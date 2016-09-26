var format = require('stringformat');
var config = require('config');
var q = require('q');
var amqp = require('amqp');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;

var queueHost = format('amqp://{0}:{1}@{2}:{3}', config.RabbitMQ.user, config.RabbitMQ.password, config.RabbitMQ.ip, config.RabbitMQ.port);
var queueConnection = amqp.createConnection({
    url: queueHost
});
queueConnection.on('ready', function () {

    logger.info("Coonection with the queue is OK");

});

module.exports.queueConnection = queueConnection;