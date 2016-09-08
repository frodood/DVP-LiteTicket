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
var ticketViewService = require('./Services/TicketViewService');
var formMaster = require('./Services/FormService');
var util = require('util');
var port = config.Host.port || 3000;
var host = config.Host.vdomain || 'localhost';
var ardsService =  require('./Workers/Trigger/PickAgent.js');
var scheduleWorker = require('./Workers/SLA/SLAWorker.js');


var server = restify.createServer({
    name: "DVP Lite Ticket Service"
});

server.pre(restify.pre.userAgentConnection());
server.use(restify.bodyParser({ mapParams: false }));

restify.CORS.ALLOW_HEADERS.push('authorization');
server.use(restify.CORS());
server.use(restify.fullResponse());
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());

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
server.post('/DVP/API/:version/Ticket/Comments',authorization({resource:"ticket", action:"write"}), ticketService.CreateTicketWithComment);
server.put('/DVP/API/:version/Ticket/Comment/:id',authorization({resource:"ticket", action:"write"}), ticketService.UpdateComment);
server.get('/DVP/API/:version/Tickets/:Size/:Page', authorization({resource:"ticket", action:"read"}), ticketService.GetAllTickets);
server.get('/DVP/API/:version/Tickets/TimeRange/:fromDate/:toDate', authorization({resource:"ticket", action:"read"}), ticketService.GetTicketsByTimeRange);
server.get('/DVP/API/:version/Tickets/:status/:Size/:Page', authorization({resource:"ticket", action:"read"}), ticketService.GetAllTicketsWithStatus);
server.get('/DVP/API/:version/Tickets/:status/TimeRange/:fromDate/:toDate', authorization({resource:"ticket", action:"read"}), ticketService.GetAllTicketsWithStatusTimeRange);
server.get('/DVP/API/:version/TicketsWithMatrix/:Size/:Page', authorization({resource:"ticket", action:"read"}), ticketService.GetAllTicketsWithMatrix);
server.get('/DVP/API/:version/TicketsWithMatrix/:status', authorization({resource:"ticket", action:"read"}), ticketService.GetAllTicketsInStatusWithMatrix);
server.get('/DVP/API/:version/Tickets/Channel/:Channel/:Size/:Page', authorization({resource:"ticket", action:"read"}), ticketService.GetAllTicketsByChannel);
server.get('/DVP/API/:version/Tickets/Channel/:Channel/TimeRange/:fromDate/:toDate', authorization({resource:"ticket", action:"read"}), ticketService.GetAllTicketsByChannelTimeRange);
server.get('/DVP/API/:version/Tickets/Requester/:Requester/:Size/:Page', authorization({resource:"ticket", action:"read"}), ticketService.GetAllTicketsByRequester);
server.get('/DVP/API/:version/Tickets/Requester/:Requester/TimeRange/:fromDate/:toDate', authorization({resource:"ticket", action:"read"}), ticketService.GetAllTicketsByRequesterTimeRange);
server.get('/DVP/API/:version/Tickets/Priority/:Priority/:Size/:Page', authorization({resource:"ticket", action:"read"}), ticketService.GetAllTicketsByPriority);
server.get('/DVP/API/:version/Tickets/Priority/:Priority/TimeRange/:fromDate/:toDate', authorization({resource:"ticket", action:"read"}), ticketService.GetAllTicketsByPriorityTimeRange);
server.get('/DVP/API/:version/Tickets/Group/:GroupId/:Size/:Page', authorization({resource:"ticket", action:"read"}), ticketService.GetAllGroupTickets);
server.get('/DVP/API/:version/MyTickets/:Size/:Page', authorization({resource:"ticket", action:"read"}), ticketService.GetAllMyTickets);
server.get('/DVP/API/:version/MyGroupTickets/:Size/:Page', authorization({resource:"ticket", action:"read"}), ticketService.GetAllMyGroupTickets);
server.get('/DVP/API/:version/MyTickets/:status/:Size/:Page', authorization({resource:"ticket", action:"read"}), ticketService.GetAllMyTicketsWithStatus);
server.get('/DVP/API/:version/Ticket/:id', authorization({resource:"ticket", action:"read"}), ticketService.GetTicket);
server.put('/DVP/API/:version/Ticket/:id/MapToProfile/:Requester', authorization({resource:"ticket", action:"write"}), ticketService.MapTicketToProfile);
server.get('/DVP/API/:version/Ticket/:id/Details', authorization({resource:"ticket", action:"read"}), ticketService.GetTicketWithDetails);
server.del('/DVP/API/:version/Ticket/:id', authorization({resource:"ticket", action:"delete"}), ticketService.DeActivateTicket);
server.put('/DVP/API/:version/Ticket/:id/pick', authorization({resource:"ticket", action:"write"}), ticketService.PickTicket);
server.get('/DVP/API/:version/Ticket/:id/Audit', authorization({resource:"ticket", action:"read"}), ticketService.GetTicketAudit);
server.put('/DVP/API/:version/Ticket/:id', authorization({resource:"ticket", action:"write"}), ticketService.UpdateTicket);
server.put('/DVP/API/:version/Ticket/:id/Comment', authorization({resource:"ticket", action:"write"}), ticketService.AddComment);
server.put('/DVP/API/:version/Ticket/:id/Attachment', authorization({resource:"ticket", action:"write"}), ticketService.AddAttachment);
server.put('/DVP/API/:version/Ticket/:id/Comment/:commentid/Comment', authorization({resource:"ticket", action:"write"}), ticketService.AddCommentToComment);
server.put('/DVP/API/:version/TicketByEngagement/:engagementid/Comment',authorization({resource:"ticket", action:"write"}), ticketService.AddCommentByEngagement);
server.put('/DVP/API/:version/Ticket/:id/Status', authorization({resource:"ticket", action:"write"}), ticketService.ChangeStatus);
server.put('/DVP/API/:version/Ticket/Status/Bulk', authorization({resource:"ticket", action:"write"}), ticketService.BulkStatusUpdate);
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
server.post('/DVP/API/:version/Ticket/:id/RelatedTicket/:ticketid',authorization({resource:"ticket", action:"write"}), ticketService.AttachTicket);
server.del('/DVP/API/:version/Ticket/:id/RelatedTicket/:ticketid',authorization({resource:"ticket", action:"delete"}), ticketService.DeAttachTicket);

