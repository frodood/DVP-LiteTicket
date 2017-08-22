/**
 * Created by Heshan.i on 7/15/2016.
 */

var request = require('request');
var util = require('util');
var config = require('config');
var DoPost = function (companyInfo, serviceurl, postData, callback) {
    var jsonStr = JSON.stringify(postData);
    var accessToken = util.format("bearer %s", config.Services.accessToken);
    var options = {
        url: serviceurl,
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'authorization': accessToken,
            'companyinfo': companyInfo
        },
        body: jsonStr
    };
    try {
        request.post(options, function optionalCallback(err, httpResponse, body) {
            if (err) {
                console.log('upload failed:', err);
            }
            console.log('Server returned: %j', body);
            callback(err, httpResponse, body);
        });
    }catch(ex){
        callback(ex, undefined, undefined);
    }
};

var DoPut = function (companyInfo, serviceurl, postData, callback) {
    var jsonStr = JSON.stringify(postData);
    var accessToken = util.format("bearer %s", config.Services.accessToken);
    var options = {
        url: serviceurl,
        method: 'PUT',
        headers: {
            'content-type': 'application/json',
            'authorization': accessToken,
            'companyinfo': companyInfo
        },
        body: jsonStr
    };
    try {
        request.put(options, function optionalCallback(err, httpResponse, body) {
            if (err) {
                console.log('upload failed:', err);
            }
            console.log('Server returned: %j', body);
            callback(err, httpResponse, body);
        });
    }catch(ex){
        callback(ex, undefined, undefined);
    }
};

var DoGet = function (companyInfo, serviceurl, callback) {
    var accessToken = util.format("bearer %s", config.Services.accessToken);
    console.log('RouteRequest:: %s', serviceurl);
    var options = {
        url: serviceurl,
        method: 'GET',
        headers: {
            'content-type': 'application/json',
            'authorization': accessToken,
            'companyinfo': companyInfo
        }
    };
    try {
        request(options, function optionalCallback(err, httpResponse, body) {
            if (err) {
                console.log('upload failed:', err);
            }
            console.log('Server returned: %j', body);
            callback(err, httpResponse, body);
        });
    }catch(ex){
        callback(ex, undefined, undefined);
    }
};

var DoDelete = function (companyInfo, serviceurl, callback) {
    var accessToken = util.format("bearer %s", config.Services.accessToken);
    console.log('DeleteRequest:: %s', serviceurl);
    var options = {
        url: serviceurl,
        method: 'DELETE',
        headers: {
            'content-type': 'application/json',
            'authorization': accessToken,
            'companyinfo': companyInfo
        }
    };
    try {
        request.delete(options, function optionalCallback(err, httpResponse, body) {
            if (err) {
                console.log('upload failed:', err);
            }
            console.log('Server returned: %j', body);
            callback(err, httpResponse, body);
        });
    }catch(ex){
        callback(ex, undefined, undefined);
    }
};

var DoPostNotification = function (companyInfo, serviceurl, postData, callback) {
    //var jsonStr = JSON.stringify(postData);
    var accessToken = util.format("bearer %s", config.Services.accessToken);
    var options = {
        url: serviceurl,
        method: 'POST',
        headers: {

            'authorization': accessToken,
            'companyinfo': companyInfo,
            'eventname': 'message'
        },
        json: postData
    };
    try {
        request.post(options, function optionalCallback(err, httpResponse, body) {
            if (err) {
                console.log('upload failed:', err);
            }
            console.log('Server returned: %j', body);
            callback(err, httpResponse, body);
        });
    }catch(ex){
        callback(ex, undefined, undefined);
    }
};


var DoPostTicketNotification = function (companyInfo, serviceurl, postData, callback) {
    //var jsonStr = JSON.stringify(postData);
    var accessToken = util.format("bearer %s", config.Services.accessToken);
    var options = {
        url: serviceurl,
        method: 'POST',
        headers: {

            'authorization': accessToken,
            'companyinfo': companyInfo,
            'eventname': 'ticket_event'
        },
        json: postData
    };
    try {
        request.post(options, function optionalCallback(err, httpResponse, body) {
            if (err) {
                console.log('upload failed:', err);
            }
            console.log('Server returned: %j', body);
            callback(err, httpResponse, body);
        });
    }catch(ex){
        callback(ex, undefined, undefined);
    }
};

module.exports.DoPost = DoPost;
module.exports.DoPut = DoPut;
module.exports.DoGet = DoGet;
module.exports.DoDelete = DoDelete;
module.exports.DoPostNotification = DoPostNotification;
module.exports.DoPostTicketNotification = DoPostTicketNotification;