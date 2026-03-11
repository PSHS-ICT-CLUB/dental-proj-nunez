import { db } from './src/lib/server/db';
import { caseTypes, orderItems } from './src/lib/server/db/schema';

async function main() {
	const res = await db.insert(caseTypes).values({
		caseTypeName: 'Test Case Type',
		caseTypeAbbrv: 'TCT',
		numberOfCases: 1
	}).returning();

	const ctId = res[0].caseTypeId;
	console.log("Inserted case type", ctId);

	await db.insert(orderItems).values({
		caseTypeId: ctId,
		upOrDown: 'up',
		caseNo: '123',
		itemCost: '100',
		itemQuantity: 1
	});

	console.log("Inserted order item linking to it.");
}
main().catch(console.error).finally(() => process.exit(0));
