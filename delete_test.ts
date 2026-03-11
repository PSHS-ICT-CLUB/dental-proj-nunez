import { db } from './src/lib/server/db';
import { caseTypes } from './src/lib/server/db/schema';
import { eq } from 'drizzle-orm';

async function test() {
    try {
        await db.delete(caseTypes).where(eq(caseTypes.caseTypeId, 1));
        console.log("Deleted");
    } catch (e) {
        console.error(e);
    }
    process.exit(0);
}
test();
