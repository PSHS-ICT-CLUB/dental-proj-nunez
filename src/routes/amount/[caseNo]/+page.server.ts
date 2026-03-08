import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import { orderItems, orders, records, caseTypes } from '$lib/server/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params }) => {
	const recordData = await db
		.select({
			recordId: records.recordId,
			orderId: records.orderId,
			orderTotal: orders.orderTotal,
			paidAmount: orders.paidAmount,
			paymentMethod: orders.paymentMethod,
			excessPayment: orders.excessPayment,
			items: sql<any>`json_agg(json_build_object(
        'orderItemId', ${orderItems.orderItemId},
        'upOrDown', ${orderItems.upOrDown},
        'caseTypeId', ${orderItems.caseTypeId},
        'caseNo', ${orderItems.caseNo},
        'itemCost', ${orderItems.itemCost},
        'itemQuantity', ${orderItems.itemQuantity},
        'orderDescription', ${orderItems.orderDescription}
      ))`
		})
		.from(records)
		.leftJoin(orders, eq(records.orderId, orders.orderId))
		.leftJoin(orderItems, eq(orders.orderId, orderItems.orderId))
		.groupBy(records.recordId, orders.orderId)
		.where(eq(records.recordId, parseInt(params.caseNo)))
		.limit(1);

	// Get case types for dropdown with their current case numbers
	const caseTypesData = await db.select({
		caseTypeId: caseTypes.caseTypeId,
		caseTypeName: caseTypes.caseTypeName,
		numberOfCases: caseTypes.numberOfCases
	}).from(caseTypes);

	return {
		recordId: params.caseNo,
		record: recordData[0] || null,
		caseTypes: caseTypesData
	};
};

export const actions = {
	default: async ({ request, params }) => {
		const data = await request.formData();
		const orderId = parseInt(data.get('orderId').toString());
		const orderItemsData = JSON.parse(data.get('orderItems')?.toString() || '[]');

		try {
			await db.transaction(async (tx) => {
				// Update order
				await tx
					.update(orders)
					.set({
						orderTotal: data.get('total_amount')?.toString(),
						paidAmount: data.get('paid_amount')?.toString(),
						excessPayment: data.get('excess_payment')?.toString(),
						paymentMethod: data.get('final_payment_method')?.toString()
					} as any)
					.where(eq(orders.orderId, orderId));
			});

			return { success: true };
		} catch (error) {
			console.error('Error processing payment:', error);
			return { success: false, error: 'Failed to process payment' };
		}
		redirect(303, `/`);
	}
};
