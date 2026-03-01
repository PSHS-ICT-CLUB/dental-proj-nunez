import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { clinics, doctors, caseTypes, technicians } from '$lib/server/db/schema';
import { desc, eq, sql } from 'drizzle-orm';

export const load = (async () => {
	const [doctorsData, clinicsData, caseTypesData, techniciansData] = await Promise.all([
		db
			.select({
				doctorId: doctors.doctorId,
				doctorName: doctors.doctorName,
				doctorPhone: doctors.doctorPhone,
				doctorEmail: doctors.doctorEmail,
				clinicId: doctors.clinicId,
				clinicName: clinics.clinicName,
				clinicPhone: clinics.clinicPhone,
				clinicEmail: clinics.clinicEmail
			})
			.from(doctors)
			.leftJoin(clinics, eq(doctors.clinicId, clinics.clinicId))
			.orderBy(desc(doctors.doctorName)),

		db
			.select({
				clinicId: clinics.clinicId,
				clinicName: clinics.clinicName,
				clinicPhone: clinics.clinicPhone,
				clinicEmail: clinics.clinicEmail
			})
			.from(clinics)
			.orderBy(desc(clinics.clinicName)),

		db
			.select({
				caseTypeId: caseTypes.caseTypeId,
				caseTypeName: caseTypes.caseTypeName,
				numberOfCases: caseTypes.numberOfCases
			})
			.from(caseTypes)
			.orderBy(caseTypes.caseTypeName),
		db
			.select({
				id: technicians.id,
				name: technicians.name,
				role: technicians.role,
				phone: technicians.phone,
				email: technicians.email,
				notes: technicians.notes
			})
			.from(technicians)
			.orderBy(technicians.name)
	]);

	return {
		doctors: doctorsData.map((d) => ({
			value: d.doctorId.toString(),
			label: d.doctorName,
			clinicId: d.clinicId,
			clinicName: d.clinicName,
			doctorPhone: d.doctorPhone,
			doctorEmail: d.doctorEmail,
			clinicPhone: d.clinicPhone,
			clinicEmail: d.clinicEmail
		})),
		clinics: clinicsData.map((c) => ({
			value: c.clinicId.toString(),
			label: c.clinicName,
			clinicId: c.clinicId,
			clinicPhone: c.clinicPhone,
			clinicEmail: c.clinicEmail
		})),
		caseTypes: caseTypesData,
		technicians: techniciansData
	};
}) satisfies PageServerLoad;

