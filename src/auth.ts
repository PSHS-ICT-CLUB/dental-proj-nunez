import { SvelteKitAuth } from '@auth/sveltekit';
import Credentials from '@auth/sveltekit/providers/credentials';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { pbkdf2Sync, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';

// Reuse hashing verification logic
function verifyPassword(password: string, storedHash: string): boolean {
	try {
		const parts = storedHash.split(':');
		if (parts.length !== 3) return false;
		const [algorithm, salt, hash] = parts as ['pbkdf2_sha256', string, string];
		if (algorithm !== 'pbkdf2_sha256') return false;

		const derived = pbkdf2Sync(password, salt, 120000, 32, 'sha256');
		const computedHash = derived.toString('hex');

		return timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(hash, 'hex'));
	} catch (error) {
		console.error('Password verification error', error);
		return false;
	}
}

export const { handle, signIn, signOut } = SvelteKitAuth({
	providers: [
		Credentials({
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' }
			},
			authorize: async (credentials) => {
				if (!credentials?.email || !credentials?.password) {
					return null;
				}

				const email = String(credentials.email);
				const password = String(credentials.password);

				// Find user by email
				const [user] = await db
					.select({
						id: users.id,
						email: users.email,
						name: users.name,
						passwordHash: users.passwordHash,
						role: users.role
					})
					.from(users)
					.where(eq(users.email, email));

				if (!user) {
					return null;
				}

				// Verify password
				const isValid = verifyPassword(password, user.passwordHash);

				if (!isValid) {
					return null;
				}

				// Return user object for session
				return {
					id: user.id.toString(),
					email: user.email,
					name: user.name,
					role: user.role
				};
			}
		})
	],
	secret: env.AUTH_SECRET,
	callbacks: {
		jwt: async ({ token, user }) => {
			if (user) {
				token.id = user.id;
				// @ts-ignore
				token.role = user.role;
			}
			return token;
		},
		session: async ({ session, token }) => {
			if (session.user) {
				// @ts-ignore
				session.user.id = token.id;
				// @ts-ignore
				session.user.role = token.role;
			}
			return session;
		}
	},
	session: {
		strategy: 'jwt',
		maxAge: 30 * 24 * 60 * 60 // 30 days
	},
	pages: {
		signIn: '/login'
	},
	basePath: '/auth',
	trustHost: true
});
