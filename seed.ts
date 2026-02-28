import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './src/lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { randomBytes, pbkdf2Sync } from 'node:crypto';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL is not set in .env');
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, { schema });
const users = schema.users;

// Reusing same hashing logic for credentials plugin
function hashPasswordWithSalt(password: string, salt: string): string {
	const derived = pbkdf2Sync(password, salt, 120000, 32, 'sha256');
	return derived.toString('hex');
}

async function seedAdmin() {
	console.log('Seeding initial admin user...');

	// Default admin details
	const email = 'admin@admin.com';
	const password = 'admin123';

	// Hash password
	const salt = randomBytes(16).toString('hex');
	const hash = hashPasswordWithSalt(password, salt);
	// Storing as algorithm:salt:hash (just like the previous setup)
	const passwordHash = `pbkdf2_sha256:${salt}:${hash}`;

	try {
		// Check if user already exists
		const [existingUser] = await db.select().from(users).where(eq(users.email, email));

		if (existingUser) {
			console.log(`User ${email} already exists. Updating password and role...`);
			await db
				.update(users)
				.set({ passwordHash, role: 'admin', name: 'System Admin' })
				.where(eq(users.id, existingUser.id));
			console.log('✅ Admin user successfully updated!');
		} else {
			await db.insert(users).values({
				name: 'System Admin',
				email,
				passwordHash,
				role: 'admin'
			});
			console.log('✅ Admin user successfully created!');
		}

		console.log(`Email: ${email}`);
		console.log(`Password: ${password}`);
		console.log('\n⚠️ PLEASE CHANGE THIS PASSWORD AFTER LOGGING IN!');
	} catch (e: any) {
		console.error('Failed to seed user:', e);
	}

	process.exit(0);
}

seedAdmin();
