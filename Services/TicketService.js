var mongoose = require('mongoose');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var Ticket = require('../model/Ticket').Ticket;
var TicketEvent = require('../model/Ticket').TicketEvent;
var User = require('../model/User');
var UserGroup = require('../model/UserGroup');
var Attachment = require('../model/Attachment').Attachment;
var Tag = require('../model/Tag').Tag;
var TimeEntry = require('../model/TimeEntry').TimeEntry;
var Comment = require('../model/TimeEntry').Comment;
var TicketStatics = require('../model/TicketMetrix').TicketStatics;
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');


module.exports.CreateTicket = function (req, res) {

    logger.debug("DVP-LiteTicket.CreateTicket Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    User.findOne({username: req.user.iss, company: company, tenant: tenant}, function (err, user) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
            res.end(jsonString);

        } else {

            if (user) {

                var ticket = Ticket({
                    created_at: Date.now(),
                    updated_at: Date.now(),
                    due_at: Date,
                    active: true,
                    type: req.body.type,
                    subject: req.body.subject,
                    reference: req.body.reference,
                    description: req.body.description,
                    priority: req.body.priority,
                    status: "new",
                    requester: req.body.requesterId,
                    submitter: user.id,
                    company: company,
                    tenant: tenant,
                    attachments: req.body.attachments,
                    sub_tickets: req.body.sub_tickets,
                    related_tickets: req.body.related_tickets,
                    merged_tickets: req.body.merged_tickets,
                    engagement_session: req.body.engagement_session,
                    channel: req.body.channel,
                    tags: req.body.tags,
                    custom_fields: req.body.custom_fields,
                    comments: req.body.comments,
                    SLAViolated: false
                });

                jsonString = messageFormatter.FormatMessage(undefined, "Ticket saved successfully", true, ticket);
                ticket.save(function (err, client) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Ticket create failed", false, undefined);
                    }
                    res.end(jsonString);
                });
            } else {

                jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
                res.end(jsonString);
            }
        }
    });
};

module.exports.UpdateTicket = function(req, res) {

    logger.debug("DVP-LiteTicket.UpdateTicket Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    Ticket.findOne({company: company, tenant: tenant, id: req.params.id}, function (err, ticket) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Fail Find Ticket", false, undefined);
            res.end(jsonString);
        }
        else {
            if (ticket) {
                ticket.updated_at = Date.now();
                ticket.subject = req.body.subject;
                ticket.reference = req.body.reference;
                ticket.description = req.body.description;
                ticket.priority = req.body.priority;
                ticket.type = req.body.type;
                ticket.attachments = req.body.attachments;
                ticket.sub_tickets = req.body.sub_tickets;
                ticket.related_tickets = req.body.related_tickets;
                ticket.merged_tickets = req.body.merged_tickets;
                ticket.engagement_session = req.body.engagement_session;
                ticket.channel = req.body.channel;
                ticket.tags = req.body.tags;
                ticket.custom_fields = req.body.custom_fields;
                ticket.comments = req.body.comments;

                Ticket.findOneAndUpdate({
                    id: req.params.id,
                    company: company,
                    tenant: tenant
                }, ticket, function (err, rUser) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Fail Update Ticket", false, undefined);
                    }
                    else{
                        jsonString = messageFormatter.FormatMessage(undefined, "Ticket Update Successfully", true, rUser);
                    }
                    res.end(jsonString);
                });
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Fail Find Ticket", false, undefined);
            }
        }
        res.end(jsonString);
    });
};

module.exports.GetAllTickets = function (req, res) {


    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    Ticket.find({company: company, tenant: tenant}, function (err, tickets) {
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

};

module.exports.GetAllTicketsWithStatus = function (req, res) {
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    Ticket.find({company: company, tenant: tenant, status: req.params.status}, function (err, tickets) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get AllTickets With Status Failed", false, undefined);

        } else {

            if (tickets) {

                jsonString = messageFormatter.FormatMessage(undefined, "Get AllTickets With Status Successful", true, tickets);

            } else {

                jsonString = messageFormatter.FormatMessage(undefined, "No Ticket Found", false, undefined);

            }
        }
        res.end(jsonString);
    });
};

function GetAllTicketsWithMatrix(req, res) {
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    TicketStatics.aggregate([
        {$match: {company: company, tenant: tenant}},
        {
            $lookup: {
                from: "Ticket",
                localField: "ticket",
                foreignField: "id",
                as: "TicketMatrix"
            }
        }
    ], function (err, TicketMatrix) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get AllTickets With Status Failed", false, undefined);

        } else {

            if (tickets) {

                jsonString = messageFormatter.FormatMessage(undefined, "Get AllTickets With Status Successful", true, tickets);

            } else {

                jsonString = messageFormatter.FormatMessage(undefined, "No Ticket Found", false, undefined);

            }
        }
        res.end(jsonString);
    })

};

