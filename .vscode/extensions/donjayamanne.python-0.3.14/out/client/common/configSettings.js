"use strict";
var vscode = require("vscode");
var PythonSettings = (function () {
    function PythonSettings() {
        var _this = this;
        if (PythonSettings.pythonSettings) {
            throw new Error("Singleton class, Use getInstance method");
        }
        vscode.workspace.onDidChangeConfiguration(function () {
            _this.initializeSettings();
        });
        this.initializeSettings();
    }
    PythonSettings.getInstance = function () {
        return PythonSettings.pythonSettings;
    };
    PythonSettings.prototype.initializeSettings = function () {
        var pythonSettings = vscode.workspace.getConfiguration("python");
        this.pythonPath = pythonSettings.get("pythonPath");
        this.devOptions = pythonSettings.get("devOptions");
        this.devOptions = Array.isArray(this.devOptions) ? this.devOptions : [];
        var lintingSettings = pythonSettings.get("linting");
        if (this.linting) {
            Object.assign(this.linting, lintingSettings);
        }
        else {
            this.linting = lintingSettings;
        }
        var formattingSettings = pythonSettings.get("formatting");
        if (this.formatting) {
            Object.assign(this.formatting, formattingSettings);
        }
        else {
            this.formatting = formattingSettings;
        }
        var autoCompleteSettings = pythonSettings.get("autoComplete");
        if (this.autoComplete) {
            Object.assign(this.autoComplete, autoCompleteSettings);
        }
        else {
            this.autoComplete = autoCompleteSettings;
        }
        var unitTestSettings = pythonSettings.get("unitTest");
        if (this.unitTest) {
            Object.assign(this.unitTest, unitTestSettings);
        }
        else {
            this.unitTest = unitTestSettings;
        }
        replaceTokensInPaths(this);
    };
    PythonSettings.pythonSettings = new PythonSettings();
    return PythonSettings;
}());
exports.PythonSettings = PythonSettings;
function replaceTokensInPaths(settings) {
    if (!vscode.workspace || !vscode.workspace.rootPath) {
        return;
    }
    // In test environment (travic CI)
    if (typeof settings.pythonPath !== "string") {
        return;
    }
    var workspaceRoot = vscode.workspace.rootPath;
    settings.pythonPath = settings.pythonPath.replace("${workspaceRoot}", workspaceRoot);
    settings.formatting.autopep8Path = settings.formatting.autopep8Path.replace("${workspaceRoot}", workspaceRoot);
    settings.formatting.yapfPath = settings.formatting.yapfPath.replace("${workspaceRoot}", workspaceRoot);
    settings.linting.flake8Path = settings.linting.flake8Path.replace("${workspaceRoot}", workspaceRoot);
    settings.linting.pep8Path = settings.linting.pep8Path.replace("${workspaceRoot}", workspaceRoot);
    settings.linting.prospectorPath = settings.linting.prospectorPath.replace("${workspaceRoot}", workspaceRoot);
    settings.linting.pydocStylePath = settings.linting.pydocStylePath.replace("${workspaceRoot}", workspaceRoot);
    settings.linting.pylintPath = settings.linting.pylintPath.replace("${workspaceRoot}", workspaceRoot);
    settings.unitTest.nosetestPath = settings.unitTest.nosetestPath.replace("${workspaceRoot}", workspaceRoot);
    settings.unitTest.pyTestPath = settings.unitTest.pyTestPath.replace("${workspaceRoot}", workspaceRoot);
    settings.autoComplete.extraPaths.forEach(function (value, index) {
        settings.autoComplete.extraPaths[index] = settings.autoComplete.extraPaths[index].replace("${workspaceRoot}", workspaceRoot);
    });
}
//# sourceMappingURL=configSettings.js.map