'use strict';
import * as vscode from 'vscode';
import * as escapeRegExp from 'lodash.escaperegexp';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('extension.caseSensitiveAddNext', () => {

        let editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }     

        let selection = editor.selection;
        let selectedText = editor.document.getText(selection);
        if (!selectedText) return;

        let regex = new RegExp(escapeRegExp(selectedText), 'g');
        
        let fullText = editor.document.getText();

        let match;
        let selections = editor.selections.filter(selection => editor.document.getText(selection) === selectedText);

        // If the current selections don't have matching content, do nothing (like existing Add Next Occurrence command)
        if (selections.length !== editor.selections.length) return;

        let sortedSelections = selections.slice(0).sort(sortSelections);

        let selectionBeforeCurrent;
        let selectionAfterCurrent;

        while (match = regex.exec(fullText)) {
            // Get the position of the match
            let startPos = editor.document.positionAt(match.index);
            let endPos = editor.document.positionAt(match.index + match[0].length);

            // If it's currently selected, skip it
            if (selections.find(selection => selection.start.isEqual(startPos))) {
                continue;
            }

            // We'll record the first match that pops up before the current selections
            // and use it if no unselected matches exist after the current selections
            if (startPos.isBefore(sortedSelections[0].start)) {
                if (!selectionBeforeCurrent) selectionBeforeCurrent = new vscode.Selection(startPos, endPos);
                continue;
            }

            selectionAfterCurrent = new vscode.Selection(startPos, endPos);
            break;
        }

        if (selectionAfterCurrent) {
            selections.push(selectionAfterCurrent);
        } else if (selectionBeforeCurrent) {
            selections.push(selectionBeforeCurrent);
        } else {
            // Reveal primary selection if no more are found
            editor.revealRange(new vscode.Range(selections[0].start, selections[0].end), vscode.TextEditorRevealType.InCenterIfOutsideViewport);            
            return;
        }

        editor.selections = selections;
        editor.revealRange(new vscode.Range(selections[selections.length - 1].start, selections[selections.length - 1].end), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
    });

    context.subscriptions.push(disposable);
}

function sortSelections(a: vscode.Selection, b: vscode.Selection) {
    if (a.start.isBefore(b.start)) return -1;
    if (a.start.isAfter(b.start)) return 1;
    if (a.start.isEqual(b.start)) return 0;
}

export function deactivate() {
}