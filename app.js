var restify = require('restify');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;
var config = require('config');
var jwt = require('restify-jwt');
var mongoose = require('mongoose');
var uniqueValidator = require('mongoose-unique-validator');
var secret = require('dvp-common/Authentication/Secret.js');
var authorization = require('dvp-common/Authentication/Authorization.js');
var ticketService = require('./Services/TicketService.js');
var tagService = require('./Services/TagService.js');
var timerService = require('./Services/TimerService.js');
var slaService= require('./Services/SLAService.js');
var triggrService = require('./Services/TicketTriggerService.js');
var formMaster = require('./Services/FormService');
var util = require('util');
var port = config.Host.port || 3000;
var host = config.Host.vdomain || 'localhost';
var ardsService =  require('./Workers/PickAgent.js');


var server = restify.createServer({
    name: "DVP Lite Ticket Service"
});

server.pre(restify.pre.userAgentConnection());
server.use(restify.bodyParser({ mapParams: false }));

restify.CORS.ALLOW_HEADERS.push('authorization');
server.use(restify.CORS());
server.use(restify.fullResponse());

server.use(jwt({secret: secret.Secret}));


var mongoip=config.Mongo.ip;
var mongoport=config.Mongo.port;
var mongodb=config.Mongo.dbname;
var mongouser=config.Mongo.user;
var mongopass = config.Mongo.password;



var mongoose = require('mongoose');
var connectionstring = util.format('mongodb://%s:%s@%s:%d/%s',mongouser,mongopass,mongoip,mongoport,mongodb)


mongoose.connection.on('error', function (err) {
    throw new Error(err);
});

mongoose.connection.on('disconnected', function() {
    throw new Error('Could not connect to database');
});

mongoose.connection.once('open', function() {
    console.log("Connected to db");
});


mongoose.connect(connectionstring);


///////////////////////////////Ticket////////////////////////////////////////////////////////////////////////////////////////////


server.post('/DVP/API/:version/Ticket',authorization({resource:"ticket", action:"write"}), ticketService.CreateTicket);
server.get('/DVP/API/:version/Tickets/:Size/:Page', authorization({resource:"ticket", action:"read"}), ticketService.GetAllTickets);
server.get('/DVP/API/:version/Tickets/TimeRange/:fromDate/:toDate', authorization({resource:"ticket", action:"read"}), ticketService.GetTicketsByTimeRange);
server.get('/DVP/API/:version/Tickets/:status/:Size/:Page', authorization({resource:"ticket", action:"read"}), ticketService.GetAllTicketsWithStatus);
server.get('/DVP/API/:version/TicketsWithMatrix/:Size/:Page', authorization({resource:"ticket", action:"read"}), ticketService.GetAllTicketsWithMatrix);
server.get('/DVP/API/:version/TicketsWithMatrix/:status', authorization({resource:"ticket", action:"read"}), ticketService.GetAllTicketsInStatusWithMatrix);
server.get('/DVP/API/:version/Tickets/Channel/:Channel/:Size/:Page', authorization({resource:"ticket", action:"read"}), ticketService.GetAllTicketsByChannel);
server.get('/DVP/API/:version/Tickets/Requester/:Requester/:Size/:Page', authorization({resource:"ticket", action:"read"}), ticketService.GetAllTicketsByRequester);
server.get('/DVP/API/:version/Tickets/Priority/:Priority/:Size/:Page', authorization({resource:"ticket", action:"read"}), ticketService.GetAllTicketsByPriority);
server.get('/DVP/API/:version/Tickets/Group/:GroupId/:Size/:Page', authorization({resource:"ticket", action:"read"}), ticketService.GetAllGroupTickets);
server.get('/DVP/API/:version/MyTickets/:Size/:Page', authorization({resource:"ticket", action:"read"}), ticketService.GetAllMyTickets);
server.get('/DVP/API/:version/MyTickets/:status/:Size/:Page', authorization({resource:"ticket", action:"read"}), ticketService.GetAllMyTicketsWithStatus);
server.get('/DVP/API/:version/Ticket/:id', authorization({resource:"ticket", action:"read"}), ticketService.GetTicket);
server.get('/DVP/API/:version/Ticket/:id/Details', authorization({resource:"ticket", action:"read"}), ticketService.GetTicketWithDetails);
server.del('/DVP/API/:version/Ticket/:id', authorization({resource:"ticket", action:"delete"}), ticketService.DeActivateTicket);
server.put('/DVP/API/:version/Ticket/:id/pick', authorization({resource:"ticket", action:"write"}), ticketService.PickTicket);
server.get('/DVP/API/:version/Ticket/:id/Audit', authorization({resource:"ticket", action:"read"}), ticketService.GetTicketAudit);
server.put('/DVP/API/:version/Ticket/:id', authorization({resource:"ticket", action:"write"}), ticketService.UpdateTicket);
server.put('/DVP/API/:version/Ticket/:id/Comment', authorization({resource:"ticket", action:"write"}), ticketService.AddComment);
server.put('/DVP/API/:version/Ticket/:id/Attachment', authorization({resource:"ticket", action:"write"}), ticketService.AddAttachment);
server.put('/DVP/API/:version/Ticket/:id/Comment/:commentid/Comment', authorization({resource:"ticket", action:"write"}), ticketService.AddCommentToComment);
server.put('/DVP/API/:version/Ticket/:id/Status', authorization({resource:"ticket", action:"write"}), ticketService.ChangeStatus);
server.put('/DVP/API/:version/Ticket/:id/AssignUser/:user', authorization({resource:"ticket", action:"write"}), ticketService.AssignToUser);
server.put('/DVP/API/:version/Ticket/:id/AssignGroup/:group', authorization({resource:"ticket", action:"write"}), ticketService.AssignToGroup);
server.get('/DVP/API/:version/Tickets/:FieldName/:FieldValue/:Size/:Page', authorization({resource:"ticket", action:"read"}), ticketService.GetAllTicketsBy);
server.get('/DVP/API/:version/TicketSearch/:SearchBy/:SearchValue/:Size/:Page', authorization({resource:"ticket", action:"read"}), ticketService.TicketSearch);
server.get('/DVP/API/:version/TicketSearch/:Size/:Page', authorization({resource:"ticket", action:"read"}), ticketService.SearchTickets);


