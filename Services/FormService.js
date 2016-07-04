var mongoose = require('mongoose');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var formMaster = require('../model/FormMaster').FormMaster;
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');




function CreateForm(req, res){};
function GetForms(req, res){};
function GetForm(req, res){};
function DeleteForm(req, res){};
function AddDynamicField(req, res){};
function RemoveDynamicField(req, res){};
function UpdateDynamicField(req, res){};


module.exports.CreateForm = CreateForm;
module.exports.GetForm = GetForm;
module.exports.GetForms = GetForms;
module.exports.DeleteForm = DeleteForm;
module.exports.AddDynamicField = AddDynamicField;
module.exports.RemoveDynamicField = RemoveDynamicField;
module.exports.UpdateDynamicField = UpdateDynamicField;




