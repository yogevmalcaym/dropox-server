import Downloader from "../services/Downloader.js";
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

// Streamin wanted file to the client.
// @param filePath {string}.
// @param client {Client instance}.
// @param socket {net.Socket instance}
export const download = ({ data: [filePath], client }) => {
	// Creates a Downloader session.
	new Downloader();

	const localFilePath = utils.joinPath(client.currentFolderPath, filePath);

	// In case that path didn't arrive.
	if (!filePath) return { errorMessage: consts.MISSING_DATA };

	// In case the file is not allowed.
	if (filterNotAllowed([{ name: filePath }]).length === 0)
		return { errorMessage: consts.NOT_ALLOWED_NAMES };

	const fullFilePath = utils.getFullPath(localFilePath);
	if (!files.isExists(fullFilePath))
		return { errorMessage: consts.fileNotExists(localFilePath) };

	return {
		data: {
			localFilePath: filePath,
			currentFolderPath: client.currentFolderPath
		}
	};
};

// Returns payload contained with help section.
export const help = () => {
	const helpData = consts.HELP;
	return { data: helpData };
};
