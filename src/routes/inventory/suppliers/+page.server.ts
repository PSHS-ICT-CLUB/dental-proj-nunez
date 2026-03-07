import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { inventorySuppliers } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { requireDeletePermission } from '$lib/server/roles';

export const load: PageServerLoad = async () => {
  const suppliers = await db.select().from(inventorySuppliers).orderBy(inventorySuppliers.name);

  return {
    suppliers
  };
};

export const actions: Actions = {
  add: async ({ request }) => {
    const data = await request.formData();
    const name = data.get('name')?.toString();
    const contactPerson = data.get('contact_person')?.toString();
    const phone = data.get('phone')?.toString();
    const email = data.get('email')?.toString();
    const address = data.get('address')?.toString();
    const notes = data.get('notes')?.toString();

    if (!name) {
      return {
        success: false,
        error: 'Supplier name is required'
      };
    }

    try {
      const [newSupplier] = await db.insert(inventorySuppliers).values({
        name,
        contactPerson,
        phone,
        email,
        address,
        notes
      } as any).returning();

      return {
        success: true,
        message: 'Supplier added successfully'
      };
    } catch (error) {
      console.error('Error adding supplier:', error);
      return {
        success: false,
        error: 'Failed to add supplier'
      };
    }
  },

  deleteSupplier: async ({ request, locals }) => {
    const denied = await requireDeletePermission(locals);
    if (denied) return denied;

    const data = await request.formData();
    const idStr = data.get('id')?.toString();

    if (!idStr) {
      return {
        success: false,
        error: 'Supplier ID is required'
      };
    }

    try {
      // NOTE: We should check if the supplier has associated inventory items first,
      // or rely on a foreign key cascade/restrict. Right now, Drizzle references
      // don't have explicit onDelete actions so it will restrict if items exist.
      await db.delete(inventorySuppliers).where(eq(inventorySuppliers.id, parseInt(idStr, 10)));

      return {
        success: true,
        message: 'Supplier deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting supplier:', error);
      return {
        success: false,
        error: 'Failed to delete supplier (Make sure no items are linked to it)'
      };
    }
  }
};
