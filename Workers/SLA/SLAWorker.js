/**
 * Created by Heshan.i on 7/22/2016.
 */


var SLA = require('dvp-mongomodels/model/SLA').SLA;
var Ticket = require('dvp-mongomodels/model/Ticket').Ticket;
var EventEmitter = require('events').EventEmitter;
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var util = require('util');
var validator = require('validator');
var config = require('config');
var moment = require('moment');
var RestClient = require('../Trigger/RestClient.js');
var CommonWorker = require('../Trigger/TriggerWorker.js');

function numSort(a, b) {
    return a.priority - b.priority;
}

function UniqueObjectArray(array, field) {
    var processed = [];
    for (var i=array.length-1; i>=0; i--) {
        if (processed.indexOf(array[i][field])<0) {
            processed.push(array[i][field]);
        } else {
            array.splice(i, 1);
        }
    }
    return array;
}

function GenerateFilterRegex(value){
    if(value){
        var regexStr = "";
        var tagArray = value.split(".");
        if(tagArray.length > 0){
            if(tagArray[i] === "*"){
                regexStr = util.format("^%s", "([A-Z]*[a-z]*)*");
            }else{
                regexStr = util.format("^(%s)", tagArray[0]);
            }
        }

        for (var i = 1; i < tagArray.length; i++) {
            if(tagArray[i] === "*"){
                regexStr = util.format("%s[.]%s", regexStr, "([A-Z]*[a-z]*)*");
            }else{
                regexStr = util.format("%s[.](%s)", regexStr, tagArray[i]);
            }
        }
        return util.format("%s[^\s]*", regexStr);
    }else{
        return value;
    }
}


function AggregateCondition(obj, field, value, operator, callback){
    try {
        switch (operator) {
            case "is":
                callback(obj[field] === value);
                break;
            case "less_than":
                callback(obj[field] < value);
                break;
            case "greater_than":
                callback(obj[field] > value);
                break;
            case "is_not":
                callback(obj[field] != value);
                break;
            case "included":
                if(field === "tags") {
                    var pattern_i = new RegExp(GenerateFilterRegex(value));
                    callback(pattern_i.test(obj[field]));
                }else {
                    callback(obj[field].indexOf(value) > -1);
                }
                break;
            case "not_included":
                if(field === "tags") {
                    var pattern_ni = new RegExp(GenerateFilterRegex(value));
                    callback(!pattern_ni.test(obj[field]));
                }else {
                    callback(obj[field].indexOf(value) === -1);
                }
                break;
            case "greater_than_or_equal":
                callback(obj[field] >= value);
                break;
            case "less_than_or_equal":
                callback(obj[field] <= value);
                break;
            default :
                callback(false);
                break;
        }
    }catch(ex){
        callback(false);
    }
}

function ExecuteAndOperation(obj, sla, callback){
    if(sla.filter.all && sla.filter.all.length>0){
        var eCount = 0;
        var isDone = false;
        for(var i = 0; i < sla.filter.all.length; i++){
            var condition = sla.filter.all[i];
            AggregateCondition(obj, condition.field, condition.value, condition.operator, function(aResult){
                eCount++;
                if(!isDone && aResult === false){
                    callback(true, false, sla);
                    isDone = true;
                    //break;
                }
                if(!isDone && eCount === sla.filter.all.length){
                    callback(true, true, sla);
                }
            });
        }
    }else{
        callback(false, false, sla);
    }
}

function ExecuteOrOperation(obj, sla, callback){
    if(sla.filter.any && sla.filter.any.length>0){
        var eCount = 0;
        var isDone = false;
        for(var i = 0; i < sla.filter.any.length; i++){
            var condition = sla.filter.any[i];
            AggregateCondition(obj, condition.field, condition.value, condition.operator, function(aResult){
                eCount++;
                if(!isDone && aResult === true){
                    callback(true, true, sla);
                    isDone = true;
                    //break;
                }
                if(!isDone && eCount === sla.filter.any.length){
                    callback(true, false, sla);
                }
            });
        }
    }else{
        callback(false, false, sla);
    }
}

function MatchSLAs(obj, SLAs){
    var e = new EventEmitter();
    process.nextTick(function () {
        if (SLAs && SLAs.length>0) {
            var allCount = 0;
            var anyCount = 0;
            for (var i = 0; i < SLAs.length; i++) {
                var sla = SLAs[i];
                ExecuteAndOperation(obj, sla, function(accept, match, rSla){
                    allCount++;
                    if(accept && match) {
                        e.emit('sla', rSla);
                    }
                    if (SLAs.length === allCount && SLAs.length === anyCount) {
                        e.emit('endMatchingSLAs');
                    }
                });
                ExecuteOrOperation(obj, sla, function(accept, match, rSla){
                    anyCount++;
                    if(accept && match) {
                        e.emit('sla', rSla);
                    }
                    if (SLAs.length === allCount && SLAs.length === anyCount) {
                        e.emit('endMatchingSLAs');
                    }
                });
            }
        }
        else {
            e.emit('endMatchingSLAs');
        }
    });

    return (e);
}

