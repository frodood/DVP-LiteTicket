var mongoose = require('mongoose');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var Ticket = require('dvp-mongomodels/model/Ticket').Ticket;
var TicketEvent = require('dvp-mongomodels/model/Ticket').TicketEvent;
var User = require('dvp-mongomodels/model/User');
var UserGroup = require('dvp-mongomodels/model/UserGroup');
var Attachment = require('dvp-mongomodels/model/Attachment').Attachment;
var Tag = require('dvp-mongomodels/model/Tag').Tag;
var TimeEntry = require('dvp-mongomodels/model/TimeEntry').TimeEntry;
var Comment = require('dvp-mongomodels/model/TimeEntry').Comment;
var TicketStatics = require('dvp-mongomodels/model/TicketMetrix').TicketStatics;
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');


var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

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
                    related_tickets: req.body.related_tickets,
                    merged_tickets: req.body.merged_tickets,
                    engagement_session: req.body.engagement_session,
                    channel: req.body.channel,
                    tags: req.body.tags,
                    custom_fields: req.body.custom_fields,
                    comments: req.body.comments,
                    SLAViolated: false
                });
                ticket.save(function (err, client) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Ticket create failed", false, undefined);
                    }
                    else {
                        jsonString = messageFormatter.FormatMessage(undefined, "Ticket saved successfully", true, client._doc);
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

module.exports.UpdateTicket = function (req, res) {

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
                    else {
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

module.exports.GetAllTicketsBy = function (req, res) {
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    var searchBy = req.params.searchBy;
    var searchValue = req.params.searchValue;
    if (searchBy == "assignee") {
        Ticket.find({company: company, tenant: tenant, assignee: searchValue}, function (err, tickets) {
            if (err) {

                jsonString = messageFormatter.FormatMessage(err, "Get Ticket With assignee Failed", false, undefined);

            } else {

                if (tickets) {

                    jsonString = messageFormatter.FormatMessage(undefined, "Get Ticket With assignee Successful", true, tickets);

                } else {

                    jsonString = messageFormatter.FormatMessage(undefined, "No Ticket Found", false, undefined);

                }
            }
            res.end(jsonString);
        });
    }
    else if (searchBy == "submitter") {
        Ticket.find({company: company, tenant: tenant, submitter: searchValue}, function (err, tickets) {
            if (err) {

                jsonString = messageFormatter.FormatMessage(err, "Get Ticket With submitter Failed", false, undefined);

            } else {

                if (tickets) {

                    jsonString = messageFormatter.FormatMessage(undefined, "Get Ticket With submitter Successful", true, tickets);

                } else {

                    jsonString = messageFormatter.FormatMessage(undefined, "No Ticket Found", false, undefined);

                }
            }
            res.end(jsonString);
        });
    }
    else if (searchBy == "assignee_group") {
        Ticket.find({company: company, tenant: tenant, assignee_group: searchValue}, function (err, tickets) {
            if (err) {

                jsonString = messageFormatter.FormatMessage(err, "Get Ticket With assignee_group Failed", false, undefined);

            } else {

                if (tickets) {

                    jsonString = messageFormatter.FormatMessage(undefined, "Get Ticket With assignee_group Successful", true, tickets);

                } else {

                    jsonString = messageFormatter.FormatMessage(undefined, "No Ticket Found", false, undefined);

                }
            }
            res.end(jsonString);
        });
    }
    else {
        jsonString = messageFormatter.FormatMessage(new Error("Invalid Search Category."), "Invalid Search Category.", false, undefined);
        res.end(jsonString);
    }

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
                        res.end(jsonString);
                    }
                    else {
                        Ticket.findOneAndUpdate({company: company, tenant: tenant, id:ObjectId(req.params.id)},
                            {$addToSet: {sub_tickets: obj._doc._id}}
                            , function (err, rOrg) {
                                if (err) {
                                    jsonString = messageFormatter.FormatMessage(err, "Fail To Map With Parent.", false, undefined);
                                } else {
                                    jsonString = messageFormatter.FormatMessage(undefined, "Sub-Ticket Saved Successfully", true, obj._doc);
                                }
                                res.end(jsonString);
                            });
                    }

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

module.exports.GetTicket = function (req, res) {
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
                jsonString = messageFormatter.FormatMessage(undefined, "Find Ticket", true, ticket);
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Fail To Find Ticket", false, undefined);
            }
        }
    })
};

module.exports.DeActivateTicket = function (req, res) {
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
                    else {
                        jsonString = messageFormatter.FormatMessage(undefined, "Ticket DeActivated", true, rUser);
                    }
                    res.end(jsonString);
                });
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Fail To DeActivate Ticket", false, undefined);
            }
        }
        res.end(jsonString);
    });
};

module.exports.GetTicketsByTimeRange = function (req, res) {
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    Ticket.find({
        company: company,
        tenant: tenant,
        "created_at": {"$gte": req.params.fromDate, "$lt": req.params.toDate}
    }, function (err, tickets) {
        //db.posts.find( //query today up to tonight  {"created_on": {"$gte": new Date(2012, 7, 14), "$lt": new Date(2012, 7, 15)}})
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get Tickets By TimeRange Failed", false, undefined);

        } else {

            if (tickets) {

                jsonString = messageFormatter.FormatMessage(undefined, "Get Tickets By TimeRange Successful", true, tickets);

            } else {

                jsonString = messageFormatter.FormatMessage(undefined, "No Tickets Found", false, tickets);

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

module.exports.GetAllMyTicketsWithStatus = function (req, res) {

    logger.debug("DVP-LiteTicket.GetAllMyTicketsWithStatus Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    Ticket.find({company: company, tenant: tenant, status: req.params.status}, function (err, tickets) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Fail to Find Tickets", false, undefined);
            res.end(jsonString);
        }
        else {
            if (tickets) {
                jsonString = messageFormatter.FormatMessage(undefined, "Find Tickets", true, tickets);
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Fail To Find Ticket", false, undefined);
            }
        }
    })

};


module.exports.MergeTicket = MergeTicket;
module.exports.GetMergeTickets = GetMergeTicket;
module.exports.GetSubTickets = GetSubTickets;
module.exports.AttachSubTicket = AttachSubTicket;
module.exports.DeAttachSubTicket = DeAttachSubTicket;
module.exports.GetAttachTickets = GetAttachTickets;


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



