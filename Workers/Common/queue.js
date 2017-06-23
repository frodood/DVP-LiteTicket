var format = require('stringformat');
var config = require('config');
var q = require('q');
var amqp = require('amqp');
var logger = require('dvp-common/LogHandler/CommonLogHandler.js').logger;

var queueHost = format('amqp://{0}:{1}@{2}:{3}', config.RabbitMQ.user, config.RabbitMQ.password, config.RabbitMQ.ip, config.RabbitMQ.port);
var queueConnection = amqp.createConnection({
    url: queueHost,
    heartbeat:10
}, {
    reconnect: true,
    reconnectBackoffStrategy: 'linear',
    reconnectExponentialLimit: 120000,
    reconnectBackoffTime: 1000
});
queueConnection.on('ready', function () {

    logger.info("Conection with the queue is OK");

});

queueConnection.on('error', function (error) {

    logger.error("Issue in amqp ", error);

});

module.exports.queueConnection = queueConnection;
