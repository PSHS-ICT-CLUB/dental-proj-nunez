import { db } from '$lib/server/db';
import { clinics, doctors, records, orders } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	try {
		// Aggregate totals per clinic by joining clinics -> doctors -> records -> orders
		// Only account for finished orders
		const balances = await db
			.select({
				clinicId: clinics.clinicId,
				clinicName: clinics.clinicName,
				totalOrders: sql`coalesce(sum(case when ${records.remarks} = 'finished' then ${orders.orderTotal} else 0 end), 0)`,
				totalPaid: sql`coalesce(sum(case when ${records.remarks} = 'finished' then ${orders.paidAmount} else 0 end), 0)`,
				// balance: paid - finished orders so positive means clinic has credit (overpaid)
				balance: sql`coalesce(sum(case when ${records.remarks} = 'finished' then ${orders.paidAmount} else 0 end), 0) - coalesce(sum(case when ${records.remarks} = 'finished' then ${orders.orderTotal} else 0 end), 0)`
			})
			.from(clinics)
			.leftJoin(doctors, sql`${doctors.clinicId} = ${clinics.clinicId}`)
			.leftJoin(records, sql`${records.doctorId} = ${doctors.doctorId}`)
			.leftJoin(orders, sql`${orders.orderId} = ${records.orderId}`)
			.groupBy(clinics.clinicId)
			.orderBy(clinics.clinicName);

		return { balances };
	} catch (e) {
		console.error('Error loading balances:', e);
		return { balances: [] };
	}
};
