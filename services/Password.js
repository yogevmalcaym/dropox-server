import bcrypt from "bcryptjs";
import { joinPath } from "../shared/utils.js";
import { readSync } from "../shared/files.js";

export default class Password {
	constructor(password) {
		const saltRounds = 10;
		this.hash = bcrypt.hash(password, saltRounds);
	}
	get getHash() {
		return this.hash;
	}

	static compare = async (folder, password) => {
		const passFilePath = joinPath(folder, process.env.PASS);
		const hash = readSync(passFilePath);
		const isMatch = await bcrypt.compare(password, hash);
		return isMatch;
	};
}
