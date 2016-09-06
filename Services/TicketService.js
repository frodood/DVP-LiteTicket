var mongoose = require('mongoose');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var Ticket = require('dvp-mongomodels/model/Ticket').Ticket;
var TicketEvent = require('dvp-mongomodels/model/Ticket').TicketEvent;
var User = require('dvp-mongomodels/model/User');
var UserGroup = require('dvp-mongomodels/model/UserGroup').UserGroup;
var ExternalUser = require('dvp-mongomodels/model/ExternalUser').ExternalUser;
var Attachment = require('dvp-mongomodels/model/Attachment').Attachment;
var Tag = require('dvp-mongomodels/model/Tag').Tag;
var TimeEntry = require('dvp-mongomodels/model/TimeEntry').TimeEntry;
var Comment = require('dvp-mongomodels/model/Comment').Comment;
var TicketStatics = require('dvp-mongomodels/model/TicketMetrix').TicketStatics;
var Case = require('dvp-mongomodels/model/CaseManagement').Case;
var CaseConfiguration = require('dvp-mongomodels/model/CaseManagement').CaseConfiguration;
/*var CaseConfiguration = require('dvp-mongomodels/model/CaseConfiguration').CaseConfiguration;*/
var EngagementSession = require('dvp-mongomodels/model/Engagement').EngagementSession;
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');
var triggerWorker = require('../Workers/Trigger/TriggerWorker');
var slaWorker = require('../Workers/SLA/SLAWorker.js');
var deepcopy = require("deepcopy");
var diff = require('deep-diff').diff;
var format = require('stringformat');
var config = require('config');
var q = require('q');
var amqp = require('amqp');

var Schema = mongoose.Schema;
var ObjectId = Schema.ObjectId;

var async = require("async");
var reference = require('dvp-common/Reference/ReferenceGen');

