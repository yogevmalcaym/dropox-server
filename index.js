#!/usr/bin/env node

const WebSocketServer = require('websocket').server;
const http = require('http');

const config = require('./config.json');

const server = http.createServer((request, response) => {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

server.listen(8080, () => {
    console.log((new Date()) + ' Server is listening on port 8080');
});

wsServer = new WebSocketServer({
    httpServer: server,
    //Sets autoAcceptConnections to false for future connections validation 
    autoAcceptConnections: false
});

// returns true to accept the connection only ifthe origin is allowed
// @param `origin` string
const originIsAllowed = origin => {
    //Check if the origin is allowed
    const allowed = config.allowedOrigins.includes(origin) ? true : false;
    //TODO need to check how do I get the origin 
    //may not be here since origin accepted only if the request is from a browser.
    //**FOR NOW ALLOW ALWAYS**
    return true;
}

// Handles request for a connection from a client.
const requestHandle = request => {

    // Make sure only allowed origin accepted
    if (!originIsAllowed(request.origin)) {
        request.reject();
        console.log((new Date()) + ' Connection from origin ' + request.origin + ' rejected.');
        return;
    }

    const messageReceivedHandle = message => {
        console.log("Received message: " + message.utf8Data);
        //Send hello to the client and close the connection.
        connection.sendUTF(new Date() + `\n Hello ${message.utf8Data}! from server `);
        connection.close("validationDone", "handshake flow is done");
    };

    const connectionClosedHandle = (reasonCode, description) => {
        console.log((new Date()) + ' Peer ' + ' disconnected.');
    };

    //returns the established WebSocketConnection.
    const connection = request.accept('echo-protocol');

    console.log((new Date()) + ' Connection accepted.');
    connection.on('message', messageReceivedHandle);
    connection.on('close', () => connectionClosedHandle());



}

wsServer.on('request', requestHandle);