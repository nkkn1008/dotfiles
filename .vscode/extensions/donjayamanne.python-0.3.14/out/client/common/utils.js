"use strict";
var path = require("path");
var fs = require("fs");
var child_process = require("child_process");
var settings = require("./configSettings");
var PathValidity = new Map();
function validatePath(filePath) {
    if (filePath.length === 0) {
        return Promise.resolve("");
    }
    if (PathValidity.has(filePath)) {
        return Promise.resolve(PathValidity.get(filePath) ? filePath : "");
    }
    return new Promise(function (resolve) {
        fs.exists(filePath, function (exists) {
            PathValidity.set(filePath, exists);
            return resolve(exists ? filePath : "");
        });
    });
}
exports.validatePath = validatePath;
var pythonInterpretterDirectory = null;
var previouslyIdentifiedPythonPath = null;
function getPythonInterpreterDirectory() {
    // If we already have it and the python path hasn't changed, yay
    if (pythonInterpretterDirectory && previouslyIdentifiedPythonPath === settings.PythonSettings.getInstance().pythonPath) {
        return Promise.resolve(pythonInterpretterDirectory);
    }
    return new Promise(function (resolve) {
        var pythonFileName = settings.PythonSettings.getInstance().pythonPath;
        // Check if we have the path
        var dirName = path.dirname(pythonFileName);
        if (dirName.length === 0 || dirName === "." || dirName.length === pythonFileName.length) {
            return resolve("");
        }
        // If we can execute the python, then get the path from the fullyqualitified name
        child_process.execFile(pythonFileName, ["-c", "print(1234)"], function (error, stdout, stderr) {
            // Yes this is a valid python path
            if (stdout.startsWith("1234")) {
                return resolve(path.dirname(pythonFileName));
            }
            // No idea, didn't work, hence don't reject, but return empty path
            resolve("");
        });
    }).then(function (value) {
        // Cache and return
        previouslyIdentifiedPythonPath = settings.PythonSettings.getInstance().pythonPath;
        return pythonInterpretterDirectory = value;
    }).catch(function () {
        // Don't care what the error is, all we know is that this doesn't work
        return pythonInterpretterDirectory = "";
    });
}
exports.getPythonInterpreterDirectory = getPythonInterpreterDirectory;
var IN_VALID_FILE_PATHS = new Map();
function execPythonFile(file, args, cwd, includeErrorAsResponse) {
    if (includeErrorAsResponse === void 0) { includeErrorAsResponse = false; }
    // Whether to try executing the command without prefixing it with the python path
    var tryUsingCommandArg = false;
    if (file === settings.PythonSettings.getInstance().pythonPath) {
        return execFileInternal(file, args, cwd, includeErrorAsResponse);
    }
    var fullyQualifiedFilePromise = getPythonInterpreterDirectory().then(function (pyPath) {
        var pythonIntepreterPath = pyPath;
        var fullyQualifiedFile = file;
        if (pythonIntepreterPath.length === 0 || file.startsWith(pyPath)) {
            return execFileInternal(fullyQualifiedFile, args, cwd, includeErrorAsResponse);
        }
        // Qualify the command with the python path
        fullyQualifiedFile = path.join(pythonIntepreterPath, file);
        // Check if we know whether this trow ENONE errors
        if (IN_VALID_FILE_PATHS.has(fullyQualifiedFile)) {
            return execFileInternal(file, args, cwd, includeErrorAsResponse);
        }
        // It is possible this file doesn't exist, hence we initialize tryUsingCommandArg = true
        tryUsingCommandArg = true;
        if (PathValidity.has(fullyQualifiedFile)) {
            // If the file exists, then don't try again
            // If PathValidity value = false, that means we don't really know
            // Cuz we could have some command args suffixed in the file path (hopefully this will be fixed in a later build)
            if (PathValidity.get(fullyQualifiedFile)) {
                tryUsingCommandArg = false;
            }
            return execFileInternal(fullyQualifiedFile, args, cwd, includeErrorAsResponse);
        }
        return validatePath(fullyQualifiedFile).then(function (f) {
            // If the file exists, then don't bother trying again
            if (f.length > 0) {
                tryUsingCommandArg = false;
            }
            return execFileInternal(fullyQualifiedFile, args, cwd, includeErrorAsResponse);
        });
    });
    return fullyQualifiedFilePromise.catch(function (error) {
        if (error && error.code === "ENOENT" && tryUsingCommandArg) {
            // Re-execute the file, without the python path prefix
            // Only if we know that the previous one failed with ENOENT
            return execFileInternal(file, args, cwd, includeErrorAsResponse);
        }
        // return what ever error we got from the previous process
        return Promise.reject(error);
    });
}
exports.execPythonFile = execPythonFile;
function execFileInternal(file, args, cwd, includeErrorAsResponse) {
    return new Promise(function (resolve, reject) {
        child_process.execFile(file, args, { cwd: cwd }, function (error, stdout, stderr) {
            if (typeof (error) === "object" && error !== null && (error.code === "ENOENT" || error.code === 127)) {
                if (!IN_VALID_FILE_PATHS.has(file)) {
                    IN_VALID_FILE_PATHS.set(file, true);
                }
                return reject(error);
            }
            // pylint:
            //      In the case of pylint we have some messages (such as config file not found and using default etc...) being returned in stderr
            //      These error messages are useless when using pylint   
            if (includeErrorAsResponse && (stdout.length > 0 || stderr.length > 0)) {
                return resolve(stdout + "\n" + stderr);
            }
            var hasErrors = (error && error.message.length > 0) || (stderr && stderr.length > 0);
            if (hasErrors && (typeof stdout !== "string" || stdout.length === 0)) {
                var errorMsg = (error && error.message) ? error.message : (stderr && stderr.length > 0 ? stderr + "" : "");
                return reject(errorMsg);
            }
            resolve(stdout + "");
        });
    });
}
function mergeEnvVariables(newVariables) {
    for (var setting in process.env) {
        if (!newVariables[setting]) {
            newVariables[setting] = process.env[setting];
        }
    }
    return newVariables;
}
exports.mergeEnvVariables = mergeEnvVariables;
//# sourceMappingURL=utils.js.map