import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { clinics, doctors, history, records } from '$lib/server/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { convertFileToBytea } from '$lib';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const recordData = await db
		.select({
			recordId: records.recordId,
			patientName: records.patientName,
			doctorName: doctors.doctorName,
			clinicName: clinics.clinicName,
			description: records.description,
			remarks: records.remarks
		})
		.from(records)
		.leftJoin(doctors, eq(records.doctorId, doctors.doctorId))
		.leftJoin(clinics, eq(doctors.clinicId, clinics.clinicId))
		.where(eq(records.recordId, parseInt(params.caseNo)));

	if (!recordData || recordData.length === 0) {
		throw new Error('Record not found');
	}

	return {
		record: recordData[0]
	};
};

export const actions = {
	default: async ({ request }) => {
		const data = await request.formData();
		const recordId = parseInt(data.get('recordId')?.toString() || '0');

		try {
			// Insert history records
			const inImageFiles = data.getAll('in-img') as File[];
			for (const file of inImageFiles) {
				if (file && file.size > 0 && file.name !== 'undefined') {
					await db.insert(history).values({
						historyType: 'in',
						recordId,
						imageData: await convertFileToBytea(file),
						historyDate: data.get('date')?.toString(),
						historyTime: data.get('time')?.toString()
					} as typeof history.$inferInsert);
				}
			}
		} catch (error) {
			console.error('Error processing IN record:', error);
			return { success: false, error: 'Failed to process IN record' };
		}
		redirect(303, `/history/${recordId}`);
	}
};
