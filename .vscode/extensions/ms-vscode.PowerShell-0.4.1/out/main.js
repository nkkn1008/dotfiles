/*---------------------------------------------------------
 * Copyright (C) Microsoft Corporation. All rights reserved.
 *--------------------------------------------------------*/
'use strict';
var path = require('path');
var vscode = require('vscode');
var settingsManager = require('./settings');
var vscode_languageclient_1 = require('vscode-languageclient');
var ExpandAlias_1 = require('./features/ExpandAlias');
var ShowOnlineHelp_1 = require('./features/ShowOnlineHelp');
var OpenInISE_1 = require('./features/OpenInISE');
var PowerShellFindModule_1 = require('./features/PowerShellFindModule');
var Console_1 = require('./features/Console');
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
            brackets: [
                { tokenType: 'delimiter.curly.ts', open: '{', close: '}', isElectric: true },
                { tokenType: 'delimiter.square.ts', open: '[', close: ']', isElectric: true },
                { tokenType: 'delimiter.paren.ts', open: '(', close: ')', isElectric: true }
            ],
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
    var args = [];
    if (settings.developer.editorServicesWaitForDebugger) {
        args.push('/waitForDebugger');
    }
    if (settings.developer.editorServicesLogLevel) {
        args.push('/logLevel:' + settings.developer.editorServicesLogLevel);
    }
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
exports.activate = activate;
function registerFeatures() {
    // Register other features
    ExpandAlias_1.registerExpandAliasCommand(languageServerClient);
    ShowOnlineHelp_1.registerShowHelpCommand(languageServerClient);
    Console_1.registerConsoleCommands(languageServerClient);
    OpenInISE_1.registerOpenInISECommand();
    PowerShellFindModule_1.registerPowerShellFindModuleCommand(languageServerClient);
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
        // Make the path absolute if it's not
        editorServicesHostPath =
            path.resolve(__dirname, editorServicesHostPath);
        console.log("    Resolved path to: " + editorServicesHostPath);
    }
    else {
        // Use the default path in the plugin's 'bin' folder
        editorServicesHostPath =
            path.join(__dirname, '..', 'bin', 'Microsoft.PowerShell.EditorServices.Host.exe');
        console.log("Using default Editor Services path: " + editorServicesHostPath);
    }
    return editorServicesHostPath;
}
//# sourceMappingURL=main.js.map