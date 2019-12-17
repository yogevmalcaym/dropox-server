// Module used to hold client data individually.
export default class Client {
	// @param mainFolder {string}.
	constructor(mainFolder) {
		this.mainFolder = mainFolder;
		this.currentFolerPath = mainFolder;
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
