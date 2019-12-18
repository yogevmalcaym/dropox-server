// and return an object that contains the command name also
import * as files from "../shared/files.js";
import * as utils from "../shared/utils.js";
import * as consts from "../shared/consts.js";

// Maps the folder Items into objects.
// Returns arary of objects.
// @param items {array}.
// @param extraData {object} -> optionally.
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
	const notAllowed = process.env.NOT_ALLOWED_NAMES.split("@");
	return items.filter(item => !notAllowed.includes(item.name));
};

// Updates the downloads file of the client's folder.
// @param folderName {string}
// @param fileLocalPath {string}
const updateDownloadsFile = ({ folderName, fileLocalPath }) => {
	const downloadsFileLocalPath = utils.joinPath(
		folderName,
		process.env.DOWNLOADS_FILE_NAME
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
	files.saveToFile(downloadsFileFullPath, newFileContent);
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
		process.env.DOWNLOADS_FILE_NAME
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

// Exports.
// Commands handlers, every method returns appropriate data to the client.

// Elaborates folder data.
// @param extra {string} -> optional.
// @param client {Client instance}.
export const dir = ({ data: [extra], client }) => {
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
	return { data: commandData };
};

// Navigates the client to the requested folder.
// @param to {string}.
// @param client: {Client instance}}.
export const cd = ({ data: [to], client }) => {
	// If there is no data, returns error message.
	if (!to) return { errorMessage: consts.MISSING_DATA };

	let errorMessage;
	if (to === "..") {
		const [_, parentLocalPath] = utils.splitStringEndAndRest(
			client.currentFolderPath,
			"\\"
		);
		if (parentLocalPath === "") errorMessage = consts.AT_TOP;
		else client.currentFolderPath = parentLocalPath;
	} else {
		const wantedFolderLocalPath = utils.joinPath(client.currentFolderPath, to);

		const wantedFolderFullPath = utils.getFullPath(wantedFolderLocalPath);
		if (
			files.isExists(wantedFolderFullPath) &&
			files.isFolder(wantedFolderFullPath)
		) {
			client.currentFolderPath = wantedFolderLocalPath;
		} else errorMessage = consts.FOLDER_NOT_EXISTS_OR_A_FILE;
	}
	return { errorMessage };
};

// Streamin wanted file to the client TODO not finished.
// @param filePath {string}.
// @param client {Client instance}.
// @param socket {net.Socket instance}
export const download = ({ data: [filePath], client, socket }) => {
	// If there is no data, returns error message.
	if (!filePath) return { errorMessage: consts.MISSING_DATA };
	const [fileName] = utils.splitStringEndAndRest(filePath, "\\");

	const localFilePath = utils.joinPath(client.currentFolderPath, filePath);
	const fullFilePath = utils.getFullPath(localFilePath);

	if (!files.isExists(fullFilePath))
		return { errorMessage: consts.fileNotExists(localFilePath) };

	const rstream = files.newReadStream(fullFilePath);

	rstream.on("readable", () => {
		let chunk;
		if ((chunk = rstream.read())) {
			socket.write(utils.JSONToString({ chunk }) + "\n");
		}
	});

	rstream.on("error", error => {
		console.log(["[rstream] - error"]);
	});

	rstream.on("end", () => {
		console.log("[rstream] - end ");
	});

	rstream.on("close", () => {
		socket.write(utils.JSONToString({ done: true }));
		console.log("[rstream] - close ");
		updateDownloadsFile({
			folderName: client.mainFolderName,
			fileLocalPath: localFilePath
		});
	});

	return { data: { fileName } };
};

// Returns payload contained with help section.
export const help = () => {
	const helpData = consts.HELP;
	return { data: helpData };
};
