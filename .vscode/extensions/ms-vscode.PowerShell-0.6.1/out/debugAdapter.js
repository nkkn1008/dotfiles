"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var vscode_debugadapter_1 = require('vscode-debugadapter');
var fs = require('fs');
var PowerShellDebugSession = (function (_super) {
    __extends(PowerShellDebugSession, _super);
    function PowerShellDebugSession(debuggerLinesAndColumnsStartAt1, isServer) {
        _super.call(this);
        var pipeName = "\\\\.\\pipe\\PSES-VSCode-Debug-" + process.env.VSCODE_PID;
        var pid = process.env.VSCODE_PID;
        fs.writeFile("c:\\Users\\daviwil\\Desktop\\DEBUG_PID.txt", "VSCODE_PID: " + pid, function (err) {
            if (err) {
                return console.log(err);
            }
            console.log("The file was saved!");
        });
    }
    return PowerShellDebugSession;
}(vscode_debugadapter_1.DebugSession));
// Run the debug session
vscode_debugadapter_1.DebugSession.run(PowerShellDebugSession);
//# sourceMappingURL=debugAdapter.js.map