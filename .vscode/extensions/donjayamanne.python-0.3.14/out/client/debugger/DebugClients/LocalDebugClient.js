"use strict";
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var LocalDebugServer_1 = require("../DebugServers/LocalDebugServer");
var vscode_debugadapter_1 = require("vscode-debugadapter");
var path = require("path");
var child_process = require("child_process");
var DebugClient_1 = require("./DebugClient");
var open_1 = require("../../common/open");
var fsExtra = require("fs-extra");
var tmp = require("tmp");
var prependFile = require("prepend-file");
var LineByLineReader = require("line-by-line");
var PTVS_FILES = ["visualstudio_ipython_repl.py", "visualstudio_py_debugger.py",
    "visualstudio_py_launcher.py", "visualstudio_py_repl.py", "visualstudio_py_util.py"];
var LocalDebugClient = (function (_super) {
    __extends(LocalDebugClient, _super);
    function LocalDebugClient(args, debugSession) {
        _super.call(this, args, debugSession);
        this.args = args;
    }
    LocalDebugClient.prototype.CreateDebugServer = function (pythonProcess) {
        this.pythonProcess = pythonProcess;
        this.debugServer = new LocalDebugServer_1.LocalDebugServer(this.debugSession, this.pythonProcess);
        return this.debugServer;
    };
    Object.defineProperty(LocalDebugClient.prototype, "DebugType", {
        get: function () {
            return DebugClient_1.DebugType.Local;
        },
        enumerable: true,
        configurable: true
    });
    LocalDebugClient.prototype.Stop = function () {
        if (this.debugServer) {
            this.debugServer.Stop();
            this.debugServer = null;
        }
        if (this.pyProc) {
            try {
                this.pyProc.send("EXIT");
            }
            catch (ex) { }
            try {
                this.pyProc.stdin.write("EXIT");
            }
            catch (ex) { }
            try {
                this.pyProc.disconnect();
            }
            catch (ex) { }
            this.pyProc = null;
        }
    };
    LocalDebugClient.prototype.getPTVSToolsFilePath = function () {
        var currentFileName = module.filename;
        return new Promise(function (resolve, reject) {
            tmp.dir(function (error, tmpDir) {
                if (error) {
                    return reject(error);
                }
                var ptVSToolsPath = path.join(path.dirname(currentFileName), "..", "..", "..", "..", "pythonFiles", "PythonTools");
                var promises = PTVS_FILES.map(function (ptvsFile) {
                    return new Promise(function (copyResolve, copyReject) {
                        var sourceFile = path.join(ptVSToolsPath, ptvsFile);
                        var targetFile = path.join(tmpDir, ptvsFile);
                        fsExtra.copy(sourceFile, targetFile, function (copyError) {
                            if (copyError) {
                                return copyReject(copyError);
                            }
                            copyResolve(targetFile);
                        });
                    });
                });
                Promise.all(promises).then(function () {
                    resolve(path.join(tmpDir, "visualstudio_py_launcher.py"));
                }, reject);
            });
        });
    };
    LocalDebugClient.prototype.displayError = function (error) {
        if (!error) {
            return;
        }
        var errorMsg = typeof error === "string" ? error : ((error.message && error.message.length > 0) ? error.message : "");
        if (errorMsg.length > 0) {
            this.debugSession.sendEvent(new vscode_debugadapter_1.OutputEvent(errorMsg + "\n", "stderr"));
        }
    };
    LocalDebugClient.prototype.getShebangLines = function (program) {
        var MAX_SHEBANG_LINES = 2;
        return new Promise(function (resolve, reject) {
            var lr = new LineByLineReader(program);
            var shebangLines = [];
            lr.on("error", function (err) {
                reject(err);
            });
            lr.on("line", function (line) {
                if (shebangLines.length >= MAX_SHEBANG_LINES) {
                    lr.close();
                    return false;
                }
                var trimmedLine = line.trim();
                if (trimmedLine.startsWith("#")) {
                    shebangLines.push(line);
                }
                else {
                    shebangLines.push("#");
                }
            });
            lr.on("end", function () {
                // Ensure we always have two lines, even if no shebangLines
                // This way if ever we get lines numbers in errors for the python file, we have a consistency
                while (shebangLines.length < MAX_SHEBANG_LINES) {
                    shebangLines.push("#");
                }
                resolve(shebangLines);
            });
        });
    };
    LocalDebugClient.prototype.prependShebangToPTVSFile = function (ptVSToolsFilePath, program) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.getShebangLines(program).then(function (lines) {
                var linesToPrepend = lines.join("\n") + "\n";
                prependFile(ptVSToolsFilePath, linesToPrepend, function (error) {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(ptVSToolsFilePath);
                    }
                });
            }, reject);
        });
    };
    LocalDebugClient.prototype.LaunchApplicationToDebug = function (dbgServer) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var fileDir = path.dirname(_this.args.program);
            var processCwd = fileDir;
            if (typeof _this.args.cwd === "string" && _this.args.cwd.length > 0) {
                processCwd = _this.args.cwd;
            }
            var fileNameWithoutPath = path.basename(_this.args.program);
            var pythonPath = "python";
            if (typeof _this.args.pythonPath === "string" && _this.args.pythonPath.trim().length > 0) {
                pythonPath = _this.args.pythonPath;
            }
            var environmentVariables = _this.args.env ? _this.args.env : {};
            if (environmentVariables) {
                for (var setting in process.env) {
                    if (!environmentVariables[setting]) {
                        environmentVariables[setting] = process.env[setting];
                    }
                }
            }
            if (!environmentVariables.hasOwnProperty("PYTHONIOENCODING")) {
                environmentVariables["PYTHONIOENCODING"] = "UTF-8";
            }
            var currentFileName = module.filename;
            _this.getPTVSToolsFilePath().then(function (ptVSToolsFilePath) {
                return _this.prependShebangToPTVSFile(ptVSToolsFilePath, _this.args.program);
            }, function (error) {
                _this.displayError(error);
                reject(error);
            }).then(function (ptVSToolsFilePath) {
                var launcherArgs = _this.buildLauncherArguments();
                var args = [ptVSToolsFilePath, processCwd, dbgServer.port.toString(), "34806ad9-833a-4524-8cd6-18ca4aa74f14"].concat(launcherArgs);
                if (_this.args.externalConsole === true) {
                    open_1.open({ wait: false, app: [pythonPath].concat(args), cwd: processCwd, env: environmentVariables }).then(function (proc) {
                        _this.pyProc = proc;
                        resolve();
                    }, function (error) {
                        if (!_this.debugServer && _this.debugServer.IsRunning) {
                            return;
                        }
                        _this.displayError(error);
                        reject(error);
                    });
                    return;
                }
                _this.pyProc = child_process.spawn(pythonPath, args, { cwd: processCwd, env: environmentVariables });
                _this.pyProc.on("error", function (error) {
                    if (!_this.debugServer && _this.debugServer.IsRunning) {
                        return;
                    }
                    _this.displayError(error);
                });
                _this.pyProc.on("stderr", function (error) {
                    if (!_this.debugServer && _this.debugServer.IsRunning) {
                        return;
                    }
                    _this.displayError(error);
                });
                resolve();
            }, function (error) {
                _this.displayError(error);
                reject(error);
            });
        });
    };
    LocalDebugClient.prototype.buildLauncherArguments = function () {
        var vsDebugOptions = "WaitOnAbnormalExit,WaitOnNormalExit,RedirectOutput";
        if (Array.isArray(this.args.debugOptions)) {
            vsDebugOptions = this.args.debugOptions.join(",");
        }
        var programArgs = Array.isArray(this.args.args) && this.args.args.length > 0 ? this.args.args : [];
        return [vsDebugOptions, this.args.program].concat(programArgs);
    };
    return LocalDebugClient;
}(DebugClient_1.DebugClient));
exports.LocalDebugClient = LocalDebugClient;
//# sourceMappingURL=LocalDebugClient.js.map