"use strict";
var vscode = require("vscode");
var completionProvider_1 = require("./providers/completionProvider");
var hoverProvider_1 = require("./providers/hoverProvider");
var definitionProvider_1 = require("./providers/definitionProvider");
var referenceProvider_1 = require("./providers/referenceProvider");
var renameProvider_1 = require("./providers/renameProvider");
var formatProvider_1 = require("./providers/formatProvider");
var sortImports = require("./sortImports");
var lintProvider_1 = require("./providers/lintProvider");
var symbolProvider_1 = require("./providers/symbolProvider");
var formatOnSaveProvider_1 = require("./providers/formatOnSaveProvider");
var settings = require("./common/configSettings");
var testProvider_1 = require("./providers/testProvider");
var telemetryHelper = require("./common/telemetry");
var telemetryContracts = require("./common/telemetryContracts");
var PYTHON = { language: "python", scheme: "file" };
var unitTestOutChannel;
var formatOutChannel;
var lintingOutChannel;
function activate(context) {
    var rootDir = context.asAbsolutePath(".");
    var pythonSettings = settings.PythonSettings.getInstance();
    telemetryHelper.sendTelemetryEvent(telemetryContracts.EVENT_LOAD, {
        CodeComplete_Has_ExtraPaths: pythonSettings.autoComplete.extraPaths.length > 0 ? "true" : "false",
        Format_Has_Custom_Python_Path: pythonSettings.pythonPath.length !== "python".length ? "true" : "false"
    });
    unitTestOutChannel = vscode.window.createOutputChannel(pythonSettings.unitTest.outputWindow);
    unitTestOutChannel.clear();
    formatOutChannel = unitTestOutChannel;
    lintingOutChannel = unitTestOutChannel;
    if (pythonSettings.unitTest.outputWindow !== pythonSettings.formatting.outputWindow) {
        formatOutChannel = vscode.window.createOutputChannel(pythonSettings.formatting.outputWindow);
        formatOutChannel.clear();
    }
    if (pythonSettings.unitTest.outputWindow !== pythonSettings.linting.outputWindow) {
        lintingOutChannel = vscode.window.createOutputChannel(pythonSettings.linting.outputWindow);
        lintingOutChannel.clear();
    }
    sortImports.activate(context, formatOutChannel);
    testProvider_1.activateUnitTestProvider(context, pythonSettings, unitTestOutChannel);
    context.subscriptions.push(formatOnSaveProvider_1.activateFormatOnSaveProvider(PYTHON, pythonSettings, formatOutChannel, vscode.workspace.rootPath));
    // Enable indentAction
    vscode.languages.setLanguageConfiguration(PYTHON.language, {
        onEnterRules: [
            {
                beforeText: /^\s*(?:def|class|for|if|elif|else|while|try|with|finally).*?:\s*$/,
                action: { indentAction: vscode.IndentAction.Indent }
            }
        ]
    });
    context.subscriptions.push(vscode.languages.registerRenameProvider(PYTHON, new renameProvider_1.PythonRenameProvider(context)));
    context.subscriptions.push(vscode.languages.registerHoverProvider(PYTHON, new hoverProvider_1.PythonHoverProvider(context)));
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(PYTHON, new definitionProvider_1.PythonDefinitionProvider(context)));
    context.subscriptions.push(vscode.languages.registerReferenceProvider(PYTHON, new referenceProvider_1.PythonReferenceProvider(context)));
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(PYTHON, new completionProvider_1.PythonCompletionItemProvider(context), "."));
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(PYTHON, new symbolProvider_1.PythonSymbolProvider(context)));
    context.subscriptions.push(vscode.languages.registerDocumentFormattingEditProvider(PYTHON, new formatProvider_1.PythonFormattingEditProvider(context, formatOutChannel, pythonSettings, vscode.workspace.rootPath)));
    context.subscriptions.push(new lintProvider_1.LintProvider(context, lintingOutChannel, vscode.workspace.rootPath));
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() {
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map