function ExecuteSLA(ticketId, previousPriority, callback){
    var jsonString;

    if(ticketId) {
        Ticket.findOne({_id: ticketId}, function (err, tResult) {
            if (err) {
                jsonString = messageFormatter.FormatMessage(err, "Get Ticket Failed", false, undefined);
                callback(jsonString);
            } else {
                if (tResult) {
                    if(tResult.sla){
                        SLA.findOne({_id: tResult.sla}, function (err, sla) {
                            if (err) {
                                jsonString = messageFormatter.FormatMessage(err, "Get SLA Failed", false, undefined);
                                callback(jsonString);
                            } else {
                                UpdateCron(tResult.tenant, tResult.company, tResult.id, tResult.priority, previousPriority, sla.matrix);
                                jsonString = messageFormatter.FormatMessage(err, "Start Execute Scheduler Success", true, undefined);
                                callback(jsonString);
                            }
                        });
                    }else {
                        SLA.find({$and: [{company: tResult.company}, {tenant: tResult.tenant}]}, function (err, slaResult) {
                            if (err) {
                                jsonString = messageFormatter.FormatMessage(err, "Find SLA Failed", false, undefined);
                                callback(jsonString);
                            } else {
                                if (slaResult) {
                                    var matchingSLAs = [];
                                    var mt = MatchSLAs(tResult, slaResult);

                                    mt.on('sla', function (sla) {
                                        matchingSLAs.push(sla);
                                    });

                                    mt.on('endMatchingSLAs', function () {
                                        var SLAsToExecute = UniqueObjectArray(matchingSLAs, "title").sort(numSort);
                                        if (SLAsToExecute.length > 0) {
                                            var slaToExecute = SLAsToExecute[0];
                                            tResult.sla = slaToExecute.id;
                                            tResult.update(tResult, function (err, newTicket) {
                                                if (err) {
                                                    jsonString = messageFormatter.FormatMessage(err, "Update Ticket Failed", false, undefined);
                                                } else {
                                                    jsonString = messageFormatter.FormatMessage(undefined, "Update Ticket Successful", true, newTicket);
                                                    UpdateCron(tResult.tenant, tResult.company, tResult.id, tResult.priority, previousPriority, slaToExecute.matrix);
                                                }
                                                console.log(jsonString);
                                            });
                                        } else {
                                            jsonString = messageFormatter.FormatMessage(undefined, "No SLA found", false, undefined);
                                            callback(jsonString);
                                        }
                                    });
                                } else {
                                    jsonString = messageFormatter.FormatMessage(undefined, "SLA Failed, SLA object is null", false, undefined);
                                    callback(jsonString);
                                }
                            }
                        });
                    }
                } else {
                    jsonString = messageFormatter.FormatMessage(undefined, "ExecuteSLA Failed, ticket object is null", false, undefined);
                    callback(jsonString);
                }
            }
        });
    }else{
        jsonString = messageFormatter.FormatMessage(undefined, "Invalid Ticket ID", false, undefined);
        callback(jsonString);
    }
}

