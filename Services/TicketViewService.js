/**
 * Created by Sukitha on 8/27/2016.
 */

var mongoose = require('mongoose');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var TicketView = require('dvp-mongomodels/model/TicketView').TicketView;
var User = require('dvp-mongomodels/model/User');
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var Ticket = require('dvp-mongomodels/model/Ticket').Ticket;
var moment = require("moment");


function CreateTicketView(req, res){


    logger.info("DVP-LiteTicket.CreateTicketView Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);

    var jsonString;



    User.findOne({username: req.user.iss, company: company, tenant: tenant}, function (err, user) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
            res.end(jsonString);
        }
        else {
            if (user) {

                var ticketview = TicketView({
                    title: req.body.title,
                    owner: user.id,
                    active: req.body.Active,
                    created_at: Date.now(),
                    updated_at: Date.now(),
                    company: company,
                    tenant: tenant,
                    conditions: req.body.conditions,
                    order: req.body.order,
                    public: req.body.public
                });

                ticketview.save(function(err, trigger){
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Ticket view create failed", false, undefined);
                    }
                    else {
                        jsonString = messageFormatter.FormatMessage(undefined, "Ticket view saved successfully", true, trigger);
                    }
                    res.end(jsonString);
                });


            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Get User Failed", false, undefined);
                res.end(jsonString);
            }
        }
    });


}

function GetMyTicketViews(req, res){
    logger.info("DVP-LiteTicket.GetMyTicketViews Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;


    User.findOne({username: req.user.iss, company: company, tenant: tenant}, function (err, user) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
            res.end(jsonString);
        }
        else {
            if (user) {

                TicketView.find({$or:[{company: company, tenant: tenant, owner: user.id},{public:true}]}, function (err, view) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Get Ticket Views Failed", false, undefined);
                        res.end(jsonString);
                    } else {
                        jsonString = messageFormatter.FormatMessage(err, "Get Ticket Views Success", true, view);
                        res.end(jsonString);
                    }
                });


            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Get User Failed", false, undefined);
                res.end(jsonString);
            }
        }
    });



}

function GetTicketView(req, res){

    logger.info("DVP-LiteTicket.GetTicketView Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;


    User.findOne({username: req.user.iss, company: company, tenant: tenant}, function (err, user) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
            res.end(jsonString);
        }
        else {
            if (user) {

                TicketView.findOne({company: company, tenant: tenant, _id: req.params.id, owner: user.id}, function (err, view) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Get Ticket Views Failed", false, undefined);
                        res.end(jsonString);
                    } else {
                        jsonString = messageFormatter.FormatMessage(err, "Get Ticket Views Success", true, view);
                        res.end(jsonString);
                    }
                });


            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Get User Failed", false, undefined);
                res.end(jsonString);
            }
        }
    });

}

function DeleteTicketView(req, res){

    logger.info("DVP-LiteTicket.DeleteTicketView Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;


    User.findOne({username: req.user.iss, company: company, tenant: tenant}, function (err, user) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
            res.end(jsonString);
        }
        else {
            if (user) {

                TicketView.findOneAndRemove({company: company, tenant: tenant, _id: req.params.id, owner: user.id}, function (err, view) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Delete Ticket Views Failed", false, undefined);
                        res.end(jsonString);
                    } else {
                        jsonString = messageFormatter.FormatMessage(err, "Delete Ticket Views Success", true, view);
                        res.end(jsonString);
                    }
                });
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Get User Failed", false, undefined);
                res.end(jsonString);
            }
        }
    });
}

function UpdateTicketView(req,res){
    logger.info("DVP-LiteTicket.UpdateTicketView Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;


    User.findOne({username: req.user.iss, company: company, tenant: tenant}, function (err, user) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
            res.end(jsonString);
        }
        else {
            if (user) {

                TicketView.findOneAndUpdate({company: company, tenant: tenant, owner: user.id, _id: req.params.id}, req.body, function (err, view) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Update Ticket Views Failed", false, undefined);
                        res.end(jsonString);
                    } else {
                        jsonString = messageFormatter.FormatMessage(err, "Update Ticket Views Success", true, view);
                        res.end(jsonString);
                    }
                });


            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Get User Failed", false, undefined);
                res.end(jsonString);
            }
        }
    });


}

