import { db } from '$lib/server/db';
import { caseTypes, clinics, doctors, records } from '$lib/server/db/schema';
import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { desc, eq, sql } from 'drizzle-orm';
import { verifyAdminPassword, isPasswordSet } from '$lib/server/auth';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const recordData = await db
			.select({
				recordId: records.recordId,
				datePickup: records.datePickup,
				timePickup: records.timePickup,
				dateDropoff: records.dateDropoff,
				timeDropoff: records.timeDropoff,
				doctorId: records.doctorId,
				patientName: records.patientName,
				description: records.description,
				remarks: records.remarks,
				deliveryCourier: records.deliveryCourier,
				deliveryFee: records.deliveryFee,
				deliveryNotes: records.deliveryNotes,
				finishBy: records.finishBy,
				assignedTechnicians: records.assignedTechnicians,
				doctorName: doctors.doctorName,
				clinicId: doctors.clinicId,
				clinicName: clinics.clinicName
			})
			.from(records)
			.leftJoin(doctors, eq(records.doctorId, doctors.doctorId))
			.leftJoin(clinics, eq(doctors.clinicId, clinics.clinicId))
			.where(sql`${records.recordId} = ${params.caseNo}`)
			.limit(1);

		if (!recordData || recordData.length === 0) {
			throw error(404, 'Record not found');
		}

		const doctorsData = await db.select().from(doctors);

		const clinicsData = await db.select().from(clinics).orderBy(desc(clinics.clinicName));

		const passwordIsSet = await isPasswordSet();

		return {
			record: recordData[0],
			doctors: doctorsData,
			clinics: clinicsData,
			passwordIsSet
		};
	} catch (e) {
		console.error('Error fetching record:', e);
		throw error(500, 'Failed to fetch record');
	}
};

export const actions = {
	update: async ({ request }) => {
		const formData = await request.formData();
		const recordId = formData.get('recordId');
		const doctorId = parseInt(formData.get('doctorId')?.toString() || '0');
		const confirmPassword = formData.get('confirm_password')?.toString() ?? '';

		const patientName = formData.get('patientName')?.toString() ?? '';
		const remarks = formData.get('remarks')?.toString() ?? '';

		const deliveryCourier = formData.get('deliveryCourier')?.toString() ?? '';
		const deliveryFeeRaw = formData.get('deliveryFee')?.toString() ?? '';
		const deliveryNotes = formData.get('deliveryNotes')?.toString() ?? '';
		const finishBy = formData.get('finishBy')?.toString() ?? '';
		const assignedTechnicians = formData.get('assignedTechnicians')?.toString() ?? '';

		// Check if password is set
		const passwordIsSet = await isPasswordSet();
		if (!passwordIsSet) {
			return fail(400, {
				error: 'No password is set. Please set a password first in the Change Password page.'
			});
		}

		// Verify password
		if (!confirmPassword) {
			return fail(400, { error: 'Password is required' });
		}

		const ok = await verifyAdminPassword(confirmPassword);
		if (!ok) {
			return fail(400, { error: 'Wrong password' });
		}

		console.log(formData);
		try {
			// Parse the recordId to ensure it's a number
			const recordIdNum = parseInt(recordId?.toString() || '0');
			if (!recordIdNum) throw new Error('Invalid record ID');

			const deliveryFee = deliveryFeeRaw ? parseFloat(deliveryFeeRaw) : NaN;

			await db
				.update(records)
				.set({
					doctorId,
					patientName,
					remarks,
					deliveryCourier: deliveryCourier || null,
					deliveryFee: isNaN(deliveryFee) ? null : deliveryFee,
					deliveryNotes: deliveryNotes || null,
					finishBy: finishBy || null,
					assignedTechnicians: assignedTechnicians || null
				} as any)
				.where(eq(records.recordId, recordIdNum));

			return {
				success: true,
				message: 'Record updated successfully'
			};
		} catch (e) {
			console.error('Error updating record:', e);
			return {
				success: false,
				message: 'Failed to update record'
			};
		}
	}
};
