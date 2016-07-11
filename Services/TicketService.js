var mongoose = require('mongoose');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var Ticket = require('dvp-mongomodels/model/Ticket').Ticket;
var TicketEvent = require('dvp-mongomodels/model/Ticket').TicketEvent;
var User = require('dvp-mongomodels/model/User');
var UserGroup = require('dvp-mongomodels/model/UserGroup').UserGroup;
var Attachment = require('dvp-mongomodels/model/Attachment').Attachment;
var Tag = require('dvp-mongomodels/model/Tag').Tag;
var TimeEntry = require('dvp-mongomodels/model/TimeEntry').TimeEntry;
var Comment = require('dvp-mongomodels/model/Comment').Comment;
var TicketStatics = require('dvp-mongomodels/model/TicketMetrix').TicketStatics;
var EngagementSession = require('dvp-mongomodels/model/Engagement').EngagementSession;
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');


var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

module.exports.CreateTicket = function (req, res) {

    logger.info("DVP-LiteTicket.CreateTicket Internal method ");

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
                    is_sub_ticket: false,
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

module.exports.GetAllTickets = function (req, res) {

    logger.info("DVP-LiteTicket.GetAllTickets Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);

    var page = parseInt(req.params.Page),
        size = parseInt(req.params.Size),
        skip = page > 0 ? ((page - 1) * size) : 0;

    var jsonString;
    Ticket.find({company: company, tenant: tenant, active: true}).skip(skip)
        .limit(size).sort({created_at: -1}).exec(function (err, tickets) {
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

module.exports.GetTicketsByTimeRange = function (req, res) {
    logger.info("DVP-LiteTicket.GetTicketsByTimeRange Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    Ticket.find({
        company: company,
        tenant: tenant, active: true,
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

module.exports.GetAllTicketsWithStatus = function (req, res) {
    logger.info("DVP-LiteTicket.GetAllTicketsWithStatus Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var page = parseInt(req.params.Page),
        size = parseInt(req.params.Size),
        skip = page > 0 ? ((page - 1) * size) : 0;

    var jsonString;
    Ticket.find({company: company, tenant: tenant, active: true, status: req.params.status}).skip(skip)
        .limit(size).sort({created_at: -1}).exec(function (err, tickets) {
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


module.exports.GetAllTicketsWithMatrix = function (req, res) {
    logger.info("DVP-LiteTicket.GetAllTickets Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);

    var page = parseInt(req.params.Page),
        size = parseInt(req.params.Size),
        skip = page > 0 ? ((page - 1) * size) : 0;

    var jsonString;
    TicketStatics.find().populate({
        path: 'ticket',
        match: {company: company, tenant: tenant, active: true}
    }).skip(skip)
        .limit(size).sort({created_at: -1}).exec(function (err, tickets) {
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

module.exports.GetAllTicketsInStatusWithMatrix = function (req, res) {
    logger.info("DVP-LiteTicket.GetAllTickets Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);

    var page = parseInt(req.params.Page),
        size = parseInt(req.params.Size),
        skip = page > 0 ? ((page - 1) * size) : 0;

    var status = req.params.status;
    var jsonString;
    TicketStatics.find().populate({
        path: 'ticket',
        match: {company: company, tenant: tenant, active: true, status: status}
    }).skip(skip)
        .limit(size).sort({created_at: -1}).exec(function (err, tickets) {
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

module.exports.GetAllTicketsByChannel = function (req, res) {
    logger.info("DVP-LiteTicket.GetAllTicketsByChannel Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);

    var page = parseInt(req.params.Page),
        size = parseInt(req.params.Size),
        skip = page > 0 ? ((page - 1) * size) : 0;

    var jsonString;
    Ticket.find({company: company, tenant: tenant,channel:req.params.Channel, active: true}).skip(skip)
        .limit(size).sort({created_at: -1}).exec(function (err, tickets) {
            if (err) {

                jsonString = messageFormatter.FormatMessage(err, "Get All Tickets Failed", false, undefined);

            } else {

                if (tickets) {

                    jsonString = messageFormatter.FormatMessage(undefined, "Get All Tickets By Channel Successful", true, tickets);

                } else {

                    jsonString = messageFormatter.FormatMessage(undefined, "No Tickets Found", false, tickets);

                }
            }

            res.end(jsonString);
        });
};

module.exports.GetAllTicketsByRequester = function (req, res) {
    logger.info("DVP-LiteTicket.GetAllTicketsByRequester Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);

    var page = parseInt(req.params.Page),
        size = parseInt(req.params.Size),
        skip = page > 0 ? ((page - 1) * size) : 0;

    var jsonString;
    Ticket.find({company: company, tenant: tenant,requester:req.params.Requester, active: true}).skip(skip)
        .limit(size).sort({created_at: -1}).exec(function (err, tickets) {
            if (err) {

                jsonString = messageFormatter.FormatMessage(err, "Get All Tickets Failed", false, undefined);

            } else {

                if (tickets) {

                    jsonString = messageFormatter.FormatMessage(undefined, "Get All Tickets By Requester Successful", true, tickets);

                } else {

                    jsonString = messageFormatter.FormatMessage(undefined, "No Tickets Found", false, tickets);

                }
            }

            res.end(jsonString);
        });
};

module.exports.GetAllTicketsByPriority = function (req, res) {
    logger.info("DVP-LiteTicket.GetAllTicketsByPriority Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);

    var page = parseInt(req.params.Page),
        size = parseInt(req.params.Size),
        skip = page > 0 ? ((page - 1) * size) : 0;

    var jsonString;
    Ticket.find({company: company, tenant: tenant,priority:req.params.Priority, active: true}).skip(skip)
        .limit(size).sort({created_at: -1}).exec(function (err, tickets) {
            if (err) {

                jsonString = messageFormatter.FormatMessage(err, "Get All Tickets Failed", false, undefined);

            } else {

                if (tickets) {

                    jsonString = messageFormatter.FormatMessage(undefined, "Get All Tickets By Priority Successful", true, tickets);

                } else {

                    jsonString = messageFormatter.FormatMessage(undefined, "No Tickets Found", false, tickets);

                }
            }

            res.end(jsonString);
        });
};

module.exports.GetAllGroupTickets = function (req, res) {
    logger.info("DVP-LiteTicket.GetAllGroupTickets Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);

    var page = parseInt(req.params.Page),
        size = parseInt(req.params.Size),
        skip = page > 0 ? ((page - 1) * size) : 0;

    var jsonString;
    Ticket.find({company: company, tenant: tenant,assignee_group:req.params.GroupId, active: true}).skip(skip)
        .limit(size).sort({created_at: -1}).exec(function (err, tickets) {
            if (err) {

                jsonString = messageFormatter.FormatMessage(err, "Get All Tickets Failed", false, undefined);

            } else {

                if (tickets) {

                    jsonString = messageFormatter.FormatMessage(undefined, "Get All Tickets By Group ID Successful", true, tickets);

                } else {

                    jsonString = messageFormatter.FormatMessage(undefined, "No Tickets Found", false, tickets);

                }
            }

            res.end(jsonString);
        });
};

module.exports.GetAllMyTickets = function (req, res) {
    logger.debug("DVP-LiteTicket.GetAllMyTickets Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var page = parseInt(req.params.Page),
        size = parseInt(req.params.Size),
        skip = page > 0 ? ((page - 1) * size) : 0;

    var jsonString;
    User.findOne({username: req.user.iss, company: company, tenant: tenant}, function (err, user) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
            res.end(jsonString);

        } else {

            if (user) {
                Ticket.find({
                    company: company,
                    tenant: tenant, active: true,
                    submitter: user.id
                }).skip(skip)
                    .limit(size).sort({created_at: -1}).exec(function (err, tickets) {
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
                            res.end(jsonString);
                        }
                    })
            } else {
                jsonString = messageFormatter.FormatMessage(undefined, "Get User Failed", false, undefined);
                res.end(jsonString);
            }
        }
    });
};

module.exports.GetAllMyTicketsWithStatus = function (req, res) {

    logger.debug("DVP-LiteTicket.GetAllMyTicketsWithStatus Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var page = parseInt(req.params.Page),
        size = parseInt(req.params.Size),
        skip = page > 0 ? ((page - 1) * size) : 0;

    var jsonString;
    User.findOne({username: req.user.iss, company: company, tenant: tenant}, function (err, user) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
            res.end(jsonString);

        } else {

            if (user) {
                Ticket.find({
                    company: company,
                    tenant: tenant, active: true,
                    submitter: user.id,
                    status: req.params.status
                }).skip(skip)
                    .limit(size).sort({created_at: -1}).exec(function (err, tickets) {
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
                            res.end(jsonString);
                        }
                    })
            } else {
                jsonString = messageFormatter.FormatMessage(undefined, "Get User Failed", false, undefined);
                res.end(jsonString);
            }
        }
    });
};

module.exports.GetTicket = function (req, res) {
    logger.info("DVP-LiteTicket.GetTicket Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    Ticket.findOne({
        company: company,
        tenant: tenant,
        active: true,
        _id: req.params.id
    }, function (err, ticket) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Fail to Find Ticket", false, undefined);
        }
        else {
            if (ticket) {
                jsonString = messageFormatter.FormatMessage(undefined, "Find Ticket", true, ticket);
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Fail To Find Ticket", false, undefined);
            }
        }
        res.end(jsonString);
    })
};

module.exports.GetTicketWithDetails = function (req, res) {
    logger.info("DVP-LiteTicket.GetTicketWithDetails Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    Ticket.findOne({
        company: company,
        tenant: tenant,
        active: true,
        _id: req.params.id
    }).populate('attachments')
        .populate('sub_tickets')
        .populate('related_tickets')
        .populate('merged_tickets')
        .populate('engagement_session')
        .populate('comments').exec(function (err, ticket) {
            if (err) {

                jsonString = messageFormatter.FormatMessage(err, "Fail to Find Ticket", false, undefined);
            }
            else {
                if (ticket) {
                    jsonString = messageFormatter.FormatMessage(undefined, "Find Ticket", true, ticket);
                }
                else {
                    jsonString = messageFormatter.FormatMessage(undefined, "Fail To Find Ticket", false, undefined);
                }
            }
            res.end(jsonString);
        })
};

module.exports.DeActivateTicket = function (req, res) {
    logger.debug("DVP-LiteTicket.DeActivateTicket Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    Ticket.findById(req.params.id, function (err, ticket) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Fail to Find Ticket", false, undefined);
            res.end(jsonString);
        }
        else {
            if (ticket) {
                Ticket.findOneAndUpdate({
                    _id: req.params.id,
                    company: company,
                    tenant: tenant
                }, {active: false}, function (err, rUser) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Fail To DeActivate Ticket", false, undefined);
                    }
                    else {
                        if (rUser) {
                            jsonString = messageFormatter.FormatMessage(undefined, "Ticket DeActivated", true, undefined);
                        }
                        else {
                            jsonString = messageFormatter.FormatMessage(undefined, "Invalid Ticket ID.", true, undefined);
                        }
                    }
                    res.end(jsonString);
                });
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Invalid Ticket ID", false, undefined);
                res.end(jsonString);
            }
        }

    });
};

module.exports.PickTicket = function (req, res) {
    logger.debug("DVP-LiteTicket.PickTicket Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);

    var jsonString;
    Ticket.findOne({company: company, tenant: tenant, _id: req.params.id}, function (err, ticket) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Fail Find Ticket", false, undefined);
            res.end(jsonString);
        }
        else {
            if (ticket) {
                if (ticket.assignee) {
                    jsonString = messageFormatter.FormatMessage(undefined, "Already Assign To User.", false, undefined);
                    res.end(jsonString);
                }
                else {
                    User.findOne({username: req.user.iss, company: company, tenant: tenant}, function (err, user) {
                        if (err) {
                            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
                            res.end(jsonString);

                        } else {
                            if (user) {
                                ticket.assignee_group = [];
                                ticket.assignee = user.id;
                                ticket.updated_at = Date.now();

                                Ticket.findOneAndUpdate({
                                    _id: req.params.id,
                                    company: company,
                                    tenant: tenant
                                }, ticket, function (err, rUser) {
                                    if (err) {
                                        jsonString = messageFormatter.FormatMessage(err, "Fail Pick Ticket", false, undefined);
                                    }
                                    else {
                                        if (rUser) {
                                            jsonString = messageFormatter.FormatMessage(undefined, "Ticket Pick Successfully", true, ticket);
                                        }
                                        else {
                                            jsonString = messageFormatter.FormatMessage(undefined, "Invalid Ticket ID.", true, ticket);
                                        }
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
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Fail Find Ticket", false, undefined);
                res.end(jsonString);
            }
        }

    });
};


function GetTicketAudit(req, res) {
};

module.exports.UpdateTicket = function (req, res) {

    logger.debug("DVP-LiteTicket.UpdateTicket Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);

    var jsonString;
    Ticket.findOne({company: company, tenant: tenant, _id: req.params.id}, function (err, ticket) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Fail Find Ticket", false, undefined);
            res.end(jsonString);
        }
        else {
            if (ticket) {
                ticket.updated_at = Date.now();
                ticket.subject = req.body.subject;
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
                    _id: req.params.id,
                    company: company,
                    tenant: tenant
                }, ticket, function (err, rUser) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Fail Update Ticket", false, undefined);
                    }
                    else {
                        if (rUser) {
                            jsonString = messageFormatter.FormatMessage(undefined, "Ticket Update Successfully", true, rUser);
                        }
                        else {
                            jsonString = messageFormatter.FormatMessage(undefined, "Invalid Ticket ID.", true, rUser);
                        }
                    }
                    res.end(jsonString);
                });
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Fail Find Ticket", false, undefined);
                res.end(jsonString);
            }
        }

    });
};

module.exports.AddComment = function (req, res) {
    logger.info("DVP-LiteTicket.AddComment Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    Ticket.findById(req.params.id, function (err, ticket) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Fail To Find Ticket", false, undefined);
            res.end(jsonString);
        }
        else {
            if (ticket) {
                User.findOne({username: req.user.iss, company: company, tenant: tenant}, function (err, user) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
                        res.end(jsonString);
                    }
                    else {
                        if (user) {
                            var comment = Comment({
                                body: req.body.body,
                                body_type: req.body.body_type,
                                type: req.body.type,
                                public: req.body.public,
                                author: user.id,
                                author_external: req.body.author_external,
                                attachments: req.body.attachments,
                                channel: req.body.channel,
                                channel_from: req.body.channel_from,
                                engagement_session: ObjectId(req.body.engagement_session),
                                created_at: Date.now(),
                                meta_data: req.body.meta_data
                            });

                            comment.save(function (err, obj) {
                                if (err) {
                                    jsonString = messageFormatter.FormatMessage(err, "Fail To Save Comment", false, undefined);
                                    res.end(jsonString);
                                }
                                else {
                                    if (obj.id) {
                                        Ticket.findOneAndUpdate({
                                                company: company,
                                                tenant: tenant,
                                                _id: req.params.id
                                            },
                                            {$addToSet: {comments: obj.id}}
                                            , function (err, rOrg) {
                                                if (err) {
                                                    jsonString = messageFormatter.FormatMessage(err, "Fail To Map With Ticket.", false, undefined);
                                                } else {
                                                    if (rOrg) {
                                                        jsonString = messageFormatter.FormatMessage(undefined, "Comment Successfully Attach To Ticket", true, obj);
                                                    }
                                                    else {
                                                        jsonString = messageFormatter.FormatMessage(undefined, "Invalid Ticket ID.", true, obj);
                                                    }
                                                }
                                                res.end(jsonString);
                                            });
                                    }
                                    else {
                                        jsonString = messageFormatter.FormatMessage(undefined, "Fail To Save Comment", false, undefined);
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
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Invalid Ticket ID.", false, undefined);
                res.end(jsonString);
            }
        }
    });


};

module.exports.AddAttachment = function (req, res) {
    logger.info("DVP-LiteTicket.AddAttachment Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    Ticket.findById(req.params.id, function (err, ticket) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Fail To Find Ticket", false, undefined);
            res.end(jsonString);
        }
        else {
            if (ticket) {
                User.findOne({username: req.user.iss, company: company, tenant: tenant}, function (err, user) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
                        res.end(jsonString);
                    } else {

                        if (user) {

                            var attachment = Attachment({
                                file: req.body.file,
                                url: req.body.url,
                                type: req.body.type,
                                size: req.body.size
                            });

                            attachment.save(function (err, obj) {
                                if (err) {
                                    jsonString = messageFormatter.FormatMessage(err, "Fail To Save Attachment.", false, undefined);
                                    res.end(jsonString);
                                }
                                else {
                                    if (obj.id) {
                                        Ticket.findOneAndUpdate({
                                                company: company,
                                                tenant: tenant,
                                                _id: req.params.id
                                            },
                                            {$addToSet: {attachments: obj.id}}
                                            , function (err, rOrg) {
                                                if (err) {
                                                    jsonString = messageFormatter.FormatMessage(err, "Fail To Map With Ticket.", false, undefined);
                                                } else {
                                                    if (rOrg) {
                                                        jsonString = messageFormatter.FormatMessage(undefined, "Attachment Successfully Map To Ticket", true, obj);
                                                    }
                                                    else {
                                                        jsonString = messageFormatter.FormatMessage(undefined, "Invalid Ticket ID.", true, obj);
                                                    }
                                                }
                                                res.end(jsonString);
                                            });
                                    }
                                    else {
                                        jsonString = messageFormatter.FormatMessage(undefined, "Fail To Save Attachment.", false, undefined);
                                        res.end(jsonString);
                                    }
                                }

                            });
                        } else {

                            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
                            res.end(jsonString);
                        }
                    }
                });
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Invalid Ticket ID.", false, undefined);
                res.end(jsonString);
            }
        }
    });


};

module.exports.AddCommentToComment = function (req, res) {
    logger.info("DVP-LiteTicket.AddCommentToComment Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    Comment.findById(req.params.commentid, function (err, comment) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Fail To Find Comment", false, undefined);
            res.end(jsonString);
        }
        else {
            if (comment) {
                Ticket.findById(req.params.id, function (err, ticket) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Fail To Find Ticket", false, undefined);
                        res.end(jsonString);
                    }
                    else {
                        if (ticket) {
                            User.findOne({
                                username: req.user.iss,
                                company: company,
                                tenant: tenant
                            }, function (err, user) {
                                if (err) {
                                    jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
                                    res.end(jsonString);
                                }
                                else {
                                    if (user) {
                                        var comment = Comment({
                                            body: req.body.body,
                                            body_type: req.body.body_type,
                                            type: req.body.type,
                                            public: req.body.public,
                                            author: user.id,
                                            author_external: req.body.author_external,
                                            attachments: req.body.attachments,
                                            channel: req.body.channel,
                                            channel_from: req.body.channel_from,
                                            engagement_session: ObjectId(req.body.engagement_session),
                                            created_at: Date.now(),
                                            meta_data: req.body.meta_data
                                        });

                                        comment.save(function (err, obj) {
                                            if (err) {
                                                jsonString = messageFormatter.FormatMessage(err, "Fail To Save Comment", false, undefined);
                                                res.end(jsonString);
                                            }
                                            else {
                                                if (obj.id) {
                                                    Comment.findOneAndUpdate({_id: req.params.id},
                                                        {$addToSet: {sub_comment: obj.id}}
                                                        , function (err, rOrg) {
                                                            if (err) {
                                                                jsonString = messageFormatter.FormatMessage(err, "Fail To Map Sub-Comment With Comment.", false, undefined);
                                                            } else {
                                                                if (rOrg) {
                                                                    jsonString = messageFormatter.FormatMessage(undefined, "Sub-Comment Successfully Save", true, obj);
                                                                }
                                                                else {
                                                                    jsonString = messageFormatter.FormatMessage(undefined, "Invalid Comment ID.", true, obj);
                                                                }
                                                            }
                                                            res.end(jsonString);
                                                        });
                                                }
                                                else {
                                                    jsonString = messageFormatter.FormatMessage(undefined, "Fail To Save Comment", false, undefined);
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
                        else {
                            jsonString = messageFormatter.FormatMessage(undefined, "Invalid Ticket ID.", false, undefined);
                            res.end(jsonString);
                        }
                    }
                });
            }
            else {
                jsonString = messageFormatter.FormatMessage(err, "Fail To Find Comment", false, undefined);
                res.end(jsonString);
            }
        }

    });
};

module.exports.ChangeStatus = function (req, res) {
    logger.debug("DVP-LiteTicket.ChangeStatus Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);

    var jsonString;
    if (req.body.status) {
        Ticket.findOne({company: company, tenant: tenant, _id: req.params.id}, function (err, ticket) {
            if (err) {

                jsonString = messageFormatter.FormatMessage(err, "Fail Find Ticket", false, undefined);
                res.end(jsonString);
            }
            else {
                if (ticket) {
                    ticket.updated_at = Date.now();
                    ticket.status = req.body.status;


                    /* A.find(
                     {id : { $in: ticket.sub_tickets.map(function(o){ return ObjectId(o); })}}
                     , callback);
                     */

                    if (ticket.sub_tickets.length > 0 && req.body.status == "closed") {
                        Ticket.find({
                            id: {
                                $in: ticket.sub_tickets.map(function (o) {
                                    return ObjectId(o);
                                })
                            }, status: "closed"
                        }, function (err, docs) {
                            if (err) {
                                jsonString = messageFormatter.FormatMessage(err, "Fail To Check Sub Ticket Status.", false, undefined);
                                res.end(jsonString);
                            }
                            else {
                                if (docs && (ticket.sub_tickets.length == docs.length)) {
                                    Ticket.findOneAndUpdate({
                                        _id: req.params.id,
                                        company: company,
                                        tenant: tenant
                                    }, ticket, function (err, rUser) {
                                        if (err) {
                                            jsonString = messageFormatter.FormatMessage(err, "Fail Update Status.", false, undefined);
                                        }
                                        else {
                                            if (rUser) {
                                                jsonString = messageFormatter.FormatMessage(undefined, "Status Update Successfully", true, rUser);
                                            }
                                            else {
                                                jsonString = messageFormatter.FormatMessage(undefined, "Invalid Ticket ID.", true, rUser);
                                            }
                                        }
                                        res.end(jsonString);
                                    });
                                }
                                else {
                                    jsonString = messageFormatter.FormatMessage(undefined, "Sub Ticket Not Completed.", false, undefined);
                                    res.end(jsonString);
                                }
                            }
                        });

                    }
                    else {
                        Ticket.findOneAndUpdate({
                            _id: req.params.id,
                            company: company,
                            tenant: tenant
                        }, ticket, function (err, rUser) {
                            if (err) {
                                jsonString = messageFormatter.FormatMessage(err, "Fail Update Ticket", false, undefined);
                            }
                            else {
                                if (rUser) {
                                    jsonString = messageFormatter.FormatMessage(undefined, "Status Update Successfully", true, rUser);
                                }
                                else {
                                    jsonString = messageFormatter.FormatMessage(undefined, "Invalid Ticket ID.", true, rUser);
                                }
                            }
                            res.end(jsonString);
                        });
                    }

                }
                else {
                    jsonString = messageFormatter.FormatMessage(undefined, "Fail Find Ticket", false, undefined);
                    res.end(jsonString);
                }
            }

        });
    }
    else {
        jsonString = messageFormatter.FormatMessage(undefined, "Invalid Status.", false, undefined);
        res.end(jsonString);
    }

};

module.exports.AssignToUser = function (req, res) {
    logger.info("DVP-LiteTicket.AssignToUser Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    if (req.params.user) {
        User.findOne({_id: req.params.user, company: company, tenant: tenant}, function (err, user) {
            if (err) {
                jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
                res.end(jsonString);
            } else {
                if (user) {
                    Ticket.findOne({company: company, tenant: tenant, _id: req.params.id}, function (err, ticket) {
                        if (err) {
                            jsonString = messageFormatter.FormatMessage(err, "Fail Find Ticket", false, undefined);
                            res.end(jsonString);
                        }
                        else {
                            if (ticket) {

                                ticket.update({$set: {assignee_group: undefined,assignee: user.id  }}, function (err, obj) {
                                    if (err) {
                                        jsonString = messageFormatter.FormatMessage(err, "Fail Find Ticket", false, undefined);
                                    }
                                    if(obj){
                                        jsonString = messageFormatter.FormatMessage(undefined, "Ticket Assign To User.", true, undefined);
                                    }
                                    else{
                                        jsonString = messageFormatter.FormatMessage(undefined, "Invalid Ticket Information.", false, undefined);
                                    }
                                    res.end(jsonString);
                                });

                            } else {
                                jsonString = messageFormatter.FormatMessage(undefined, "Fail Find Ticket", false, undefined);
                                res.end(jsonString);
                            }
                        }
                    });
                }
                else {
                    jsonString = messageFormatter.FormatMessage(undefined, "Unable To Find User.", false, undefined);
                    res.end(jsonString);
                }
            }
        });
    }
    else {
        jsonString = messageFormatter.FormatMessage(undefined, "Invalid User Info.", false, undefined);
        res.end(jsonString);
    }

};

module.exports.AssignToGroup = function(req, res) {
    logger.info("DVP-LiteTicket.AssignToGroup Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    if (req.params.group) {
        UserGroup.findOne({_id: req.params.group, company: company, tenant: tenant}, function (err, group) {
            if (err) {
                jsonString = messageFormatter.FormatMessage(err, "Get Group Failed", false, undefined);
                res.end(jsonString);
            } else {
                if (group) {
                    Ticket.findOne({company: company, tenant: tenant, _id: req.params.id}, function (err, ticket) {
                        if (err) {
                            jsonString = messageFormatter.FormatMessage(err, "Fail Find Ticket", false, undefined);
                            res.end(jsonString);
                        }
                        else {
                            if (ticket) {

                                ticket.update({$set: {assignee_group: group.id ,assignee: undefined}}, function (err, obj) {
                                    if (err) {
                                        jsonString = messageFormatter.FormatMessage(err, "Fail Find Ticket", false, undefined);
                                    }
                                    if(obj){
                                        jsonString = messageFormatter.FormatMessage(undefined, "Ticket Assign To Group.", true, undefined);
                                    }
                                    else{
                                        jsonString = messageFormatter.FormatMessage(undefined, "Invalid Ticket Information.", false, undefined);
                                    }
                                    res.end(jsonString);
                                });

                            } else {
                                jsonString = messageFormatter.FormatMessage(undefined, "Fail Find Ticket", false, undefined);
                                res.end(jsonString);
                            }
                        }
                    });
                }
                else {
                    jsonString = messageFormatter.FormatMessage(undefined, "Unable To Find User Group.", false, undefined);
                    res.end(jsonString);
                }
            }
        });
    }
    else {
        jsonString = messageFormatter.FormatMessage(undefined, "Invalid Group Info.", false, undefined);
        res.end(jsonString);
    }
};

module.exports.GetAllTicketsBy = function (req, res) {
    logger.info("DVP-LiteTicket.GetAllTicketsBy Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    var FieldName = req.params.FieldName;
    var fieldValue = req.params.FieldValue;

    var page = parseInt(req.params.Page),
        size = parseInt(req.params.Size),
        skip = page > 0 ? ((page - 1) * size) : 0;


    if (FieldName == "assignee") {
        Ticket.find({company: company, tenant: tenant, active: true, assignee: fieldValue}).skip(skip)
            .limit(size).sort({created_at: -1}).exec(function (err, tickets) {
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
    else if (FieldName == "assignee_group") {
        Ticket.find({
            company: company,
            tenant: tenant,
            active: true,
            assignee_group: fieldValue
        }).skip(skip)
            .limit(size).sort({created_at: -1}).exec(function (err, tickets) {
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
    else if (FieldName == "submitter") {
        Ticket.find({company: company, tenant: tenant, active: true, submitter: fieldValue}).skip(skip)
            .limit(size).sort({created_at: -1}).exec(function (err, tickets) {
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
    /*else if (FieldName == "requester") {
        Ticket.find({company: company, tenant: tenant, active: true, requester: fieldValue}).skip(skip)
            .limit(size).sort({created_at: -1}).exec(function (err, tickets) {
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
    }*/
    else {
        jsonString = messageFormatter.FormatMessage(new Error("Invalid Search Category."), "Invalid Search Category.", false, undefined);
        res.end(jsonString);
    }

};

//var query = Product.find({"title": new RegExp(".*" + value.replace(/(\W)/g, "\\$1") + ".*", "i")}).limit(3);
module.exports.TicketSearch = function (req, res) {
    logger.info("DVP-LiteTicket.TicketSearch Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    var searchBy = req.params.SearchBy;
    var searchValue = req.params.SearchValue;

    var page = parseInt(req.params.Page),
        size = parseInt(req.params.Size),
        skip = page > 0 ? ((page - 1) * size) : 0;

    if (searchBy == "subject") {
        Ticket.find({
            'subject': new RegExp(searchValue, 'i'), active: true,
            company: company,
            tenant: tenant
        }).skip(skip)
            .limit(size).sort({created_at: -1}).exec(function (err, tickets) {
                if (err) {

                    jsonString = messageFormatter.FormatMessage(err, "Search Tickets by Subject Failed", false, undefined);

                } else {

                    if (tickets) {

                        jsonString = messageFormatter.FormatMessage(undefined, "Search Tickets by Subject Successful", true, tickets);

                    } else {

                        jsonString = messageFormatter.FormatMessage(undefined, "No Ticket Found", false, undefined);

                    }
                }
                res.end(jsonString);
            });
    }
    else if (searchBy == "reference") {
        Ticket.find({
            'reference': new RegExp(searchValue, 'i'), active: true,
            company: company,
            tenant: tenant
        }).skip(skip)
            .limit(size).sort({created_at: -1}).exec(function (err, tickets) {
                if (err) {

                    jsonString = messageFormatter.FormatMessage(err, "Search Tickets by Reference Failed", false, undefined);

                } else {

                    if (tickets) {

                        jsonString = messageFormatter.FormatMessage(undefined, "Search Tickets by Reference Successful", true, tickets);

                    } else {

                        jsonString = messageFormatter.FormatMessage(undefined, "No Ticket Found", false, undefined);

                    }
                }
                res.end(jsonString);
            });
    }
    else if (searchBy == "channel") {
        Ticket.find({
            'reference': new RegExp(searchValue, 'i'), active: true,
            company: company,
            tenant: tenant
        }).skip(skip)
            .limit(size).sort({created_at: -1}).exec(function (err, tickets) {
                if (err) {

                    jsonString = messageFormatter.FormatMessage(err, "Search Tickets by channel Failed", false, undefined);

                } else {

                    if (tickets) {

                        jsonString = messageFormatter.FormatMessage(undefined, "Search Tickets by channel Successful", true, tickets);

                    } else {

                        jsonString = messageFormatter.FormatMessage(undefined, "No Ticket Found", false, undefined);

                    }
                }
                res.end(jsonString);
            });
    }
    else {
        jsonString = messageFormatter.FormatMessage(err, "Search Category Not Implemented.", false, undefined);
        res.end(jsonString);
    }

};

module.exports.SearchTickets = function (req, res) {
    logger.debug("DVP-TicketService.SearchTickets Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    var page = parseInt(req.params.Page),
        size = parseInt(req.params.Size),
        skip = page > 0 ? ((page - 1) * size) : 0;

    Ticket.find({
        $text: {$search: req.params.text},
        company: company,
        tenant: tenant
    }, {score: {$meta: "textScore"}}).skip(skip)
        .limit(size).sort({score: {$meta: 'textScore'}})
        .exec(function (err, tickets) {
            if (err) {

                jsonString = messageFormatter.FormatMessage(err, "Get Tickets Failed", false, undefined);

            } else {

                if (tickets) {


                    jsonString = messageFormatter.FormatMessage(err, "Get Tickets Successful", true, tickets);

                } else {

                    jsonString = messageFormatter.FormatMessage(undefined, "No External Users Found", false, undefined);

                }
            }

            res.end(jsonString);
        });
};

function MergeTicket(req, res) {
};
function GetMergeTicket(req, res) {
};


module.exports.CreateSubTicket = function (req, res) {

    logger.info("DVP-LiteTicket.CreateSubTicket Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    Ticket.findOne({company: company, tenant: tenant, _id: req.params.id}, function (err, parentTicket) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
            res.end(jsonString);

        }
        else if (parentTicket) {

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
                            is_sub_ticket: true,
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
                            engagement_session: ObjectId(req.body.engagement_session),
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
                                parentTicket.update({$addToSet: {sub_tickets: obj._doc._id}}
                                    , function (err, rOrg) {
                                        if (err) {
                                            jsonString = messageFormatter.FormatMessage(err, "Fail To Map With Parent.", false, undefined);
                                        } else {
                                            if (rOrg) {
                                                jsonString = messageFormatter.FormatMessage(undefined, "Sub-Ticket Saved Successfully", true, obj._doc);
                                            }
                                            else {
                                                jsonString = messageFormatter.FormatMessage(undefined, "Invalid Ticket ID.", true, obj._doc);
                                            }
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

        } else {
            jsonString = messageFormatter.FormatMessage(err, "Invalid Ticket ID.", false, undefined);
            res.end(jsonString);
        }
    });


};

module.exports.GetSubTickets = function (req, res) {
    logger.info("DVP-LiteTicket.GetSubTickets Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    var page = parseInt(req.params.Page),
        size = parseInt(req.params.Size),
        skip = page > 0 ? ((page - 1) * size) : 0;

    Ticket.find({company: company, tenant: tenant, is_sub_ticket: true}).skip(skip)
        .limit(size).sort({created_at: -1}).exec(function (err, tickets) {
            if (err) {

                jsonString = messageFormatter.FormatMessage(err, "Get All Sub Tickets Failed", false, undefined);

            } else {

                if (tickets) {

                    jsonString = messageFormatter.FormatMessage(undefined, "Get All Sub Tickets Successful", true, tickets);

                } else {

                    jsonString = messageFormatter.FormatMessage(undefined, "No Sub Tickets Found", false, tickets);

                }
            }

            res.end(jsonString);
        });
};

function GetAttachTickets(req, res) {
};
function AttachSubTicket(req, res) {

};
function DeAttachSubTicket(req, res) {
};

module.exports.MergeTicket = MergeTicket;
module.exports.GetMergeTickets = GetMergeTicket;

module.exports.AttachSubTicket = AttachSubTicket;
module.exports.DeAttachSubTicket = DeAttachSubTicket;
module.exports.GetAttachTickets = GetAttachTickets;


module.exports.GetTicketAudit = GetTicketAudit;










