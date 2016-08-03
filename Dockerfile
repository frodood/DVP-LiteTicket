#FROM ubuntu
#RUN apt-get update
#RUN apt-get install -y git nodejs npm nodejs-legacy
#RUN git clone git://github.com/DuoSoftware/DVP-LiteTicket.git /usr/local/src/liteticket
#RUN cd /usr/local/src/liteticket; npm install
#CMD ["nodejs", "/usr/local/src/liteticket/app.js"]

#EXPOSE 8872

FROM node:5.10.0
RUN git clone git://github.com/DuoSoftware/DVP-LiteTicket.git /usr/local/src/liteticket
RUN cd /usr/local/src/liteticket;
WORKDIR /usr/local/src/liteticket
RUN npm install
EXPOSE 8872
CMD [ "node", "/usr/local/src/liteticket/app.js" ]