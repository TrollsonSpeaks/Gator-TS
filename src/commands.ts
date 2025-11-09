import { setUser, readConfig } from "./config.js";
import { createUser, getUserByName, deleteAllUsers, getUsers } from "./lib/db/queries/users.js";
import { fetchFeed, parsePublishedDate } from "./lib/rss.js";
import { createFeedFollow, getFeedFollowsForUser, deleteFeedFollow } from "./lib/db/queries/feedFollows.js";
import { createFeed, getFeeds, getFeedByUrl, getNextFeedToFetch, markFeedFetched } from "./lib/db/queries/feeds.js";
import type { Feed, User } from "./lib/db/schema.js";
import { parseDuration, formatDuration } from "./utils.js";
import { createPost, getPostsForUser } from "./lib/db/queries/posts.js";

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

export type CommandsRegistry = Record<string, CommandHandler>;

export type UserCommandHandler = (cmdName: string, user: User, ...args: string[]) => Promise<void>;

export type middlewareLoggedIn = (handler: UserCommandHandler) => CommandHandler;

function printFeed(feed: Feed, user: User): void {
	console.log(`* ID: ${feed.id}`);
	console.log(`* Name: ${feed.name}`);
	console.log(`* URL: ${feed.url}`);
	console.log(`* User: ${user.name}`);
	console.log(`* Created at: ${feed.createdAt}`);
}

export const middlewareLoggedIn: middlewareLoggedIn = (handler: UserCommandHandler): CommandHandler => {
	return async (cmdName: string, ...args: string[]): Promise<void> => {
		const config = readConfig();
		if (!config.currentUserName) {
			throw new Error("No user is currently logged in");
		}

		const user = await getUserByName(config.currentUserName);
		if (!user) {
			throw new Error(`User ${config.currentUserName} not found`);
		}

		await handler(cmdName, user, ...args);
	};
};

async function scrapeFeeds(): Promise<void> {
	console.log("Fetching next feed...");

	const feed = await getNextFeedToFetch();

	if (!feed) {
		console.log("No feeds to fetch");
		return;
	}

	console.log(`Fetching feed: ${feed.name} (${feed.url})`);

	await markFeedFetched(feed.id);

	try {
		const rssFeed = await fetchFeed(feed.url);

		console.log(`Found ${rssFeed.items.length} posts in ${feed.name}`);

		let savedCount = 0;
		for (const item of rssFeed.items) {
		    const publishedAt = parsePublishedDate(item.pubDate);

		    const post = await createPost(
		    	item.title,
		    	item.link,
		    	item.description || null,
		    	publishedAt,
		    	feed.id
		    );

		    if (post) {
		    	savedCount++;
		    	console.log(`  Saved: ${item.title}`);
		    }
		    
		}

		console.log(`Successfully saved ${savedCount} new posts from ${feed.name}`);
	} catch (error) {
		console.error(`Error fetching feed ${feed.name}`, error);
	}

	console.log("Feed fetch complete");
}

export async function handlerBrowse(cmdName: string, user: User, ...args: string[]): Promise<void> {
	let limit = 2;

	if (args.length > 0) {
		limit = parseInt(args[0]);
		if (isNaN(limit) || limit < 1) {
			throw new Error("Limit must be a positive number");
		}
	}

	console.log(`Fetching the latest ${limit} posts...`);

	const results = await getPostsForUser(user.id, limit);

	if (results.length === 0) {
		console.log("No posts found. Follow some feeds first!");
		return;
	}

	console.log(`\nLatest posts for ${user.name}:\n`);

	for (const { post, feed } of results) {
		console.log(`Title: ${post.title}`);
		console.log(`Feed: ${feed.name}`);
		console.log(`URL: ${post.url}`);
		
		if (post.description) {
			const desc = post.description.length > 100
				? post.description.substring(0, 100) + "..." 
				: post.description;
			console.log(`Description: ${desc}`);
		}
		
		if (post.publishedAt) {
			console.log(`Published: ${post.publishedAt.toLocaleString()}`);
		}
		
		console.log("---");
	}
}

export async function handlerUnfollow(cmdName: string, user: User, ...args: string[]): Promise<void> {
	if (args.length === 0) {
		throw new Error("Usage: unfollow <url>");
	}

	const url = args[0];

	await deleteFeedFollow(user.id, url);

	console.log(`Successfully unfollowed ${url}`);
}