export const actions = {
	addDoctor: async ({ request }) => {
		const data = await request.formData();
		const doctorName = data.get('doctor_name')?.toString();
		const clinicId = data.get('clinic_id')?.toString();
		const doctorPhone = data.get('doctor_phone')?.toString() || null;
		const doctorEmail = data.get('doctor_email')?.toString() || null;

		if (doctorName && clinicId) {
			try {
				const result = await db
					.insert(doctors)
					.values({
						doctorName: doctorName,
						clinicId: parseInt(clinicId),
						doctorPhone,
						doctorEmail
					} as unknown as typeof doctors.$inferInsert)
					.returning({ doctorId: doctors.doctorId });

				if (result && result.length > 0 && result[0].doctorId) {
					return {
						success: true,
						message: `Doctor "${doctorName}" added successfully to clinic ID ${clinicId}`,
						doctorId: result[0].doctorId
					};
				} else {
					return { success: false, error: 'Failed to add doctor and get ID' };
				}
			} catch (error) {
				console.error('Error inserting doctor:', error);
				return { success: false, error: 'Failed to add doctor' };
			}
		} else {
			return { success: false, error: 'Doctor name and clinic selection are required' };
		}
	},
	addClinic: async ({ request }) => {
		const data = await request.formData();
		const clinicName = data.get('clinic_name')?.toString();
		const clinicPhone = data.get('clinic_phone')?.toString() || null;
		const clinicEmail = data.get('clinic_email')?.toString() || null;

		if (clinicName) {
			try {
				const result = await db
					.insert(clinics)
					.values({
						clinicName: clinicName,
						clinicPhone,
						clinicEmail
					} as unknown as typeof clinics.$inferInsert)
					.returning({ clinicId: clinics.clinicId });
				if (result && result.length > 0 && result[0].clinicId) {
					return {
						success: true,
						message: `Clinic "${clinicName}" added successfully`,
						clinicId: result[0].clinicId
					};
				} else {
					return { success: false, error: 'Failed to add clinic and get ID' };
				}
			} catch (error) {
				console.error('Error inserting clinic:', error);
				return { success: false, error: 'Failed to add clinic' };
			}
		} else {
			return { success: false, error: 'Clinic name is required' };
		}
	},
	addClinicAndDoctor: async ({ request }) => {
		const data = await request.formData();
		const clinicName = data.get('clinic_name')?.toString();
		const doctorName = data.get('doctor_name')?.toString();
		const clinicPhone = data.get('clinic_phone')?.toString() || null;
		const clinicEmail = data.get('clinic_email')?.toString() || null;
		const doctorPhone = data.get('doctor_phone')?.toString() || null;
		const doctorEmail = data.get('doctor_email')?.toString() || null;

		if (clinicName && doctorName) {
			try {
				const clinicResult = await db
					.insert(clinics)
					.values({
						clinicName: clinicName,
						clinicPhone,
						clinicEmail
					} as unknown as typeof clinics.$inferInsert)
					.returning({ clinicId: clinics.clinicId });

				if (clinicResult && clinicResult.length > 0 && clinicResult[0].clinicId) {
					const newClinicId = clinicResult[0].clinicId;
					await db.insert(doctors).values({
						doctorName: doctorName,
						clinicId: newClinicId,
						doctorPhone,
						doctorEmail
					} as unknown as typeof doctors.$inferInsert);
					return {
						success: true,
						message: `Clinic "${clinicName}" and doctor "${doctorName}" added successfully`
					};
				} else {
					return { success: false, error: 'Failed to add clinic and get ID for doctor' };
				}
			} catch (error) {
				console.error('Error inserting clinic and doctor:', error);
				return { success: false, error: 'Failed to add clinic and doctor' };
			}
		} else {
			return { success: false, error: 'Clinic name and doctor name are required' };
		}
	},
	deleteDoctor: async ({ request }) => {
		const data = await request.formData();
		const doctorIdToDelete = data.get('doctor_id')?.toString();

		if (doctorIdToDelete) {
			try {
				await db.delete(doctors).where(eq(doctors.doctorId, parseInt(doctorIdToDelete))); // Assuming doctor_id in the form corresponds to clinicId in doctors table based on previous code
				return {
					success: true,
					message: `Doctor with ID ${doctorIdToDelete} deleted successfully`
				};
			} catch (error) {
				console.error('Error deleting doctor:', error);
				return { success: false, error: 'Failed to delete doctor' };
			}
		} else {
			return { success: false, error: 'Doctor ID not provided for deletion' };
		}
	},
	deleteClinic: async ({ request }) => {
		const data = await request.formData();
		const clinicIdToDelete = data.get('clinic_id')?.toString();

		if (clinicIdToDelete) {
			try {
				await db.transaction(async (tx) => {
					// First, delete all doctors associated with this clinic
					await tx.delete(doctors).where(eq(doctors.clinicId, parseInt(clinicIdToDelete)));
					// Then, delete the clinic itself
					await tx.delete(clinics).where(eq(clinics.clinicId, parseInt(clinicIdToDelete)));
				});
				return {
					success: true,
					message: `Clinic with ID ${clinicIdToDelete} and associated doctors deleted successfully`
				};
			} catch (error) {
				console.error('Error deleting clinic and associated doctors:', error);
				return { success: false, error: 'Failed to delete clinic and associated doctors' };
			}
		} else {
			return { success: false, error: 'Clinic ID not provided for deletion' };
		}
	},
	addCaseType: async ({ request }) => {
		const data = await request.formData();
		const caseType = data.get('case_type')?.toString();

		if (!caseType) {
			return { success: false, error: 'Case type is required' };
		}

		try {
			await db.insert(caseTypes).values({
				caseType: caseType,
				numberOfCases: 0
			} as unknown as typeof caseTypes.$inferInsert);

			return {
				success: true,
				message: 'Case type added successfully'
			};
		} catch (error) {
			console.error('Error adding case type:', error);
			return { success: false, error: 'Failed to add case type' };
		}
	},
	deleteCaseType: async ({ request }) => {
		const data = await request.formData();
		const caseTypeId = data.get('case_type_id')?.toString();

		if (!caseTypeId) {
			return { success: false, error: 'Case type ID is required' };
		}

		try {
			await db.delete(caseTypes).where(eq(caseTypes.caseTypeId, parseInt(caseTypeId)));

			return {
				success: true,
				message: 'Case type deleted successfully'
			};
		} catch (error) {
			console.error('Error deleting case type:', error);
			return { success: false, error: 'Failed to delete case type' };
		}
	},
	updateCaseTypeCount: async ({ request }) => {
		const data = await request.formData();
		const caseTypeId = data.get('case_type_id')?.toString();
		const numberOfCases = data.get('number_of_cases')?.toString();

		if (!caseTypeId || !numberOfCases) {
			return { success: false, error: 'Case type ID and number of cases are required' };
		}

		try {
			await db
				.update(caseTypes)
				.set({ numberOfCases: parseInt(numberOfCases) })
				.where(eq(caseTypes.caseTypeId, parseInt(caseTypeId)));

			return {
				success: true,
				message: 'Case count updated successfully'
			};
		} catch (error) {
			console.error('Error updating case count:', error);
			return { success: false, error: 'Failed to update case count' };
		}
	},
	addTechnician: async ({ request }) => {
		const data = await request.formData();
		const name = data.get('name')?.toString();
		const role = data.get('role')?.toString() || null;
		const phone = data.get('phone')?.toString() || null;
		const email = data.get('email')?.toString() || null;
		const notes = data.get('notes')?.toString() || null;

		if (!name) {
			return { success: false, error: 'Technician name is required' };
		}

		try {
			await db.insert(technicians).values({
				name,
				role,
				phone,
				email,
				notes
			} as unknown as typeof technicians.$inferInsert);

			return { success: true, message: 'Technician added successfully' };
		} catch (error) {
			console.error('Error adding technician:', error);
			return { success: false, error: 'Failed to add technician' };
		}
	},
	deleteTechnician: async ({ request }) => {
		const data = await request.formData();
		const techId = data.get('technician_id')?.toString();

		if (!techId) {
			return { success: false, error: 'Technician ID is required' };
		}

		try {
			await db.delete(technicians).where(eq(technicians.id, parseInt(techId)));
			return { success: true, message: 'Technician deleted successfully' };
		} catch (error) {
			console.error('Error deleting technician:', error);
			return { success: false, error: 'Failed to delete technician' };
		}
	}
} satisfies Actions;
