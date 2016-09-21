/**
 * Created by Heshan.i on 8/8/2016.
 */
var format = require('stringformat');
var config = require('config');
var q = require('q');
var amqp = require('amqp');

var queueHost = format('amqp://{0}:{1}@{2}:{3}', config.RabbitMQ.user, config.RabbitMQ.password, config.RabbitMQ.ip, config.RabbitMQ.port);
var queueConnection = amqp.createConnection({
    url: queueHost
});
queueConnection.on('ready', function () {

    logger.info("Coonection with the queue is OK");

});

function ReadDataFromTicket(ticket, pattern){
    var queryPath = pattern.slice(2, -1);
    var spQuery = queryPath.split(".");
    if(spQuery && spQuery.length > 1){
        var readValue = ticket;
        for(var i = 1; i < spQuery.length; i++){
            if(readValue || i === 1){
                readValue = readValue[spQuery[i]];
            }else{
                readValue = "";
                break;
            }
        }
        return readValue;
    }else{
        readValue = "";
        return readValue;
    }
}

function SendEmail(ticket, template, emailData, callback){
    try{
        var queryRegex = "\\${ticket([.]([A-Z]*[a-z]*)*)*}";
        var queryPattern = new RegExp(queryRegex);
        var sendObj = {
            "company": ticket.company,
            "tenant": ticket.tenant
        };

        sendObj.from =  queryPattern.test(emailData.from)? ReadDataFromTicket(ticket, emailData.from) : emailData.from;
        sendObj.to =  queryPattern.test(emailData.to)? ReadDataFromTicket(ticket, emailData.to) : emailData.to;
        if(template){
            sendObj.template = template;
            sendObj.body = "";
            sendObj.subject = queryPattern.test(emailData.subject)? ReadDataFromTicket(ticket, emailData.subject) : emailData.subject;
            sendObj.Parameters = {};
            if(emailData.Parameters) {
                var parameterCount = Object.keys(emailData.Parameters).length;
                for (var i = 0; i < parameterCount; i++) {
                    var paramKey = Object.keys(emailData.Parameters)[i];
                    var valueAt = emailData.Parameters[paramKey];
                    if (valueAt) {
                        sendObj.Parameters[paramKey] = queryPattern.test(valueAt) ? ReadDataFromTicket(ticket, valueAt) : valueAt;
                    }
                }
            }
            console.log("tetdgdb");
        }else{
            sendObj.template = "";
            sendObj.body = emailData.body;
            sendObj.subject = emailData.subject;
        }
        //CommonHandler.RbmqPublish("EMAILOUT", JSON.stringify(sendObj));
        try {
            queueConnection.publish("EMAILOUT", sendObj, {
                contentType: 'application/json'
            });
        }catch(exp){

            console.log(exp);
        }
        callback(true);
    }catch(ex){
        console.log("Generate Email Failed :: "+ ex);
        callback(false);
    }
}

module.exports.SendEmail = SendEmail;