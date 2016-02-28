/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
var vscode = require('vscode');
function load(myPluginId) {
    var configuration = vscode.workspace.getConfiguration(myPluginId);
    var defaultScriptAnalysisSettings = {
        enable: true
    };
    var defaultDeveloperSettings = {
        editorServicesHostPath: "../bin/Microsoft.PowerShell.EditorServices.Host.exe",
        editorServicesLogLevel: "Normal",
        editorServicesWaitForDebugger: false
    };
    return {
        scriptAnalysis: configuration.get("scriptAnalysis", defaultScriptAnalysisSettings),
        developer: configuration.get("developer", defaultDeveloperSettings)
    };
}
exports.load = load;
//# sourceMappingURL=settings.js.map