server.put('/DVP/API/:version/Ticket/:id/Engagement/:EngagementId',authorization({resource:"ticket", action:"write"}), ticketService.AppendEngagement);
server.get('/DVP/API/:version/Ticket/Engagement/:EngagementId',authorization({resource:"ticket", action:"write"}), ticketService.GetTicketsByEngagementId);

///////////////////////////////Case////////////////////////////////////////////////////////////////////////////////////////////
server.post('/DVP/API/:version/CaseConfiguration',authorization({resource:"ticket", action:"write"}), ticketService.AddCaseConfiguration);
server.del('/DVP/API/:version/CaseConfiguration/:id',authorization({resource:"ticket", action:"write"}), ticketService.AddCaseConfiguration);

server.post('/DVP/API/:version/Case',authorization({resource:"ticket", action:"write"}), ticketService.CreateCase);
server.del('/DVP/API/:version/Case/:id',authorization({resource:"ticket", action:"write"}), ticketService.DeleteCase);
server.put('/DVP/API/:version/Case/:id/RelatedTicket/:ticketid',authorization({resource:"ticket", action:"write"}), ticketService.AddTicketToCase);



/////////////////////////////////////////////Tags///////////////////////////////////////////////////////////////////////////////////////////////


server.post('/DVP/API/:version/TagCategory', authorization({resource:"tag", action:"write"}), tagService.CreateTagCategory);
server.get('/DVP/API/:version/TagCategory/:id', authorization({resource:"tag", action:"read"}), tagService.GetTagCategory);
server.get('/DVP/API/:version/TagCategories', authorization({resource:"tag", action:"read"}), tagService.GetTagCategories);
server.del('/DVP/API/:version/TagCategory/:id', authorization({resource:"tag", action:"write"}), tagService.RemoveTagCategory);
server.put('/DVP/API/:version/TagCategory/:id/Tag', authorization({resource:"tag", action:"write"}), tagService.CreateTagsToTagCategory);


server.post('/DVP/API/:version/Tag', authorization({resource:"tag", action:"write"}), tagService.CreateTag);
server.get('/DVP/API/:version/Tags', authorization({resource:"tag", action:"read"}), tagService.GetTags);
server.get('/DVP/API/:version/Tag/:id', authorization({resource:"tag", action:"read"}), tagService.GetTag);
server.del('/DVP/API/:version/Tag/:id', authorization({resource:"tag", action:"write"}), tagService.DeleteTag);
server.post('/DVP/API/:version/Tag/:id', authorization({resource:"tag", action:"write"}), tagService.CreateTagsToTag);
server.put('/DVP/API/:version/Tag/:id/AttachToTag/:tagid', authorization({resource:"tag", action:"write"}), tagService.AttachTagsToTag);
server.del('/DVP/API/:version/Tag/:id/DetachFrom/:tagid', authorization({resource:"tag", action:"write"}), tagService.DetachTagsFromTag);

