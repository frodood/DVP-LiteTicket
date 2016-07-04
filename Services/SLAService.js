/**
 * Created by a on 7/4/2016.
 */

var mongoose = require('mongoose');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var TimeEntry = require('../model/TimeEntry').TimeEntry;
var Ticket = require('../model/Ticket').Ticket;
var User = require('../model/User');
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');






function CreateSLA(req, res){};
function GetSLA(req, res){};
function GetSLAs(req, res){};
function UpdateSLA(req, res){};
function DeleteSLA(req, res){};
function AddMatrix(req, res){};
function DeleteMatrix(req, res){};
function AddFilterAll(req, res){};
function RemoveFilterAll(req, res){};
function GetFiltersAll(req, res){};
function AddFilterAny(req, res){};
function RemoveFilterAny(req, res){};
function GetFiltersAny(req, res){};
function GetMatrixs(req, res){};


module.exports.CreateSLA =CreateSLA;
module.exports.GetSLA =GetSLA;
module.exports.GetSLAs =GetSLAs;
module.exports.UpdateSLA = UpdateSLA;
module.exports.DeleteSLA = DeleteSLA;
module.exports.AddMatrix = AddMatrix;
module.exports.DeleteMatrix = DeleteMatrix;
module.exports.AddFilterAll = AddFilterAll;
module.exports.RemoveFilterAll = RemoveFilterAll;
module.exports.AddFilterAny = AddFilterAny;
module.exports.RemoveFilterAny = RemoveFilterAny;
module.exports.GetMatrixs = GetMatrixs;
module.exports.GetFiltersAll =GetFiltersAll;
module.exports.GetFiltersAny =GetFiltersAny;

