const fs = require("fs");
const utils = require("./utils");

const getPathToMainClientFolder = folderName =>
	utils.joinPath(global.sharedFolderPath, folderName);

// Module that handles any interaction with the file system.
module.exports = {
	checkExistFolder: folderName =>
		fs.existsSync(getPathToMainClientFolder(folderName)),
	// TODO here I should decrypt the password
	validateFolderPassword: ({ folderName, clientPassword }) => {
		//get the password file content.
		//decrypt/encrypt the password and check if it maches.
		return true;
	},
	//Creates a folder.
	//returns true is case its done successfully.
	//@param folderPath {string}.
	createMainClientFolder: folderName =>
		fs.mkdirSync(getPathToMainClientFolder(folderName)),
	isFolderEmpty: folderName => {
		fs.readdirSync(getPathToMainClientFolder(folderName));
	}
};
