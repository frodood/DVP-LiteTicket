/**
 * Created by Heshan.i on 7/22/2016.
 */


var SLA = require('dvp-mongomodels/model/SLA').SLA;
var Ticket = require('dvp-mongomodels/model/Ticket').Ticket;
var EventEmitter = require('events').EventEmitter;
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var util = require('util');

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

function ExecuteTrigger(ticketId, callback){
    var jsonString;

    if(ticketId) {
        Ticket.findOne({_id: ticketId}, function (err, tResult) {
            if (err) {
                jsonString = messageFormatter.FormatMessage(err, "Get Ticket Failed", false, undefined);
                callback(jsonString);
            } else {
                if (tResult) {
                    SLA.find({$and:[{company:tResult.company}, {tenant:tResult.tenant}]}, function (err, slaResult) {
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
                                    if(SLAsToExecute.length > 0){
                                        var slaToExecute = SLAsToExecute[0];
                                        tResult.sla = slaToExecute.id;
                                        tResult.update(tResult, function (err, newTicket) {
                                            if (err) {
                                                jsonString = messageFormatter.FormatMessage(err, "Update Ticket Failed", false, undefined);
                                            } else {
                                                jsonString = messageFormatter.FormatMessage(undefined, "Update Ticket Successful", true, newSla);
                                            }
                                            console.log(jsonString);
                                        });
                                    }else{
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



module.exports.ExecuteTrigger = ExecuteTrigger;