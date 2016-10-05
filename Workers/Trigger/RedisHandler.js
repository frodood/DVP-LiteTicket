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

module.exports.Publish = Publish;