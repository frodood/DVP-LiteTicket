module.exports = {
  "DB": {
    "Type":"postgres",
    "User":"duo",
    "Password":"DuoS123",
    "Port":5432,
    "Host":"localhost",
    "Database":"dvpdb"
  },


  "Redis":
  {
    "ip": "45.55.142.207",
    "port": 6389,
    "user": "duo",
    "password": "DuoS123",
    "redisDB":8
  },


  "Security":
  {
    "ip" : "45.55.142.207",
    "port": 6389,
    "user": "duo",
    "password": "DuoS123"
  },


  "Host":
  {
    "resource": "cluster",
    "vdomain": "127.0.0.1",
    "domain": "127.0.0.1",
    "port": "3636",
    "version": "1.0.0.0"
  },

  "LBServer" : {

    "ip": "192.168.0.101",
    "port": "3636"

  },


  "Mongo":
  {
    "ip":"45.55.142.207",
    "port":"27017",
    "dbname":"dvpdb",
    "password":"DuoS123",
    "user":"duo"
  },


  "RabbitMQ":
  {
    "ip": "45.55.142.207",
    "port": 5672,
    "user": "admin",
    "password": "admin"
  },

    "Services" : {
      "accessToken":"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdWtpdGhhIiwianRpIjoiMTdmZTE4M2QtM2QyNC00NjQwLTg1NTgtNWFkNGQ5YzVlMzE1Iiwic3ViIjoiNTZhOWU3NTlmYjA3MTkwN2EwMDAwMDAxMjVkOWU4MGI1YzdjNGY5ODQ2NmY5MjExNzk2ZWJmNDMiLCJleHAiOjE4OTMzMDI3NTMsInRlbmFudCI6LTEsImNvbXBhbnkiOi0xLCJzY29wZSI6W3sicmVzb3VyY2UiOiJhbGwiLCJhY3Rpb25zIjoiYWxsIn1dLCJpYXQiOjE0NjEyOTkxNTN9.YiocvxO_cVDzH5r67-ulcDdBkjjJJDir2AeSe3jGYeA",
      "resourceServiceHost": "resourceservice.104.131.67.21.xip.io",
      "resourceServicePort": "8831",
      "resourceServiceVersion": "1.0.0.0",
      "sipuserendpointserviceHost": "sipuserendpointservice.104.131.67.21.xip.io",
      "sipuserendpointservicePort": "8831",
      "sipuserendpointserviceVersion": "1.0.0.0",
      "clusterconfigserviceHost": "clusterconfig.104.131.67.21.xip.io",
      "clusterconfigservicePort": "8831",
      "clusterconfigserviceVersion": "1.0.0.0",
      "ardsServiceHost": "127.0.0.1",
      "ardsServicePort": "8828",
      "ardsServiceVersion": "1.0.0.0",
      "notificationServiceHost": "notificationservice.104.131.67.21.xip.io",
      "notificationServicePort": "8089",
      "notificationServiceVersion": "1.0.0.0",
      "scheduleWorkerHost": "192.168.0.67",
      "scheduleWorkerPort": "8080",
      "scheduleWorkerVersion": "1.0.0.0"
    }



};