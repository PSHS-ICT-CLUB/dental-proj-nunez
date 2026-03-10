import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { caseTypes } from '../src/lib/server/db/schema.ts';
import { eq } from 'drizzle-orm';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in .env');
  }

  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  try {
    const existing = await db.select().from(caseTypes);
    console.log(`Found ${existing.length} existing case types.`);

    let updatedCount = 0;
    for (const type of existing) {
      // Only update if abbrv is empty (our default)
      if (type.caseTypeAbbrv === '') {
        await db.update(caseTypes)
          .set({ caseTypeAbbrv: type.caseTypeName })
          .where(eq(caseTypes.caseTypeId, type.caseTypeId));
        updatedCount++;
      }
    }
    console.log(`Successfully migrated ${updatedCount} case types to have an abbreviation.`);
  } catch (error) {
    console.error('Error migrating case types:', error);
  } finally {
    await client.end();
    process.exit(0);
  }
}

main();
