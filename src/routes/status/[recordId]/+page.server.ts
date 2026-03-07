import { db } from '$lib/server/db';
import { clinics, doctors, records } from '$lib/server/db/schema';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { eq, sql } from 'drizzle-orm';

export const load: PageServerLoad = async (event) => {
  const session = await event.locals.auth();

  if (!session?.user) {
    redirect(303, '/login');
  }

  const userRole = (session.user as any).role || 'staff';

  try {
    const recordData = await db
      .select({
        recordId: records.recordId,
        patientName: records.patientName,
        caseStatus: records.caseStatus,
        createdAt: records.createdAt,
        doctorName: doctors.doctorName,
        clinicName: clinics.clinicName
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
