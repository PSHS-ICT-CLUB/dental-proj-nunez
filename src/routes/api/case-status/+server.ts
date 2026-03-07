import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { records } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { CASE_STATUSES, canChangeToStatus, ROLE_PERMISSIONS, getStatusWorkflow } from '$lib/utils/caseStatusUtils';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.auth();

    // Check if user is authenticated
    if (!session?.user?.id) {
      throw error(401, 'Unauthorized');
    }

    // Get user role
    const userRole = (session.user as { role?: string }).role || 'staff';

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

    // Validate workflow progression for non-admins
    if (userRole !== 'admin') {
      const currentState = currentRecord[0].caseStatus;
      const workflow = getStatusWorkflow().find(s => s.status === currentState);

      const isForward = workflow?.nextStages.includes(newStatus as typeof workflow.nextStages[number]);
      if (!isForward && currentState !== newStatus) {
        throw error(403, `Role '${userRole}' can only advance cases forward in the workflow. Reversions require admin access.`);
      }
    }

    // Update the status
    const userId = parseInt(session.user.id);

    const updatedRecord = await db
      .update(records)
      .set({
        caseStatus: newStatus,
        updatedBy: userId
      } as any)
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
