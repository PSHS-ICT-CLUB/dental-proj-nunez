module.exports = {
	apps: [
		{
			name: 'dental-server',
			script: 'bun',
			args: 'run preview:solo --host',
			watch: false,
			env: {
				NODE_ENV: 'production'
			}
		},
		{
			name: 'dental-bot',
			script: 'bun',
			args: 'run src/bot.ts',
			watch: false,
			env: {
				NODE_ENV: 'production'
			}
		}
	],

	deploy: {
		production: {
			user: 'SSH_USERNAME',
			host: 'SSH_HOSTMACHINE',
			ref: 'origin/master',
			repo: 'GIT_REPOSITORY',
			path: 'DESTINATION_PATH',
			'pre-deploy-local': '',
			'post-deploy': 'bun install && pm2 reload ecosystem.config.js --env production',
			'pre-setup': ''
		}
	}
};
