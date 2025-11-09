import fs from "fs";
import os from "os";
import path from "path";

type Config = {
	dbUrl: string;
	currentUserName?: string;
};

function getConfigFilePath(): string {
	return path.join(os.homedir(), ".gatorconfig.json");
}

function writeConfig(cfg: Config): void {
	const filePath = getConfigFilePath();

	const jsonData = {
		db_url: cfg.dbUrl,
		current_user_name: cfg.currentUserName,
	};

	fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2), "utf-8");
}

function validateConfig(rawConfig: any): Config {
	if (
		typeof rawConfig !== "object" || 
		rawConfig === null || 
		typeof rawConfig.db_url !== "string"
	) {
		throw new Error("Invalid config file structure");
	}

	return {
		dbUrl: rawConfig.db_url,
		currentUserName: rawConfig.current_user_name,
	};
}

export function readConfig(): Config {
	const filePath = getConfigFilePath();

	const fileContent = fs.readFileSync(filePath, "utf-8");

	const rawConfig = JSON.parse(fileContent);

	return validateConfig(rawConfig);
}

export function setUser(username: string): void {
	const config = readConfig();

	config.currentUserName = username;

	writeConfig(config);
}
