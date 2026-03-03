import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { records } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { CASE_STATUSES, canChangeToStatus, ROLE_PERMISSIONS } from '$lib/utils/caseStatusUtils';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.auth();

    // Check if user is authenticated
    if (!session?.user?.id) {
      throw error(401, 'Unauthorized');
    }

    // Get user role
    const userRole = (session.user as any).role || 'staff';

    // Parse request body
    const body = await request.json();
    const { recordId, newStatus } = body;

    // Validate inputs
    if (!recordId || typeof recordId !== 'number') {
      throw error(400, 'Invalid recordId');
    }

    // Validate status value
    const validStatuses = Object.values(CASE_STATUSES);
    if (!newStatus || !validStatuses.includes(newStatus)) {
      throw error(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    // Check permissions based on role
    if (!canChangeToStatus(userRole, newStatus)) {
      throw error(
        403,
        `Role '${userRole}' cannot change status to '${newStatus}'. Allowed statuses: ${(ROLE_PERMISSIONS[userRole.toLowerCase()] || []).join(', ')}`
      );
    }

    // Get current record
    const currentRecord = await db.select().from(records).where(eq(records.recordId, recordId));
    if (!currentRecord || currentRecord.length === 0) {
      throw error(404, 'Record not found');
    }

    // Update the status
    const userId = parseInt(session.user.id);

    // Prepare update data
    const updateData: any = {
      caseStatus: newStatus,
      updatedBy: userId
    };

    // If changing to "to be deliver", set the OUT date and time
    if (newStatus === CASE_STATUSES.TO_BE_DELIVER) {
      const now = new Date();
      updateData.dateOut = now.toISOString().split('T')[0]; // YYYY-MM-DD
      updateData.timeOut = now.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    }

    const updatedRecord = await db
      .update(records)
      .set(updateData)
      .where(eq(records.recordId, recordId))
      .returning({
        recordId: records.recordId,
        patientName: records.patientName,
        caseStatus: records.caseStatus,
        dateOut: records.dateOut,
        timeOut: records.timeOut
      });

    return json({
      success: true,
      message: `Case status updated to '${newStatus}'${newStatus === CASE_STATUSES.TO_BE_DELIVER ? ' - Case OUT' : ''}`,
      record: updatedRecord[0]
    });
  } catch (err) {
    if (err instanceof Error && 'status' in err) {
      // It's a SvelteKit error
      throw err;
    }

    console.error('Error updating case status:', err);
    throw error(500, 'Failed to update case status');
  }
};

export const GET: RequestHandler = async () => {
  return json({
    validStatuses: Object.values(CASE_STATUSES),
    rolePermissions: ROLE_PERMISSIONS
  });
};