function AddFilterAll(req, res){



    logger.info("DVP-LiteTicket.AddFilterAll Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;


    User.findOne({username: req.user.iss, company: company, tenant: tenant}, function (err, user) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
            res.end(jsonString);
        }
        else {
            if (user) {

                TicketView.findOne({company: company, tenant: tenant, _id: req.params.id, owner: user.id}, function (err, view) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Get Ticket Views Failed", false, undefined);
                        res.end(jsonString);
                    } else {

                        if(!view){

                            jsonString = messageFormatter.FormatMessage(undefined, "Get Ticket Views failed", false, undefined);
                            res.end(jsonString);

                        }else{

                            var allFiler = {field: req.body.field, operator: req.body.operator, value: req.body.value};
                            if (view.conditions.all && Array.isArray(view.conditions.all)) {
                                view.conditions.all.push(allFiler);
                            } else {
                                view.conditions.all = [allFiler];
                            }
                            view.save(function (err, newview) {
                                if (err) {
                                    jsonString = messageFormatter.FormatMessage(err, "Add Filter All Failed", false, undefined);
                                } else {
                                    jsonString = messageFormatter.FormatMessage(undefined, "Add Filter All Successful", true, newview);
                                }
                                res.end(jsonString);
                            });
                        }


                    }
                });


            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Get User Failed", false, undefined);
                res.end(jsonString);
            }
        }
    });
}

function AddFilterAny(req, res){



    logger.info("DVP-LiteTicket.AddFilterAny Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;


    User.findOne({username: req.user.iss, company: company, tenant: tenant}, function (err, user) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
            res.end(jsonString);
        }
        else {
            if (user) {

                TicketView.findOne({company: company, tenant: tenant, _id: req.params.id, owner: user.id}, function (err, view) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Get Ticket Views Failed", false, undefined);
                        res.end(jsonString);
                    } else {

                        if(!view){

                            jsonString = messageFormatter.FormatMessage(undefined, "Get Ticket Views failed", false, undefined);
                            res.end(jsonString);

                        }else{

                            var anyFiler = {field: req.body.field, operator: req.body.operator, value: req.body.value};
                            if (view.conditions.any && Array.isArray(view.conditions.any)) {
                                view.conditions.any.push(anyFiler);
                            } else {
                                view.conditions.any = [anyFiler];
                            }
                            view.save(function (err, newview) {
                                if (err) {
                                    jsonString = messageFormatter.FormatMessage(err, "Add Filter Any Failed", false, undefined);
                                } else {
                                    jsonString = messageFormatter.FormatMessage(undefined, "Add Filter Any Successful", true, newview);
                                }
                                res.end(jsonString);
                            });
                        }


                    }
                });


            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Get User Failed", false, undefined);
                res.end(jsonString);
            }
        }
    });
}

function RemoveFilterAll(req, res){

    logger.info("DVP-LiteTicket.RemoveFilterAll Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;


    User.findOne({username: req.user.iss, company: company, tenant: tenant}, function (err, user) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
            res.end(jsonString);
        }
        else {
            if (user) {

                TicketView.findOne({company: company, tenant: tenant, _id: req.params.id, owner: user.id}, function (err, view) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Get Ticket Views Failed", false, undefined);
                        res.end(jsonString);
                    } else {

                        if(!view){

                            jsonString = messageFormatter.FormatMessage(undefined, "Get Ticket Views failed", false, undefined);
                            res.end(jsonString);

                        }else{

                            for (var i = 0; i < view.conditions.all.length; i++) {
                                if (view.conditions.all[i].id == req.params.fid) {
                                    view.conditions.all.splice(i, 1);
                                    break;
                                }
                            }
                            view.save( function (err, newTrigger) {
                                if (err) {
                                    jsonString = messageFormatter.FormatMessage(err, "Delete Filter All Failed", false, undefined);
                                } else {
                                    jsonString = messageFormatter.FormatMessage(undefined, "Delete Filter All Successful", true, newTrigger);
                                }
                                res.end(jsonString);
                            });
                        }
                    }
                });
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Get User Failed", false, undefined);
                res.end(jsonString);
            }
        }
    });
}

