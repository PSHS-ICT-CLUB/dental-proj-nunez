import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { pbkdf2Sync, randomBytes } from 'node:crypto';

export const load: PageServerLoad = async (event) => {
	const session = await event.locals.auth();

	if (!session?.user) {
		redirect(303, '/login');
	}

	if (session.user.role !== 'admin') {
		error(403, 'Forbidden: You do not have permission to access this page.');
	}

	return {
		user: session.user
	};
};

function hashPassword(password: string): string {
	const salt = randomBytes(16).toString('hex');
	const derived = pbkdf2Sync(password, salt, 120000, 32, 'sha256');
	const hash = derived.toString('hex');
	return `pbkdf2_sha256:${salt}:${hash}`;
}

export const actions: Actions = {
	create: async (event) => {
		const session = await event.locals.auth();

		if (!session?.user || session.user.role !== 'admin') {
			return fail(403, { message: 'Forbidden: Admin access required.' });
		}

		const formData = await event.request.formData();
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const role = formData.get('role') as string;

		if (!name || !email || !password || !role) {
			return fail(400, { message: 'All fields are required.', name, email, role });
		}

		// Check if email already exists
		const [existingUser] = await db.select().from(users).where(eq(users.email, email));
		if (existingUser) {
			return fail(400, { message: 'Email is already in use.', name, email, role });
		}

		const passwordHash = hashPassword(password);

		try {
			await db.insert(users).values({
				name,
				email,
				passwordHash,
				role
			} as any);

			return { success: true, message: 'Account created successfully!' };
		} catch (e) {
			console.error('Failed to create account:', e);
			return fail(500, {
				message: 'An error occurred while creating the account.',
				name,
				email,
				role
			});
		}
	}
};