export async function handlerFollowing(cmdName: string, user: User, ...args: string[]): Promise<void> {
	const following = await getFeedFollowsForUser(user.id);

	if (following.length === 0) {
		console.log("Not following any feeds");
		return;
	}

	console.log(`Feeds followed by ${user.name}:`);
	for (const { feed } of following) {
		console.log(`* ${feed.name}`);
	}
}

export async function handlerFollow(cmdName: string, user: User, ...args: string[]): Promise<void> {
	if (args.length === 0) {
		throw new Error("Usage: follow <url>");
	}

	const url = args[0];

	const feed = await getFeedByUrl(url);
	if (!feed) {
		throw new Error(`Feed with URL ${url} not found`);
	}

	const result = await createFeedFollow(user.id, feed.id);

	console.log(`${result.user.name} is now following ${result.feed.name}`);
}

export async function handlerFeeds(cmdName: string, ...args: string[]): Promise<void> {
	const feedsData = await getFeeds();

	if (feedsData.length === 0) {
		console.log("No feeds found");
		return;
	}

	for (const { feed, user } of feedsData) {
		console.log(`* Name: ${feed.name}`);
		console.log(`  URL: ${feed.url}`);
		console.log(`  User: ${user.name}`);
	}
}

export async function handlerAddFeed(cmdName: string, user: User, ...args: string[]): Promise<void> {
	if (args.length < 2) {
		throw new Error("Usage: addfeed <name> <url>");
	}

	const name = args[0];
	const url = args[1];

	const feed = await createFeed(name, url, user.id);

	const followResult = await createFeedFollow(user.id, feed.id);

	console.log("Feed created successfully:");
	printFeed(feed, user);
	console.log(`${followResult.user.name} is now following ${followResult.feed.name}`);
}

export async function handlerAgg(cmdName: string, ...args: string[]): Promise<void> {
	if (args.length === 0) {
		throw new Error("Usage: agg <time_between_reqs>");
	}

	const durationStr = args[0];
	const timeBetweenRequests = parseDuration(durationStr);

	console.log(`Collecting feeds every ${formatDuration(timeBetweenRequests)}`);

	await scrapeFeeds();

	const interval = setInterval(() => {
		scrapeFeeds().catch((error) => {
			console.error("Error in scrapeFeeds:", error);
		});
	}, timeBetweenRequests);

	await new Promise<void>((resolve) => {
		process.on("SIGINT", () => {
			console.log("\nShutting down feed aggregator...");
			clearInterval(interval);
			resolve();
		});
	});
}

export async function handlerUsers(cmdName: string, ...args: string[]): Promise<void> {
	const config = readConfig();
	const currentUser = config.currentUserName;

	const users = await getUsers();

	if (users.length === 0) {
		console.log("No users found");
		return;
	}

	for (const user of users) {
	    if (user.name === currentUser) {
	    	console.log(`* ${user.name} (current)`);
	    } else {
	    	console.log(`* ${user.name}`);
	    }
	}
}

export async function handlerReset(cmdName: string, ...args: string[]): Promise<void> {
	await deleteAllUsers();
	console.log("Database reset successfully");
}

export async function handlerRegister(cmdName: string, ...args: string[]): Promise<void> {
	if (args.length === 0) {
		throw new Error("Usage: register <username>");
	}

	const username = args[0];

	const existingUser = await getUserByName(username);
	if (existingUser) {
		throw new Error(`User ${username} already exists`);
	}

	const newUser = await createUser(username);

	setUser(username);

	console.log(`User ${username} was created`);
	console.log(newUser);
}

export async function handlerLogin(cmdName: string, ...args: string[]): Promise<void> {
	if (args.length === 0) {
		throw new Error("Usage: login <username>");
	}

	const username = args[0];

	const user = await getUserByName(username);
	if (!user) {
		throw new Error(`User ${username} does not exist`);
	}

	setUser(username);
	console.log(`User has been set to: ${username}`);
}

export async function registerCommand(
	registry: CommandsRegistry,
	cmdName: string,
	handler: CommandHandler
): void {
	registry[cmdName] = handler;
}

export async function runCommand(
	registry: CommandsRegistry,
	cmdName: string,
	...args: string[]
): Promise<void> {
	const handler = registry[cmdName];

	if (!handler) {
		throw new Error(`Unknown command: ${cmdName}`);
	}

	await handler(cmdName, ...args);
}
