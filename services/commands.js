// TODO The methods should receive commanndData object {name: "command-name", data: [array-of-data]}
// and return an object that contains the command name also
const path = require("path");
const files = require("./files");
const utils = require("../shared/utils");
const consts = require("../shared/consts");

// Maps the folder content array to be detailed for client usage.
// @param folderContent {array}.
const mapFolderContent = folderContent =>
	folderContent.map(item => {
		let itemDetails;
		if (item.isDirectory()) {
			itemDetails = { type: "dir", name: item.name };
		} else {
			const [fileType, fileName] = utils.splitStringEndAndRest(item.name, ".");
			itemDetails = { type: "file", name: fileName, fileType };
		}
		return itemDetails;
	});

// Module that handles commands, every method returns appropriate data to the client.
module.exports = {
	// @param commandName {string}.
	// @param client {Client instance}.
	dir: ({ data: { commandName }, client }) => {
		const clientCurrentFolderFullPath = utils.getFullPath(
			client.currentFolderPath
		);
		const folderContent = files.getFolderData(clientCurrentFolderFullPath);
		const folderContentMaped = mapFolderContent(folderContent);
		const currentFolderPath = `/${client.currentFolderPath}`;
		const commandData = {
			folderPath: currentFolderPath,
			folderData: folderContentMaped
		};
		return { commandName, data: commandData };
	},
	// @param data {object: {commandName {string}, data {array}}, client: {Client instance}}.
	cd: ({
		data: {
			commandName,
			data: [to]
		},
		client
	}) => {
		let errorMessage;
		if (to === "..") {
			const [_, parentLocalPath] = utils.splitStringEndAndRest(
				client.currentFolderPath,
				"/"
			);
			if (parentLocalPath === "") errorMessage = consts.AT_TOP;
			else client.currentFolderPath = parentLocalPath;
		} else {
			const wantedFolderLocalPath = utils.joinPath(
				client.currentFolderPath,
				to
			);

			const wantedFolderFullPath = utils.getFullPath(wantedFolderLocalPath);
			if (
				files.isExists(wantedFolderFullPath) &&
				files.isFolder(wantedFolderFullPath)
			) {
				client.currentFolderPath = wantedFolderLocalPath;
			} else errorMessage = consts.FOLDER_NOT_EXISTS_OR_A_FILE;
		}
		return { commandName, errorMessage };
	},
	download: ({
		data: {
			commandName,
			data: [filePath]
		},
		client,
		socket
	}) => {
		let errorMessage;
		const localFilePath = utils.joinPath(client.currentFolderPath, filePath);
		const fullFilePath = utils.getFullPath(localFilePath);
		if (!files.isExists(fullFilePath))
			errorMessage = `${localFilePath} not exists`;
		else {
			const rstream = files.newReadStream(fullFilePath);
			rstream.pipe(socket, { end: false });
			rstream.close();
			rstream.on("close", () => {
				console.log("read stream closed");
				const payload = {
					type: "commandResponse",
					commandName,
					data: { done: true }
				};
				socket.write(utils.JSONToString(payload));
			});
		}
		return { commandName, errorMessage };
	}
};
