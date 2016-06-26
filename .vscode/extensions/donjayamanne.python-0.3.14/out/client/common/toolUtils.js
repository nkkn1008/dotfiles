"use strict";
var vscode_1 = require("vscode");
function handleLinterError(expectedFileName, fileName, message, error, outputChannel) {
    if (typeof (error) === "object" && error !== null && (error.code === "ENOENT" || error.code === 127)) {
        // Check if we have some custom arguments such as "pylint --load-plugins pylint_django"
        // Such settings are no longer supported
        var stuffAfterFileName = fileName.substring(fileName.toUpperCase().indexOf(expectedFileName) + expectedFileName.length);
        // Ok if we have a space after the file name, this means we have some arguments defined and this isn't supported
        if (stuffAfterFileName.indexOf(" ")) {
        }
    }
    outputChannel.appendLine(message + ".\n " + error);
    vscode_1.window.showInformationMessage(message + ". View Python output for details.");
}
exports.handleLinterError = handleLinterError;
//# sourceMappingURL=toolUtils.js.map