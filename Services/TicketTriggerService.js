/**
 * Created by a on 7/4/2016.
 */

var mongoose = require('mongoose');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var TimeEntry = require('dvp-mongomodels/model/TimeEntry').TimeEntry;
var Ticket = require('dvp-mongomodels/model/Ticket').Ticket;
var User = require('dvp-mongomodels/model/User');
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');


function CreateTrigger(req, res){};
function GetTriggers(req, res){};
function GetTrigger(req, res){};
function DeleteTrigger(req, res){};
function UpdateTrigger(req,res){};
function AddFilterAll(req, res){};
function RemoveFilterAll(req, res){};
function GetFiltersAll(req, res){};
function AddFilterAny(req, res){};
function RemoveFilterAny(req, res){};
function GetFiltersAny(req, res){};
function AddAction(req, res){};
function RemoveAction(req, res){};
function GetActions(req, res){};
function AddOperations(req, res){};
function RemoveOperations(req, res){};
function GetOperations(req, res){};

module.exports.CreateTrigger =CreateTrigger;
module.exports.GetTriggers = GetTriggers;
module.exports.GetTrigger = GetTrigger;
module.exports.UpdateTrigger = UpdateTrigger;
module.exports.DeleteTrigger = DeleteTrigger;
module.exports.AddFilterAll = AddFilterAll;
module.exports.RemoveFilterAll = RemoveFilterAll;
module.exports.GetFiltersAll = GetFiltersAll;
module.exports.AddFilterAny = AddFilterAny;
module.exports.RemoveFilterAny = RemoveFilterAny;
module.exports.GetFiltersAny = GetFiltersAny;
module.exports.AddAction = AddAction;
module.exports.RemoveAction = RemoveAction;
module.exports.GetActions = GetActions;
module.exports.AddOperations = AddOperations;
module.exports.RemoveOperations = RemoveOperations;
module.exports.GetOperations = GetOperations;






