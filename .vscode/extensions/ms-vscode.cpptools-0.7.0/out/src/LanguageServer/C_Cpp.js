'use strict';
var path = require('path');
var vscode = require('vscode');
var fs = require('fs');
var vscode_languageclient_1 = require('vscode-languageclient');
var Telemetry = require('../telemetry');
var C_Cpp_DebugProtocol = require('./C_Cpp_DebugProtocol');
var C_Cpp_ConfigurationProperties = require('./C_Cpp_ConfigurationProperties');
var onDidSave_type = {
    get method() { return 'textDocument/didSave'; }
};
var ShutdownRequest_type = {
    get method() { return "shutdown"; }
};
var ExitRequest_type = {
    get method() { return "exit"; }
};
function activate(context) {
    var _this = this;
    var plat = process.platform;
    var extensionProcessName = 'Microsoft.VSCode.CPP.Extension';
    if (plat == 'linux') {
        extensionProcessName += '.linux';
    }
    else if (plat == 'darwin') {
        extensionProcessName += '.darwin';
    }
    else if (plat == 'win32') {
        extensionProcessName += '.exe';
    }
    else {
        throw "Invalid Platform";
    }
    var serverModule = context.asAbsolutePath(path.join('bin', extensionProcessName));
    fs.chmod(serverModule, '755', function (err) {
        if (err) {
            throw err;
        }
        var serverOptions = {
            run: { command: serverModule },
            debug: { command: serverModule }
        };
        var con = vscode.workspace.getConfiguration("C_Cpp");
        var clientOptions = {
            documentSelector: ['cpp', "c"],
            synchronize: {
                configurationSection: 'C_Cpp',
                fileEvents: vscode.workspace.createFileSystemWatcher('**/.clientrc')
            },
            initializationOptions: {
                clang_format_path: con.get("clang_format_path")
            }
        };
        var languageClient = new vscode_languageclient_1.LanguageClient('C/Cpp Language Server', serverOptions, clientOptions);
        vscode.workspace.onDidSaveTextDocument(function (doc) {
            if (!doc) {
                return;
            }
            if (doc.languageId == "cpp" || doc.languageId == "c") {
                languageClient.sendNotification(onDidSave_type, {
                    uri: doc.uri.toString(),
                    languageId: doc.languageId
                });
            }
        });
        C_Cpp_DebugProtocol.setupDebugProtocolHandler(languageClient);
        context.subscriptions.push(C_Cpp_ConfigurationProperties.setupConfigurationProperties(context, languageClient));
        context.subscriptions.push(languageClient.start());
        _this.registeredCommand = vscode.commands.registerCommand('C_Cpp.UnloadLanguageServer', function () {
            languageClient.sendRequest(ShutdownRequest_type).then(function () {
                return languageClient.sendNotification(ExitRequest_type);
            });
        });
        Telemetry.logLanguageServerEvent("LanguageServerLaunched");
        languageClient.onNotification(Telemetry.LogTelemetry_type, function (notificationBody) {
            Telemetry.logLanguageServerEvent(notificationBody.event, notificationBody.properties, notificationBody.metrics);
        });
    });
}
exports.activate = activate;
function deactivate() {
    Telemetry.logLanguageServerEvent("LanguageServerShutdown");
}
exports.deactivate = deactivate;
//# sourceMappingURL=C_Cpp.js.map