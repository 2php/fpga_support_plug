"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var vscode = require("vscode");
var Provider = /** @class */ (function () {
    function Provider() {
		this.data = [
			new Item('Init',   'FPGA.Init',   'Init'),
			new Item('Update', 'FPGA.Update', 'Update designed file'),
			new Item('Sim',    'FPGA.Sim',    'Run the Simulation'),
			new Item('Build',  
					 'FPGA.Build',  
					 'Build the current fpga project',
						 [
							new Item('Snyth','FPGA.Snyth','Snyth the current fpga project'), 
							new Item('Impl' ,'FPGA.Impl' ,'Impl  the current fpga project')]
					),
			new Item('Program','FPGA.Program','Download the bit file into the device'),
			new Item('GUI',    'FPGA.GUI',    'Open the GUI'),
			new Item('exit',   'FPGA.exit',   'Exit the current project')
        ];
	}
    Provider.prototype.getTreeItem = function (element) {
        return element;
    };
    Provider.prototype.getChildren = function (element) {
        if (element === undefined) {
            return this.data;
        }
        return element.children;
    };
    return Provider;
}());
exports.Provider = Provider;
var Item = /** @class */ (function (_super) {
    __extends(Item, _super);
    function Item(label, command, tooltip, children) {
        var _this = _super.call(this, label, children === undefined ? vscode.TreeItemCollapsibleState.None : vscode.TreeItemCollapsibleState.Collapsed) || this;
		_this.contextValue = "FPGA";
		_this.children = children;
        _this.command = {
            title: label,
            command: command
        };
		_this.tooltip = tooltip;
		_this.iconPath = `${__dirname}/../../../images/svg/cmd.svg`
        return _this;
    }
    return Item;
}(vscode.TreeItem));