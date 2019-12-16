const files = require("./files");
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
		const isExists = files.isExists(folderFullPath);
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
		const isValid = files.validateFolderPassword(args);
		const payload = {
			type: "validationRespond",
			isValid
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
	}
	
};
