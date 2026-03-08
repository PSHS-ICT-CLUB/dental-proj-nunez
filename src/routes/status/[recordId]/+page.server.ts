import { db } from '$lib/server/db';
import { clinics, doctors, records, history } from '$lib/server/db/schema';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { eq, sql } from 'drizzle-orm';
import { supabase } from '$lib/server/supabase';

export const load: PageServerLoad = async (event) => {
  const session = await event.locals.auth();

  if (!session?.user) {
    redirect(303, '/login');
  }

  const userRole = (session.user as { role?: string }).role || 'staff';

  try {
    const recordData = await db
      .select({
        recordId: records.recordId,
        patientName: records.patientName,
        caseStatus: records.caseStatus,
        createdAt: records.createdAt,
        doctorName: doctors.doctorName,
        clinicName: clinics.clinicName,
        dateOut: records.dateOut
      })
      .from(records)
      .leftJoin(doctors, eq(records.doctorId, doctors.doctorId))
      .leftJoin(clinics, eq(doctors.clinicId, clinics.clinicId))
      .where(sql`${records.recordId} = ${event.params.recordId}`)
      .limit(1);

    if (!recordData || recordData.length === 0) {
      throw error(404, 'Record not found');
    }

    return {
      record: recordData[0],
      userRole
    };
  } catch (e) {
    console.error('Error fetching record:', e);
    throw error(500, 'Failed to fetch record details');
  }
};

export const actions: Actions = {
  processIn: async ({ request }) => {
    const data = await request.formData();
    const recordIdStr = data.get('recordId')?.toString();
    if (!recordIdStr) return { success: false, error: 'Record ID is required', type: 'in' };
    const recordId = parseInt(recordIdStr, 10);

    try {
      // Check if case status is "to be deliver" before allowing action
      const recordCheck = await db
        .select({ caseStatus: records.caseStatus })
        .from(records)
        .where(eq(records.recordId, recordId));

      if (!recordCheck || recordCheck.length === 0) {
        return { success: false, error: 'Record not found', type: 'in' };
      }

      if (recordCheck[0].caseStatus !== 'to be deliver') {
        return {
          success: false,
          error: `Case cannot be taken out for action. Current status: ${recordCheck[0].caseStatus}. Status must be "to be deliver" to proceed.`,
          type: 'in'
        };
      }

      // Insert history records
      const inImageFiles = data.getAll('in-img') as File[];
      for (const file of inImageFiles) {
        if (file && file.size > 0 && file.name !== 'undefined') {
          const fileExt = file.name.split('.').pop() || 'jpg';
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('history_images')
            .upload(fileName, file);

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from('history_images')
              .getPublicUrl(fileName);

            await db.insert(history).values({
              historyType: 'in',
              recordId,
              imageUrl: publicUrlData.publicUrl,
              historyDate: data.get('date')?.toString(),
              historyTime: data.get('time')?.toString()
            } as any);
          } else {
            console.error("Supabase upload error:", uploadError);
            throw new Error(`Failed to upload image ${file.name}: ${uploadError.message}`);
          }
        }
      }

      // Record the physical dispatch (OUT from lab)
      await db
        .update(records)
        .set({
          dateOut: data.get('date')?.toString(),
          timeOut: data.get('time')?.toString()
        } as any)
        .where(eq(records.recordId, recordId));

    } catch (error: any) {
      console.error('Error processing IN record:', error);
      let errorMessage = error.message || 'An unknown error occurred';
      if (error.code) errorMessage += ` (DB Error Code: ${error.code})`;
      if (error.detail) errorMessage += ` - ${error.detail}`;
      return { success: false, error: `Failed to process IN record: ${errorMessage}`, type: 'in' };
    }

    return { success: true, message: 'Successfully captured IN data', type: 'in' };
  },

  processOut: async ({ request }) => {
    const data = await request.formData();
    const recordIdStr = data.get('recordId')?.toString();
    if (!recordIdStr) return { success: false, error: 'Record ID is required', type: 'out' };
    const recordId = parseInt(recordIdStr, 10);

    try {
      // Update record with actual dropoff information
      await db
        .update(records)
        .set({
          actualDropoff: data.get('date')?.toString(),
          caseStatus: data.get('finished') ? 'delivered' : 'to be deliver'
        } as any)
        .where(eq(records.recordId, recordId));

      // Insert history records
      const outImageFiles = data.getAll('out-img') as File[];
      for (const file of outImageFiles) {
        if (file && file.size > 0 && file.name !== 'undefined') {
          const fileExt = file.name.split('.').pop() || 'jpg';
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('history_images')
            .upload(fileName, file);

          if (!uploadError) {
            const { data: publicUrlData } = supabase.storage
              .from('history_images')
              .getPublicUrl(fileName);

            await db.insert(history).values({
              historyType: 'out',
              recordId,
              imageUrl: publicUrlData.publicUrl,
              historyDate: data.get('date')?.toString(),
              historyTime: data.get('time')?.toString()
            } as any);
          } else {
            console.error('Supabase upload error:', uploadError);
            throw new Error(`Failed to upload image ${file.name}: ${uploadError.message}`);
          }
        }
      }
    } catch (error: any) {
      console.error('Error processing OUT record:', error);
      let errorMessage = error.message || 'An unknown error occurred';
      if (error.code) errorMessage += ` (DB Error Code: ${error.code})`;
      if (error.detail) errorMessage += ` - ${error.detail}`;
      return { success: false, error: `Failed to process OUT record: ${errorMessage}`, type: 'out' };
    }

    const isFinished = data.get('finished');
    if (isFinished) {
      redirect(303, `/invoice/${recordId}`);
    } else {
      return { success: true, message: 'Successfully captured OUT data', type: 'out' };
    }
  }
};
