const fs = require("fs");

// Module that handles any interaction with the file system.
module.exports = {
	folderExists: folderPath => fs.existsSync(folderPath),
	// TODO the password should be encrypt in this stage.
	validateFolderPassword: ({ folderName, clientPassword }) => {
		//get the password file content.
		//decrypt/encrypt the password and check if it maches.
		return true;
	},

	// Creates a folder.
	// Returns true is case its done successfully.
	// @param folderPath {string}.
	createMainClientFolder: folderPath => fs.mkdirSync(folderPath),

	// Returns array of fs.Direct objects.
	// @param folderPath {string}.
	getFolderData: folderPath =>
		fs.readdirSync(folderPath, { withFileTypes: true }),
	isFolder: folderPath => fs.lstatSync(folderPath).isDirectory()
};
