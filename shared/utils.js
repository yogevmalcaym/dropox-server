const path = require("path");

// Holds general utility methods
module.exports = {
	stringToJSON: string => JSON.parse(string),
	JSONToString: json => JSON.stringify(json),
	joinPath: (...args) => path.join(...args),
	
	//Returns new global path based at `global.sharedFolderPath`.
	//@param itemPath {string}.
	getFullPath: itemPath => path.join(global.sharedFolderPath, itemPath),

	// Returns the string splitted by the ending and the rest seperated.
	// @param string {string}.
	// @param sign {string}.
	splitStringEndAndRest: (string, sign) => {
		const stringSplitted = string.split(sign);
		const [ending] = stringSplitted.splice(-1, 1);
		// Concatenate back if there is more than one `sign`
		const rest = stringSplitted.join(sign);
		return [ending, rest];
	}
};
