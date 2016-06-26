/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
var os = require('os');
var path = require('path');
var vscode = require('vscode');
var settingsManager = require('./settings');
var vscode_languageclient_1 = require('vscode-languageclient');
var ExpandAlias_1 = require('./features/ExpandAlias');
var ShowOnlineHelp_1 = require('./features/ShowOnlineHelp');
var OpenInISE_1 = require('./features/OpenInISE');
var PowerShellFindModule_1 = require('./features/PowerShellFindModule');
var Console_1 = require('./features/Console');
var ExtensionCommands_1 = require('./features/ExtensionCommands');
var languageServerClient = undefined;
function activate(context) {
    var PowerShellLanguageId = 'powershell';
    var settings = settingsManager.load('powershell');
    vscode.languages.setLanguageConfiguration(PowerShellLanguageId, {
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\=\+\[\{\]\}\\\|\;\'\"\,\.\<\>\/\?\s]+)/g,
        indentationRules: {
            // ^(.*\*/)?\s*\}.*$
            decreaseIndentPattern: /^(.*\*\/)?\s*\}.*$/,
            // ^.*\{[^}"']*$
            increaseIndentPattern: /^.*\{[^}"']*$/
        },
        comments: {
            lineComment: '#',
            blockComment: ['<#', '#>']
        },
        brackets: [
            ['{', '}'],
            ['[', ']'],
            ['(', ')'],
        ],
        __electricCharacterSupport: {
            docComment: { scope: 'comment.documentation', open: '/**', lineStart: ' * ', close: ' */' }
        },
        __characterPairSupport: {
            autoClosingPairs: [
                { open: '{', close: '}' },
                { open: '[', close: ']' },
                { open: '(', close: ')' },
                { open: '"', close: '"', notIn: ['string'] },
                { open: '\'', close: '\'', notIn: ['string', 'comment'] }
            ]
        }
    });
    // The language server is only available on Windows
    if (os.platform() == "win32") {
        // Get the current version of this extension
        var hostVersion = vscode
            .extensions
            .getExtension("ms-vscode.PowerShell")
            .packageJSON
            .version;
        var args = [
            "/hostName:\"Visual Studio Code Host\"",
            "/hostProfileId:\"Microsoft.VSCode\"",
            "/hostVersion:" + hostVersion
        ];
        if (settings.developer.editorServicesWaitForDebugger) {
            args.push('/waitForDebugger');
        }
        if (settings.developer.editorServicesLogLevel) {
            args.push('/logLevel:' + settings.developer.editorServicesLogLevel);
        }
        try {
            var serverPath = resolveLanguageServerPath(settings);
            var serverOptions = {
                run: {
                    command: serverPath,
                    args: args
                },
                debug: {
                    command: serverPath,
                    args: ['/waitForDebugger']
                }
            };
            var clientOptions = {
                documentSelector: [PowerShellLanguageId],
                synchronize: {
                    configurationSection: PowerShellLanguageId,
                }
            };
            languageServerClient =
                new vscode_languageclient_1.LanguageClient('PowerShell Editor Services', serverOptions, clientOptions);
            languageServerClient.onReady().then(function () { return registerFeatures(); }, function (reason) { return vscode.window.showErrorMessage("Could not start language service: " + reason); });
            languageServerClient.start();
        }
        catch (e) {
            vscode.window.showErrorMessage("The language service could not be started: " + e);
        }
    }
}
exports.activate = activate;
function registerFeatures() {
    // Register other features
    ExpandAlias_1.registerExpandAliasCommand(languageServerClient);
    ShowOnlineHelp_1.registerShowHelpCommand(languageServerClient);
    Console_1.registerConsoleCommands(languageServerClient);
    OpenInISE_1.registerOpenInISECommand();
    PowerShellFindModule_1.registerPowerShellFindModuleCommand(languageServerClient);
    ExtensionCommands_1.registerExtensionCommands(languageServerClient);
}
function deactivate() {
    if (languageServerClient) {
        // Close the language server client
        languageServerClient.stop();
        languageServerClient = undefined;
    }
}
exports.deactivate = deactivate;
function resolveLanguageServerPath(settings) {
    var editorServicesHostPath = settings.developer.editorServicesHostPath;
    if (editorServicesHostPath) {
        console.log("Found Editor Services path from config: " + editorServicesHostPath);
        // Does the path end in a .exe?  Alert the user if so.
        if (path.extname(editorServicesHostPath) != '') {
            throw "The editorServicesHostPath setting must point to a directory, not a file.";
        }
        // Make the path absolute if it's not
        editorServicesHostPath =
            path.resolve(__dirname, editorServicesHostPath, getHostExeName(settings.useX86Host));
        console.log("    Resolved path to: " + editorServicesHostPath);
    }
    else {
        // Use the default path in the extension's 'bin' folder
        editorServicesHostPath =
            path.join(__dirname, '..', 'bin', getHostExeName(settings.useX86Host));
        console.log("Using default Editor Services path: " + editorServicesHostPath);
    }
    return editorServicesHostPath;
}
function getHostExeName(useX86Host) {
    // The useX86Host setting is only relevant on 64-bit OS
    var is64BitOS = process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
    var archText = useX86Host && is64BitOS ? ".x86" : "";
    return "Microsoft.PowerShell.EditorServices.Host" + archText + ".exe";
}
//# sourceMappingURL=main.js.map