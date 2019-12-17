// Client module holds the client data.
export default class Client {
	// @param mainFolderName {string}.
	constructor({ mainFolderName }) {
		this.mainFolder = mainFolderName;
		this.currentFolerPath = mainFolderName;
	}
	get mainFolderName() {
		return this.mainFolder;
	}
	get currentFolderPath() {
		return this.currentFolerPath;
	}
	set currentFolderPath(newCurrent) {
		this.currentFolerPath = newCurrent;
	}
	resetMainFolder(folderName) {
		this.mainFolder = folderName;
		this.currentFolerPath = folderName;
	}
}
