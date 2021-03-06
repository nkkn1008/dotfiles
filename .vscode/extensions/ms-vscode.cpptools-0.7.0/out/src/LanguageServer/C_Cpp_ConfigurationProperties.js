'use strict';
var path = require('path');
var fs = require("fs");
var vscode = require('vscode');
var defaultSettings = "{\n    \"configurations\": [\n        {\n            \"name\": \"Mac\",\n            \"includePath\": []\n        },\n        {\n            \"name\": \"Linux\",\n            \"includePath\": []\n        },\n        {\n            \"name\": \"Win32\",\n            \"includePath\": []\n        }\n    ],\n    \"clang_format\" : {\n        \"style\" : \"file\",\n        \"fallback-style\" : \"LLVM\",\n        \"sort-includes\" : false\n    }\n}\n";
var defaultSettingsExample = "{\n    \"configurations\": [\n        {\n            \"name\": \"Mac\",\n            \"includePath\": [\"/usr/include\"]\n        },\n        {\n            \"name\": \"Linux\",\n            \"includePath\": [\"/usr/include\"]\n        },\n        {\n            \"name\": \"Win32\",\n            \"includePath\": [\"c:/Program Files (x86)/Microsoft Visual Studio 14.0/VC/include\"]\n        }\n    ],\n    \"clang_format\" : {\n        \"style\" : \"file\",\n        \"fallback-style\" : \"LLVM\",\n        \"sort-includes\" : false\n    }\n}\n";
var ReportStatus_type = {
    get method() { return 'C_Cpp/ReportStatus'; }
};
var ChangeFolderSettings_type = {
    get method() { return 'C_Cpp/didChangeFolderSettings'; }
};
var ChangeSelectedSetting_type = {
    get method() { return 'C_Cpp/didChangeSelectedSetting'; }
};
var SwitchHeaderSource_type = {
    get method() { return 'C_Cpp/didSwitchHeaderSource'; }
};
var ConfigurationProperties = (function () {
    function ConfigurationProperties(context, client) {
        var _this = this;
        if (!vscode.workspace.rootPath) {
            return;
        }
        this.parseStatus = "";
        this.configurationFileName = "**/c_cpp_properties.json";
        var configFilePath = path.join(vscode.workspace.rootPath, ".vscode", "c_cpp_properties.json");
        this.quickPickOptions = {};
        this.languageClient = client;
        this.currentConfigurationIndex = 0;
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        this.registeredCommand = vscode.commands.registerCommand('C_Cpp.ConfigurationSelect', function () {
            _this.handleConfigurationSelect();
        });
        this.registeredCommand = vscode.commands.registerCommand('C_Cpp.ConfigurationEdit', function () {
            _this.handleConfigurationEdit();
        });
        this.registeredCommand = vscode.commands.registerCommand('C_Cpp.SwitchHeaderSource', function () {
            _this.handleSwitchHeaderSource();
        });
        if (fs.existsSync(configFilePath)) {
            this.propertiesFile = vscode.Uri.file(configFilePath);
            this.configurationJson = JSON.parse(fs.readFileSync(this.propertiesFile.fsPath, 'utf8'));
            this.getConfigIndexForPlatform(this.configurationJson);
            this.UpdateStatusBar();
            this.updateServerOnFolderSettingsChange();
        }
        else {
            this.handleConfigurationChange();
        }
        this.configFileWatcher = vscode.workspace.createFileSystemWatcher(this.configurationFileName);
        this.configFileWatcher.onDidCreate(function (uri) {
            _this.propertiesFile = uri;
            _this.handleConfigurationChange();
        });
        this.configFileWatcher.onDidDelete(function () {
            _this.propertiesFile = null;
            _this.handleConfigurationChange();
        });
        this.configFileWatcher.onDidChange(function () {
            _this.handleConfigurationChange();
        });
        vscode.window.onDidChangeActiveTextEditor(function (e) {
            _this.UpdateStatusBar();
        });
        client.onNotification(ReportStatus_type, function (notificationBody) {
            var message = notificationBody.status;
            if (message == "C_Cpp: Parsing ...") {
                _this.parseStatus = "$(flame)";
            }
            else {
                _this.parseStatus = "";
            }
            _this.UpdateStatusBar();
        });
    }
    ConfigurationProperties.prototype.UpdateStatusBar = function () {
        var activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            this.statusBarItem.hide();
            return;
        }
        if (activeEditor.document.languageId != "cpp" && activeEditor.document.languageId != "c") {
            this.statusBarItem.hide();
            return;
        }
        this.statusBarItem.text = this.parseStatus + this.configurationJson.configurations[this.currentConfigurationIndex].name;
        if (this.parseStatus == "") {
            this.statusBarItem.color = '';
        }
        else {
            this.statusBarItem.color = 'DarkRed';
        }
        this.statusBarItem.command = "C_Cpp.ConfigurationSelect";
        this.statusBarItem.show();
    };
    ConfigurationProperties.prototype.getConfigIndexForPlatform = function (config) {
        var plat = process.platform;
        if (plat == 'linux') {
            plat = "Linux";
        }
        else if (plat == 'darwin') {
            plat = "Mac";
        }
        else if (plat == 'win32') {
            plat = "Win32";
        }
        for (var i = 0; i < this.configurationJson.configurations.length; i++) {
            if (config.configurations[i].name == plat) {
                this.currentConfigurationIndex = i;
                return;
            }
        }
        this.currentConfigurationIndex = 0;
    };
    ConfigurationProperties.prototype.updateServerOnFolderSettingsChange = function () {
        var cmd_line = "";
        if (typeof this.configurationJson.clang_format != 'undefined') {
            if (typeof this.configurationJson.clang_format.style != 'undefined')
                cmd_line += "-style=\"" + this.configurationJson.clang_format.style + "\" ";
            if (typeof this.configurationJson.clang_format["fallback-style"] != 'undefined')
                cmd_line += "-fallback-style=\"" + this.configurationJson.clang_format["fallback-style"] + "\" ";
            if (typeof this.configurationJson.clang_format["sort-includes"] != 'undefined') {
                if (this.configurationJson.clang_format["sort-includes"] == "true" || this.configurationJson.clang_format["sort-includes"] == "1" ||
                    this.configurationJson.clang_format["sort-includes"] == true)
                    cmd_line += "-sort-includes=1";
                else
                    cmd_line += "-sort-includes=0";
            }
        }
        this.languageClient.sendNotification(ChangeFolderSettings_type, {
            currentConfiguration: this.currentConfigurationIndex,
            configurations: this.configurationJson.configurations,
            clang_format_style: cmd_line
        });
    };
    ConfigurationProperties.prototype.updateServerOnCurrentConfigurationChange = function () {
        this.languageClient.sendNotification(ChangeSelectedSetting_type, {
            currentConfiguration: this.currentConfigurationIndex
        });
    };
    ConfigurationProperties.prototype.updateServerOnSwitchHeaderSourceChange = function (rootPath_, fileName_) {
        this.languageClient.sendRequest(SwitchHeaderSource_type, { rootPath: rootPath_, switchHeaderSourceFileName: fileName_, }).then(function (targetFileName) {
            vscode.workspace.openTextDocument(targetFileName).then(function (document) {
                vscode.window.showTextDocument(document);
            });
        });
    };
    ConfigurationProperties.prototype.handleConfigurationChange = function () {
        if (this.propertiesFile) {
            this.configurationJson = JSON.parse(fs.readFileSync(this.propertiesFile.fsPath, 'utf8'));
            if (this.configurationJson.configurations.length <= this.currentConfigurationIndex) {
                this.currentConfigurationIndex = 0;
            }
        }
        else {
            this.configurationJson = JSON.parse(defaultSettings);
            this.getConfigIndexForPlatform(this.configurationJson);
        }
        this.UpdateStatusBar();
        this.updateServerOnFolderSettingsChange();
    };
    ConfigurationProperties.prototype.handleConfigurationEdit = function () {
        if (this.propertiesFile) {
            vscode.workspace.openTextDocument(this.propertiesFile).then(function (document) {
                vscode.window.showTextDocument(document);
            });
        }
        else {
            var dirPath_1 = path.join(vscode.workspace.rootPath, ".vscode");
            fs.mkdir(dirPath_1, function (e) {
                if (!e || e.code === 'EEXIST') {
                    var filePath = vscode.Uri.parse("untitled:" + path.join(dirPath_1, "c_cpp_properties.json"));
                    vscode.workspace.openTextDocument(filePath).then(function (document) {
                        var edit = new vscode.WorkspaceEdit;
                        edit.insert(document.uri, new vscode.Position(0, 0), defaultSettingsExample);
                        vscode.workspace.applyEdit(edit).then(function (status) {
                            vscode.window.showTextDocument(document);
                        });
                    });
                }
            });
        }
    };
    ConfigurationProperties.prototype.handleConfigurationSelect = function () {
        var _this = this;
        this.quickPickOptions.placeHolder = "Select a Configuration";
        var items;
        items = [];
        for (var i = 0; i < this.configurationJson.configurations.length; i++) {
            items.push({ label: this.configurationJson.configurations[i].name, description: "", index: i });
        }
        var result = vscode.window.showQuickPick(items, this.quickPickOptions);
        result.then(function (selection) {
            if (!selection) {
                return;
            }
            _this.currentConfigurationIndex = selection.index;
            _this.UpdateStatusBar();
            _this.updateServerOnCurrentConfigurationChange();
        });
    };
    ConfigurationProperties.prototype.handleSwitchHeaderSource = function () {
        var activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor || !activeEditor.document) {
            return;
        }
        if (activeEditor.document.languageId != "cpp" && activeEditor.document.languageId != "c") {
            return;
        }
        this.updateServerOnSwitchHeaderSourceChange(vscode.workspace.rootPath, activeEditor.document.fileName);
    };
    ConfigurationProperties.prototype.dispose = function () {
        this.configFileWatcher.dispose();
        this.statusBarItem.dispose();
        this.registeredCommand.dispose();
    };
    return ConfigurationProperties;
}());
function setupConfigurationProperties(context, client) {
    var ret = new ConfigurationProperties(context, client);
    return ret;
}
exports.setupConfigurationProperties = setupConfigurationProperties;
//# sourceMappingURL=C_Cpp_ConfigurationProperties.js.map