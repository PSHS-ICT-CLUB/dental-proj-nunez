import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { siteNotifications } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	try {
		const notifications = await db
			.select()
			.from(siteNotifications)
			.where(eq(siteNotifications.isActive, 'true'));

		return json({ notifications });
	} catch (error) {
		console.error('Failed to fetch notifications:', error);
		return json({ notifications: [] });
	}
};
