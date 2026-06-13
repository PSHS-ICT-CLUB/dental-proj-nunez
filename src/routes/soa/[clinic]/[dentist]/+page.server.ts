import { db } from '$lib/server/db';
import { clinics, doctors, records } from '$lib/server/db/schema';
import { desc, and, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	console.log(params.clinic.toString(), 'params.clinic');
	console.log(params.dentist.toString(), 'params.dentist');
	const clinicName = String(params.clinic.toString());
	const dentistName = String(params.dentist.toString());
	let data = [];
	try {
		data = await db
			.select({
                recordId: records.recordId,
                patientName: records.patientName,
                patientContact: records.patientContact,
                patientSex: records.patientSex,
                description: records.description,
                caseNotes: records.caseNotes,
                caseStatus: records.caseStatus,
                datePickup: records.datePickup,
                dateDropoff: records.dateDropoff,
                clinicName: clinics.clinicName,
                doctorName: doctors.doctorName
            })
			.from(records)
            .leftJoin(doctors, eq(records.doctorId, doctors.doctorId))
            .leftJoin(clinics, eq(doctors.clinicId, clinics.clinicId))
			.where(and(eq(clinics.clinicName, clinicName), eq(doctors.doctorName, dentistName)))
			.orderBy(desc(records.recordId));
		console.log(data);
	} catch (error) {
		console.error('Error:', error);
	}
	return {
		data: data,
		clinicName: clinicName,
        dentistName: dentistName
	};
};
