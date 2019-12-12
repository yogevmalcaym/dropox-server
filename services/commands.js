// TODO The methods should receive commanndData object {name: "command-name", data: [array-of-data]}
// and return an object that contains the command name also

module.exports = {
	mikeCheck: ({ name, data }) => {
		return { name, responseData: "OK" };
	}
};
