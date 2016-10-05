/**
 * Created by Heshan.i on 7/20/2016.
 */
var User = require('dvp-mongomodels/model/User');
var UserGroup = require('dvp-mongomodels/model/UserGroup');
var validator = require('validator');
var config = require('config');
var restClientHandler = require('./RestClient.js');
var util = require('util');

function InitiateNotification(internalAccessToken, notificationData){
    var initUrl = util.format("http://%s/DVP/API/%s/NotificationService/Notification/initiate", config.Services.notificationServiceHost, config.Services.notificationServiceVersion);
    if (validator.isIP(config.Services.notificationServiceHost)) {
        initUrl = util.format("http://%s:%s/DVP/API/%s/NotificationService/Notification/initiate", config.Services.notificationServiceHost, config.Services.notificationServicePort, config.Services.notificationServiceVersion);
    }
    restClientHandler.DoPostNotification(internalAccessToken, initUrl, notificationData, function (err, res1, result) {
        if (err) {
            console.log(err);
        }
        else {
            console.log("Send InitiateNotification Success");
        }
    });
}

function BroadcastNotification(internalAccessToken, notificationData){
    var initUrl = util.format("http://%s/DVP/API/%s/NotificationService/Notification/Broadcast", config.Services.notificationServiceHost, config.Services.notificationServiceVersion);
    if (validator.isIP(config.Services.notificationServiceHost)) {
        initUrl = util.format("http://%s:%s/DVP/API/%s/NotificationService/Notification/Broadcast", config.Services.notificationServiceHost, config.Services.notificationServicePort, config.Services.notificationServiceVersion);
    }
    restClientHandler.DoPostNotification(internalAccessToken, initUrl, notificationData, function (err, res1, result) {
        if (err) {
            console.log(err);
        }
        else {
            console.log("Send BroadcastNotification Success");
        }
    });
}

function SendNotificationToAssignee(company, tenant, internalAccessToken, userId, message){
    User.findOne({_id: userId, company: company, tenant: tenant}, function (err, user) {
        if (err) {
            console.log("Get User Failed");
        } else {
            if(user) {
                var nData = {
                    From: "",
                    To: user.username,
                    Message: JSON.stringify(message),
                    Direction: "STATELESS",
                    CallbackURL: "",
                    Ref: ""
                };
                InitiateNotification(internalAccessToken, nData);
            }else{
                console.log("User Data empty");
            }
        }
    });

}

function SendNotificationToAssigneeGroup(company, tenant, internalAccessToken, groupId, message){
    UserGroup.findOne({_id: groupId, company: company, tenant: tenant}, function (err, userGroup) {
        if (err) {
            console.log("Get UserGroup Failed");
        } else {
            if(userGroup) {
                var nData = {
                    Message: JSON.stringify(message)
                };
                if(userGroup.users && userGroup.users.length >0) {
                    var count = 0;
                    var clientList = [];
                    for (var i = 0; i < userGroup.users.length; i++) {
                        var userId = userGroup.users[i];
                        User.findOne({_id: userId, company: company, tenant: tenant}, function (err, user) {
                            count++;
                            if (err) {
                                console.log("Get User Failed");
                            } else {
                                var client = {name: user.username};
                                clientList.push(client);
                            }

                            if(count === userGroup.users.length){
                                nData.Clients = clientList;
                                BroadcastNotification(internalAccessToken, nData);
                            }
                        });
                    }
                }
            }else{
                console.log("UserGroup Data empty");
            }
        }
    });

}

function SendNotificationToCollaborators(company, tenant, internalAccessToken, collaboratorList, message){
    var nData = {
        Message: JSON.stringify(message)
    };
    if(collaboratorList && collaboratorList.length > 0) {
        var count = 0;
        var clientList = [];
        for (var i = 0; i < collaboratorList.length; i++) {
            var userId = collaboratorList[i];
            User.findOne({_id: userId, company: company, tenant: tenant}, function (err, user) {
                count++;
                if (err) {
                    console.log("Get User Failed");
                } else {
                    if(user) {
                        clientList.push(user.username);
                    }
                }
                if(count === collaboratorList.length){
                    if(clientList.length > 0) {
                        nData.Clients = clientList;
                        BroadcastNotification(internalAccessToken, nData);
                    }
                }
            });
        }
    }
}


function SendNotification(ticket, field, value){
    try{
        var internalAccessToken = util.format("%d:%d", ticket.tenant, ticket.company);
        var messageObj = {TicketId: ticket.id, Data: value};
        switch (field){
            case "assignee":
                SendNotificationToAssignee(ticket.company, ticket.tenant, internalAccessToken, ticket.assignee, messageObj);
                 break;
            case "assignee_group":
                SendNotificationToAssigneeGroup(ticket.company, ticket.tenant, internalAccessToken, ticket.assignee_group, messageObj);
                break;
            case "collaborators":
                SendNotificationToCollaborators(ticket.company, ticket.tenant, internalAccessToken, ticket.collaborators, messageObj);
                break;
            default :
                break;
        }
    }catch(ex){
        console.log("Send Notification failed::", ex);
    }
}

module.exports.SendNotification = SendNotification;