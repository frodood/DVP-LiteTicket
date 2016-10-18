/**
 * Created by Heshan.i on 8/1/2016.
 */
var redis = require('redis');
var config = require('config');
var util = require('util');

client = redis.createClient(config.Redis.port, config.Redis.ip);
client.auth(config.Redis.password);

client.on("error", function (err) {
    console.log('error', 'Redis connection error :: %s', err);
});

client.on("connect", function (err) {
    client.select(config.Redis.redisDB, redis.print);
    console.log("Redis Connect Success");
});

var Publish = function(pattern, message, callback){
    try {
        client.publish(pattern, message, function (err, result) {
            if (err) {
                console.log(util.format('Redis Publish Error - pattern: %s :: Error: %s', pattern, err));
                callback(err, null);
            } else {
                console.log(util.format('Redis Publish - pattern: %s :: Reply: %s', pattern, result));
                callback(null, result);
            }
        });
    }catch(err){
        console.log("Redis Publish Err:: "+ err);
        callback(err, null);
    }
};


var SearchKeys = function (searchString, callback) {
    var result = [];
    try {
        client.keys(searchString, function (err, replies) {
            if (err) {
                callback(err, result);
            } else {
                console.log(replies.length + " replies:");
                if (replies.length > 0) {
                    client.mget(replies, function(err, result){
                        if(err){
                            callback(err, []);
                        }else{
                            callback(null, result);
                        }
                    });
                } else {
                    callback(null, result);
                }
            }
        });
    }catch(err) {
        console.log("Redis Publish Err:: " + err);
        callback(err, result);
    }
};


module.exports.Publish = Publish;
module.exports.SearchKeys = SearchKeys;