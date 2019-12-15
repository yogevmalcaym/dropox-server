const fs = require("fs");

// Module that handles any interaction with the file system.
module.exports = {
	isExists: path => fs.existsSync(path),
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
	isFolder: folderPath => fs.lstatSync(folderPath).isDirectory(),
	newReadStream: path => fs.createReadStream(path),
	readSync: path => fs.readFileSync(path, "utf8"),
	saveToFile: ({ path, content }) => fs.writeFileSync(path, content)
};
