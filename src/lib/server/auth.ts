import { db } from './db';
import { appSettings } from './db/schema';
import { eq } from 'drizzle-orm';
import { pbkdf2Sync, timingSafeEqual, randomBytes } from 'node:crypto';

const ADMIN_PASSWORD_KEY = 'admin_password_hash';

function hashPassword(password: string): string {
	const salt = randomBytes(16).toString('hex');
	const hash = pbkdf2Sync(password, salt, 120000, 32, 'sha256').toString('hex');
	return `pbkdf2_sha256:${salt}:${hash}`;
}

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

export async function isPasswordSet(): Promise<boolean> {
	try {
		const [setting] = await db
			.select()
			.from(appSettings)
			.where(eq(appSettings.key, ADMIN_PASSWORD_KEY))
			.limit(1);

		return !!setting?.value;
	} catch (e) {
		console.error('Error checking if password is set:', e);
		return false;
	}
}

export async function setAdminPassword(password: string): Promise<void> {
	const hashed = hashPassword(password);

	const exists = await isPasswordSet();
	if (exists) {
		await db
			.update(appSettings)
			.set({ value: hashed })
			.where(eq(appSettings.key, ADMIN_PASSWORD_KEY));
	} else {
		await db.insert(appSettings).values({ key: ADMIN_PASSWORD_KEY, value: hashed });
	}
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
	try {
		const [setting] = await db
			.select()
			.from(appSettings)
			.where(eq(appSettings.key, ADMIN_PASSWORD_KEY))
			.limit(1);

		if (!setting?.value) return false;

		return verifyPassword(password, setting.value);
	} catch (e) {
		console.error('Error verifying admin password:', e);
		return false;
	}
}

export async function removeAdminPassword(): Promise<void> {
	try {
		await db.delete(appSettings).where(eq(appSettings.key, ADMIN_PASSWORD_KEY));
	} catch (e) {
		console.error('Error removing admin password:', e);
		throw e;
	}
}
