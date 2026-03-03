import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { clinics, doctors, history, records } from '$lib/server/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { supabase } from '$lib/server/supabase';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const recordData = await db
		.select({
			recordId: records.recordId,
			patientName: records.patientName,
			doctorName: doctors.doctorName,
			clinicName: clinics.clinicName,
			description: records.description,
			remarks: records.remarks,
			caseStatus: records.caseStatus
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
			// Check if case status is "to be deliver" before allowing action
			const recordCheck = await db
				.select({ caseStatus: records.caseStatus })
				.from(records)
				.where(eq(records.recordId, recordId));

			if (!recordCheck || recordCheck.length === 0) {
				return { success: false, error: 'Record not found' };
			}

			if (recordCheck[0].caseStatus !== 'to be deliver') {
				return {
					success: false,
					error: `Case cannot be taken out for action. Current status: ${recordCheck[0].caseStatus}. Status must be "to be deliver" to proceed.`
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
						});
					} else {
						console.error("Supabase upload error:", uploadError);
					}
				}
			}
		} catch (error) {
			console.error('Error processing IN record:', error);
			return { success: false, error: 'Failed to process IN record' };
		}
		redirect(303, `/history/${recordId}`);
	}
};
