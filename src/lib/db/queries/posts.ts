import { desc, eq } from "drizzle-orm";
import { db } from "../index.js";
import { posts, feeds, feedFollows } from "../schema.js";

export async function createPost(
	title: string,
	url: string,
	description: string | null,
	publishedAt: Date | null,
	feedId: string
) {
	try {
		const [result] = await db
		    .insert(posts)
		    .values({
		    	title,
		    	url,
		    	description,
		    	publishedAt,
		    	feedId,
		    })
		    .returning();
		return result;
	} catch (error: any) {
	    if (
	        error?.cause?.code === "23505" || 
	        error?.code === "23505" ||
	        error?.message?.includes("duplicate key") || 
	        error?.message?.includes("unique")
	    ) {
	    	return null;
	    }
		throw error;
	}
}

export async function getPostsForUser(userId: string, limit: number = 2) {
	const results = await db
	    .select({
	    	post: posts,
	    	feed: feeds,
	    })
	    .from(posts)
	    .innerJoin(feeds, eq(posts.feedId, feeds.id))
	    .innerJoin(feedFollows, eq(feeds.id, feedFollows.feedId))
	    .where(eq(feedFollows.userId, userId))
	    .orderBy(desc(posts.publishedAt))
	    .limit(limit);

    return results;
}