/////////////////////////////////////////////Tag Category///////////////////////////////////////////////////////////////////////////////////////////////
server.put('/DVP/API/:version/Tag/:id/AttachToCategory/:cid', authorization({resource:"tag", action:"write"}), tagService.AttachTagsToCategory);
server.del('/DVP/API/:version/Tag/:id/DetachFromCategory/:cid', authorization({resource:"tag", action:"write"}), tagService.DetachTagsFromCategory);



///////////////////////////////////////////Timer///////////////////////////////////////////////////////////////////////////////////////////////////

server.post('/DVP/API/:version/Timer', authorization({resource:"timer", action:"write"}), timerService.CreateTimer);
server.get('/DVP/API/:version/Timers', authorization({resource:"timer", action:"read"}), timerService.GetTimes);
server.get('/DVP/API/:version/MyTimer', authorization({resource:"timer", action:"read"}), timerService.GetMyTimer);
server.del('/DVP/API/:version/MyTimer', authorization({resource:"timer", action:"delete"}), timerService.DeleteMyTimer);
server.get('/DVP/API/:version/MyTimers', authorization({resource:"timer", action:"read"}), timerService.GetMyTimes);
server.get('/DVP/API/:version/Timers/User/:uid', authorization({resource:"timer", action:"read"}), timerService.GetTimesForUser);
server.get('/DVP/API/:version/Timers/Ticket/:tid', authorization({resource:"timer", action:"read"}), timerService.GetTimesForTicket);
server.get('/DVP/API/:version/Timer/:id', authorization({resource:"timer", action:"read"}), timerService.GetTime);
server.put('/DVP/API/:version/Timer/:id/Ticket/:tid', authorization({resource:"timer", action:"write"}), timerService.UpdateMyTimerTicket);
server.put('/DVP/API/:version/Timer/:id/Time/:time', authorization({resource:"timer", action:"write"}), timerService.UpdateMyTimerTime);
server.put('/DVP/API/:version/MyTimer/pause', authorization({resource:"timer", action:"write"}), timerService.PauseTimer);
server.put('/DVP/API/:version/MyTimer/start', authorization({resource:"timer", action:"write"}), timerService.StartTimer);
server.put('/DVP/API/:version/MyTimer/stop', authorization({resource:"timer", action:"write"}), timerService.StopTimer);



///////////////////////////////////////////SLA/////////////////////////////////////////////////////////////////////////////////////////////////


server.post('/DVP/API/:version/SLA', authorization({resource:"sla", action:"write"}), slaService.CreateSLA);
server.get('/DVP/API/:version/SLAs', authorization({resource:"sla", action:"read"}), slaService.GetSLAs);
server.get('/DVP/API/:version/SLA/:id', authorization({resource:"sla", action:"read"}), slaService.GetSLA);
server.put('/DVP/API/:version/SLA', authorization({resource:"sla", action:"write"}), slaService.UpdateSLA);
server.del('/DVP/API/:version/SLA/:id', authorization({resource:"sla", action:"delete"}), slaService.DeleteSLA);
server.put('/DVP/API/:version/SLA/:id/Matrix', authorization({resource:"sla", action:"write"}), slaService.AddMatrix);
server.get('/DVP/API/:version/SLA/:id/Matrixs', authorization({resource:"sla", action:"read"}), slaService.GetMatrices);
server.del('/DVP/API/:version/SLA/:id/Matrix/matrixid', authorization({resource:"sla", action:"delete"}), slaService.DeleteMatrix);
server.put('/DVP/API/:version/SLA/:id/Filter/All', authorization({resource:"sla", action:"write"}), slaService.AddFilterAll);
server.get('/DVP/API/:version/SLA/:id/Filters/All', authorization({resource:"sla", action:"read"}), slaService.GetFiltersAll);
server.del('/DVP/API/:version/SLA/:id/Filter/All/:filterid', authorization({resource:"sla", action:"delete"}), slaService.RemoveFilterAll);
server.put('/DVP/API/:version/SLA/:id/Filter/Any', authorization({resource:"sla", action:"write"}), slaService.AddFilterAny);
server.get('/DVP/API/:version/SLA/:id/Filters/Any', authorization({resource:"sla", action:"read"}), slaService.GetFiltersAny);
server.del('/DVP/API/:version/SLA/:id/Filter/Any/:filterid', authorization({resource:"sla", action:"delete"}), slaService.RemoveFilterAny);


//////////////////////////////////////Ticket View///////////////////////////////////////////////////////////////////////////////////