////////////////////////////rabbitmq//////////////////////////////////////////////////////
var queueHost = format('amqp://{0}:{1}@{2}:{3}',config.RabbitMQ.user,config.RabbitMQ.password,config.RabbitMQ.ip,config.RabbitMQ.port);
var queueConnection = amqp.createConnection({
    url: queueHost
});
queueConnection.on('ready', function () {

    logger.info("Coonection with the queue is OK");

});
/////////////////////////////////////////////////////////////////////////////////////////////////////



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

                var time = new Date().toISOString();
                var tEvent = TicketEvent({
                    type: 'status',
                    body: {
                        "message": req.user.iss + " Created Ticket",
                        "time": time
                    }
                });

                reference.generate(1,3,function(done, id) {
                    var ticket = Ticket({
                        created_at: Date.now(),
                        updated_at: Date.now(),
                        active: true,
                        is_sub_ticket: false,
                        type: req.body.type,
                        subject: req.body.subject,
                        reference: id,
                        description: req.body.description,
                        priority: req.body.priority,
                        status: "new",
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
                        SLAViolated: false,
                        events: [tEvent],
                        requester: undefined
                    });

                    if (req.body.requesterId)
                        ticket.requester = req.body.requesterId;

                    ticket.save(function (err, client) {
                        if (err) {
                            jsonString = messageFormatter.FormatMessage(err, "Ticket create failed", false, undefined);
                        }
                        else {
                            jsonString = messageFormatter.FormatMessage(undefined, "Ticket saved successfully", true, client._doc);
                            ExecuteTrigger(client.id, "change_status", "new");

                            ////////////////////////////////////////add note to engagement session async//////////////////////////
                            try {
                                EngagementSession.findOneAndUpdate({
                                    engagement_id: req.body.engagement_session,
                                    company: company,
                                    tenant: tenant
                                }, {
                                    $addToSet: {
                                        notes: {
                                            body: '#TID ' + ticket.reference,
                                            author: req.user.iss,
                                            created_at: Date.now(),
                                        }
                                    }
                                }, function (err, notes) {
                                    if (err) {

                                        logger.error("Append Note To EngagementSession Failed", err);

                                    } else {

                                        logger.debug("Append Note To EngagementSession Success");

                                    }

                                });
                            } catch (excep) {

                                logger.error("Append Note To EngagementSession Failed", excep);
                            }


                            //////////////////////////////////////////////////////////////////////////////////////////////////////
                            ExecuteSla(client.id, undefined);
                        }
                        res.end(jsonString);
                    });
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
    if(req.query.status){
        var paramArr;
        if(Array.isArray(req.query.status)) {
            paramArr = req.query.status;
        }else{

            paramArr = [req.query.status];
        }

        Ticket.find({company: company, tenant: tenant, active: true, status: { $in: paramArr }}).skip(skip)
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

    }
   else{
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

    }



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

module.exports.GetAllTicketsWithStatusTimeRange = function (req, res) {
    logger.info("DVP-LiteTicket.GetAllTicketsWithStatusTimeRange Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);

    var jsonString;
    Ticket.find({
        company: company,
        tenant: tenant,
        active: true,
        "created_at": {"$gte": req.params.fromDate, "$lt": req.params.toDate}
    }).sort({created_at: -1}).exec(function (err, tickets) {
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
    Ticket.find({company: company, tenant: tenant, channel: req.params.Channel, active: true}).skip(skip)
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

module.exports.GetAllTicketsByChannelTimeRange = function (req, res) {
    logger.info("DVP-LiteTicket.GetAllTicketsByChannelTimeRange Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);


    var jsonString;
    Ticket.find({
        company: company,
        tenant: tenant,
        "created_at": {"$gte": req.params.fromDate, "$lt": req.params.toDate},
        active: true
    }).sort({created_at: -1}).exec(function (err, tickets) {
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
    Ticket.find({company: company, tenant: tenant, requester: req.params.Requester, active: true}).skip(skip)
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

module.exports.GetAllTicketsByRequesterTimeRange = function (req, res) {
    logger.info("DVP-LiteTicket.GetAllTicketsByRequesterTimeRange Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);


    var jsonString;
    Ticket.find({
        company: company,
        tenant: tenant,
        "created_at": {"$gte": req.params.fromDate, "$lt": req.params.toDate},
        active: true
    }).sort({created_at: -1}).exec(function (err, tickets) {
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
    Ticket.find({company: company, tenant: tenant, priority: req.params.Priority, active: true}).skip(skip)
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

module.exports.GetAllTicketsByPriorityTimeRange = function (req, res) {
    logger.info("DVP-LiteTicket.GetAllTicketsByPriorityTimeRange Internal method ");
    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);


    var jsonString;
    Ticket.find({
        company: company,
        tenant: tenant,
        "created_at": {"$gte": req.params.fromDate, "$lt": req.params.toDate},
        active: true
    }).sort({created_at: -1}).exec(function (err, tickets) {
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
    Ticket.find({company: company, tenant: tenant, assignee_group: req.params.GroupId, active: true}).skip(skip)
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

module.exports.MapTicketToProfile = function (req, res) {
    logger.info("DVP-LiteTicket.MapTicketToProfile Internal method ");

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
            res.end(jsonString);
        }
        else {
            if (ticket) {
                if (ticket.requester) {
                    jsonString = messageFormatter.FormatMessage(undefined, "Already Map To Profile", false, undefined);
                    res.end(jsonString);
                }
                else {
                    ticket.requester = req.params.Requester;
                    ticket.update(ticket, function (ex, obj) {
                        if (err) {

                            jsonString = messageFormatter.FormatMessage(err, "Fail to Find Ticket", false, undefined);
                        } else {
                            jsonString = messageFormatter.FormatMessage(undefined, "Successfully Map.", true, obj);
                        }
                        res.end(jsonString);
                    });
                }
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Fail To Find Ticket", false, undefined);
                res.end(jsonString);
            }
        }

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
    Ticket.findOne({
        _id: req.params.id, company: company,
        tenant: tenant
    }, function (err, ticket) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Fail to Find Ticket", false, undefined);
            res.end(jsonString);
        }
        else {
            if (ticket) {
                var time = new Date().toISOString();
                var tEvent = TicketEvent({
                    type: 'status',
                    body: {
                        "message": req.user.iss + " Deactivate Ticket",
                        "time": time
                    }
                });


                ticket.update({
                    "$set": {
                        "updated_at": time,
                        "active": false
                    },
                    "$addToSet": {"events": tEvent}
                }, function (err, rUser) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Fail To DeActivate Ticket", false, undefined);
                    }
                    else {
                        if (rUser) {
                            jsonString = messageFormatter.FormatMessage(undefined, "Ticket DeActivated", true, undefined);
                            ExecuteTrigger(req.params.id, "change_status", "closed");
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

                                var assigneeGroup = deepcopy(ticket.toJSON().assignee_group);
                                var time = new Date().toISOString();
                                ticket.assignee_group = undefined;
                                ticket.assignee = user.id;
                                ticket.updated_at = time;
                                var tEvent = TicketEvent({
                                    type: 'status',
                                    body: {
                                        "message": req.user.iss + " Pick Ticket From Group " + assigneeGroup,
                                        "time": time
                                    }
                                });
                                ticket.events.push(tEvent);

                                ticket.update(ticket, function (err, rUser) {
                                    if (err) {
                                        jsonString = messageFormatter.FormatMessage(err, "Fail Pick Ticket", false, undefined);
                                    }
                                    else {
                                        if (rUser) {
                                            jsonString = messageFormatter.FormatMessage(undefined, "Ticket Pick Successfully", true, ticket);
                                            ExecuteTrigger(req.params.id, "change_assignee", undefined);
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

module.exports.GetTicketAudit = function (req, res) {
    logger.info("DVP-LiteTicket.GetTicketAudit Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    Ticket.findOne({
        company: company,
        tenant: tenant,
        active: true,
        _id: req.params.id
    }, '_id requester events', function (err, ticket) {
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

                var oldTicket = deepcopy(ticket.toJSON());

                var time = new Date().toISOString();
                ticket.updated_at = time;
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
                /*ticket.tags = req.body.tags;*/
                ticket.custom_fields = req.body.custom_fields;
                /*ticket.comments = req.body.comments;*/

                var differences = diff(oldTicket, ticket.toJSON());

                var tEvent = TicketEvent({
                    type: 'status',
                    body: {
                        "message": req.user.iss + " made changes",
                        "time": time,
                        "differences": differences
                    }
                });
                ticket.events.push(tEvent);

                ticket.update(ticket, function (err, rUser) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Fail Update Ticket", false, undefined);
                    }
                    else {
                        if (rUser) {
                            jsonString = messageFormatter.FormatMessage(undefined, "Ticket Update Successfully", true, rUser);
                        }
                        else {
                            jsonString = messageFormatter.FormatMessage(undefined, "Invalid Ticket ID.", false, rUser);
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

module.exports.AddCommentByEngagement = function(req, res){



    logger.info("DVP-LiteTicket.AddCommentByEngagement Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    var author = req.user.iss;

    try {
        if (req.body.author)
            author = req.body.author;
    }catch(exx){

    }

    Ticket.findOne({company: company, tenant: tenant, engagement_session: req.params.engagementid}, function (err, ticket) {
        if (err) {

            //////////////////////////////////////check for comment/////////////////////////////////////////////////////////
            Comment.findOne({engagement_session: req.params.engagementid}, function (err, comment) {
                if (err) {
                    jsonString = messageFormatter.FormatMessage(err, "Fail To Find Comment", false, undefined);
                    res.end(jsonString);
                }
                else {
                    if (comment) {
                        User.findOne({
                            username: author,
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
                                        engagement_session: req.body.engagement_session,
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
                                                Comment.findOneAndUpdate({_id: req.params.commentid},
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
                        jsonString = messageFormatter.FormatMessage(err, "Fail To Find Comment", false, undefined);
                        res.end(jsonString);
                    }
                }

            });

            ////////////////////////////////////////////////////////////////////////////////////////////////////////////////


            //jsonString = messageFormatter.FormatMessage(err, "Fail To Find Ticket", false, undefined);
            //res.end(jsonString);
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
                                engagement_session: req.body.engagement_session,
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
                                                engagement_session: req.params.engagementid
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
                //////////////////////////////////////check for comment/////////////////////////////////////////////////////////
                Comment.findOne({engagement_session: req.params.engagementid}, function (err, comment) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Fail To Find Comment", false, undefined);
                        res.end(jsonString);
                    }
                    else {
                        if (comment) {
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
                                            engagement_session: req.body.engagement_session,
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
                                                    Comment.findOneAndUpdate({engagement_session: req.params.engagementid},
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
                            jsonString = messageFormatter.FormatMessage(err, "Fail To Find Comment", false, undefined);
                            res.end(jsonString);
                        }
                    }

                });

                ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

            }
        }
    });


}

module.exports.AddComment = function (req, res) {
    logger.info("DVP-LiteTicket.AddComment Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    Ticket.findOne({_id: req.params.id, company: company, tenant: tenant}, function (err, ticket) {
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
                                created_at: new Date().toISOString(),
                                meta_data: req.body.meta_data
                            });

                            comment.save(function (err, obj) {
                                if (err) {
                                    jsonString = messageFormatter.FormatMessage(err, "Fail To Save Comment", false, undefined);
                                    res.end(jsonString);
                                }
                                else {
                                    if (obj.id) {



                                        ////////////////////////////////////////////////////////////////////////////////////////////////////////
                                        var queueName;

                                        var message = {
                                            "from": req.body.channel_from,
                                            "to": req.body.channel_to,
                                            "body": req.body.body,
                                            "comment":comment._id,
                                            "company": company,
                                            "tenant": tenant
                                        }

                                        if (req.body.channel == 'twitter') {
                                            queueName = 'TWEETOUT';
                                        } else if (req.body.channel == 'sms') {
                                            queueName = 'SMSOUT';
                                        } else {
                                            jsonString = messageFormatter.FormatMessage(undefined, "Given channel doesn,t support public comments", false, undefined);
                                            res.end(jsonString);
                                            return;
                                        }

                                        queueConnection.publish(queueName, message, {
                                            contentType: 'application/json'
                                        });

                                        /////////////////////////////////////////////////////////////////////////////////////////////////////////


                                        var time = new Date().toISOString();
                                        ticket.updated_at = time;
                                        ticket.comments.push(obj.id);
                                        var tEvent = TicketEvent({
                                            type: 'status',
                                            body: {
                                                "message": req.user.iss + " Make Comment " + obj.id,
                                                "time": time
                                            }
                                        });
                                        ticket.events.push(tEvent);

                                        ticket.update(ticket
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

module.exports.UpdateComment = function (req, res) {
    logger.info("DVP-LiteTicket.UpdateComment Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    Comment.findOneAndUpdate({_id: req.params.id}, req.body, function (err, comment) {

        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Comment Update Failed", false, undefined);
            res.end(jsonString);
        } else {
            jsonString = messageFormatter.FormatMessage(undefined, "Comment Update successfully", true, comment);
            res.end(jsonString);
        }
    });
};

module.exports.AddAttachment = function (req, res) {
    logger.info("DVP-LiteTicket.AddAttachment Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    Ticket.findOne({_id: req.params.id, company: company, tenant: tenant}, function (err, ticket) {
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

                                        var time = new Date().toISOString();
                                        ticket.updated_at = time;
                                        ticket.attachments.push(obj.id);
                                        var tEvent = TicketEvent({
                                            type: 'status',
                                            body: {
                                                "message": req.user.iss + " Add Attachment " + obj.id,
                                                "time": time
                                            }
                                        });
                                        ticket.events.push(tEvent);

                                        ticket.update(ticket
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
                Ticket.findOne({
                    _id: req.params.id, company: company,
                    tenant: tenant
                }, function (err, ticket) {
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
                                            created_at: new Date().toISOString(),
                                            meta_data: req.body.meta_data
                                        });

                                        comment.save(function (err, obj) {
                                            if (err) {
                                                jsonString = messageFormatter.FormatMessage(err, "Fail To Save Comment", false, undefined);
                                                res.end(jsonString);
                                            }
                                            else {
                                                if (obj.id) {


                                                ////////////////////////////////////////////////////////////////////////////////////////////////////////
                                                    var queueName;

                                                    var message = {
                                                        "from": req.body.channel_from,
                                                        "to": req.body.channel_to,
                                                        "body": req.body.body,
                                                        "comment":comment._id,
                                                        "company": company,
                                                        "tenant": tenant
                                                    }

                                                    if (req.body.channel == 'twitter') {
                                                        queueName = 'TWEETOUT';
                                                    } else if (req.body.channel == 'sms') {
                                                        queueName = 'SMSOUT';
                                                    } else {
                                                        jsonString = messageFormatter.FormatMessage(undefined, "Given channel doesn,t support public comments", false, undefined);
                                                        res.end(jsonString);
                                                        return;
                                                    }

                                                    queueConnection.publish(queueName, message, {
                                                        contentType: 'application/json'
                                                    });

                                                 /////////////////////////////////////////////////////////////////////////////////////////////////////////

                                                    Comment.findOneAndUpdate({_id: req.params.commentid},
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


                                                    var time = new Date().toISOString();
                                                    ticket.updated_at = time;
                                                    var tEvent = TicketEvent({
                                                        type: 'status',
                                                        body: {
                                                            "message": req.user.iss + " Make Comment To Comment " + obj.id,
                                                            "time": time
                                                        }
                                                    });
                                                    ticket.events.push(tEvent);
                                                    ticket.update(ticket, function (ex, nTick) {
                                                        if (err) {
                                                            jsonString = messageFormatter.FormatMessage(err, "Ticket Updated Fail", false, undefined);
                                                        } else {
                                                            jsonString = messageFormatter.FormatMessage(err, "Ticket Updated", true, undefined);
                                                        }
                                                    })
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

                    ticket.status = req.body.status;

                    var time = new Date().toISOString();
                    ticket.updated_at = time;
                    var tEvent = TicketEvent({
                        type: 'status',
                        body: {
                            "message": req.user.iss + " Status Update ",
                            "time": time
                        }
                    });
                    ticket.events.push(tEvent);

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

                                    ticket.update(ticket, function (err, rUser) {
                                        if (err) {
                                            jsonString = messageFormatter.FormatMessage(err, "Fail Update Status.", false, undefined);
                                        }
                                        else {
                                            if (rUser) {
                                                jsonString = messageFormatter.FormatMessage(undefined, "Status Update Successfully", true, rUser);
                                                ExecuteTrigger(req.params.id, "change_status", undefined);
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
                                    ExecuteTrigger(req.params.id, "change_status", undefined);
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

                                var oldTicket = deepcopy(ticket.toJSON());
                                var time = new Date().toISOString();

                                var tEvent = TicketEvent({
                                    type: 'status',
                                    body: {
                                        "message": req.user.iss + " Ticket Assign To User " + user.name,
                                        "time": time
                                    }
                                });

                                ticket.update({
                                    "$set": {
                                        "assignee_group": undefined,
                                        "assignee": user.id,
                                        "updated_at": time
                                    },
                                    "$addToSet": {"events": tEvent}
                                }, function (err, obj) {
                                    if (err) {
                                        jsonString = messageFormatter.FormatMessage(err, "Fail Find Ticket", false, undefined);
                                    }
                                    if (obj) {
                                        jsonString = messageFormatter.FormatMessage(undefined, "Ticket Assign To User.", true, undefined);
                                        ExecuteTrigger(req.params.id, "change_assignee", oldTicket.assignee);
                                    }
                                    else {
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

module.exports.AssignToGroup = function (req, res) {
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
                                var oldTicket = deepcopy(ticket.toJSON());
                                var time = new Date().toISOString();
                                ticket.updated_at = time;
                                var tEvent = TicketEvent({
                                    type: 'status',
                                    body: {
                                        "message": req.user.iss + " Ticket Assign To Group " + group.name,
                                        "time": time
                                    }
                                });
                                /*ticket.events.push(tEvent);

                                 ticket.assignee_group = group.id;
                                 ticket.assignee = undefined ;*/

                                ticket.update({
                                    "$set": {
                                        "assignee_group": group.id,
                                        "assignee": undefined,
                                        "updated_at": time
                                    },
                                    "$addToSet": {"events": tEvent}
                                }, function (err, obj) {
                                    if (err) {
                                        jsonString = messageFormatter.FormatMessage(err, "Fail Find Ticket", false, undefined);
                                    }
                                    if (obj) {
                                        jsonString = messageFormatter.FormatMessage(undefined, "Ticket Assign To Group.", true, undefined);
                                        ExecuteTrigger(req.params.id, "change_assignee_groups", oldTicket.assignee_group);
                                    }
                                    else {
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

module.exports.MergeTicket = function (req, res) {

    logger.info("DVP-LiteTicket.MergeTicket Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    Ticket.findOne({
        company: company,
        tenant: tenant,
        active: true,
        _id: req.params.ticketid
    }, function (err, sticket) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Fail to Find Sub Ticket", false, undefined);
            res.end(jsonString);
        }
        else {
            if (sticket) {
                Ticket.findOne({
                    company: company,
                    tenant: tenant,
                    active: true,
                    _id: req.params.id
                }, function (err, ticket) {
                    if (err) {

                        jsonString = messageFormatter.FormatMessage(err, "Fail to Find Ticket", false, undefined);
                        res.end(jsonString);
                    }
                    else {
                        if (ticket) {
                            var time = new Date().toISOString();

                            var tEvent = TicketEvent({
                                type: 'status',
                                body: {
                                    "message": req.user.iss + " Merge Ticket With " + req.params.ticketid,
                                    "time": time
                                }
                            });

                            ticket.update({
                                "$set": {
                                    "updated_at": time
                                },
                                "$addToSet": {"events": tEvent, "merged_tickets": req.params.ticketid}
                            }, function (err, obj) {
                                if (err) {
                                    jsonString = messageFormatter.FormatMessage(err, "Fail to Find Ticket", false, undefined);
                                    res.end(jsonString);
                                }
                                else {
                                    jsonString = messageFormatter.FormatMessage(undefined, "Merge Ticket Successfully.", true, undefined);
                                    res.end(jsonString);
                                }
                            });
                        }
                        else {
                            jsonString = messageFormatter.FormatMessage(undefined, "Fail To Find Ticket", false, undefined);
                            res.end(jsonString);
                        }
                    }

                })
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Invalid Sub Ticket ID.", false, undefined);
                res.end(jsonString);
            }
        }
    });
};

module.exports.GetMergeTickets = function (req, res) {
    logger.info("DVP-LiteTicket.MergeTicket Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    Ticket.findOne({
        company: company,
        tenant: tenant,
        active: true,
        _id: req.params.id
    }, function (err, sticket) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Fail to Find Ticket", false, undefined);
            res.end(jsonString);
        }
        else {
            if (sticket) {

                Ticket.find({
                        _id: {
                            $in: sticket.merged_tickets.map(function (o) {
                                return o;
                            })
                        }
                    },
                    function (err, ticket) {
                        if (err) {

                            jsonString = messageFormatter.FormatMessage(err, "Fail to Find MergeTicket", false, undefined);
                            res.end(jsonString);
                        }
                        else {
                            if (ticket) {
                                jsonString = messageFormatter.FormatMessage(undefined, "Get Merge Ticket Successfully.", true, ticket);
                                res.end(jsonString);
                            }
                            else {
                                jsonString = messageFormatter.FormatMessage(undefined, "Fail To Find MergeTicket", false, undefined);
                                res.end(jsonString);
                            }
                        }

                    })
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Invalid Ticket ID.", false, undefined);
                res.end(jsonString);
            }
        }
    });
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

                        var time = new Date().toISOString();
                        var tEvent = TicketEvent({
                            type: 'status',
                            body: {
                                "message": req.user.iss + " Create Sub Ticket",
                                "time": time
                            }
                        });


                        var ticket = Ticket({
                            created_at: time,
                            updated_at: time,
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
                            SLAViolated: false,
                            events: [tEvent]
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

module.exports.GetAttachTickets = function (req, res) {
    logger.info("DVP-LiteTicket.GetAttachTickets Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    Ticket.findOne({
        company: company,
        tenant: tenant,
        active: true,
        _id: req.params.id
    }, function (err, sticket) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Fail to Find Ticket", false, undefined);
            res.end(jsonString);
        }
        else {
            if (sticket) {

                Ticket.find({
                        _id: {
                            $in: sticket.related_tickets.map(function (o) {
                                return o;
                            })
                        }
                    },
                    function (err, ticket) {
                        if (err) {

                            jsonString = messageFormatter.FormatMessage(err, "Fail to Find Related Ticket", false, undefined);
                            res.end(jsonString);
                        }
                        else {
                            if (ticket) {
                                jsonString = messageFormatter.FormatMessage(undefined, "Get Related Ticket Successfully.", true, ticket);
                                res.end(jsonString);
                            }
                            else {
                                jsonString = messageFormatter.FormatMessage(undefined, "Fail To Find Related Ticket", false, undefined);
                                res.end(jsonString);
                            }
                        }

                    })
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Invalid Ticket ID.", false, undefined);
                res.end(jsonString);
            }
        }
    });
};

module.exports.AttachTicket = function (req, res) {
    logger.info("DVP-LiteTicket.AttachTicket Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    Ticket.findOne({
        company: company,
        tenant: tenant,
        active: true,
        _id: req.params.ticketid
    }, function (err, sticket) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Fail to Find Related Ticket", false, undefined);
            res.end(jsonString);
        }
        else {
            if (sticket) {
                Ticket.findOne({
                    company: company,
                    tenant: tenant,
                    active: true,
                    _id: req.params.id
                }, function (err, ticket) {
                    if (err) {

                        jsonString = messageFormatter.FormatMessage(err, "Fail to Find Ticket", false, undefined);
                        res.end(jsonString);
                    }
                    else {
                        if (ticket) {
                            var time = new Date().toISOString();

                            var tEvent = TicketEvent({
                                type: 'status',
                                body: {
                                    "message": req.user.iss + " Attach Ticket With " + req.params.ticketid,
                                    "time": time
                                }
                            });

                            ticket.update({
                                "$set": {
                                    "updated_at": time
                                },
                                "$addToSet": {"events": tEvent, "related_tickets": req.params.ticketid}
                            }, function (err, obj) {
                                if (err) {
                                    jsonString = messageFormatter.FormatMessage(err, "Fail to Find Ticket", false, undefined);
                                    res.end(jsonString);
                                }
                                else {
                                    jsonString = messageFormatter.FormatMessage(undefined, "Attach Ticket Successfully.", true, undefined);
                                    res.end(jsonString);
                                }
                            });
                        }
                        else {
                            jsonString = messageFormatter.FormatMessage(undefined, "Fail To Find Ticket", false, undefined);
                            res.end(jsonString);
                        }
                    }

                })
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Invalid Related Ticket ID.", false, undefined);
                res.end(jsonString);
            }
        }
    });
};

module.exports.DeAttachTicket = function (req, res) {
    logger.info("DVP-LiteTicket.DeAttachTicket Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    Ticket.findOne({
        company: company,
        tenant: tenant,
        active: true,
        _id: req.params.ticketid
    }, function (err, sticket) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Fail to Find Related Ticket", false, undefined);
            res.end(jsonString);
        }
        else {
            if (sticket) {
                Ticket.findOne({
                    company: company,
                    tenant: tenant,
                    active: true,
                    _id: req.params.id
                }, function (err, ticket) {
                    if (err) {

                        jsonString = messageFormatter.FormatMessage(err, "Fail to Find Ticket", false, undefined);
                        res.end(jsonString);
                    }
                    else {
                        if (ticket) {
                            var time = new Date().toISOString();

                            var tEvent = TicketEvent({
                                type: 'status',
                                body: {
                                    "message": req.user.iss + " Detach Ticket " + req.params.ticketid,
                                    "time": time
                                }
                            });

                            ticket.update({
                                "$set": {
                                    "updated_at": time
                                },
                                "$addToSet": {"events": tEvent},
                                "$pull": {"related_tickets": req.params.ticketid}

                            }, function (err, obj) {
                                if (err) {
                                    jsonString = messageFormatter.FormatMessage(err, "Fail to Find Ticket", false, undefined);
                                    res.end(jsonString);
                                }
                                else {
                                    jsonString = messageFormatter.FormatMessage(undefined, "Detach Ticket Successfully.", true, obj);
                                    res.end(jsonString);
                                }
                            });
                        }
                        else {
                            jsonString = messageFormatter.FormatMessage(undefined, "Fail To Find Ticket", false, undefined);
                            res.end(jsonString);
                        }
                    }

                })
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Invalid Related Ticket ID.", false, undefined);
                res.end(jsonString);
            }
        }
    });
};

module.exports.AppendEngagement = function (req, res) {
    logger.info("DVP-LiteTicket.AppendEngagement Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    Ticket.findOne({_id: req.params.id, company: company, tenant: tenant}, function (err, ticket) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Fail To Find Ticket", false, undefined);
            res.end(jsonString);
        }
        else {
            if (ticket) {

                var time = new Date().toISOString();

                var tEvent = TicketEvent({
                    type: 'status',
                    body: {
                        "message": req.user.iss + " Append Engagement " + req.params.id,
                        "time": time
                    }
                });

                ticket.update({
                    "$set": {
                        "updated_at": time,
                        "engagement_session":req.params.EngagementId
                    },
                    "$addToSet": {"events": tEvent}

                }, function (err, rOrg) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Fail To Append Engagement to Ticket.", false, undefined);
                    } else {
                        if (rOrg) {
                            jsonString = messageFormatter.FormatMessage(undefined, "Comment Successfully Append Engagement To Ticket", true, obj);

                        }
                        else {
                            jsonString = messageFormatter.FormatMessage(undefined, "Invalid Ticket ID.", false, obj);
                        }
                    }
                    res.end(jsonString);
                });
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Invalid Ticket ID.", false, undefined);
                res.end(jsonString);
            }
        }
    });


};

module.exports.GetTicketsByEngagementId = function (req, res) {
    logger.info("DVP-LiteTicket.GetTicketsByEngagementId Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    Ticket.find({engagement_session: req.params.EngagementId, company: company, tenant: tenant}, function (err, ticket) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Fail To Find Ticket", false, undefined);
            res.end(jsonString);
        }
        else {
            jsonString = messageFormatter.FormatMessage(undefined, "GetTicketsByEngagementId.", true, ticket);
            res.end(jsonString);
        }
    });


};

module.exports.BulkStatusUpdate = function (req, res) {
    logger.info("DVP-LiteTicket.DeAttachTicket Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    Ticket.update({
        company: company,
        tenant: tenant,
        active: true,
        _id: {
            $in: req.body.TicketIds
        }
    }, {$set: {channel: req.body.Status}}, {multi: true}, function (err, sticket) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Fail to Find Related Ticket", false, undefined);
            res.end(jsonString);
        }
        else {
            if (sticket) {
                jsonString = messageFormatter.FormatMessage(undefined, "Successfully Update.", true, undefined);
                res.end(jsonString);
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Invalid Related Ticket ID.", false, undefined);
                res.end(jsonString);
            }
        }
    });
};


function ExecuteTriggerAsync(ticketId, eventType, data) {
    var deferred = q.defer();

    try {

        triggerWorker.ExecuteTrigger(ticketId, eventType, data, function (reply) {
            deferred.resolve(reply);
        })
    }
    catch (ex) {
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error("DVP-LiteTicket.ExecuteTriggerAsync Internal method." + ticketId + " " + eventType + " " + data, jsonString, ex);
    }

    /*setTimeout(function() {
     deferred.resolve('hello world');
     }, 500);*/

    return deferred.promise;
}
function ExecuteTrigger(ticketId, eventType, data) {
    try {

        logger.info("DVP-LiteTicket.ExecuteTrigger Internal method." + ticketId + " " + eventType + " " + data);
        ExecuteTriggerAsync(ticketId, eventType, data).then(function (val) {
            logger.info("DVP-LiteTicket.ExecuteTrigger Internal method. reply : " + val);
        });
    }
    catch (ex) {
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error("DVP-LiteTicket.ExecuteTrigger Internal method." + ticketId + " " + eventType + " " + data, jsonString, ex);
    }

}

function ExecuteSlaAsync(ticketId, previousPriority) {
    var deferred = q.defer();

    try {

        slaWorker.ExecuteSLA(ticketId, previousPriority, function (reply) {
            deferred.resolve(reply);
        })
    }
    catch (ex) {
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error("DVP-LiteTicket.ExecuteSlaAsync Internal method." + ticketId, jsonString, ex);
    }

    /*setTimeout(function() {
     deferred.resolve('hello world');
     }, 500);*/

    return deferred.promise;
}
function ExecuteSla(ticketId, previousPriority) {
    try {

        logger.info("DVP-LiteTicket.ExecuteSla Internal method." + ticketId);
        ExecuteSlaAsync(ticketId, previousPriority).then(function (val) {
            logger.info("DVP-LiteTicket.ExecuteSla Internal method. reply : " + val);
        });
    }
    catch (ex) {
        var jsonString = messageFormatter.FormatMessage(ex, "EXCEPTION", false, undefined);
        logger.error("DVP-LiteTicket.ExecuteSla Internal method." + ticketId, jsonString, ex);
    }

}


/* -----------------------------Case--------------------------------------------------*/

module.exports.AddCaseConfiguration = function (req, res) {
    logger.info("DVP-LiteTicket.AddCaseConfiguration Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    User.findOne({username: req.user.iss, company: company, tenant: tenant}, function (err, user) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
            res.end(jsonString);

        } else {

            if (user) {

                var time = new Date().toISOString();
                var tEvent = TicketEvent({
                    type: 'status',
                    body: {
                        "message": req.user.iss + " CaseConfiguration",
                        "time": time
                    }
                });

                var caseConfiguration = CaseConfiguration({
                    created_at: time,
                    updated_at: time,
                    active: true,
                    configurationName: req.body.configurationName,
                    description: req.body.description,
                    submitter:  user.id,
                    company: company,
                    tenant: tenant,
                    configurationRule: req.body.configurationRule,
                    threshold : req.body.threshold,
                    events : [tEvent]
                });

                caseConfiguration.save(function (err, caseConfiguration) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "caseConfiguration failed", false, undefined);
                    }
                    else {
                        if(caseConfiguration){
                            jsonString = messageFormatter.FormatMessage(undefined, "caseConfiguration saved successfully", true, caseConfiguration);
                        }
                            else{
                            jsonString = messageFormatter.FormatMessage(undefined, "Fail To Save caseConfiguration.", false, caseConfiguration);
                        }
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

module.exports.DeleteCaseConfiguration = function (req, res) {
    logger.info("DVP-LiteTicket.DeleteCaseConfiguration Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    CaseConfiguration.findOne({
        company: company,
        tenant: tenant,
        active: true,
        _id: req.params.id
    }, function (err, caseConfiguration) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Fail to Find CaseConfiguration", false, undefined);
            res.end(jsonString);
        }
        else {
            if (caseConfiguration) {

                var tEvent = TicketEvent({
                    type: 'status',
                    body: {
                        "message": req.user.iss + " Delete CaseConfiguration",
                        "time": time
                    }
                });
                caseConfiguration.update({
                    "$set": {
                        "updated_at": Date.now(),
                        "active": false
                    },
                    "$addToSet": {"events": tEvent}
                }, function (err, rUser) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Fail To Delete CaseConfiguration", false, undefined);
                    }
                    else {
                        if (rUser) {
                            jsonString = messageFormatter.FormatMessage(undefined, "Delete CaseConfiguration", true, undefined);

                        }
                        else {
                            jsonString = messageFormatter.FormatMessage(undefined, "Invalid Data.", false, undefined);
                        }
                    }
                    res.end(jsonString);
                });
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Invalid CaseConfiguration ID.", false, undefined);
                res.end(jsonString);
            }
        }
    });
};

module.exports.CreateCase = function (req, res) {
    logger.info("DVP-LiteTicket.CreateCase Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    User.findOne({username: req.user.iss, company: company, tenant: tenant}, function (err, user) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
            res.end(jsonString);

        } else {

            if (user) {

                var time = new Date().toISOString();
                var tEvent = TicketEvent({
                    type: 'status',
                    body: {
                        "message": req.user.iss + " Create Case",
                        "time": time
                    }
                });

                var caseInfo = Case({
                    created_at: time,
                    updated_at: time,
                    active: true,
                    status: "new",
                    caseName: req.body.caseName,
                    description: req.body.description,
                    submitter:  user.id,
                    company: company,
                    tenant: tenant,
                    attachments: req.body.attachments,
                    caseConfiguration: req.body.caseConfiguration,
                    related_tickets: req.body.relatedTickets,
                    comments: req.body.comments,
                    events: [tEvent],
                    SLAViolated:false
                });

                caseInfo.save(function (err, caseData) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Case failed", false, undefined);
                    }
                    else {
                        if(caseData){
                            jsonString = messageFormatter.FormatMessage(undefined, "Case saved successfully", true, caseData);
                        }
                        else{
                            jsonString = messageFormatter.FormatMessage(undefined, "Fail To Save Case.", false, caseData);
                        }
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

module.exports.DeleteCase = function (req, res) {
    logger.info("DVP-LiteTicket.DeleteCase Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;

    Case.findOne({
        company: company,
        tenant: tenant,
        active: true,
        _id: req.params.id
    }, function (err, caseData) {
        if (err) {
            jsonString = messageFormatter.FormatMessage(err, "Fail to Find Case", false, undefined);
            res.end(jsonString);
        }
        else {
            if (caseData) {

                var tEvent = TicketEvent({
                    type: 'status',
                    body: {
                        "message": req.user.iss + " Delete Case",
                        "time": time
                    }
                });
                caseData.update({
                    "$set": {
                        "updated_at": Date.now(),
                        "active": false
                    },
                    "$addToSet": {"events": tEvent}
                }, function (err, rUser) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Fail To Delete Case", false, undefined);
                    }
                    else {
                        if (rUser) {
                            jsonString = messageFormatter.FormatMessage(undefined, "Delete Case", true, undefined);
                        }
                        else {
                            jsonString = messageFormatter.FormatMessage(undefined, "Invalid Data.", false, undefined);
                        }
                    }
                    res.end(jsonString);
                });
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Invalid Case ID.", false, undefined);
                res.end(jsonString);
            }
        }
    });
};

module.exports.AddTicketToCase = function (req, res) {
    logger.info("DVP-LiteTicket.AddTicketToCase Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);

    var jsonString;
    Case.findOne({company: company, tenant: tenant, _id: req.params.id}, function (err, caseData) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Fail Find Case", false, undefined);
            res.end(jsonString);
        }
        else {
            if (caseData) {

                var tEvent = TicketEvent({
                    type: 'status',
                    body: {
                        "message": req.user.iss + " Add Ticket To Case "+req.params.ticketid,
                        "time": time,
                        "differences": {}
                    }
                });

                caseData.update({
                    "$set": {
                        "updated_at": Date.now()
                    },
                    "$addToSet": {"events": tEvent,"related_tickets":req.params.ticketid}
                }, function (err, rUser) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Fail Update Case.", false, undefined);
                    }
                    else {
                        if (rUser) {
                            jsonString = messageFormatter.FormatMessage(undefined, "Add Ticket To Case.", true, rUser);
                        }
                        else {
                            jsonString = messageFormatter.FormatMessage(undefined, "Invalid Case ID.", false, rUser);
                        }
                    }
                    res.end(jsonString);
                });
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Fail Find Case", false, undefined);
                res.end(jsonString);
            }
        }

    });
};

module.exports.RemoveTicketFromCase = function (req, res) {
    logger.info("DVP-LiteTicket.RemoveTicketFromCase Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);

    var jsonString;
    Case.findOne({company: company, tenant: tenant, _id: req.params.id}, function (err, caseData) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Fail Find Case", false, undefined);
            res.end(jsonString);
        }
        else {
            if (caseData) {

                var tEvent = TicketEvent({
                    type: 'status',
                    body: {
                        "message": req.user.iss + " Remove Ticket From Case "+req.params.ticketid,
                        "time": time,
                        "differences": {}
                    }
                });

                caseData.update({
                    "$set": {
                        "updated_at": Date.now()
                    },
                    "$addToSet": {"events": tEvent},
                    "$pull": {"related_tickets": req.params.ticketid}
                }, function (err, rUser) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Fail To Remove Ticket.", false, undefined);
                    }
                    else {
                        if (rUser) {
                            jsonString = messageFormatter.FormatMessage(undefined, "Remove Ticket.", true, rUser);
                        }
                        else {
                            jsonString = messageFormatter.FormatMessage(undefined, "Invalid Case ID.", false, rUser);
                        }
                    }
                    res.end(jsonString);
                });
            }
            else {
                jsonString = messageFormatter.FormatMessage(undefined, "Fail Find Case", false, undefined);
                res.end(jsonString);
            }
        }

    });
};

/* -----------------------------Case--------------------------------------------------*/

/*to Facebook App*/
module.exports.CreateTicketWithComment = function (req, res) {

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

                var time = new Date().toISOString();
                var tEvent = TicketEvent({
                    type: 'status',
                    body: {
                        "message": req.user.iss + " Created Ticket",
                        "time": time
                    }
                });

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
                    SLAViolated: false,
                    events: [tEvent],
                    requester: undefined
                });

                if (req.body.requesterId)
                    ticket.requester = req.body.requesterId;

                ticket.save(function (err, client) {
                    if (err) {
                        jsonString = messageFormatter.FormatMessage(err, "Ticket create failed", false, undefined);
                        res.end(jsonString);
                    }
                    else {



                        ////////////////////////////////////////add note to engagement session async//////////////////////////
                        try {
                            EngagementSession.findOneAndUpdate({
                                engagement_id: req.body.engagement_session,
                                company: company,
                                tenant: tenant
                            }, {
                                $addToSet: {
                                    notes: {
                                        body: '#TID ' + ticket.reference,
                                        author: req.user.iss,
                                        created_at: Date.now(),
                                    }
                                }
                            }, function (err, notes) {
                                if (err) {

                                    logger.error("Append Note To EngagementSession Failed", err);

                                } else {

                                    logger.debug("Append Note To EngagementSession Success");

                                }

                            });
                        }catch(excep){

                            logger.error("Append Note To EngagementSession Failed", excep);
                        }



                        //////////////////////////////////////////////////////////////////////////////////////////////////////



                        if(req.body.comments){
                            var createTicketTasks = [];
                            req.body.comments.forEach(function(com){

                                createTicketTasks.push(function(callBack){
                                    var comment = Comment({
                                        body: com.body,
                                        body_type: com.body_type,
                                        type: com.type,
                                        public: com.public,
                                        author: author,
                                        author_external: com.author_external,
                                        attachments: com.attachments,
                                        channel: com.channel,
                                        channel_from: com.channel_from,
                                        engagement_session: ObjectId(req.body.engagement_session),
                                        created_at: new Date().toISOString(),
                                        meta_data: com.meta_data
                                    });

                                    comment.save(function (err, obj) {
                                        if (!err) {
                                            if (obj.id) {
                                                var time = new Date().toISOString();
                                                ticket.updated_at = time;
                                                ticket.comments.push(obj.id);
                                                var tEvent = TicketEvent({
                                                    type: 'status',
                                                    body: {
                                                        "message": req.user.iss + " Make Comment " + obj.id,
                                                        "time": time
                                                    }
                                                });
                                                ticket.events.push(tEvent);

                                                ticket.update(ticket
                                                    , function (err, rOrg) {
                                                        if (err) {
                                                            callBack(err,undefined);
                                                        } else {
                                                            callBack(undefined,rOrg);
                                                        }
                                                    });
                                            }
                                            else {
                                                callBack(new Error("Invalid Data"),undefined);
                                            }
                                        }
                                    });

                                });

                            });

                            if (createTicketTasks.length > 0) {
                                async.parallel(createTicketTasks,
                                    function (err, results) {
                                        if (err) {
                                            jsonString = messageFormatter.FormatMessage(err, "Fail To Complete Process.", false, undefined);
                                            res.end(jsonString);
                                        }
                                        else{
                                            jsonString = messageFormatter.FormatMessage(undefined, "Process Complete.", true, results);
                                            res.end(jsonString);
                                        }
                                    });
                            }
                        }
                        else{
                            jsonString = messageFormatter.FormatMessage(undefined, "Ticket create Sucess.", true, undefined);
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
};


/*to Facebook App*/














