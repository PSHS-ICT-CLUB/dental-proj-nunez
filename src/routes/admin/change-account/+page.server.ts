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

	// Fetch all users for the dropdown
	const allUsers = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			role: users.role
		})
		.from(users);

	return {
		user: session.user,
		users: allUsers
	};
};

function hashPassword(password: string): string {
	const salt = randomBytes(16).toString('hex');
	const derived = pbkdf2Sync(password, salt, 120000, 32, 'sha256');
	const hash = derived.toString('hex');
	return `pbkdf2_sha256:${salt}:${hash}`;
}

export const actions: Actions = {
	update: async (event) => {
		const session = await event.locals.auth();

		if (!session?.user || session.user.role !== 'admin') {
			return fail(403, { message: 'Forbidden: Admin access required.' });
		}

		const formData = await event.request.formData();
		const userId = formData.get('userId') as string;
		const name = formData.get('name') as string;
		const email = formData.get('email') as string;
		const role = formData.get('role') as string;
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		if (!userId || !name || !email || !role) {
			return fail(400, { message: 'User, name, role, and email are required.' });
		}

		const userIdNum = parseInt(userId);
		if (isNaN(userIdNum)) {
			return fail(400, { message: 'Invalid user selected.' });
		}

		// Check if user exists
		const [targetUser] = await db.select().from(users).where(eq(users.id, userIdNum));
		if (!targetUser) {
			return fail(400, { message: 'User not found.' });
		}

		// If email changed, check uniqueness
		if (email !== targetUser.email) {
			const [existingUser] = await db.select().from(users).where(eq(users.email, email));
			if (existingUser) {
				return fail(400, { message: 'Email is already in use by another user.' });
			}
		}

		// If password is being changed, validate and hash
		let passwordHash = targetUser.passwordHash;
		if (password) {
			if (password !== confirmPassword) {
				return fail(400, { message: 'Passwords do not match.' });
			}
			if (password.length < 6) {
				return fail(400, { message: 'Password must be at least 6 characters long.' });
			}
			passwordHash = hashPassword(password);
		}

		try {
			await db
				.update(users)
				.set({
					name,
					email,
					role,
					passwordHash
				} as any)
				.where(eq(users.id, userIdNum));

			return { success: true, message: 'Account updated successfully!' };
		} catch (e) {
			console.error('Failed to update account:', e);
			return fail(500, { message: 'An error occurred while updating the account.' });
		}
	}
};