module.exports.CreateSubTicket = function (req, res) {

    logger.debug("DVP-LiteTicket.CreateSubTicket Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    User.findOne({username: req.user.iss, company: company, tenant: tenant}, function (err, user) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
            res.end(jsonString);

        } else {

            if (user) {

                var ticket = Ticket({
                    created_at: Date.now(),
                    updated_at: Date.now(),
                    due_at: Date,
                    active: true,
                    type: req.body.type,
                    subject: req.body.subject,
                    reference: req.body.reference,
                    description: req.body.description,
                    priority: req.body.priority,
                    status: "new",
                    requester: req.body.requesterId,
                    submitter: user.id,
                    company: company,
                    tenant: tenant,
                    attachments: req.body.attachments,
                    sub_tickets: req.body.sub_tickets,
                    related_tickets: req.body.related_tickets,
                    merged_tickets: req.body.merged_tickets,
                    engagement_session: req.body.engagement_session,
                    channel: req.body.channel,
                    tags: req.body.tags,
                    custom_fields: req.body.custom_fields,
                    comments: req.body.comments,
                    SLAViolated: false
                });
                ticket.save(function (err, obj) {
                    jsonString = messageFormatter.FormatMessage(new Error("Invalid Parent ID."), "Sub-Ticket Saved Successfully.Without Mapping To Parent.", false, ticket);
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Ticket create failed", false, undefined);
                    }
                    else {
                        Ticket.findOneAndUpdate({company: company, tenant: tenant, id: req.params.id}, {
                            $push: {
                                sub_tickets: {
                                    $each: [obj.insertedId]
                                }
                            }
                        }, function (err, rOrg) {
                            if (err) {
                                jsonString = messageFormatter.FormatMessage(err, "Fail To Map With Parent.", false, undefined);
                            } else {
                                jsonString = messageFormatter.FormatMessage(undefined, "Sub-Ticket Saved Successfully", true, ticket);
                            }
                            res.end(jsonString);
                        });
                    }
                    res.end(jsonString);
                });
            } else {

                jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
                res.end(jsonString);
            }
        }
    });

};


function GetSubTickets(req, res) {
};
function AttachSubTicket(req, res) {
};
function GetAttachTickets(req, res) {
};
function DeAttachSubTicket(req, res) {
};

function MergeTicket(req, res) {
};
function GetMergeTicket(req, res) {
};
function GetTicket(req, res) {
};
function DeActivateTicket(req, res) {
    logger.debug("DVP-LiteTicket.DeActivateTicket Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    Ticket.findOne({company: company, tenant: tenant, id: req.params.id}, function (err, ticket) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Fail to Find Ticket", false, undefined);
            res.end(jsonString);
        }
        else {
            if (ticket) {
                ticket.active = false;
                Ticket.findOneAndUpdate({
                    id: req.params.id,
                    company: company,
                    tenant: tenant
                }, ticket, function (err, rUser) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Fail To DeActivate Ticket", false, undefined);
                    }
                    else{
                        jsonString = messageFormatter.FormatMessage(undefined, "Ticket DeActivated", true, rUser);
                    }
                    res.end(jsonString);
                });
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Fail Find Ticket", false, undefined);
            }
        }
        res.end(jsonString);
    });
};
function PickTicket(req, res) {
};
function GetTicketAudit(req, res) {
};

function AddComment(req, res) {
};
function AddAttachment(req, res) {
};
function AddCommentToComment(req, res) {
};
function ChangeStatus(req, res) {
};
function AssignToUser(req, res) {
};
function AssignToGroup(req, res) {
};

function GetAllTicketsInStatusWithMatrix(req, res) {
};
function GetAllMyTickets(req, res) {
};
function GetAllMyTicketsWithStatus(req, res) {
};


module.exports.MergeTicket = MergeTicket;
module.exports.GetMergeTickets = GetMergeTicket;
module.exports.GetSubTickets = GetSubTickets;
module.exports.AttachSubTicket = AttachSubTicket;
module.exports.DeAttachSubTicket = DeAttachSubTicket;
module.exports.GetAttachTickets = GetAttachTickets;

module.exports.GetTicket = GetTicket;
module.exports.DeActivateTicket = DeActivateTicket;
module.exports.PickTicket = PickTicket;
module.exports.GetTicketAudit = GetTicketAudit;

module.exports.AddComment = AddComment;
module.exports.AddAttachment = AddAttachment;
module.exports.AddCommentToComment = AddCommentToComment;
module.exports.ChangeStatus = ChangeStatus;
module.exports.AssignToUser = AssignToUser;
module.exports.AssignToGroup = AssignToGroup;
module.exports.GetAllTicketsWithMatrix = GetAllTicketsWithMatrix;
module.exports.GetAllTicketsInStatusWithMatrix = GetAllTicketsInStatusWithMatrix;
module.exports.GetAllMyTickets = GetAllMyTickets;
module.exports.GetAllMyTicketsWithStatus = GetAllMyTicketsWithStatus;

