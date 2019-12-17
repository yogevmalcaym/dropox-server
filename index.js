#!/usr/bin/env node

import net from "net";
const wsServer = new net.Server();
wsServer.listen({ port: process.env.PORT, host: process.env.HOST });

import * as acquaintance from "./services/acquaintance.js";
import * as utils from "./shared/utils.js";
import Client from "./services/Client.js";
import * as commands from "./services/commands.js";
import * as consts from "./shared/consts.js";

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
	// @param data {Buffer}.
	const dataReceivedHandler = async data => {
		const { type, name, pdata } = utils.toJSON(data);
		let payload;
		if (type === "command") {
			// Routes 'command' type data to its command handler. if there is no an appropriate hanlder, returns an errorMessage.
			const response = (commands[name] &&
				commands[name]({
					data: pdata || [],
					client,
					socket
				})) || {
				errorMessage: consts.WRONG_COMMAND
			};
			// Same type and name will be handled at the other side.
			payload = { type, name, ...response };
		}
		if (type === "acquaintance") {
			try {
				const response = await acquaintance[name]({
					data: pdata || {},
					client
				});
				// For the first question's answer - create the client instance.
				if (name === "mainClientFolder")
					if (!client) client = new Client(pdata || {});
				// Attach the type prop to the payload to be handled at the other side.
				payload = { ...response, type };
			} catch (error) {
				console.error(error);
			}
		}

		if (payload) socket.write(utils.JSONToString(payload));
	};

	// Handles error event.
	// @param error {object}
	const errorHandler = error => {
		if (error.code === "ECONNRESET") console.log("Client disconnected");
		else console.error(error);
	};

	const closeHandler = hadError => {
		console.log("a client connection closed");
		//TODO make sure that the client didnt left the folder without password.
	};

	socket.on("error", errorHandler);
	socket.on("data", dataReceivedHandler);
	socket.on("close", closeHandler);
	socket.on("end", () => {
		console.log("Client disconnected");
	});
});
