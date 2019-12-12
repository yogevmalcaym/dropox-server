const path = require("path");

//Holds general utility methods
module.exports = {
	stringToJSON: string => JSON.parse(string),
	JSONToString: json => JSON.stringify(json),
	joinPath: (...args) => path.join(...args)
};
