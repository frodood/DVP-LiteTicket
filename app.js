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
var util = require('util');
var port = config.Host.port || 3000;
var host = config.Host.vdomain || 'localhost';


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




server.post('/DVP/API/:version/Ticket',authorization({resource:"ticket", action:"write"}), ticketService.CreateTicket);
server.get('/DVP/API/:version/Tickets', authorization({resource:"ticket", action:"read"}), ticketService.GetAllTickets);
server.get('/DVP/API/:version/Tickets/:status', authorization({resource:"ticket", action:"read"}), ticketService.GetAllTicketsWithStatus);
server.get('/DVP/API/:version/Ticket/:id', authorization({resource:"ticket", action:"read"}), ticketService.GetTicket);
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




server.post('/DVP/API/:version/TagCategory', authorization({resource:"tags", action:"write"}), tagService.CreateTagCategory);
server.get('/DVP/API/:version/TagCategorys', authorization({resource:"tags", action:"read"}), tagService.GetTagCategorys);
server.get('/DVP/API/:version/TagCategory/:id', authorization({resource:"tags", action:"read"}), tagService.GetTagCategory);
server.del('/DVP/API/:version/TagCategory/:id', authorization({resource:"tags", action:"read"}), tagService.DeleteTagCategory);
server.post('/DVP/API/:version/TagCategory/:id/Tag', authorization({resource:"tags", action:"read"}), tagService.AddTag);
server.post('/DVP/API/:version/TagCategory/:id/Tags', authorization({resource:"tags", action:"read"}), tagService.GetAllTagsInCategory);
server.del('/DVP/API/:version/TagCategory/:id/Tag/:tagid', authorization({resource:"tags", action:"delete"}), tagService.DeleteTag);



server.post('/DVP/API/:version/Ticket/:id/timer', authorization({resource:"timer", action:"write"}), timerService.CreateTimer);
server.get('/DVP/API/:version/Ticket/:id/times', authorization({resource:"ticket", action:"read"}), timerService.GetTimes);
server.put('/DVP/API/:version/Timer/:id', authorization({resource:"timer", action:"write"}), timerService.UpdateTimer);
server.put('/DVP/API/:version/Timer/:id/time', authorization({resource:"timer", action:"write"}), timerService.UpdateTimerTime);
server.put('/DVP/API/:version/Timer/:id/toggle', authorization({resource:"timer", action:"write"}), timerService.ToggelTimer);
server.get('/DVP/API/:version/MyTimer', authorization({resource:"timer", action:"write"}), timerService.GetMyTimeSheet);




server.listen(port, function () {

    logger.info("DVP-LiteTicket.main Server %s listening at %s", server.name, server.url);

});



