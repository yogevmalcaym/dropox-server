const files = require("./files");
const commands = require("./commands");

//This module handles all the messages that arrive from the client and returns an appropriate payload object.
//payload allways consist from `type` property and optionally additional properties.
module.exports = {
	// Check if the requested folder exists in sharedFolder.
	// @param folderName {string}.
	mainClientFolder: ({ folderName }) => {
		const isExists = files.checkExistFolder(folderName);
		let payload;
		if (isExists)
			payload = {
				type: "mainFolderExistance",
				isExists
			};
		else {
			//If the folder does not exists, create new one
			files.createMainClientFolder(folderName);
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

	// A command received, transfered to the commands module.
	// If the command name does not exists in commands module, returns with wrongCommand flag as true.
	// @param commandData {object}.
	command: ({ commandData }) => {
		const response = (commands[commandData.name] && commands[commandData.name](commandData)) || {
			wrongCommand: true
		};
		const payload = { type: "commandResponse", ...response };
		return payload;
	}
};
