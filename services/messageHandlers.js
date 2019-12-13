const files = require("./files");
const commands = require("./commands");
const utils = require("../shared/utils");

//This module handles all the messages that arrive from the client and returns an appropriate payload object.
//payload allways consist from `type` property and optionally additional properties.
module.exports = {
	// Check if the requested folder exists in sharedFolder.
	// @param folderName {string}.
	// @param client {object} -> client instance, exists only if its not the first call of `mainClientFolder`.
	mainClientFolder: ({ folderName }, client) => {
		//In case the client change the requested main folder.
		if (client) client.resetMainFolder(folderName);
		const folderFullPath = utils.getFullPath(folderName);
		const isExists = files.folderExists(folderFullPath);
		let payload;
		if (isExists)
			payload = {
				type: "mainFolderExistance",
				isExists
			};
		else {
			// If the folder does not exists, creates new one.
			files.createMainClientFolder(folderFullPath);
			payload = {
				type: "clientFolderCreated"
			};
		}
		return payload;
	},

	// Validate the folder password.
	validatePasswordByFolder: args => {
		const isValidate = files.validateFolderPassword(args);
		const payload = {
			type: "validationRespond",
			isValidate
		};
		return payload;
	},

	//New client password for new folder received.
	//@param clientPassword {string}.
	newClientPassword: ({ clientPassword }) => {
		//TODO encrypt the password and save to a file in the folder
		console.log("client password: " + clientPassword);
		const payload = { type: "passwordReserved" };
		return payload;
	},

	// Every command that received is transfered to the commands module.
	// If the command name does not exists in commands module, it returns with wrongCommand flag as true.
	// @param commandData {object}.
	// @param client {Client instance}.
	command: ({ commandData }, client) => {
		const response = (commands[commandData.commandName] &&
			commands[commandData.commandName]({ data: commandData, client })) || {
			wrongCommand: true
		};
		const payload = { type: "commandResponse", ...response };
		return payload;
	}
};
