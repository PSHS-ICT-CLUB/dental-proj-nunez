import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { caseTypes } from '../src/lib/server/db/schema.ts';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in .env');
  }

  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  try {
    const existing = await db.select().from(caseTypes);
    console.log(JSON.stringify(existing, null, 2));
  } catch (error) {
    console.error('Error fetching case types:', error);
  } finally {
    await client.end();
    process.exit(0);
  }
}

main();
