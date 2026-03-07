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
			caseStatus: records.caseStatus,
			caseNotes: records.caseNotes,
			remarksDeprecated: records.remarksDeprecated
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
					}
				}
			}
		} catch (error) {
			console.error('Error processing OUT record:', error);
			return { success: false, error: 'Failed to process OUT record' };
		}

		const isFinished = data.get('finished');
		if (isFinished) {
			redirect(303, `/invoice/${recordId}`);
		} else {
			redirect(303, `/history/${recordId}`);
		}
	}
};
