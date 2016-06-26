"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var baseFormatter_1 = require("./baseFormatter");
var AutoPep8Formatter = (function (_super) {
    __extends(AutoPep8Formatter, _super);
    function AutoPep8Formatter(outputChannel, pythonSettings, workspaceRootPath) {
        _super.call(this, "autopep8", outputChannel, pythonSettings, workspaceRootPath);
        this.outputChannel = outputChannel;
        this.pythonSettings = pythonSettings;
        this.workspaceRootPath = workspaceRootPath;
    }
    AutoPep8Formatter.prototype.formatDocument = function (document, options, token) {
        var autopep8Path = this.pythonSettings.formatting.autopep8Path;
        var autoPep8Args = Array.isArray(this.pythonSettings.formatting.autopep8Args) ? this.pythonSettings.formatting.autopep8Args : [];
        return _super.prototype.provideDocumentFormattingEdits.call(this, document, options, token, autopep8Path, autoPep8Args.concat(["--diff"]));
    };
    return AutoPep8Formatter;
}(baseFormatter_1.BaseFormatter));
exports.AutoPep8Formatter = AutoPep8Formatter;
//# sourceMappingURL=autoPep8Formatter.js.map