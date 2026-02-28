import { db } from '$lib/server/db';
import { records, doctors, clinics, orders, orderItems, history } from '$lib/server/db/schema';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { sql, desc, eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params }) => {
	try {
		// Get the record details with all related information
		const recordData = await db
			.select({
				recordId: records.recordId,
				orderId: records.orderId,
				datePickup: records.datePickup,
				timePickup: records.timePickup,
				dateDropoff: records.dateDropoff,
				timeDropoff: records.timeDropoff,
				patientName: records.patientName,
				description: records.description,
				remarks: records.remarks,
				createdAt: records.createdAt,
				doctorId: doctors.doctorId,
				doctorName: doctors.doctorName,
				clinicId: clinics.clinicId,
				clinicName: clinics.clinicName,
				// Include order information
				orderInfo: {
					orderTotal: orders.orderTotal,
					paidAmount: orders.paidAmount,
					excessPayment: orders.excessPayment,
					paymentMethod: orders.paymentMethod,
					paymentStatus: orders.paymentStatus,
					orderDate: orders.orderDate
				}
			})
			.from(records)
			.leftJoin(doctors, eq(records.doctorId, doctors.doctorId))
			.leftJoin(clinics, eq(doctors.clinicId, clinics.clinicId))
			.leftJoin(orders, eq(records.orderId, orders.orderId))
			.where(sql`${records.recordId} = ${params.caseNo}`)
			.limit(1);

		if (!recordData || recordData.length === 0) {
			throw error(404, 'Case not found');
		}

		// Get order items if order exists
		const items = recordData[0].orderId
			? await db.select().from(orderItems).where(eq(orderItems.orderId, recordData[0].orderId))
			: [];

		// Get the history for this case
		const caseHistory = await db
			.select()
			.from(history)
			.where(sql`${history.recordId} = ${params.caseNo}`)
			.orderBy(desc(history.historyDate));

		return {
			record: recordData[0],
			orderItems: items,
			history: caseHistory
		};
	} catch (e) {
		console.error('Error fetching case details:', e);
		throw error(500, 'Failed to fetch case details');
	}
};
