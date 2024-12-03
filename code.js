"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// This plugin creates color variables from selected shapes or frames
figma.showUI(__html__, { width: 300, height: 360 });
// Listen for messages from the UI
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === 'get-collections') {
        // Send list of existing collections to UI
        const collections = figma.variables.getLocalVariableCollections();
        figma.ui.postMessage({
            type: 'collections-list',
            collections: collections.map(c => ({ name: c.name }))
        });
        return;
    }
    if (msg.type === 'create-variables') {
        const selection = figma.currentPage.selection;
        if (selection.length === 0) {
            figma.notify('Please select at least one element.');
            return;
        }
        let collection;
        if (msg.useExistingCollection && msg.collectionName) {
            // Get existing collections
            const collections = figma.variables.getLocalVariableCollections();
            const existingCollection = collections.find(c => c.name === msg.collectionName);
            if (!existingCollection) {
                figma.notify('Collection not found!');
                return;
            }
            collection = existingCollection;
        }
        else if (msg.collectionName) {
            // Create new collection with custom name
            collection = figma.variables.createVariableCollection(msg.collectionName);
        }
        else {
            figma.notify('Please enter a collection name.');
            return;
        }
        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;
        // Process each selected element
        for (const node of selection) {
            try {
                if ('fills' in node) {
                    const fills = node.fills;
                    if (fills.length > 0 && fills[0].type === 'SOLID') {
                        const fill = fills[0];
                        const { r, g, b } = fill.color;
                        const opacity = fill.opacity || 1;
                        // Process variable name and create hierarchy
                        const nameParts = node.name.split('/').map(part => part.trim());
                        const variableName = nameParts.join('/');
                        try {
                            // Create the variable
                            const variable = figma.variables.createVariable(variableName, collection.id, 'COLOR');
                            // Set the variable value
                            variable.setValueForMode(collection.modes[0].modeId, {
                                r: r,
                                g: g,
                                b: b,
                                a: opacity
                            });
                            successCount++;
                        }
                        catch (error) {
                            console.error(`Error creating variable for "${node.name}":`, error);
                            errorCount++;
                        }
                    }
                    else {
                        skippedCount++;
                    }
                }
                else {
                    skippedCount++;
                }
            }
            catch (error) {
                console.error(`Error processing node "${node.name}":`, error);
                errorCount++;
            }
        }
        // Prepare notification message
        if (errorCount === 0 && skippedCount === 0) {
            figma.notify(`Successfully created ${successCount} color variables! 🎨`);
        }
        else {
            let message = `Created ${successCount} variables`;
            if (errorCount > 0) {
                message += `, ${errorCount} failed`;
            }
            if (skippedCount > 0) {
                message += `, ${skippedCount} skipped (no solid fill)`;
            }
            figma.notify(message);
        }
        figma.closePlugin();
    }
});
