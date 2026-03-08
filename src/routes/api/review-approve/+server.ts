import { json, error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { records, history } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';
import { CASE_STATUSES, canChangeToStatus } from '$lib/utils/caseStatusUtils';
import { supabase } from '$lib/server/supabase';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const session = await locals.auth();

    if (!session?.user?.id) {
      throw error(401, 'Unauthorized');
    }

    const userRole = (session.user as { role?: string }).role || 'staff';

    // Only admin and dentist can use this endpoint
    if (userRole !== 'admin' && userRole !== 'dentist') {
      throw error(403, 'Only admin and dentist can approve cases');
    }

    // Check permission for "to be deliver" status
    if (!canChangeToStatus(userRole, CASE_STATUSES.TO_BE_DELIVER)) {
      throw error(403, `Role '${userRole}' cannot approve cases for delivery`);
    }

    const formData = await request.formData();
    const recordId = parseInt(formData.get('recordId')?.toString() || '0');

    if (!recordId) {
      throw error(400, 'Invalid recordId');
    }

    // Get current record
    const currentRecord = await db
      .select()
      .from(records)
      .where(eq(records.recordId, recordId));

    if (!currentRecord || currentRecord.length === 0) {
      throw error(404, 'Record not found');
    }

    if (currentRecord[0].caseStatus !== 'to be reviewed by dentist') {
      throw error(400, 'Case is not in "to be reviewed by dentist" status');
    }

    const userId = parseInt(session.user.id);
    const now = new Date();

    // Upload proof images to Supabase Storage
    const imageFiles = formData.getAll('proof-images') as File[];
    const uploadedUrls: string[] = [];

    for (const file of imageFiles) {
      if (file && file.size > 0 && file.name !== 'undefined') {
        const fileExt = file.name.split('.').pop() || 'jpg';
        const fileName = `review_${recordId}_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('history_images')
          .upload(fileName, file);

        if (!uploadError) {
          const { data: publicUrlData } = supabase.storage
            .from('history_images')
            .getPublicUrl(fileName);

          // Insert history entry for the review proof image
          await db.insert(history).values({
            historyType: 'review',
            recordId,
            imageUrl: publicUrlData.publicUrl,
            historyDate: now.toISOString().split('T')[0],
            historyTime: now.toLocaleTimeString('en-GB', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            }),
            createdBy: userId
          } as typeof history.$inferInsert);

          uploadedUrls.push(publicUrlData.publicUrl);
        } else {
          console.error('Supabase upload error:', uploadError);
          throw error(500, `Failed to upload proof image: ${uploadError.message}`);
        }
      }
    }

    await db
      .update(records)
      .set({
        caseStatus: CASE_STATUSES.TO_BE_DELIVER,
        updatedBy: userId
      } as any)
      .where(eq(records.recordId, recordId));

    return json({
      success: true,
      message: `Case #${recordId} approved for delivery`,
      imagesUploaded: uploadedUrls.length
    });
  } catch (err: any) {
    if (err instanceof Error && 'status' in err) {
      throw err;
    }
    console.error('Error approving case:', err);
    let errorMessage = err.message || 'Failed to approve case';
    if (err.code) errorMessage += ` (DB Error Code: ${err.code})`;
    if (err.detail) errorMessage += ` - ${err.detail}`;
    throw error(500, `Failed to approve case: ${errorMessage}`);
  }
};