function RemoveFilterAny(req, res){


    logger.info("DVP-LiteTicket.RemoveFilterAny Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;


    User.findOne({username: req.user.iss, company: company, tenant: tenant}, function (err, user) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
            res.end(jsonString);
        }
        else {
            if (user) {

                TicketView.findOne({company: company, tenant: tenant, _id: req.params.id, owner: user.id}, function (err, view) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Get Ticket Views Failed", false, undefined);
                        res.end(jsonString);
                    } else {

                        if(!view){

                            jsonString = messageFormatter.FormatMessage(undefined, "Get Ticket Views failed", false, undefined);
                            res.end(jsonString);

                        }else{

                            for (var i = 0; i < view.conditions.any.length; i++) {
                                if (view.conditions.any[i].id == req.params.fid) {
                                    view.conditions.any.splice(i, 1);
                                    break;
                                }
                            }
                            view.save( function (err, newTrigger) {
                                if (err) {
                                    jsonString = messageFormatter.FormatMessage(err, "Delete Filter Any Failed", false, undefined);
                                } else {
                                    jsonString = messageFormatter.FormatMessage(undefined, "Delete Filter Any Successful", true, newTrigger);
                                }
                                res.end(jsonString);
                            });
                        }
                    }
                });
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Get User Failed", false, undefined);
                res.end(jsonString);
            }
        }
    });

}

function GetFiltersAny(req, res){
    logger.info("DVP-LiteTicket.GetFiltersAny Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;


    User.findOne({username: req.user.iss, company: company, tenant: tenant}, function (err, user) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
            res.end(jsonString);
        }
        else {
            if (user) {

                TicketView.findOne({company: company, tenant: tenant, _id: req.params.id, owner: user.id}, function (err, view) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Get Ticket Views Failed", false, undefined);
                        res.end(jsonString);
                    } else {
                        jsonString = messageFormatter.FormatMessage(err, "Get Ticket Views Success", true, view.conditions.any);
                        res.end(jsonString);
                    }
                });


            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Get User Failed", false, undefined);
                res.end(jsonString);
            }
        }
    });
}

function GetFiltersAll(req, res){

    logger.info("DVP-LiteTicket.GetFiltersAll Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;


    User.findOne({username: req.user.iss, company: company, tenant: tenant}, function (err, user) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
            res.end(jsonString);
        }
        else {
            if (user) {

                TicketView.findOne({company: company, tenant: tenant, _id: req.params.id, owner: user.id}, function (err, view) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Get Ticket Views Failed", false, undefined);
                        res.end(jsonString);
                    } else {
                        jsonString = messageFormatter.FormatMessage(err, "Get Ticket Views Success", true, view.conditions.all);
                        res.end(jsonString);
                    }
                });


            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Get User Failed", false, undefined);
                res.end(jsonString);
            }
        }
    });
}