server.put('/DVP/API/:version/Ticket/:id/MergeTicket/:ticketid',authorization({resource:"ticket", action:"write"}), ticketService.MergeTicket);
server.get('/DVP/API/:version/Ticket/:id/MergeTickets',authorization({resource:"ticket", action:"read"}), ticketService.GetMergeTickets);


server.post('/DVP/API/:version/Ticket/:id/SubTicket',authorization({resource:"ticket", action:"write"}), ticketService.CreateSubTicket);
server.get('/DVP/API/:version/Ticket/:id/SubTickets',authorization({resource:"ticket", action:"read"}), ticketService.GetSubTickets);
server.get('/DVP/API/:version/Ticket/:id/RelatedTickets',authorization({resource:"ticket", action:"read"}), ticketService.GetAttachTickets);
server.post('/DVP/API/:version/Ticket/:id/RelatedTicket',authorization({resource:"ticket", action:"write"}), ticketService.AttachSubTicket);
server.del('/DVP/API/:version/Ticket/:id/RelatedTicket',authorization({resource:"ticket", action:"delete"}), ticketService.DeAttachSubTicket);


/////////////////////////////////////////////Tags///////////////////////////////////////////////////////////////////////////////////////////////


server.post('/DVP/API/:version/TagCategory', authorization({resource:"ticket", action:"write"}), tagService.CreateTagCategory);
server.get('/DVP/API/:version/TagCategory/:id', authorization({resource:"ticket", action:"read"}), tagService.GetTagCategory);
server.get('/DVP/API/:version/TagCategories', authorization({resource:"ticket", action:"read"}), tagService.GetTagCategories);
server.del('/DVP/API/:version/TagCategory/:id', authorization({resource:"ticket", action:"write"}), tagService.RemoveTagCategory);


