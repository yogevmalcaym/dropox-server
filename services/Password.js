import bcrypt from "bcryptjs";
import { joinPath } from "../shared/utils.js";
import { readSync, isExists } from "../shared/files.js";

// Handles any process connection to password.
export default class Password {
	constructor(password) {
		const saltRounds = 10;
		this.hash = bcrypt.hash(password, saltRounds);
	}

	get getHash() {
		return this.hash;
	}

	// Compare accepted password with the current password by folder.
	// Returns boolean.
	// @param folder {string}.
	// @param password {string}.
	static compare = async (folder, password) => {
		const passFile = joinPath(folder, process.env.PASS);
		const hash = readSync(passFile);
		const isMatch = await bcrypt.compare(password, hash);
		return isMatch;
	};

	// Validates pass file existance by folder path.
	// Returns boolean.
	// @param folder {string}
	static passFileExists = folder => {
		const passFile = joinPath(folder, process.env.PASS);
		return isExists(passFile);
	};
}
