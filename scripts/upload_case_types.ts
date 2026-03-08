import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { caseTypes } from '../src/lib/server/db/schema.ts';

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set in .env');
  }

  const client = postgres(process.env.DATABASE_URL, { max: 1 });
  const db = drizzle(client);

  const caseTypesData = [
    { caseTypeName: 'OR', numberOfCases: 0 },
    { caseTypeName: 'F', numberOfCases: 0 },
    { caseTypeName: 'TH', numberOfCases: 0 },
    { caseTypeName: 'IVO', numberOfCases: 0 },
    { caseTypeName: 'R', numberOfCases: 0 },
    { caseTypeName: 'P', numberOfCases: 0 },
    { caseTypeName: 'TIL', numberOfCases: 0 },
    { caseTypeName: 'Z', numberOfCases: 0 },
    { caseTypeName: 'TC', numberOfCases: 0 },
    { caseTypeName: 'BJ', numberOfCases: 0 }
  ];

  try {
    console.log('Checking existing case types...');
    const existing = await db.select().from(caseTypes);
    console.log(`Found ${existing.length} existing case types.`);

    console.log('Inserting case types...');
    await db.insert(caseTypes)
      .values(caseTypesData)
      .onConflictDoNothing({ target: caseTypes.caseTypeName });

    console.log('Successfully added missing case types!');
  } catch (error) {
    console.error('Error inserting case types:', error);
  } finally {
    await client.end();
    process.exit(0);
  }
}

main();
