import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "../index.js";
import { feeds, users } from "../schema.js";

export async function createFeed(name: string, url: string,
userId: string) {
	const [result] = await db
	    .insert(feeds)
	    .values({ name, url, userId })
	    .returning();
	return result;
}

export async function getFeeds() {
	const results = await db
	    .select({
	    	feed: feeds,
	    	user: users,
	    })
	    .from(feeds)
	    .innerJoin(users, eq(feeds.userId, users.id));

    return results;
}

export async function getFeedByUrl(url: string) {
	const [result] = await db
	    .select()
	    .from(feeds)
	    .where(eq(feeds.url, url));

	return result;
}

export async function markFeedFetched(feedId: string) {
	const now = new Date();
	await db
	    .update(feeds)
	    .set({
	    	lastFetchedAt: now,
	    	updatedAt: now,
	    })
	    .where(eq(feeds.id, feedId));
}

export async function getNextFeedToFetch() {
	const [result] = await db
	    .select()
	    .from(feeds)
	    .orderBy(sql`${feeds.lastFetchedAt} NULLS FIRST`)
	    .limit(1);

	return result;
}
