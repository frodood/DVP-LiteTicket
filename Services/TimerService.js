var mongoose = require('mongoose');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var TimeEntry = require('dvp-mongomodels/model/TimeEntry').TimeEntry;
var Ticket = require('dvp-mongomodels/model/Ticket').Ticket;
var User = require('dvp-mongomodels/model/User');
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');






function CreateTimer(req, res){};
function GetTimes(req, res){};
function UpdateTimer(req, res){};
function UpdateTimerTime(req, res){};
function ToggelTimer(req, res){};
function GetMyTimeSheet(req, res){};


module.exports.CreateTimer =CreateTimer;
module.exports.GetTimes = GetTimes;
module.exports.UpdateTimer = UpdateTimer;
module.exports.UpdateTimerTime = UpdateTimerTime;
module.exports.ToggelTimer = ToggelTimer;
module.exports.GetMyTimeSheet = GetMyTimeSheet;