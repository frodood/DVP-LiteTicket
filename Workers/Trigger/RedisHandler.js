/**
 * Created by Heshan.i on 8/1/2016.
 */
var redis = require('redis');
var config = require('config');

client = redis.createClient(config.Redis.port, config.Redis.ip);
client.auth(config.Redis.password);

client.on("error", function (err) {
    console.log('error', 'Redis connection error :: %s', err);
});

client.on("connect", function (err) {
    console.log("Redis Connect Success");
});

var Publish = function(pattern, message, callback){
    client.publish(pattern, message, function (err, result) {
        if (err) {
            console.log('error', 'Redis Publish Error - pattern: %s :: Error: %s', pattern, err);
            callback(err, null);
        } else {
            console.log('info', 'Redis Publish - pattern: %s :: Reply: %s', pattern, result);
            callback(null, result);
        }
    });
};

module.exports.Publish = Publish;