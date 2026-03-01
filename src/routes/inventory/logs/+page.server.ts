import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { inventoryLogs, inventoryItems, users } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
  // Fetch all logs joined with items and users
  const logs = await db
    .select({
      id: inventoryLogs.id,
      actionType: inventoryLogs.actionType,
      quantity: inventoryLogs.quantity,
      date: inventoryLogs.date,
      remarks: inventoryLogs.remarks,
      itemName: inventoryItems.name,
      unit: inventoryItems.unit,
      userName: users.name
    })
    .from(inventoryLogs)
    .leftJoin(inventoryItems, eq(inventoryLogs.itemId, inventoryItems.id))
    .leftJoin(users, eq(inventoryLogs.createdBy, users.id))
    .orderBy(desc(inventoryLogs.date));

  return {
    logs
  };
};
