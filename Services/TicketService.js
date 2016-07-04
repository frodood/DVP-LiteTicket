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
var messageFormatter = require('dvp-common/CommonMessageGenerator/ClientMessageJsonFormatter.js');




function GetAllTickets(req, res){


    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    Ticket.find({company: company, tenant: tenant}, function(err, tickets) {
        if (err) {

            jsonString = messageFormatter.FormatMessage(err, "Get All Tickets Failed", false, undefined);

        }else {

            if (users) {


                jsonString = messageFormatter.FormatMessage(err, "Get All Tickets Successful", true, tickets);

            }else{

                jsonString = messageFormatter.FormatMessage(undefined, "No External Users Found", false, undefined);

            }
        }

        res.end(jsonString);
    });

}
function CreateTicket(req, res){


    logger.debug("DVP-LiteTicket.CreateTicket Internal method ");

    var company = parseInt(req.user.company);
    var tenant = parseInt(req.user.tenant);
    var jsonString;
    User.findOne({username: req.user.iss,company: company, tenant: tenant}, function(err, user) {
        if (err) {


            jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
            res.end(jsonString);

        } else {

            if (user) {


                var ticket = Ticket({




                    created_at: Date.now(),
                    updated_at: Date.now(),
                    //due_at: Date,
                    type: req.body.type,
                    subject: req.body.subject,
                    description: req.body.description,
                    priority: req.body.priority,
                    status: "new",
                    requester: req.body.userid,
                    submitter: user.id,
                    //assignee_group: [{type: ObjectId,ref: 'UserGroup'}],
                    company: company,
                    tenant: tenant,
                    channel: req.body.channel,
                    tags: req.body.tags,
                    events: [{type: 'status', body: {status: 'new', time: Date.now()}}]


                });

                var jsonString = messageFormatter.FormatMessage(undefined, "Ticket saved successfully", true, ticket);
                ticket.save(function (err, client) {
                    if (err) {

                        jsonString = messageFormatter.FormatMessage(err, "Ticket create failed", false, undefined);


                    }

                    res.end(jsonString);

                });
            }else {

                jsonString = messageFormatter.FormatMessage(err, "Get User Failed", false, undefined);
                res.end(jsonString);
            }
        }
    });
};
function CreateSubTicket(req, res){};
function GetSubTickets(req,res){};
function AttachSubTicket(req, res){};
function GetAttachTickets(req,res){};
function DeAttachSubTicket(req,res){};
function GetAllTicketsWithStatus(req,res){};
function GetTicket(req,res){};
function DeActivateTicket(req,res){};
function PickTicket(req,res){};
function GetTicketAudit(req,res){};
function UpdateTicket(req,res){};
function AddComment(req,res){};
function AddAttachment(req,res){};
function AddCommentToComment(req,res){};
function ChangeStatus(req,res){};
function AssignToUser(req,res){};
function AssignToGroup(req,res){};
function GetAllTicketsWithMatrix(req,res){};
function GetAllTicketsInStatusWithMatrix(req,res){};
function GetAllMyTickets(req,res){};
function GetAllMyTicketsWithStatus(req,res){};


module.exports.GetAllTickets = GetAllTickets;
module.exports.CreateTicket = CreateTicket;
module.exports.CreateSubTicket = CreateSubTicket;
module.exports.GetSubTickets = GetSubTickets;
module.exports.AttachSubTicket = AttachSubTicket;
module.exports.DeAttachSubTicket = DeAttachSubTicket;
module.exports.GetAttachTickets =GetAttachTickets;
module.exports.GetAllTicketsWithStatus = GetAllTicketsWithStatus;
module.exports.GetTicket = GetTicket;
module.exports.DeActivateTicket = DeActivateTicket;
module.exports.PickTicket = PickTicket;
module.exports.GetTicketAudit = GetTicketAudit;
module.exports.UpdateTicket = UpdateTicket;
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