server.post('/DVP/API/:version/TicketView', authorization({resource:"ticketview", action:"write"}), ticketViewService.CreateTicketView);
server.get('/DVP/API/:version/TicketViews', authorization({resource:"ticketview", action:"read"}), ticketViewService.GetMyTicketViews);
server.get('/DVP/API/:version/TicketView/:id', authorization({resource:"ticketview", action:"read"}), ticketViewService.GetTicketView);
server.put('/DVP/API/:version/TicketView/:id', authorization({resource:"ticketview", action:"write"}), ticketViewService.UpdateTicketView);
server.del('/DVP/API/:version/TicketView/:id', authorization({resource:"ticketview", action:"delete"}), ticketViewService.DeleteTicketView);
server.put('/DVP/API/:version/TicketView/:id/Filter/All', authorization({resource:"ticketview", action:"write"}), ticketViewService.AddFilterAll);
server.get('/DVP/API/:version/TicketView/:id/Filters/All', authorization({resource:"ticketview", action:"read"}), ticketViewService.GetFiltersAll);
server.del('/DVP/API/:version/TicketView/:id/Filter/All/:fid', authorization({resource:"ticketview", action:"delete"}), triggrService.RemoveFilterAll);
server.put('/DVP/API/:version/TicketView/:id/Filter/Any', authorization({resource:"ticketview", action:"write"}), ticketViewService.AddFilterAny);
server.get('/DVP/API/:version/TicketView/:id/Filters/Any', authorization({resource:"ticketview", action:"read"}), ticketViewService.GetFiltersAny);
server.del('/DVP/API/:version/TicketView/:id/Filter/Any/:fid', authorization({resource:"ticketview", action:"delete"}), triggrService.RemoveFilterAny);
server.get('/DVP/API/:version/TicketView/:id/Tickets', authorization({resource:"ticketview", action:"read"}), ticketViewService.GetTicketsByView);





//////////////////////////////////////Trigger//////////////////////////////////////////////////////////////////////////////////////////////


server.post('/DVP/API/:version/Trigger', authorization({resource:"triggers", action:"write"}), triggrService.CreateTrigger);
server.get('/DVP/API/:version/Triggers', authorization({resource:"triggers", action:"read"}), triggrService.GetTriggers);
server.get('/DVP/API/:version/Trigger/:id', authorization({resource:"triggers", action:"read"}), triggrService.GetTrigger);
server.put('/DVP/API/:version/Trigger/:id', authorization({resource:"triggers", action:"write"}), triggrService.UpdateTrigger);
server.del('/DVP/API/:version/Trigger/:id', authorization({resource:"triggers", action:"delete"}), triggrService.DeleteTrigger);
server.put('/DVP/API/:version/Trigger/:id/Filter/All', authorization({resource:"triggers", action:"write"}), triggrService.AddFilterAll);
server.get('/DVP/API/:version/Trigger/:id/Filters/All', authorization({resource:"triggers", action:"read"}), triggrService.GetFiltersAll);
server.del('/DVP/API/:version/Trigger/:id/Filter/All/:filterid', authorization({resource:"triggers", action:"delete"}), triggrService.RemoveFilterAll);
server.put('/DVP/API/:version/Trigger/:id/Filter/Any', authorization({resource:"triggers", action:"write"}), triggrService.AddFilterAny);
server.get('/DVP/API/:version/Trigger/:id/Filters/Any', authorization({resource:"triggers", action:"read"}), triggrService.GetFiltersAny);
server.del('/DVP/API/:version/Trigger/:id/Filter/Any/:filterid', authorization({resource:"triggers", action:"delete"}), triggrService.RemoveFilterAny);
server.put('/DVP/API/:version/Trigger/:id/Action', authorization({resource:"triggers", action:"write"}), triggrService.AddAction);
server.get('/DVP/API/:version/Trigger/:id/Actions', authorization({resource:"triggers", action:"read"}), triggrService.GetActions);
server.del('/DVP/API/:version/Trigger/:id/Action/:actionid', authorization({resource:"triggers", action:"delete"}), triggrService.RemoveAction);
server.put('/DVP/API/:version/Trigger/:id/Operation', authorization({resource:"triggers", action:"write"}), triggrService.AddOperations);
server.get('/DVP/API/:version/Trigger/:id/Operations', authorization({resource:"triggers", action:"read"}), triggrService.GetOperations);
server.del('/DVP/API/:version/Trigger/:id/Operation/:operationid', authorization({resource:"triggers", action:"delete"}), triggrService.RemoveOperations);



/////////////////////////////////////////////////////////////matrix///////////////////////////////////////////////////////////////////////////////////


