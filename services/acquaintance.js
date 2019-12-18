import Password from "./Password.js";
import * as files from "../shared/files.js";
import * as utils from "../shared/utils.js";

// Exports.
// Functions below handles any acquaintance messages that arrives from the client at the introduction stage.
// payload allways consist from `type` property and optionally additional properties.

// Check if the requested folder exists in sharedFolder.
// @param mainFolderName {string}.
// @param client {object} -> client instance, exists only if its not the first call of `mainClientFolder`.
export const mainClientFolder = ({ data: { mainFolderName }, client }) => {
	//In case the client change the requested main folder.
	if (client) client.resetMainFolder(mainFolderName);
	const folderFullPath = utils.getFullPath(mainFolderName);
	const isExists = files.isExists(folderFullPath);
	let payload;
	if (isExists)
		payload = {
			name: "mainFolderExistance",
			isExists
		};
	else {
		// If the folder does not exists, creates new one.
		files.createFolder(folderFullPath);
		payload = {
			name: "clientFolderCreated"
		};
	}
	return payload;
};

// Validate the folder password..
// @param clientPassword {string}.
// @param client {Client instance}.
export const validatePasswordByFolder = async ({
	data: { clientPassword },
	client
}) => {
	try {
		const fullFolderPath = utils.getFullPath(client.mainFolderName);
		const isValid = await Password.compare(fullFolderPath, clientPassword);
		const payload = {
			name: "validationRespond",
			isValid
		};
		return payload;
	} catch (error) {
		console.log(error.message);
	}
};

//New client password for new folder received.
//@param clientPassword {string}.
export const newClientPassword = async ({data: { clientPassword }, client}) => {
	try {
		const hash = await new Password(clientPassword).getHash;
		const fullFolderPath = utils.getFullPath(client.mainFolderName);
		const passFilePath = utils.joinPath(fullFolderPath, process.env.PASS);

		files.saveToFile(passFilePath, hash);
		const payload = { name: "passwordReserved" };
		return payload;
	} catch (error) {
		console.log(error.message);
	}
};
