import net from "net";
import * as utils from "../shared/utils.js";
import * as files from "../shared/files.js";

let downloaderSession;

// Downloader model manage any connection to the download net.Server.
export default class Downloader {
	constructor() {
		// Creates new session only if it doesn't exist.
		if (!downloaderSession) {
			downloaderSession = new net.Server();
			downloaderSession.listen({
				port: process.env.DOWNLOADER_PORT,
				host: process.env.HOST
			});
			downloaderSession.on("connection", newConnection);
		}
	}
}

// New connection occured occation.
// @param downloadStream {net.Socket instance}.
const newConnection = downloadStream => {
	let LocallyFilePath, folderPath;
	// Get emitted when new file stream starts.
	downloadStream.on("data", data => {
		// Extracts the data from the object - this data used to connect the right file to the stream.
		const { localFilePath, currentFolderPath } = utils.toJSON(data);

		// For 'close' event handler
		LocallyFilePath = localFilePath;
		folderPath = currentFolderPath;

		const fullFolderPath = utils.getFullPath(currentFolderPath);
		const fullFilePath = utils.joinPath(fullFolderPath, localFilePath);
		const rstream = files.newReadStream(fullFilePath);
		// Connects the reader to the download stream
		rstream.pipe(downloadStream);
		rstream.on("error", error => {
			console.log("[rstream] - error: " + error.message);
		});
	});

	// Get emitted when file stream ends.
	// @param hadError {boolean}.
	downloadStream.on("close", hadError => {
		if (!hadError)
			updateDownloadsFile({
				fileLocalPath: LocallyFilePath,
				currentFolderPath: folderPath
			});
	});
};

// Updates the downloads file of the client's folder.
// @param currentFolderPath {string}
// @param fileLocalPath {string}
const updateDownloadsFile = ({ currentFolderPath, fileLocalPath }) => {
	// In case the name is the whole file just copy it.
	let mainFolderName = currentFolderPath;
	let restLocalPath = "";
	if (currentFolderPath.includes("\\"))
		[restLocalPath, mainFolderName] = utils.splitStringEndAndRest(
			currentFolderPath,
			"\\"
		);

	const downloadsFileLocalPath = utils.joinPath(
		mainFolderName,
		process.env.DOWNLOADS_FILE_NAME
    );
	const downloadsFileFullPath = utils.getFullPath(downloadsFileLocalPath);
    
	// Referance of the file a downloads file.
    const fileReferance = utils.joinPath(restLocalPath, fileLocalPath);
    
	let newFileContent;
	if (files.isExists(downloadsFileFullPath)) {
		const downloadsFileContent = files.readSync(downloadsFileFullPath);
		const fileContentSplitted = downloadsFileContent.split("\n");
		let occured = false;
		// Returns the content array updated at the file's row if exists.
		const newFileContentSplitted = fileContentSplitted.map(row => {
			const rowSplitted = row.split("=");
			if (rowSplitted[0] === fileReferance) {
				rowSplitted[1] = Number(rowSplitted[1]) + 1;
				const stringRowUpdated = rowSplitted.join("=");
				occured = true;
				return stringRowUpdated;
			}
			return row;
		});
		// If the file didnt exist in the file, it would create new row for this file.
		if (!occured) newFileContentSplitted.push(`${fileReferance}=1`);
		newFileContent = newFileContentSplitted.join("\n");
	} else newFileContent = `${fileReferance}=1`;
	files.saveToFile(downloadsFileFullPath, newFileContent);
};
