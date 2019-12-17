import Password from "./Password.js";
import * as files from "../shared/files.js";
import * as utils from "../shared/utils.js";

// Exports.
// Functions below handles any acquaintance messages that arrives from the client at the introduction stage.
// payload allways consist from `type` property and optionally additional properties.

// Check if the requested folder exists in sharedFolder.
// @param folderName {string}.
// @param client {object} -> client instance, exists only if its not the first call of `mainClientFolder`.
export const mainClientFolder = ({ folderName }, client) => {
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
		files.createFolder(folderFullPath);

		// Create initial files.
		const passFilePath = utils.joinPath(folderFullPath, process.env.PASS);
		files.createFile(passFilePath);

		payload = {
			type: "clientFolderCreated"
		};
	}
	return payload;
};

// Validate the folder password.
export const validatePasswordByFolder = async ({ clientPassword }, client) => {
	try {
		const fullFolderPath = utils.getFullPath(client.mainFolderName);
		const isValid = await Password.compare(fullFolderPath, clientPassword);
		const payload = {
			type: "validationRespond",
			isValid
		};
		return payload;
	} catch (error) {
		console.error(error);
	}
};

//New client password for new folder received.
//@param clientPassword {string}.
export const newClientPassword = async ({ clientPassword }, client) => {
	try {
		const hash = await new Password(clientPassword).getHash;
		const fullFolderPath = utils.getFullPath(client.mainFolderName);
		const passFilePath = utils.joinPath(fullFolderPath, process.env.PASS);
		files.saveToFile(passFilePath, hash);
		const payload = { type: "passwordReserved" };
		return payload;
	} catch (error) {
		console.error(error);
	}
};
