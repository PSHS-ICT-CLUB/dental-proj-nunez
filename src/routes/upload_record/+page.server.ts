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
	default: async ({ cookies, request }) => {
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
							paymentMethod: data.get('payment_method')
						} as typeof orders.$inferInsert)
						.returning({ id: orders.orderId });
					let selectedJaw = data.get('selected_jaw')?.toString();
					console.log('order_id', orderID);

					if (selectedJaw === 'upper' || selectedJaw === 'U/L') {
						let caseTypeId = Number(data.get('case_type_upper')?.toString());
						console.log(caseTypeId);
						await tx.insert(orderItems).values({
							orderId: orderID[0].id,
							upOrDown: 'up',
							caseTypeId: caseTypeId,
							caseNo: data.get('case_number_upper'),
							itemCost: data.get('upper_cost'),
							itemQuantity: data.get('upper_unit') as unknown as number,
							orderDescription: data.get('upper_description')
						} as typeof orderItems.$inferInsert);
						await tx
							.update(caseTypes)
							.set({
								numberOfCases: data.get('case_number_upper') as unknown as number
							})
							.where(eq(caseTypes.caseTypeId, caseTypeId));
					}
					if (selectedJaw === 'lower' || selectedJaw === 'U/L') {
						let caseTypeId = Number(data.get('case_type_lower')?.toString());

						console.log('lower');
						await tx.insert(orderItems).values({
							orderId: orderID[0].id,
							upOrDown: 'down',
							caseTypeId: caseTypeId,
							caseNo: data.get('case_number_lower'),
							itemCost: data.get('lower_cost'),
							itemQuantity: data.get('lower_unit') as unknown as number,
							orderDescription: data.get('lower_description')
						} as typeof orderItems.$inferInsert);
						console.log(caseTypeId);
						await tx
							.update(caseTypes)
							.set({
								numberOfCases: data.get('case_number_lower') as unknown as number
							})
							.where(eq(caseTypes.caseTypeId, caseTypeId));
					}

					const record = await tx
						.insert(records)
						.values({
							orderId: orderID[0].id,
							datePickup: data.get('date'),
							timePickup: data.get('time'),
							doctorId: data.get('doctor_name') as unknown as number,
							patientName: data.get('patient_name'),
							remarks: 'pending'
						} as typeof records.$inferInsert)
						.returning({ id: records.recordId });

					await tx.insert(history).values({
						historyType: 'in',
						imageData: await convertFileToBytea(data.get('in-img') as File),
						historyDate: data.get('date'),
						recordId: record[0].id,
						historyTime: data.get('time')
					} as typeof history.$inferInsert);

					return record[0].id;
				});
		} catch (error) {
			console.error('Error inserting record:', error);
			return { success: false, error: 'Failed to insert record' };
		}
		redirect(303, '/?record_id=' + recordId);
	}
} satisfies Actions;
