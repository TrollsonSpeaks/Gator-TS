import {
	CommandsRegistry,
	registerCommand,
	runCommand,
	handlerLogin,
	handlerRegister,
	handlerReset,
	handlerUsers,
	handlerAgg,
	handlerAddFeed,
	handlerFeeds,
	handlerFollow,
	handlerFollowing,
	handlerUnfollow,
	handlerBrowse,
	middlewareLoggedIn,
} from "./commands.js";

async function main(): Promise<void> {
	const registry: CommandsRegistry = {};

	registerCommand(registry, "login", handlerLogin);
	registerCommand(registry, "register", handlerRegister);
	registerCommand(registry, "reset", handlerReset);
	registerCommand(registry, "users", handlerUsers);
	registerCommand(registry, "agg", handlerAgg);
	registerCommand(registry, "feeds", handlerFeeds);

	registerCommand(registry, "addfeed", middlewareLoggedIn(handlerAddFeed));
	registerCommand(registry, "follow", middlewareLoggedIn(handlerFollow));
	registerCommand(registry, "following", middlewareLoggedIn(handlerFollowing));
	registerCommand(registry, "unfollow", middlewareLoggedIn(handlerUnfollow));
	registerCommand(registry, "browse", middlewareLoggedIn(handlerBrowse));

	const args = process.argv.slice(2);

	if (args.length === 0) {
		console.error("Error: Not enough arguments provided");
		process.exit(1);
	}

	const cmdName = args[0];
	const cmdArgs = args.slice(1);

	try {
		await runCommand(registry, cmdName, ...cmdArgs);
	} catch (error) {

		if (error instanceof Error) {
			console.error(`Error: ${error.message}`);
		} else {
			console.error("Error: An unknown error occurred");
		}
		process.exit(1);
	}

	process.exit(0);
}

main();
