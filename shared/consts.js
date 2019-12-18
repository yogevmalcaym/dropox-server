// The consts of the application.
export const FOLDER_NOT_EXISTS_OR_A_FILE = `Requested folder either not exist or isn't a folder`;
export const AT_TOP = `You are already at your root folder`;
export const MISSING_DATA = `Missing command data, type 'help' to see your options`;
export const PASSWORD_ERROR = `An error occured, please try again`;
export const HELP = `
Available commands: dir, cd, download and help
Detailed commands explenation:
	dir:
		returns information about the current directory's content.
		Information includes: 
			regular: item name, file type (' - ' sign for directories), file/dir flag.
			extra data (for files only and by using the 'extra' option): size(bytes), count of downloads, creation time.
			options: 
				extra: can be marked by '+' or 'extra' after the command.
	cd:
		cd command usage is to change the current location in the tree. 
		use '..' to climb stage, or 'inner-folder-name' to get into inner folder.
	download:
		use download command to download files.
		download command takes a path to the file which is relates to the current folder in the tree.
		NOTE: download command does not accept '..' and global paths.
		The downloaded file will be saved into the project directory in a folder named 'Dropox' in case you didn't change it's variable in the .evn file.

If you want to see usages of above commands read ReadMe file.
	`;
export const fileNotExists = path => `${path} not exists`;
