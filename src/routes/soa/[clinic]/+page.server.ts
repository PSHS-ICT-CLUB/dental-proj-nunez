import { db } from '$lib/server/db';
import { clinics, doctors, records } from '$lib/server/db/schema';
import { desc, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	console.log(params.clinic.toString(), 'params.clinic');
	const clinicName = String(params.clinic.toString());
	let data = [];
	try {
		// clinic_name lives on clinics (records -> doctors -> clinics), not on records
		data = await db
			.select({
				recordId: records.recordId,
				patientName: records.patientName,
				patientContact: records.patientContact,
				description: records.description,
				caseNotes: records.caseNotes,
				caseStatus: records.caseStatus,
				datePickup: records.datePickup,
				doctorName: doctors.doctorName
			})
			.from(records)
			.innerJoin(doctors, eq(records.doctorId, doctors.doctorId))
			.innerJoin(clinics, eq(doctors.clinicId, clinics.clinicId))
			.where(eq(clinics.clinicName, clinicName))
			.orderBy(desc(records.recordId));
		console.log(data);
	} catch (error) {
		console.error('Error:', error);
	}
	return {
		data: data,
		clinicName: clinicName
	};
};
