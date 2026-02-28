import { db } from '$lib/server/db';
import { clinics, doctors, records, orders, orderItems, caseTypes } from '$lib/server/db/schema';
import { sql, eq, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	try {
		const startDate = url.searchParams.get('start_date');
		const endDate = url.searchParams.get('end_date');
		const caseTypeId = url.searchParams.get('case_type_id');

		const whereConditions = [];
		if (startDate && endDate) {
			whereConditions.push(sql`records.date_pickup BETWEEN ${startDate} AND ${endDate}`);
		}
		if (caseTypeId && !isNaN(parseInt(caseTypeId))) {
			whereConditions.push(eq(orderItems.caseTypeId, parseInt(caseTypeId)));
		}

		const baseQuery = db
			.select({
				clinicId: clinics.clinicId,
				clinicName: clinics.clinicName,
				totalOrders: sql`coalesce(sum(${orders.orderTotal}), 0)`,
				totalPaid: sql`coalesce(sum(${orders.paidAmount}), 0)`,
				pendingOrders: sql`coalesce(sum(case when ${records.remarks} = 'pending' then ${orders.orderTotal} else 0 end), 0)`,
				finishedOrders: sql`coalesce(sum(case when ${records.remarks} = 'finished' then ${orders.orderTotal} else 0 end), 0)`,
				balance: sql`coalesce(sum(${orders.paidAmount}), 0) - coalesce(sum(${orders.orderTotal}), 0)`
			})
			.from(clinics)
			.leftJoin(doctors, sql`${doctors.clinicId} = ${clinics.clinicId}`)
			.leftJoin(records, sql`${records.doctorId} = ${doctors.doctorId}`)
			.leftJoin(orders, sql`${orders.orderId} = ${records.orderId}`)
			.leftJoin(orderItems, sql`${orderItems.orderId} = ${orders.orderId}`)
			.groupBy(clinics.clinicId)
			.orderBy(clinics.clinicName);

		if (whereConditions.length > 0) {
			baseQuery.where(and(...whereConditions));
		}

		const [balances, caseTypeData] = await Promise.all([
			baseQuery,
			db.select().from(caseTypes).orderBy(caseTypes.caseTypeName)
		]);

		return {
			balances,
			caseTypes: caseTypeData,
			filters: Object.fromEntries(url.searchParams)
		};
	} catch (e) {
		console.error('Error loading balances:', e);
		return { balances: [], caseTypes: [], filters: {} };
	}
};
