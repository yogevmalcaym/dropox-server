#!/usr/bin/env node
const path = require("path");
const config = require("./config.json");

global.sharedFolderPath = path.join(__dirname, config.sharedFolderName);

const wsServer = require("./services/wsServer").wsServer;
const utils = require("./shared/utils");
const messageHandlers = require("./services/messageHandlers");
const files = require("./services/files");
const Client = require("./services/Client");

const wsServerSession = new wsServer().session;

// returns true to accept the connection only ifthe origin is allowed
// @param `origin` string
const originIsAllowed = origin => {
	//Check if the origin is allowed
	const allowed = config.allowedOrigins.includes(origin) ? true : false;
	//TODO need to check how do I get the origin
	//may not be here since origin accepted only if the request is from a browser.
	//**FOR NOW ALLOW ALWAYS**
	return true;
};

// Handles request for a connection from a client.
const requestHandle = request => {
	let client;
	// Make sure only allowed origin accepted
	if (!originIsAllowed(request.origin)) {
		request.reject();
		console.log(
			new Date() + " Connection from origin " + request.origin + " rejected."
		);
		return;
	}

	// Handle message received event.
	// Routes the received message to the appropriate function handler, and send back to
	// the client the handler response.
	// @param message {object} -> using `utf8Data` property.
	const messageReceivedHandle = message => {
		const { type: messageType, ...restArgs } = utils.stringToJSON(
			message.utf8Data
		);

		// Operates the appropriate function handle case with the arguments that received from the client.
		// Client instance is used only in `command` and `mainClientFolder` type messages.
		const response = messageHandlers[messageType](restArgs, client);

		// For the first question's answer.
		if (messageType === "mainClientFolder")
			if (!client) client = new Client(restArgs.folderName);

		if (response) connection.sendUTF(utils.JSONToString(response));
	};

	// Handles connection closed event.
	// @param `reasonCode` {number} -> -1 if connection still exists.
	// @param description {string}.
	const connectionClosedHandle = (reasonCode, description) => {
		if (connection && connection.folderName)
			//TODO if its empty, delete it.
			files.getFolderData(connection.folderName);
		console.log(new Date() + " Peer " + " disconnected.");
	};

	//returns the established WebSocketConnection.
	const connection = request.accept("echo-protocol");

	console.log(new Date() + " Connection accepted.");
	connection.on("message", messageReceivedHandle);
	connection.on("close", () => connectionClosedHandle());
};

wsServerSession.on("request", requestHandle);
