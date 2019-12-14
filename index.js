#!/usr/bin/env node
const path = require("path");
const config = require("./config.json");
const net = require("net");

const wsServer = new net.Server();
const PORT = config.port;
const HOST = config.host;
wsServer.listen({ port: PORT, host: HOST });
global.sharedFolderPath = path.join(__dirname, config.sharedFolderName);

const utils = require("./shared/utils");
const messageHandlers = require("./services/messageHandlers");
const Client = require("./services/Client");

wsServer.on("listening", () => {
	const { port, family, address } = wsServer.address();
	console.log(
		`server is listening on port: ${port} family: ${family} address: ${address}`
	);
});

wsServer.on("connection", socket => {
	let client;
	// Handles data event.
	// Routes the received data to the appropriate function handler, and sends back to
	// the client the handler response.
	// @param data {string} -> utf8 encoded.
	const dataReceivedHandler = data => {
		const { type, ...restArgs } = utils.stringToJSON(data);
		// Operates the appropriate function handle case with the arguments that received from the client.
		// Client instance is used only in `command` and `mainClientFolder` types.
		// socket is used only in type `command`, commandName `download`
		const response = messageHandlers[type](restArgs, client,socket);

		// For the first question's answer - create the client instance.
		if (type === "mainClientFolder")
			if (!client) client = new Client(restArgs.folderName);

		if (response) socket.write(utils.JSONToString(response));
	};

	// Handles error event.
	// @param error {object}
	const errorHandler = error => {
		console.error(error);
	};
	const closeHandler = hadError => {
		//TODO make sure that the client didnt left the folder without password.
	};

	socket.setEncoding("utf8");
	console.log(
		"connection request arrived from client: " + socket.remoteAddress
	);

	socket.on("error", errorHandler);
	socket.on("data", dataReceivedHandler);
	socket.on("close", closeHandler);
	socket.on("end", () => {
		console.log("Client disconnected");
	});
});
