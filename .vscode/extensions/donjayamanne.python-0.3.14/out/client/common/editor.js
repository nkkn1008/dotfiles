"use strict";
var vscode_1 = require("vscode");
var dmp = require("diff-match-patch");
var os_1 = require("os");
var fs = require("fs");
var path = require("path");
var tmp = require("tmp");
// Code borrowed from goFormat.ts (Go Extension for VS Code)
var EDIT_DELETE = 0;
var EDIT_INSERT = 1;
var EDIT_REPLACE = 2;
var NEW_LINE_LENGTH = os_1.EOL.length;
var Patch = (function () {
    function Patch() {
    }
    return Patch;
}());
var Edit = (function () {
    function Edit(action, start) {
        this.action = action;
        this.start = start;
        this.text = "";
    }
    Edit.prototype.apply = function () {
        switch (this.action) {
            case EDIT_INSERT:
                return vscode_1.TextEdit.insert(this.start, this.text);
            case EDIT_DELETE:
                return vscode_1.TextEdit.delete(new vscode_1.Range(this.start, this.end));
            case EDIT_REPLACE:
                return vscode_1.TextEdit.replace(new vscode_1.Range(this.start, this.end), this.text);
        }
    };
    return Edit;
}());
function getTextEditsFromPatch(before, patch) {
    if (patch.startsWith("---")) {
        // Strip the first two lines
        patch = patch.substring(patch.indexOf("@@"));
    }
    if (patch.length === 0) {
        return [];
    }
    var d = new dmp.diff_match_patch();
    var patches = d.patch_fromText(patch);
    if (!Array.isArray(patches) || patches.length === 0) {
        throw new Error("Unable to parse Patch string");
    }
    // Add line feeds
    patches[0].diffs.forEach(function (diff) {
        diff[1] += os_1.EOL;
    });
    return getTextEditsInternal(before, patches[0].diffs, patches[0].start1);
}
exports.getTextEditsFromPatch = getTextEditsFromPatch;
function getTextEdits(before, after) {
    var d = new dmp.diff_match_patch();
    var diffs = d.diff_main(before, after);
    return getTextEditsInternal(before, diffs);
}
exports.getTextEdits = getTextEdits;
function getTextEditsInternal(before, diffs, startLine) {
    if (startLine === void 0) { startLine = 0; }
    var line = startLine;
    var character = 0;
    if (line > 0) {
        var beforeLines = before.split(/\r?\n/g);
        beforeLines.filter(function (l, i) { return i < line; }).forEach(function (l) { return character += l.length + NEW_LINE_LENGTH; });
    }
    var edits = [];
    var edit = null;
    for (var i = 0; i < diffs.length; i++) {
        var start = new vscode_1.Position(line, character);
        // Compute the line/character after the diff is applied.
        for (var curr = 0; curr < diffs[i][1].length; curr++) {
            if (diffs[i][1][curr] !== "\n") {
                character++;
            }
            else {
                character = 0;
                line++;
            }
        }
        switch (diffs[i][0]) {
            case dmp.DIFF_DELETE:
                if (edit == null) {
                    edit = new Edit(EDIT_DELETE, start);
                }
                else if (edit.action !== EDIT_DELETE) {
                    throw new Error("cannot format due to an internal error.");
                }
                edit.end = new vscode_1.Position(line, character);
                break;
            case dmp.DIFF_INSERT:
                if (edit == null) {
                    edit = new Edit(EDIT_INSERT, start);
                }
                else if (edit.action === EDIT_DELETE) {
                    edit.action = EDIT_REPLACE;
                }
                // insert and replace edits are all relative to the original state
                // of the document, so inserts should reset the current line/character
                // position to the start.		
                line = start.line;
                character = start.character;
                edit.text += diffs[i][1];
                break;
            case dmp.DIFF_EQUAL:
                if (edit != null) {
                    edits.push(edit.apply());
                    edit = null;
                }
                break;
        }
    }
    if (edit != null) {
        edits.push(edit.apply());
    }
    return edits;
}
function getTempFileWithDocumentContents(document) {
    return new Promise(function (resolve, reject) {
        var ext = path.extname(document.uri.fsPath);
        var tmp = require("tmp");
        tmp.file({ postfix: ext }, function (err, tmpFilePath, fd) {
            if (err) {
                return reject(err);
            }
            fs.writeFile(tmpFilePath, document.getText(), function (ex) {
                if (ex) {
                    return reject("Failed to create a temporary file, " + ex.message);
                }
                resolve(tmpFilePath);
            });
        });
    });
}
exports.getTempFileWithDocumentContents = getTempFileWithDocumentContents;
//# sourceMappingURL=editor.js.map