function UpdateCron(tenant, company, ticketId, priority, previousPriority, matrices){
    try{
        var internalAccessToken = util.format("%d:%d", tenant, company);

        for(var i = 0; i < matrices.length; i++){
            var matrix = matrices[i];
            if(priority === matrix.priority) {
                var cronUrl = util.format("http://%s/DVP/API/%s/Cron", config.Services.scheduleWorkerHost, config.Services.scheduleWorkerVersion);
                var callbackUrl = util.format("http://%s/DVP/API/%s/SLA/ScheduleCallback", config.LBServer.ip, config.Host.version);
                if (validator.isIP(config.Services.scheduleWorkerHost)) {
                    cronUrl = util.format("http://%s:%s/DVP/API/%s/Cron", config.Services.scheduleWorkerHost, config.Services.scheduleWorkerPort, config.Services.scheduleWorkerVersion);
                }
                if (validator.isIP(config.LBServer.ip)) {
                    callbackUrl = util.format("http://%s:%s/DVP/API/%s/SLA/ScheduleCallback", config.LBServer.ip, config.LBServer.port, config.Host.version);
                }

                var targetTime = moment().add(matrix.target, 'm');
                var targetScheduler = {
                    Description: "on_fail",
                    CronePattern: targetTime.toDate().toString(),
                    CallbackURL: callbackUrl,
                    CallbackData: JSON.stringify(matrix),
                    Reference: util.format("%s#%s#%s#%s", matrix.id, "on_fail", ticketId, matrix.criteria)
                };
                RestClient.DoPost(internalAccessToken, cronUrl, targetScheduler, function (err, res1, result) {
                    if (err) {
                        console.log(err);
                    }
                    else {
                        var resObj = JSON.parse(result);
                        if (resObj.IsSuccess) {
                            console.log("Add target CRON Success");
                        } else {
                            console.log(result.Message);
                        }
                    }
                });

                if (matrix.threshold) {
                    var thresholdTime = moment().add(matrix.threshold, 'm');
                    var thresholdScheduler = {
                        Description: "on_threshold",
                        CronePattern: thresholdTime.toDate().toString(),
                        CallbackURL: callbackUrl,
                        CallbackData: JSON.stringify(matrix),
                        Reference: util.format("%s#%s#%s#%s", matrix.id, "on_threshold", ticketId, matrix.criteria)
                    };
                    RestClient.DoPost(internalAccessToken, cronUrl, thresholdScheduler, function (err, res1, result) {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            var resObj = JSON.parse(result);
                            if (resObj.IsSuccess) {
                                console.log("Add threshold CRON Success");
                            } else {
                                console.log(result.Message);
                            }
                        }
                    });
                }
            }else if(previousPriority && previousPriority != priority && previousPriority === matrix.priority){
                var cronTargetDeleteUrl = util.format("http://%s/DVP/API/%s/Cron/Reference/%s", config.Services.scheduleWorkerHost, config.Services.scheduleWorkerVersion, util.format("%s#%s#%s#%s", matrix.id, "on_fail", ticketId, matrix.criteria));
                var cronThresholdDeleteUrl = util.format("http://%s/DVP/API/%s/Cron/Reference/%s", config.Services.scheduleWorkerHost, config.Services.scheduleWorkerVersion, util.format("%s#%s#%s#%s", matrix.id, "on_threshold", ticketId, matrix.criteria));
                if (validator.isIP(config.Services.scheduleWorkerHost)) {
                    cronTargetDeleteUrl = util.format("http://%s:%s/DVP/API/%s/Cron/Reference/%s", config.Services.scheduleWorkerHost, config.Services.scheduleWorkerPort, config.Services.scheduleWorkerVersion, util.format("%s#%s#%s#%s", matrix.id, "on_fail", ticketId, matrix.criteria));
                    cronThresholdDeleteUrl = util.format("http://%s:%s/DVP/API/%s/Cron/Reference/%s", config.Services.scheduleWorkerHost, config.Services.scheduleWorkerPort, config.Services.scheduleWorkerVersion, util.format("%s#%s#%s#%s", matrix.id, "on_threshold", ticketId, matrix.criteria));
                }

                RestClient.DoDelete(internalAccessToken, cronTargetDeleteUrl, function (err, res1, result) {

                });
                if(matrix.threshold) {
                    RestClient.DoDelete(internalAccessToken, cronThresholdDeleteUrl, function (err, res1, result) {

                    });
                }
            }
        }
    }catch(ex){
        console.log("UpdateCron Failed:: "+ ex);
    }
}

function ScheduleCallback(req, res){
    var jsonString;
    try {
        if(req.body){
            var references = req.body.Reference.split("#");
            if(references.length == 4){
                var ticketId = references[2];
                var operationType = references[1];
                var matrixInfo = JSON.parse(req.body.CallbackData);

                Ticket.findOne({_id:ticketId}, function(err, ticket){
                    if(err){
                        console.log("Get Ticket Information Failed.");
                        jsonString = messageFormatter.FormatMessage(undefined, "Get Ticket Information Failed.", false, undefined);
                        res.end(jsonString);
                    }else{
                        if(ticket.priority === matrixInfo.priority){
                            var operationsToExecute = matrixInfo[operationType];
                            if(operationsToExecute && operationsToExecute.length > 0){
                                for(var i =0; i < operationsToExecute.length; i++){
                                    var operationToExecute = operationsToExecute[i];
                                    CommonWorker.ExecuteOperations(ticket, operationToExecute);
                                }
                                console.log("Execute Operations Success");
                                jsonString = messageFormatter.FormatMessage(undefined, "Execute Operations Success", true, undefined);
                                res.end(jsonString);
                            }else{
                                console.log("No Operations To Execute.");
                                jsonString = messageFormatter.FormatMessage(undefined, "No Operations To Execute.", false, undefined);
                                res.end(jsonString);
                            }
                        }else{
                            console.log("Unmatching Ticket  priority.");
                            jsonString = messageFormatter.FormatMessage(undefined, "Unmatching Ticket  priority.", false, undefined);
                            res.end(jsonString);
                        }
                    }
                });
            }else{
                console.log("Invalid ScheduleCallback.");
                jsonString = messageFormatter.FormatMessage(undefined, "Invalid ScheduleCallback.", false, undefined);
                res.end(jsonString);
            }
        }else{
            console.log("Empty ScheduleCallback.");
            jsonString = messageFormatter.FormatMessage(undefined, "Empty ScheduleCallback.", false, undefined);
            res.end(jsonString);
        }
    }catch(ex){
        console.log("ScheduleCallback Failed.");
        jsonString = messageFormatter.FormatMessage(ex, "ScheduleCallback Failed.", false, undefined);
        res.end(jsonString);
    }
}

module.exports.ExecuteSLA = ExecuteSLA;
module.exports.ScheduleCallback = ScheduleCallback;