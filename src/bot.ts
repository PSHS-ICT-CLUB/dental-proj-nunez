/**
 * Discord Bot Entry Point
 * Run with: bun run src/bot.ts
 */

import { startBot } from './lib/server/discord-bot';
import postgres from 'postgres';

async function main() {
	console.log('Dental Lab Discord Bot Starting...');

	// Get config from database or environment
	const DATABASE_URL = process.env.DATABASE_URL;

	if (!DATABASE_URL) {
		console.error('DATABASE_URL not set in environment');
		process.exit(1);
	}

	const sql = postgres(DATABASE_URL);

	try {
		// Try to get Discord config from database
		const configs = await sql`
      SELECT key, value FROM app_config 
      WHERE key IN ('DISCORD_BOT_TOKEN', 'DISCORD_GUILD_ID')
    `;

		const configMap: Record<string, string> = {};
		for (const row of configs) {
			configMap[row.key] = row.value;
		}

		// Prefer database values, fall back to environment
		const token = configMap['DISCORD_BOT_TOKEN'] || process.env.DISCORD_BOT_TOKEN;
		const guildId = configMap['DISCORD_GUILD_ID'] || process.env.DISCORD_GUILD_ID;

		if (!token) {
			console.error('DISCORD_BOT_TOKEN not found in database or environment');
			console.log('Set it with: /config key:DISCORD_BOT_TOKEN value:your_token');
			console.log('   Or add to .env file');
			process.exit(1);
		}

		console.log('Config loaded from database');
		console.log(`Guild ID: ${guildId || 'global (all servers)'}`);

		await startBot(token, guildId);
	} catch (error) {
		console.error('Failed to start bot:', error);
		process.exit(1);
	}
}

main();
