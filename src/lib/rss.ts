import { XMLParser } from "fast-xml-parser";
import { RSSFeed } from "../types.js";

export function parsePublishedDate(dateString: string): Date | null {
	try {
		const date = new Date(dateString);

		if (isNaN(date.getTime())) {
			console.warn(`Could not parse date: ${dateString}`);
			return null;
		}

		return date;
	} catch (error) {
		console.warn(`Error parsing date: ${dateString}`, error);
		return null;
	}
}

export async function fetchFeed(feedURL: string): Promise<RSSFeed> {
	const response = await fetch(feedURL, {
		headers: {
			"User-Agent": "gator",
		},
	});

	const xmlText = await response.text();

	const parser = new XMLParser();
	const parsed = parser.parse(xmlText);

	if (!parsed.rss || !parsed.rss.channel) {
		throw new Error("Invalid RSS feed: missing channel");
	}

	const channel = parsed.rss.channel;

	if (!channel.title || !channel.link || !channel.description) {
		throw new Error("Invalid RSS feed: missing required channel fields");
	}

	const title = channel.title;
	const link = channel.link;
	const description = channel.description;

	let items = channel.item;

	if (!Array.isArray(items)) {
		items = [];
	}

	const validItems = [];
	for (const item of items) {
		if (!item.title || !item.link || !item.description || !item.pubDate) {
			continue;
		}

		validItems.push({
			title: item.title,
			link: item.link,
			description: item.description,
			pubDate: item.pubDate,
		});
	}

	return {
		title,
		link,
		description,
		items: validItems,
	};
}
