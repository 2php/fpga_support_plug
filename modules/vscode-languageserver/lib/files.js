/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const url = require("url");
const path = require("path");
const fs = require("fs");
const child_process_1 = require("child_process");
/**
 * @deprecated Use the `vscode-uri` npm module which provides a more
 * complete implementation of handling VS Code URIs.
 */
function uriToFilePath(uri) {
    let parsed = url.parse(uri);
    if (parsed.protocol !== 'file:' || !parsed.path) {
        return undefined;
    }
    let segments = parsed.path.split('/');
    for (var i = 0, len = segments.length; i < len; i++) {
        segments[i] = decodeURIComponent(segments[i]);
    }
    if (process.platform === 'win32' && segments.length > 1) {
        let first = segments[0];
        let second = segments[1];
        // Do we have a drive letter and we started with a / which is the
        // case if the first segement is empty (see split above)
        if (first.length === 0 && second.length > 1 && second[1] === ':') {
            // Remove first slash
            segments.shift();
        }
    }
    return path.normalize(segments.join('/'));
}
exports.uriToFilePath = uriToFilePath;
function isWindows() {
    return process.platform === 'win32';
}
function resolveModule(workspaceRoot, moduleName) {
    let nodePathKey = 'NODE_PATH';
    return new Promise((resolve, reject) => {
        let nodePath = [];
        if (workspaceRoot) {
            nodePath.push(path.join(workspaceRoot, 'node_modules'));
        }
        child_process_1.exec('npm config get prefix', (error, stdout, _stderr) => {
            if (!error) {
                let globalPath = stdout.replace(/[\s\r\n]+$/, '');
                if (globalPath.length > 0) {
                    if (isWindows()) {
                        nodePath.push(path.join(globalPath, 'node_modules'));
                    }
                    else {
                        nodePath.push(path.join(globalPath, 'lib', 'node_modules'));
                    }
                }
            }
            let separator = isWindows() ? ';' : ':';
            let env = process.env;
            let newEnv = Object.create(null);
            Object.keys(env).forEach(key => newEnv[key] = env[key]);
            if (newEnv[nodePathKey]) {
                newEnv[nodePathKey] = nodePath.join(separator) + separator + newEnv[nodePathKey];
            }
            else {
                newEnv[nodePathKey] = nodePath.join(separator);
            }
            newEnv['ELECTRON_RUN_AS_NODE'] = '1';
            try {
                let cp = child_process_1.fork(path.join(__dirname, 'resolve.js'), [], { env: newEnv, execArgv: [] });
                if (cp.pid === void 0) {
                    reject(new Error(`Starting process to resolve node module  ${moduleName} failed`));
                    return;
                }
                cp.on('message', (message) => {
                    if (message.command === 'resolve') {
                        let toRequire = moduleName;
                        if (message.success) {
                            toRequire = message.result;
                        }
                        cp.send({ command: 'exit' });
                        try {
                            resolve(require(toRequire));
                        }
                        catch (error) {
                            reject(error);
                        }
                    }
                });
                let message = {
                    command: 'resolve',
                    args: moduleName
                };
                cp.send(message);
            }
            catch (error) {
                reject(error);
            }
        });
    });
}
exports.resolveModule = resolveModule;
function resolve(moduleName, nodePath, cwd, tracer) {
    const nodePathKey = 'NODE_PATH';
    const app = [
        "var p = process;",
        "p.on('message',function(m){",
        "if(m.c==='e'){",
        "p.exit(0);",
        "}",
        "else if(m.c==='rs'){",
        "try{",
        "var r=require.resolve(m.a);",
        "p.send({c:'r',s:true,r:r});",
        "}",
        "catch(err){",
        "p.send({c:'r',s:false});",
        "}",
        "}",
        "});"
    ].join('');
    return new Promise((resolve, reject) => {
        let env = process.env;
        let newEnv = Object.create(null);
        Object.keys(env).forEach(key => newEnv[key] = env[key]);
        if (nodePath) {
            if (newEnv[nodePathKey]) {
                newEnv[nodePathKey] = nodePath + path.delimiter + newEnv[nodePathKey];
            }
            else {
                newEnv[nodePathKey] = nodePath;
            }
            if (tracer) {
                tracer(`NODE_PATH value is: ${newEnv[nodePathKey]}`);
            }
        }
        newEnv['ELECTRON_RUN_AS_NODE'] = '1';
        try {
            let cp = child_process_1.fork('', [], {
                cwd: cwd,
                env: newEnv,
                execArgv: ['-e', app]
            });
            if (cp.pid === void 0) {
                reject(new Error(`Starting process to resolve node module  ${moduleName} failed`));
                return;
            }
            cp.on('error', (error) => {
                reject(error);
            });
            cp.on('message', (message) => {
                if (message.c === 'r') {
                    cp.send({ c: 'e' });
                    if (message.s) {
                        resolve(message.r);
                    }
                    else {
                        reject(new Error(`Failed to resolve module: ${moduleName}`));
                    }
                }
            });
            let message = {
                c: 'rs',
                a: moduleName
            };
            cp.send(message);
        }
        catch (error) {
            reject(error);
        }
    });
}
exports.resolve = resolve;
function resolveGlobalNodePath(tracer) {
    let npmCommand = 'npm';
    let options = {
        encoding: 'utf8'
    };
    if (isWindows()) {
        npmCommand = 'npm.cmd';
        options.shell = true;
    }
    let handler = () => { };
    try {
        process.on('SIGPIPE', handler);
        let stdout = child_process_1.spawnSync(npmCommand, ['config', 'get', 'prefix'], options).stdout;
        if (!stdout) {
            if (tracer) {
                tracer(`'npm config get prefix' didn't return a value.`);
            }
            return undefined;
        }
        let prefix = stdout.trim();
        if (tracer) {
            tracer(`'npm config get prefix' value is: ${prefix}`);
        }
        if (prefix.length > 0) {
            if (isWindows()) {
                return path.join(prefix, 'node_modules');
            }
            else {
                return path.join(prefix, 'lib', 'node_modules');
            }
        }
        return undefined;
    }
    catch (err) {
        return undefined;
    }
    finally {
        process.removeListener('SIGPIPE', handler);
    }
}
exports.resolveGlobalNodePath = resolveGlobalNodePath;
function resolveGlobalYarnPath(tracer) {
    let yarnCommand = 'yarn';
    let options = {
        encoding: 'utf8'
    };
    if (isWindows()) {
        yarnCommand = 'yarn.cmd';
        options.shell = true;
    }
    let handler = () => { };
    try {
        process.on('SIGPIPE', handler);
        let results = child_process_1.spawnSync(yarnCommand, ['global', 'dir', '--json'], options);
        let stdout = results.stdout;
        if (!stdout) {
            if (tracer) {
                tracer(`'yarn global dir' didn't return a value.`);
                if (results.stderr) {
                    tracer(results.stderr);
                }
            }
            return undefined;
        }
        let lines = stdout.trim().split(/\r?\n/);
        for (let line of lines) {
            try {
                let yarn = JSON.parse(line);
                if (yarn.type === 'log') {
                    return path.join(yarn.data, 'node_modules');
                }
            }
            catch (e) {
                // Do nothing. Ignore the line
            }
        }
        return undefined;
    }
    catch (err) {
        return undefined;
    }
    finally {
        process.removeListener('SIGPIPE', handler);
    }
}
exports.resolveGlobalYarnPath = resolveGlobalYarnPath;
var FileSystem;
(function (FileSystem) {
    let _isCaseSensitive = undefined;
    function isCaseSensitive() {
        if (_isCaseSensitive !== void 0) {
            return _isCaseSensitive;
        }
        if (process.platform === 'win32') {
            _isCaseSensitive = false;
        }
        else {
            // convert current file name to upper case / lower case and check if file exists
            // (guards against cases when name is already all uppercase or lowercase)
            _isCaseSensitive = !fs.existsSync(__filename.toUpperCase()) || !fs.existsSync(__filename.toLowerCase());
        }
        return _isCaseSensitive;
    }
    FileSystem.isCaseSensitive = isCaseSensitive;
    function isParent(parent, child) {
        if (isCaseSensitive()) {
            return path.normalize(child).indexOf(path.normalize(parent)) === 0;
        }
        else {
            return path.normalize(child).toLowerCase().indexOf(path.normalize(parent).toLowerCase()) == 0;
        }
    }
    FileSystem.isParent = isParent;
})(FileSystem = exports.FileSystem || (exports.FileSystem = {}));
function resolveModulePath(workspaceRoot, moduleName, nodePath, tracer) {
    if (nodePath) {
        if (!path.isAbsolute(nodePath)) {
            nodePath = path.join(workspaceRoot, nodePath);
        }
        return resolve(moduleName, nodePath, nodePath, tracer).then((value) => {
            if (FileSystem.isParent(nodePath, value)) {
                return value;
            }
            else {
                return Promise.reject(new Error(`Failed to load ${moduleName} from node path location.`));
            }
        }).then(undefined, (_error) => {
            return resolve(moduleName, resolveGlobalNodePath(tracer), workspaceRoot, tracer);
        });
    }
    else {
        return resolve(moduleName, resolveGlobalNodePath(tracer), workspaceRoot, tracer);
    }
}
exports.resolveModulePath = resolveModulePath;
/**
 * Resolves the given module relative to the given workspace root. In contrast to
 * `resolveModule` this method considers the parent chain as well.
 */
function resolveModule2(workspaceRoot, moduleName, nodePath, tracer) {
    return resolveModulePath(workspaceRoot, moduleName, nodePath, tracer).then((path) => {
        if (tracer) {
            tracer(`Module ${moduleName} got resolved to ${path}`);
        }
        return require(path);
    });
}
exports.resolveModule2 = resolveModule2;
