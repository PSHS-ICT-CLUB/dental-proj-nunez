import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { inventoryItems, inventorySuppliers, inventoryLogs, users } from '$lib/server/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { requireDeletePermission } from '$lib/server/roles';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth();

  // Use Promise.all to fetch items and suppliers concurrently
  const [itemsWithSuppliers, suppliers] = await Promise.all([
    // Fetch all items with their supplier's name
    db
      .select({
        id: inventoryItems.id,
        name: inventoryItems.name,
        category: inventoryItems.category,
        currentStock: inventoryItems.currentStock,
        unit: inventoryItems.unit,
        cost: inventoryItems.cost,
        minimumStockLevel: inventoryItems.minimumStockLevel,
        expirationDate: inventoryItems.expirationDate,
        supplierId: inventoryItems.supplierId,
        supplierName: inventorySuppliers.name
      })
      .from(inventoryItems)
      .leftJoin(inventorySuppliers, eq(inventoryItems.supplierId, inventorySuppliers.id))
      .orderBy(inventoryItems.name),

    // Fetch all suppliers for the dropdown
    db.select().from(inventorySuppliers).orderBy(inventorySuppliers.name)
  ]);

  return {
    items: itemsWithSuppliers,
    suppliers,
    user: session?.user
  };
};

export const actions: Actions = {
  addItem: async ({ request }) => {
    const data = await request.formData();
    const name = data.get('name')?.toString();
    const category = data.get('category')?.toString();
    const currentStock = parseInt(data.get('current_stock')?.toString() || '0', 10);
    const cost = data.get('cost')?.toString() || '0';
    const unit = data.get('unit')?.toString();
    const minimumStockLevel = parseInt(data.get('minimum_stock_level')?.toString() || '0', 10);
    const supplierId = data.get('supplier_id')?.toString() ? parseInt(data.get('supplier_id')!.toString(), 10) : null;

    // Optional expiration date
    const expirationDate = data.get('expiration_date')?.toString() || null;

    if (!name) {
      return { success: false, error: 'Item name is required' };
    }

    try {
      const [newItem] = await db.insert(inventoryItems).values({
        name,
        category,
        currentStock,
        unit,
        cost,
        minimumStockLevel,
        supplierId,
        expirationDate
      } as typeof inventoryItems.$inferInsert).returning();

      // Log initial stock if > 0
      if (currentStock > 0) {
        await db.insert(inventoryLogs).values({
          itemId: newItem.id,
          actionType: 'IN',
          quantity: currentStock,
          remarks: 'Initial stock setup'
        } as typeof inventoryLogs.$inferInsert);
      }

      return { success: true, message: 'Item added successfully' };
    } catch (error) {
      console.error('Error adding item:', error);
      return { success: false, error: 'Failed to add item' };
    }
  },

  adjustStock: async ({ request, locals }) => {
    const data = await request.formData();
    const idStr = data.get('item_id')?.toString();
    const actionType = data.get('action_type')?.toString(); // IN, OUT, ADJUSTMENT
    const quantityStr = data.get('quantity')?.toString();
    const remarks = data.get('remarks')?.toString() || '';

    if (!idStr || !actionType || !quantityStr) {
      return { success: false, error: 'Missing required fields' };
    }

    const itemId = parseInt(idStr, 10);
    let quantity = parseInt(quantityStr, 10);

    if (quantity <= 0 && actionType !== 'ADJUSTMENT') {
      return { success: false, error: 'Quantity must be greater than zero' };
    }

    try {
      // Get current item
      const [item] = await db.select().from(inventoryItems).where(eq(inventoryItems.id, itemId));
      if (!item) return { success: false, error: 'Item not found' };

      let newStock = item.currentStock;
      let actualChange = quantity;

      if (actionType === 'IN') {
        newStock += quantity;
      } else if (actionType === 'OUT') {
        if (item.currentStock < quantity) {
          return { success: false, error: 'Insufficient stock!' };
        }
        newStock -= quantity;
      } else if (actionType === 'ADJUSTMENT') {
        // quantity here is the NEW total stock
        actualChange = Math.abs(quantity - item.currentStock);
        newStock = quantity;
      }

      // 1. Update stock
      await db.update(inventoryItems)
        .set({ currentStock: newStock } as any)
        .where(eq(inventoryItems.id, itemId));

      // 2. Insert log
      // We can get user from locals.user.id if Auth is set up, but currently other routes use 'created_by'
      // In Dental project, user session might be available. If not, we will leave createdBy null for now.
      await db.insert(inventoryLogs).values({
        itemId,
        actionType,
        quantity: actionType === 'ADJUSTMENT' ? quantity : actualChange,
        remarks: actionType === 'ADJUSTMENT' ? `Adjusted to ${quantity}. ${remarks}` : remarks
      } as typeof inventoryLogs.$inferInsert);

      return { success: true, message: 'Stock updated successfully' };
    } catch (error) {
      console.error('Error adjusting stock:', error);
      return { success: false, error: 'Failed to adjust stock' };
    }
  },

  deleteItem: async ({ request, locals }) => {
    const denied = await requireDeletePermission(locals);
    if (denied) return denied;

    const data = await request.formData();
    const idStr = data.get('item_id')?.toString();

    if (!idStr) return { success: false, error: 'Item ID required' };

    try {
      // Check if there are logs, we might need to delete logs first depending on ON DELETE restrictions
      await db.delete(inventoryLogs).where(eq(inventoryLogs.itemId, parseInt(idStr, 10)));
      await db.delete(inventoryItems).where(eq(inventoryItems.id, parseInt(idStr, 10)));

      return { success: true, message: 'Item deleted successfully' };
    } catch (error) {
      console.error('Error deleting item:', error);
      return { success: false, error: 'Failed to delete item' };
    }
  }
};
