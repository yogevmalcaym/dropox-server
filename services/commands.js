// TODO The methods should receive commanndData object {name: "command-name", data: [array-of-data]}
// and return an object that contains the command name also
const path = require("path");
const files = require("./files");
const utils = require("../shared/utils");
const consts = require("../shared/consts");

// Maps the folder Items array to be detailed for client usage.
// @param items {array}.
// @param extraData {object} -> received only in extra data case.
const mapFolderItems = ({ items, extraData }) =>
	items.map(item => {
		let itemDetails;
		if (item.isFile()) {
			const [fileType, fileName] = utils.splitStringEndAndRest(item.name, ".");
			itemDetails = { type: "file", name: fileName, fileType };
			if (extraData) {
				const { currentFolderPath, mainFolder } = extraData;

				const currentFolderFullPath = utils.getFullPath(currentFolderPath);
				const fullFilePath = utils.joinPath(currentFolderFullPath, item.name);
				const { ctime, size } = files.getStats(fullFilePath);
				const downloadsCount = getFileDownloadsCount({
					currentFolderPath,
					fileName: item.name,
					mainFolder
				});

				itemDetails = Object.assign(itemDetails, {
					ctime,
					size,
					downloadsCount
				});
			}
		} else {
			itemDetails = { type: "dir", name: item.name };
		}
		return itemDetails;
	});

// Filters not allowed names.
// @param items {array}.
const filterNotAllowed = items => {
	const notAllowed = global.env.NOT_ALLOWED_NAMES.split("@");
	return items.filter(item => !notAllowed.includes(item.name));
};

// Updates the downloads file of the client's folder.
// @param folderName {string}
// @param fileLocalPath {string}
const updateDownloadsFile = ({ folderName, fileLocalPath }) => {
	const downloadsFileLocalPath = utils.joinPath(
		folderName,
		global.env.DOWNLOADS_FILE_NAME
	);
	const downloadsFileFullPath = utils.getFullPath(downloadsFileLocalPath);
	let downloadsFileContent = "";
	if (files.isExists(downloadsFileFullPath))
		downloadsFileContent = files.readSync(downloadsFileFullPath);

	const fileContentSplitted = downloadsFileContent.split("\n");
	let occured = false;
	// Returns the content array updated at the file's row if exists.
	const newFileContentSplitted = fileContentSplitted.map(row => {
		if (row.includes(fileLocalPath)) {
			const rowSplitted = row.split("=");
			rowSplitted[1] = Number(rowSplitted[1]) + 1;
			const stringRowUpdated = rowSplitted.join("=");
			occured = true;
			return stringRowUpdated;
		}
	});
	// If the file didnt exist in the file, it would create new row for this file.
	if (!occured) newFileContentSplitted.push(`${fileLocalPath}=1`);
	const newFileContent = newFileContentSplitted.join("\n");
	files.saveToFile({ path: downloadsFileFullPath, content: newFileContent });
};

// Check the downloads count of a specific file by the downloads file.
// Returns number of downloads.
// @param currentFolderPath {string}
// @param fileName {string}
// @param mainFolder {string}
const getFileDownloadsCount = ({ currentFolderPath, fileName, mainFolder }) => {
	let localFilePath;
	// Get first depth in path to omit the first level (which its the main shared folder)
	const firstDepth = currentFolderPath.indexOf("\\");
	if (firstDepth === -1) localFilePath = fileName;
	else {
		const localFolderPath = currentFolderPath.slice(firstDepth + 1);
		localFilePath = utils.joinPath(localFolderPath, fileName);
	}

	const mainFolderFullPath = utils.getFullPath(mainFolder);
	const downloadsFilePath = utils.joinPath(
		mainFolderFullPath,
		global.env.DOWNLOADS_FILE_NAME
	);

	let downloadsCount = 0;
	// Map downloads file data to get the file count number.
	if (!files.isExists(downloadsFilePath)) downloadsCount = 0;
	else {
		const downloadsFileContent = files.readSync(downloadsFilePath);
		const downloadsFileContentSplitted = downloadsFileContent.split("\n");
		downloadsFileContentSplitted.some(row => {
			// If there is an entry of the asked file, extract the downloads count and break the loop.
			if (row.includes(localFilePath)) {
				downloadsCount = Number(row.split("=")[1]);
				return true;
			}
		});
	}
	return downloadsCount;
};

// Module that handles commands, every method returns appropriate data to the client.
module.exports = {
	// @param commandName {string}.
	// @param extra {string} -> optional.
	// @param client {Client instance}.
	dir: ({
		data: {
			commandName,
			data: [extra]
		},
		client
	}) => {
		const clientCurrentFolderFullPath = utils.getFullPath(
			client.currentFolderPath
		);
		const folderItems = files.getFolderData(clientCurrentFolderFullPath);
		const folderItemsFiltered = filterNotAllowed(folderItems);
		// Extra data contain args only if 'extra' arg is true.
		let extraData =
			extra === "extra" || extra === "+"
				? {
						currentFolderPath: client.currentFolderPath,
						mainFolder: client.mainFolderName
				  }
				: null;
		const folderItemsMaped = mapFolderItems({
			items: folderItemsFiltered,
			extraData
		});
		const currentFolderPath = `\\${client.currentFolderPath}`;
		const commandData = {
			folderPath: currentFolderPath,
			folderData: folderItemsMaped,
			extra: extraData && true
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
		if (!filePath) return { errorMessage: consts.MISSING_DATA };

		const localFilePath = utils.joinPath(client.currentFolderPath, filePath);
		const fullFilePath = utils.getFullPath(localFilePath);
		if (!files.isExists(fullFilePath))
			return { errorMessage: `${localFilePath} not exists` };

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
			updateDownloadsFile({
				folderName: client.mainFolderName,
				fileLocalPath: localFilePath
			});
		});
		return { commandName };
	},
	// Returns payload contained with help section.
	// @param commandName {string}
	help: ({ data: { commandName } }) => {
		const helpData = consts.HELP;
		return { commandName, data: helpData };
	}
};