/////////////////////////////////////////////////////////////formMaster/////////////////////////////////////////////////////////////////////////////////
server.post('/DVP/API/:version/FormMaster', authorization({resource:"forms", action:"write"}), formMaster.CreateForm);
server.get('/DVP/API/:version/FormMasters', authorization({resource:"forms", action:"read"}), formMaster.GetForms);
server.get('/DVP/API/:version/FormMaster/:name', authorization({resource:"forms", action:"read"}), formMaster.GetForm);
server.del('/DVP/API/:version/FormMaster/:name', authorization({resource:"forms", action:"delete"}), formMaster.DeleteForm);
server.post('/DVP/API/:version/FormMaster/:name/field', authorization({resource:"forms", action:"write"}), formMaster.AddDynamicField);
server.del('/DVP/API/:version/FormMaster/:name/field/:field', authorization({resource:"forms", action:"delete"}), formMaster.RemoveDynamicField);
server.put('/DVP/API/:version/FormMaster/:name/field/:field', authorization({resource:"forms", action:"write"}), formMaster.UpdateDynamicField);




///////////////////////////////////////////////////////////////form submission////////////////////////////////////////////////////////

server.post('/DVP/API/:version/FormSubmission', authorization({resource:"forms", action:"write"}), formMaster.CreateFormSubmission);
server.get('/DVP/API/:version/FormSubmissions', authorization({resource:"forms", action:"read"}), formMaster.GetFormSubmissions);
server.get('/DVP/API/:version/FormSubmission/:reference', authorization({resource:"forms", action:"read"}), formMaster.GetFormSubmission);
server.del('/DVP/API/:version/FormSubmission/:reference', authorization({resource:"forms", action:"delete"}), formMaster.DeleteFormSubmission);
server.post('/DVP/API/:version/FormSubmission/:reference/field', authorization({resource:"forms", action:"write"}), formMaster.AddDynamicFieldSubmission);
server.del('/DVP/API/:version/FormSubmission/:reference/field/:field', authorization({resource:"forms", action:"delete"}), formMaster.RemoveDynamicFieldSubmission);
server.put('/DVP/API/:version/FormSubmission/:reference/field/:field', authorization({resource:"forms", action:"write"}), formMaster.UpdateDynamicFieldSubmission);



///////////////////////////////////////////////////////////////ticket status flow////////////////////////////////////////////////////////

server.post('/DVP/API/:version/TicketStatusNode',authorization({resource:"ticket", action:"write"}), ticketService.CreateStatusNode);
server.get('/DVP/API/:version/TicketStatusNodes',authorization({resource:"ticket", action:"read"}), ticketService.GetStatusNodes);


server.post('/DVP/API/:version/TicketStatusFlow',authorization({resource:"ticket", action:"read"}), ticketService.CreateStatusFlow);
server.put('/DVP/API/:version/TicketStatusFlow/:id/FlowNode',authorization({resource:"ticket", action:"read"}), ticketService.AddNodeToStatusFlow);
server.get('/DVP/API/:version/TicketStatusFlow',authorization({resource:"ticket", action:"read"}), ticketService.GetStatusFlow);
server.del('/DVP/API/:version/TicketStatusFlow/:id/FlowNode/:flownodeid',authorization({resource:"ticket", action:"read"}), ticketService.RemoveNodeFromStatusFlow);

server.get('/DVP/API/:version/TicketStatusFlow/NextAvailableStatus/:ticketType/:currentStatus',authorization({resource:"ticket", action:"read"}), ticketService.GetNextAvailableStatus);
server.get('/DVP/API/:version/TicketStatusFlow/ValidateStatus/:ticketType/:currentStatus/:newStatus',authorization({resource:"ticket", action:"read"}), ticketService.ValidateStatusChange);

/////////////////////////////////////////////////////////////ardsService/////////////////////////////////////////////////////////////////////////////////
server.post('/DVP/API/:version/Ticket/ArdsCallback', authorization({resource:"ticket", action:"write"}), ardsService.ArdsCallback);


/////////////////////////////////////////////////////////////scheduleWorkerService/////////////////////////////////////////////////////////////////////////////////
server.post('/DVP/API/:version/SLA/ScheduleCallback', authorization({resource:"sla", action:"write"}), scheduleWorker.ScheduleCallback);




/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
server.listen(port, function () {
    ardsService.RegisterWithArds(function(isSuccess){
        logger.info("DVP-LiteTicket.RegisterWithArds:: %t", isSuccess);
    });
    logger.info("DVP-LiteTicket.main Server %s listening at %s", server.name, server.url);
});



