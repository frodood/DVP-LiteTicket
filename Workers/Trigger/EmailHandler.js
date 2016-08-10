/**
 * Created by Heshan.i on 8/8/2016.
 */

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
            sendObj.Parameters = {};
            var parameterCount = Object.keys(emailData.Parameters).length;
            for(var i = 0; i < parameterCount; i++){
                var paramKey = Object.keys(emailData.Parameters)[i];
                var valueAt = emailData.Parameters[paramKey];
                if(valueAt){
                    sendObj.Parameters[paramKey] = queryPattern.test(valueAt)? ReadDataFromTicket(ticket, valueAt) : valueAt;
                }
            }
            console.log("tetdgdb");
        }else{
            sendObj.template = "";
            sendObj.body = emailData.body;
            sendObj.Parameters.subject = emailData.Parameters.subject;
        }
        callback(true);
    }catch(ex){
        console.log("Generate Email Failed :: "+ ex);
        callback(false);
    }
}

module.exports.SendEmail = SendEmail;