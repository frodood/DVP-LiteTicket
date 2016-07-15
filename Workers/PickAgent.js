/**
 * Created by Heshan.i on 7/14/2016.
 */
var validator = require('validator');
var config = require('config');
var restClientHandler = require('./RestClient.js');

function RegisterWithArds(callback){
    try {
        var serverId = util.format("TICKET_%s", config.Host.port);
        var callbackUrl = util.format("http://%s/DVP/API/%s/Ticket/ArdsCallback", config.LBServer.ip, config.Host.version);
        var addReqServerUrl = util.format("http://%s/DVP/API/%s/ARDS/requestserver", config.Services.routingServiceHost, config.Services.routingServiceVersion);
        if (validator.isIP(config.LBServer.ip)) {
            callbackUrl = util.format("http://%s:%s/DVP/API/%s/Ticket/ArdsCallback", config.LBServer.ip, config.LBServer.port, config.Host.version);
        }
        if (validator.isIP(config.Services.routingServiceHost)) {
            addReqServerUrl = util.format("http://%s:%s/DVP/API/%s/ARDS/requestserver", config.Services.routingServiceHost, config.Services.routingServicePort, config.Services.routingServiceVersion);
        }
        var reqData = {
            ServerType: "TICKETSERVER",
            RequestType: "TICKET",
            CallbackUrl: callbackUrl,
            CallbackOption: "POST",
            QueuePositionCallbackUrl: "",
            ReceiveQueuePosition: false,
            ServerID: serverId
        };

        restClientHandler.DoPost("", addReqServerUrl, reqData, function (err, res1, result) {
            if (err) {
                console.log(err);
                callback(false);
            }
            else {
                console.log("Add Request Server Success");
                callback(true);
            }
        });
    }catch(ex){
        callback(false);
    }
}

function AddRequest(tenant, company, sessionId, attributeId, priority, otherInfo){
    var serverId = util.format("TICKET_%s", config.Host.port);
    var internalAccessToken = util.format("%d:%d", tenant, company);
    var ardsRequest = {
        ServerType:"TICKETSERVER",
        RequestType:"TICKET",
        SessionId:sessionId,
        Attributes:[attributeId],
        RequestServerId:serverId,
        Priority:priority,
        ResourceCount:1,
        OtherInfo:otherInfo
    };

    var addReqUrl = util.format("http://%s/DVP/API/%s/ARDS/request", config.Services.routingServiceHost, config.Services.routingServiceVersion);
    if (validator.isIP(config.Services.routingServiceHost)) {
        addReqUrl = util.format("http://%s:%s/DVP/API/%s/ARDS/request", config.Services.routingServiceHost, config.Services.routingServicePort, config.Services.routingServiceVersion);
    }
    restClientHandler.DoPost(internalAccessToken, addReqUrl, ardsRequest, function (err, res1, result) {
        if (err) {
            console.log(err);
            callback(false);
        }
        else {
            console.log("Add Request Success");
            callback(true);
        }
    });
}

function ArdsCallback(req, res){
    var ardsResponse = req.body;

}

module.exports.RegisterWithArds = RegisterWithArds;
module.exports.AddRequest = AddRequest;
module.exports.ArdsCallback = ArdsCallback;