server.post('/DVP/API/:version/Tag', authorization({resource:"ticket", action:"write"}), tagService.CreateTag);
server.get('/DVP/API/:version/Tags', authorization({resource:"ticket", action:"read"}), tagService.GetTags);
server.get('/DVP/API/:version/Tag/:id', authorization({resource:"ticket", action:"read"}), tagService.GetTag);
server.del('/DVP/API/:version/Tag/:id', authorization({resource:"ticket", action:"write"}), tagService.DeleteTag);
server.post('/DVP/API/:version/Tag/:id', authorization({resource:"ticket", action:"write"}), tagService.CreateTagsToTag);
server.put('/DVP/API/:version/Tag/:id/AttachTo/:tagid', authorization({resource:"ticket", action:"write"}), tagService.AttachTagsToTag);
server.del('/DVP/API/:version/Tag/:id/DetachFrom/:tagid', authorization({resource:"ticket", action:"write"}), tagService.DetachTagsFromTag);

/////////////////////////////////////////////Tag Category///////////////////////////////////////////////////////////////////////////////////////////////
server.put('/DVP/API/:version/Tag/:id/AttachToCategory/:cid', authorization({resource:"ticket", action:"write"}), tagService.AttachTagsToCategory);
server.put('/DVP/API/:version/Tag/:id/DetachFromCategory/:cid', authorization({resource:"ticket", action:"write"}), tagService.DetachTagsFromCategory);



///////////////////////////////////////////Timer///////////////////////////////////////////////////////////////////////////////////////////////////

server.post('/DVP/API/:version/Ticket/:id/timer', authorization({resource:"timer", action:"write"}), timerService.CreateTimer);
server.get('/DVP/API/:version/Ticket/:id/times', authorization({resource:"ticket", action:"read"}), timerService.GetTimes);
server.put('/DVP/API/:version/Timer/:id', authorization({resource:"timer", action:"write"}), timerService.UpdateTimer);
server.put('/DVP/API/:version/Timer/:id/time', authorization({resource:"timer", action:"write"}), timerService.UpdateTimerTime);
server.put('/DVP/API/:version/Timer/:id/toggle', authorization({resource:"timer", action:"write"}), timerService.ToggelTimer);
server.get('/DVP/API/:version/MyTimer', authorization({resource:"timer", action:"write"}), timerService.GetMyTimeSheet);


///////////////////////////////////////////SLA/////////////////////////////////////////////////////////////////////////////////////////////////


server.post('/DVP/API/:version/SLA', authorization({resource:"sla", action:"write"}), slaService.CreateSLA);
server.get('/DVP/API/:version/SLAs', authorization({resource:"sla", action:"read"}), slaService.GetSLAs);
server.get('/DVP/API/:version/SLA/:id', authorization({resource:"sla", action:"read"}), slaService.GetSLA);
server.put('/DVP/API/:version/SLA', authorization({resource:"sla", action:"write"}), slaService.UpdateSLA);
server.del('/DVP/API/:version/SLA/:id', authorization({resource:"sla", action:"delete"}), slaService.DeleteSLA);
server.put('/DVP/API/:version/SLA/:id/Matrix', authorization({resource:"sla", action:"write"}), slaService.AddMatrix);
server.get('/DVP/API/:version/SLA/:id/Matrixs', authorization({resource:"sla", action:"read"}), slaService.GetMatrixs);
server.del('/DVP/API/:version/SLA/:id/Matrix/matrixid', authorization({resource:"sla", action:"delete"}), slaService.DeleteMatrix);
server.put('/DVP/API/:version/SLA/:id/Filter/All', authorization({resource:"sla", action:"write"}), slaService.AddFilterAll);
server.get('/DVP/API/:version/SLA/:id/Filters/All', authorization({resource:"sla", action:"read"}), slaService.GetFiltersAll);
server.del('/DVP/API/:version/SLA/:id/Filter/All/:filterid', authorization({resource:"sla", action:"delete"}), slaService.RemoveFilterAll);
server.put('/DVP/API/:version/SLA/:id/Filter/Any', authorization({resource:"sla", action:"write"}), slaService.AddFilterAny);
server.get('/DVP/API/:version/SLA/:id/Filters/Any', authorization({resource:"sla", action:"read"}), slaService.GetFiltersAny);
server.del('/DVP/API/:version/SLA/:id/Filter/Any/:filterid', authorization({resource:"sla", action:"delete"}), slaService.RemoveFilterAny);


//////////////////////////////////////Trigger//////////////////////////////////////////////////////////////////////////////////////////////


