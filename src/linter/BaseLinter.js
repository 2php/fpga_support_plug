"use strict";
exports.__esModule = true;
var vscode_1 = require("vscode");
var BaseLinter = /** @class */ (function () {
    function BaseLinter(name) {
        this.diagnostic_collection = vscode_1.languages.createDiagnosticCollection();
        this.name = name;
    }
    BaseLinter.prototype.startLint = function (doc) {
        this.lint(doc);
    };
    BaseLinter.prototype.removeFileDiagnostics = function (doc) {
        this.diagnostic_collection["delete"](doc.uri);
    };
    return BaseLinter;
}());
exports["default"] = BaseLinter;