function GetTicketsByView(req, res){

    logger.info("DVP-LiteTicket.GetTicketsByView Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;


    User.findOne({username: req.user.iss, company: company, tenant: tenant}, function (err, user) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
            res.end(jsonString);
        }
        else {
            if (user) {

                TicketView.findOne({company: company, tenant: tenant, _id: req.params.id}, function (err, view) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Get Ticket Views Failed", false, undefined);
                        res.end(jsonString);
                    } else {
                        if(view) {
                            var andQueryObject = {company: company, tenant: tenant};
                            if(view.conditions.all && Array.isArray(view.conditions.all) && view.conditions.all.length > 0){

                                view.conditions.all.forEach(function(item){
                                    //'is', 'less_than', 'greater_than','is_not','included','not_included', 'greater_than_or_equal','less_than_or_equal'

                                    ///////////////////////////////////fix system variables///////////////////////////////////////////

                                    if(item.value == '{me}'){

                                        item.value = user.id;

                                    }

                                    if(item.field == "created_at" || item.field == "updated_at:" || item.field == "due_at"){


                                        if(item.value == '{now}'){

                                            item.value = moment().toISOString();

                                        }else {

                                            try {

                                                item.value = moment(item.value);

                                            } catch (ex) {

                                                item.value = moment();
                                            }
                                        }

                                    }



                                    switch(item.operator){

                                        case 'is':
                                            if(item.value == '{unassigned}'){

                                                andQueryObject[item.field] =  {$exists: false};
                                            }else {
                                                andQueryObject[item.field] = item.value;
                                            }
                                            break;
                                        case 'less_than':
                                            //age: { $lt: 21 }
                                            andQueryObject[item.field] = {$lt: item.value};
                                            break;
                                        case 'greater_than':
                                            andQueryObject[item.field] = {$gt: item.value};
                                            break;
                                        case 'is_not':
                                            andQueryObject[item.field] = {$ne: item.value};
                                            break;
                                        case 'included':
                                            andQueryObject[item.field] = {$in: [item.value]};
                                            break;
                                        case 'not_included':
                                            andQueryObject[item.field] = {$nin: [item.value]};
                                            break;
                                        case 'greater_than_or_equal':
                                            andQueryObject[item.field] = {$gte: item.value};
                                            break;
                                        case 'less_than_or_equal':
                                            andQueryObject[item.field] = {$lte: item.value};
                                            break;
                                        default:

                                            break;
                                    }

                                })

                            }


                            var mainQuery = {$and:[andQueryObject]};


                            /*


                             Test.find({
                             $and: [
                             { $or: [{a: 1}, {b: 1}] },
                             { $or: [{c: 1}, {d: 1}] }
                             ]
                             }, function (err, results) {
                             ...
                             }
                             */

                            var orQuery = { $or: [] };

                            if(view.conditions.any && Array.isArray(view.conditions.any) && view.conditions.any.length > 0){
                                view.conditions.any.forEach(function(item){

                                    var tempQuery = {company: company, tenant: tenant};
                                    //'is', 'less_than', 'greater_than','is_not','included','not_included', 'greater_than_or_equal','less_than_or_equal'

                                    if(item.value == '{me}'){

                                        item.value = user.id;

                                    }

                                    if(item.field == "created_at" || item.field == "updated_at:" || item.field == "due_at"){


                                        if(item.value == '{now}'){

                                            item.value = moment().toISOString();

                                        }else {

                                            try {

                                                item.value = moment(item.value);

                                            } catch (ex) {

                                                item.value = moment();
                                            }
                                        }

                                    }




                                    switch(item.operator){

                                        case 'is':
                                            if(item.value == '{unassigned}'){

                                                tempQuery[item.field] =  {$exists: false};
                                            }else {
                                                tempQuery[item.field] = item.value;
                                            }

                                            break;
                                        case 'less_than':
                                            //age: { $lt: 21 }
                                            tempQuery[item.field] = {$lt: item.value};
                                            break;
                                        case 'greater_than':
                                            tempQuery[item.field] = {$gt: item.value};
                                            break;
                                        case 'is_not':
                                            tempQuery[item.field] = {$ne: item.value};
                                            break;
                                        case 'included':
                                            tempQuery[item.field] = {$in: [item.value]};
                                            break;
                                        case 'not_included':
                                            tempQuery[item.field] = {$nin: [item.value]};
                                            break;
                                        case 'greater_than_or_equal':
                                            tempQuery[item.field] = {$gte: item.value};
                                            break;
                                        case 'less_than_or_equal':
                                            tempQuery[item.field] = {$lte: item.value};
                                            break;
                                        default:

                                            break;
                                    }

                                    orQuery.$or.push(tempQuery);
                                })
                            }


                            mainQuery.$and.push(orQuery);

                            Ticket.find(mainQuery, function (err, tickets) {
                                if (err) {
                                    jsonString = messageFormatter.FormatMessage(err, "Get All Tickets Failed", false, undefined);
                                } else {

                                    if (tickets) {

                                        jsonString = messageFormatter.FormatMessage(undefined, "Get All Tickets Successful", true, tickets);
                                    } else {

                                        jsonString = messageFormatter.FormatMessage(undefined, "No Tickets Found", false, tickets);
                                    }
                                }
                                res.end(jsonString);
                            });

                        }else{

                            jsonString = messageFormatter.FormatMessage(undefined, "No Ticket View found ", false, undefined);
                            res.end(jsonString);
                        }
                    }
                });


            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Get User Failed", false, undefined);
                res.end(jsonString);
            }
        }
    });



}


module.exports.CreateTicketView = CreateTicketView;
module.exports.GetMyTicketViews = GetMyTicketViews;
module.exports.GetTicketView = GetTicketView;
module.exports.DeleteTicketView = DeleteTicketView;
module.exports.UpdateTicketView = UpdateTicketView;
module.exports.AddFilterAll = AddFilterAll;
module.exports.AddFilterAny = AddFilterAny;
module.exports.RemoveFilterAll = RemoveFilterAll;
module.exports.RemoveFilterAny = RemoveFilterAny;
module.exports.GetFiltersAny = GetFiltersAny;
module.exports.GetFiltersAll = GetFiltersAll;
module.exports.GetTicketsByView = GetTicketsByView;