server.post('/DVP/API/:version/Trigger', authorization({resource:"triggers", action:"write"}), triggrService.CreateTrigger);
server.get('/DVP/API/:version/Triggers', authorization({resource:"triggers", action:"read"}), triggrService.GetTriggers);
server.get('/DVP/API/:version/Trigger/:id', authorization({resource:"triggers", action:"read"}), triggrService.GetTrigger);
server.put('/DVP/API/:version/Trigger', authorization({resource:"triggers", action:"write"}), triggrService.UpdateTrigger);
server.del('/DVP/API/:version/Trigger/:id', authorization({resource:"triggers", action:"delete"}), triggrService.DeleteTrigger);
server.put('/DVP/API/:version/Trigger/:id/Filter/All', authorization({resource:"triggers", action:"write"}), triggrService.AddFilterAll);
server.get('/DVP/API/:version/Trigger/:id/Filters/All', authorization({resource:"triggers", action:"read"}), triggrService.GetFiltersAll);
server.del('/DVP/API/:version/Trigger/:id/Filter/All/:filterid', authorization({resource:"triggers", action:"delete"}), triggrService.RemoveFilterAll);
server.put('/DVP/API/:version/Trigger/:id/Filter/Any', authorization({resource:"triggers", action:"write"}), triggrService.AddFilterAny);
server.get('/DVP/API/:version/Trigger/:id/Filters/Any', authorization({resource:"triggers", action:"read"}), triggrService.GetFiltersAny);
server.del('/DVP/API/:version/Trigger/:id/Filter/Any/:filterid', authorization({resource:"triggers", action:"delete"}), triggrService.RemoveFilterAny);
server.put('/DVP/API/:version/Trigger/:id/Action', authorization({resource:"triggers", action:"write"}), triggrService.AddAction);
server.get('/DVP/API/:version/Trigger/:id/Actions', authorization({resource:"triggers", action:"read"}), triggrService.GetActions);
server.del('/DVP/API/:version/Trigger/:id/Action/:field', authorization({resource:"triggers", action:"delete"}), triggrService.RemoveAction);
server.put('/DVP/API/:version/Trigger/:id/Operation', authorization({resource:"triggers", action:"write"}), triggrService.AddOperations);
server.get('/DVP/API/:version/Trigger/:id/Operations', authorization({resource:"triggers", action:"read"}), triggrService.GetOperations);
server.del('/DVP/API/:version/Trigger/:id/Operation/:field', authorization({resource:"triggers", action:"delete"}), triggrService.RemoveOperations);



/////////////////////////////////////////////////////////////matrix///////////////////////////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////formMaster/////////////////////////////////////////////////////////////////////////////////
server.post('/DVP/API/:version/FormMaster', authorization({resource:"forms", action:"write"}), formMaster.CreateForm);
server.get('/DVP/API/:version/FormMasters', authorization({resource:"forms", action:"read"}), formMaster.GetForms);
server.get('/DVP/API/:version/FormMaster/:name', authorization({resource:"forms", action:"read"}), formMaster.GetForm);
server.del('/DVP/API/:version/FormMaster/:name', authorization({resource:"forms", action:"delete"}), formMaster.DeleteForm);
server.post('/DVP/API/:version/FormMaster/:name/field', authorization({resource:"forms", action:"write"}), formMaster.AddDynamicField);
server.del('/DVP/API/:version/FormMaster/:name/field/:field', authorization({resource:"forms", action:"delete"}), formMaster.RemoveDynamicField);
server.put('/DVP/API/:version/FormMaster/:name/field/:field', authorization({resource:"forms", action:"write"}), formMaster.UpdateDynamicField);


/////////////////////////////////////////////////////////////ardsService/////////////////////////////////////////////////////////////////////////////////
server.post('/DVP/API/:version/Ticket/ArdsCallback', authorization({resource:"ticket", action:"write"}), ardsService.ArdsCallback);




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
server.listen(port, function () {
    ardsService.RegisterWithArds(function(isSuccess){
        logger.info("DVP-LiteTicket.RegisterWithArds:: %t", isSuccess);
    });
    logger.info("DVP-LiteTicket.main Server %s listening at %s", server.name, server.url);
});



