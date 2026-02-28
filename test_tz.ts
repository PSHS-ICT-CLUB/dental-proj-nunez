import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { appConfig } from './src/lib/server/db/schema.js';
import { eq } from 'drizzle-orm';

async function testTz() {
  const sql = postgres(process.env.DATABASE_URL);
  const db = drizzle(sql);

  const testKey = 'tz_test_insert_' + Date.now();
  console.log("Current Node Time:", new Date().toString());

  // Insert
  await db.insert(appConfig).values({
    key: testKey,
    value: 'test_value'
  });

  const result = await db.select().from(appConfig).where(eq(appConfig.key, testKey));
  console.log("Inserted Record:", result);

  await db.delete(appConfig).where(eq(appConfig.key, testKey));
  console.log("Cleaned up");
  await sql.end();
  process.exit(0);
}

testTz().catch(console.error);
