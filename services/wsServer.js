const http = require('http');
const WebSocketServer = require('websocket').server;

const server = http.createServer((request, response) => {
    console.log((new Date()) + ' Received request for ' + request.url);
    response.writeHead(404);
    response.end();
});

server.listen(8080, () => {
    console.log((new Date()) + ' Server is listening on port 8080');
});

let wsServerSession;

class wsServer {
    constructor() {
        if (!wsServerSession)
            wsServerSession = new WebSocketServer({
                httpServer: server,
                //Sets autoAcceptConnections to false for future connections validation 
                autoAcceptConnections: false
            });
    };
    get session() {
        return wsServerSession;
    };
};

module.exports = {
    wsServer
};