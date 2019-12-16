#!/usr/bin/env node
//TODO should be change when seperating client and server
const path = require("path");
// Make .env file to be accessible through 'process.env'.
require("dotenv").config({ path: path.resolve(process.cwd(), "server/.env") });
global.env = process.env;

const net = require("net");
const wsServer = new net.Server();
wsServer.listen({ port: process.env.PORT, host: process.env.HOST });

const utils = require("./shared/utils");
const messageHandlers = require("./services/messageHandlers");
const Client = require("./services/Client");
const commands = require("./services/commands");
const consts = require("./shared/consts");

wsServer.on("listening", () => {
	const { port, family, address } = wsServer.address();
	console.log(
		`server is listening on port: ${port} family: ${family} address: ${address}`
	);
});

wsServer.on("connection", socket => {
	console.log(
		"connection request arrived from client: " + socket.remoteAddress
	);
	let client;
	// Handles data event.
	// Routes the received data to the appropriate function handler, and sends back to
	// the client the handler response.
	// @param data {string}.
	const dataReceivedHandler = data => {
		const { type, ...restArgs } = utils.stringToJSON(data);

		let payload;
		if (type === "command") {
			// Routes 'command' type data to its command handler. if there is no an appropriate hanlder, returns an errorMessage.
			const {
				commandData: { name, data }
			} = restArgs;
			const response = (commands[name] &&
				commands[name]({
					data,
					client,
					socket
				})) || {
				errorMessage: consts.WRONG_COMMAND
			};
			payload = { type, name, ...response };
		} else {
			payload = messageHandlers[type](restArgs, client, socket);
		}

		// For the first question's answer - create the client instance.
		if (type === "mainClientFolder")
			if (!client) client = new Client(restArgs.folderName);

		if (payload) socket.write(utils.JSONToString(payload));
	};

	// Handles error event.
	// @param error {object}
	const errorHandler = error => {
		if (error.code === "ECONNRESET") console.log("Client disconnected");
		else console.error(error);
	};

	const closeHandler = hadError => {
		console.log("Connection closed");
		//TODO make sure that the client didnt left the folder without password.
	};

	socket.on("error", errorHandler);
	socket.on("data", dataReceivedHandler);
	socket.on("close", closeHandler);
	socket.on("end", () => {
		console.log("Client disconnected");
	});
});
