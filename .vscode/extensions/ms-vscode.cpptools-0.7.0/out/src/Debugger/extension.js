"use strict";
var vscode = require('vscode');
var fs = require('fs');
var path = require('path');
var os = require('os');
var util = require('./common');
var linuxDistribution_1 = require('./linuxDistribution');
var telemetry_1 = require('../telemetry');
var attachToProcess_1 = require('./attachToProcess');
var nativeAttach_1 = require('./nativeAttach');
var childTerminal;
function activate(context) {
    util.setExtensionPath(context.extensionPath);
    util.checkLockFile().then(function (lockExists) {
        if (!lockExists) {
            var channel = vscode.window.createOutputChannel("C++ (DBG)");
            channel.show(vscode.ViewColumn.Three);
            channel.appendLine("Updating C++ Debugger dependencies...");
            var errorMessage_1 = '';
            var installationStage_1 = 'permissionChange';
            var linuxDistro_1;
            var arch_1 = 'unknown';
            util.allowExecution(path.resolve(util.getDebugAdaptersPath(), "OpenDebugAD7"))
                .then(function () {
                return util.allowExecution(path.resolve(util.getDebugAdaptersPath(), "mono.linux-x86"));
            })
                .then(function () {
                return util.allowExecution(path.resolve(util.getDebugAdaptersPath(), "mono.linux-x86_64"));
            })
                .then(function () {
                return util.allowExecution(path.resolve(util.getDebugAdaptersPath(), "mono.osx"));
            })
                .then(function () {
                return checkDistro(channel);
            })
                .then(function (guessedLinuxDistro) {
                linuxDistro_1 = guessedLinuxDistro;
                fs.writeFile(util.getInstallLockPath(), "");
            })
                .then(function () {
                channel.appendLine("Finished");
                installationStage_1 = '';
            })
                .then(function () {
                if (os.platform() === 'win32')
                    return getWindowsArchitecture();
                else if (os.platform() === 'linux' || os.platform() === 'darwin')
                    return getUnixArchitecture();
                else
                    return null;
            })
                .then(function (architecture) {
                if (architecture)
                    arch_1 = architecture;
            })
                .catch(function (error) {
                errorMessage_1 = error.toString();
                channel.appendLine("Failed at stage: " + installationStage_1);
                channel.appendLine(errorMessage_1);
            })
                .then(function () {
                var acquisitionEvent = {
                    'success': (!errorMessage_1).toString(),
                    'stage': installationStage_1,
                    'error': errorMessage_1
                };
                if (linuxDistro_1) {
                    acquisitionEvent['linuxDistroName'] = linuxDistro_1.name;
                    acquisitionEvent['linuxDistroVersion'] = linuxDistro_1.version;
                }
                acquisitionEvent['osArchitecture'] = arch_1;
                telemetry_1.logDebuggerEvent("acquisition", acquisitionEvent);
            });
        }
    });
    var attachItemsProvider = nativeAttach_1.NativeAttachItemsProviderFactory.Get();
    var attacher = new attachToProcess_1.AttachPicker(attachItemsProvider);
    var disposable = vscode.commands.registerCommand('extension.pickNativeProcess', function () { return attacher.ShowAttachEntries(); });
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;
function checkDistro(channel) {
    var platform = os.platform();
    var linuxDistro = Promise.resolve(null);
    switch (os.platform()) {
        case 'win32':
            channel.appendLine("Warning: Debugging is currently only supported for Windows when using MinGW or Cygwin. " + util.getReadmeMessage());
            break;
        case 'linux':
            linuxDistro = linuxDistribution_1.LinuxDistribution.DistroInformation();
            break;
        case 'darwin':
            channel.appendLine("Note: On OS X, the debugger executable must be signed for debugging to work properly. " + util.getReadmeMessage());
            break;
        default:
            channel.appendLine("Warning: Debugging has not been tested for this platform. " + util.getReadmeMessage());
    }
    return linuxDistro;
}
function getWindowsArchitecture() {
    return util.execChildProcess('wmic os get osarchitecture', util.getExtensionPath())
        .then(function (architecture) {
        if (architecture) {
            var archArray = architecture.split(os.EOL);
            if (archArray.length >= 2) {
                return archArray[1].trim();
            }
        }
        return null;
    });
}
function getUnixArchitecture() {
    return util.execChildProcess('uname -m', util.getExtensionPath())
        .then(function (architecture) {
        if (architecture) {
            return architecture.trim();
        }
        return null;
    });
}
//# sourceMappingURL=extension.js.map