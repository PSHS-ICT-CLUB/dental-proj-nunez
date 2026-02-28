import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import {
	caseTypes,
	clinics,
	doctors,
	history,
	orderItems,
	orders,
	records
} from '$lib/server/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { convertFileToBytea } from '$lib';
import { redirect } from '@sveltejs/kit';
import { Console } from 'console';

export const load: PageServerLoad = async ({ params }) => {
	return {
		caseTypes: await db.select().from(caseTypes),
		doctors: await db.select().from(doctors).orderBy(desc(doctors.doctorName)),

		clinics: await db.select().from(clinics).orderBy(desc(clinics.clinicName))
	};
};

export const actions = {
	default: async ({ locals, request }) => {
		const session = await locals.auth();
		const userId = session?.user?.id ? parseInt(session.user.id) : null;
		const data = await request.formData();
		console.log('Form data:', data);
		let recordId;
		try {
			// caseTypeUp

			recordId = await db
				.transaction(async (tx) => {
					const orderID = await tx
						.insert(orders)
						.values({
							orderDate: data.get('date'),
							orderTotal: data.get('total_amount'),
							paidAmount: data.get('paid_amount'),
							excessPayment: data.get('excess_payment'),
							paymentMethod: data.get('payment_method'),
							createdBy: userId
						} as typeof orders.$inferInsert)
						.returning({ id: orders.orderId });
					let selectedJaw = data.get('selected_jaw')?.toString();
					console.log('order_id', orderID);

					if (selectedJaw === 'upper' || selectedJaw === 'U/L') {
						let caseTypeId = Number(data.get('case_type_upper')?.toString());
						console.log(caseTypeId);

						// Atomically increment and get the new case number
						const [updatedCaseType] = await tx
							.update(caseTypes)
							.set({
								numberOfCases: sql`${caseTypes.numberOfCases} + 1`
							})
							.where(eq(caseTypes.caseTypeId, caseTypeId))
							.returning({
								newCases: caseTypes.numberOfCases,
								typeName: caseTypes.caseTypeName
							});

						const nextCaseNum = updatedCaseType.newCases;
						const formattedCaseNo = String(nextCaseNum).padStart(5, '0');

						await tx.insert(orderItems).values({
							orderId: orderID[0].id,
							upOrDown: 'up',
							caseTypeId: caseTypeId,
							caseNo: formattedCaseNo,
							itemCost: data.get('upper_cost'),
							itemQuantity: data.get('upper_unit') as unknown as number,
							orderDescription: data.get('upper_description')
						} as typeof orderItems.$inferInsert);
					}
					if (selectedJaw === 'lower' || selectedJaw === 'U/L') {
						let caseTypeId = Number(data.get('case_type_lower')?.toString());
						console.log('lower');

						// Atomically increment and get the new case number
						const [updatedCaseType] = await tx
							.update(caseTypes)
							.set({
								numberOfCases: sql`${caseTypes.numberOfCases} + 1`
							})
							.where(eq(caseTypes.caseTypeId, caseTypeId))
							.returning({
								newCases: caseTypes.numberOfCases,
								typeName: caseTypes.caseTypeName
							});

						const nextCaseNum = updatedCaseType.newCases;
						const formattedCaseNo = String(nextCaseNum).padStart(5, '0');

						await tx.insert(orderItems).values({
							orderId: orderID[0].id,
							upOrDown: 'down',
							caseTypeId: caseTypeId,
							caseNo: formattedCaseNo,
							itemCost: data.get('lower_cost'),
							itemQuantity: data.get('lower_unit') as unknown as number,
							orderDescription: data.get('lower_description')
						} as typeof orderItems.$inferInsert);
					}

					const record = await tx
						.insert(records)
						.values({
							orderId: orderID[0].id,
							datePickup: data.get('date'),
							timePickup: data.get('time'),
							doctorId: data.get('doctor_name') as unknown as number,
							patientName: data.get('patient_name'),
							remarks: 'pending',
							createdBy: userId
						} as typeof records.$inferInsert)
						.returning({ id: records.recordId });

					const inImageFiles = data.getAll('in-img') as File[];
					for (const file of inImageFiles) {
						if (file && file.size > 0 && file.name !== 'undefined') {
							await tx.insert(history).values({
								historyType: 'in',
								imageData: await convertFileToBytea(file),
								historyDate: data.get('date'),
								recordId: record[0].id,
								historyTime: data.get('time'),
								createdBy: userId
							} as typeof history.$inferInsert);
						}
					}

					return record[0].id;
				});
		} catch (error) {
			console.error('Error inserting record:', error);
			return { success: false, error: 'Failed to insert record' };
		}
		redirect(303, '/?record_id=' + recordId);
	}
} satisfies Actions;
