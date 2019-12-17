import fs from "fs";

// Exports
// Any interaction with the file system happens here.

// Check if the requested item exists, Returns boolean.
// @param path {string}.
export const isExists = path => fs.existsSync(path);

// Creates a folder.
// Returns true is case its done successfully.
// @param folderPath {string}.
export const createFolder = folderPath => fs.mkdirSync(folderPath);

// Returns array of fs.Direct objects.
// @param folderPath {string}.
export const getFolderData = folderPath =>
	fs.readdirSync(folderPath, { withFileTypes: true });

// Checks if the requested is a folder. returns boolean.
// @param folderPath {string}.
export const isFolder = folderPath => fs.lstatSync(folderPath).isDirectory();

// Checks if the requested is a file. returns boolean.
// @param filePath {string}.
export const isFile = filePath => fs.lstatSync(filePath).isFile();

// Returns fs.readable stream from the requested path.
// @param path {string}
export const newReadStream = path => fs.createReadStream(path);

// Reads data from the requested file.
// @param path {string}.
export const readSync = path => fs.readFileSync(path, "utf8");

// Writes content into a file, if it does not exists new one will be created.
// @param path {string}.
// @param content {string}.
export const saveToFile = (path, content) => fs.writeFileSync(path, content);

// Return stats of the requested file.
// @param filePath {string}.
export const getStats = filePath => fs.statSync(filePath);

// Remove a folder.
// @param folder {string}
export const deleteFolder = folder => fs.rmdirSync(folder);
