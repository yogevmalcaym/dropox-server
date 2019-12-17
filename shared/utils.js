import path from "path";

// Exports.
// General utility methods.

// Transfer string to JSON.
export const stringToJSON = string => JSON.parse(string);

// Transfer JSON to string.
export const JSONToString = json => JSON.stringify(json);

// Join arguments to path.
// @param args {array}.
export const joinPath = (...args) => path.join(...args);

//Returns new global path based at `global.sharedFolderPath`.
//@param itemPath {string}.
export const getFullPath = itemPath => path.join(process.env.SHARED_FOLDER_PATH, itemPath);

// Returns the string splitted by the ending and the rest seperated.
// @param string {string}.
// @param sign {string}.
export const splitStringEndAndRest = (string, sign) => {
	const stringSplitted = string.split(sign);
	const [ending] = stringSplitted.splice(-1, 1);
	// Concatenate back if there is more than one `sign`
	const rest = stringSplitted.join(sign);
	return [ending, rest];
};
