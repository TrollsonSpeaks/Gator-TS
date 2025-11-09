import { eq, and } from "drizzle-orm";
import { db } from "../index.js";
import { feedFollows, feeds, users } from "../schema.js";

export async function deleteFeedFollow(userId: string, feedUrl: string) {
	const [feed] = await db
	    .select()
	    .from(feeds)
	    .where(eq(feeds.url, feedUrl));

    if (!feed) {
    	throw new Error(`Feed with URL ${feedUrl} not found`);
    }

    const result = await db
        .delete(feedFollows)
        .where(
        	and(
        		eq(feedFollows.userId, userId),
        		eq(feedFollows.feedId, feed.id)
        	)
        )
        .returning();

        if (result.length === 0) {
        	throw new Error("You are not following this feed");
        }

        return result[0];
}

export async function createFeedFollow(userId: string, feedId: string) {
	const [newFeedFollow] = await db
	    .insert(feedFollows)
	    .values({ userId, feedId })
	    .returning();

	const [result] = await db
	    .select({
	    	feedFollow: feedFollows,
	    	feed: feeds,
	    	user: users,
	    })
	    .from(feedFollows)
	    .innerJoin(feeds, eq(feedFollows.feedId, feeds.id))
	    .innerJoin(users, eq(feedFollows.userId, users.id))
	    .where(eq(feedFollows.id, newFeedFollow.id));

	return result;
}

export async function getFeedFollowsForUser(userId: string) {
	const results = await db
	    .select({
	    	feedFollow: feedFollows,
	    	feed: feeds,
	    	user: users,
	    })
	    .from(feedFollows)
	    .innerJoin(feeds, eq(feedFollows.feedId, feeds.id))
	    .innerJoin(users, eq(feedFollows.userId, users.id))
	    .where(eq(feedFollows.userId, userId));

    return results;
}
