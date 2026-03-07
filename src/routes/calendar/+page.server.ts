import { db } from '$lib/server/db';
import { records, doctors, clinics, orders, orderItems, caseTypes } from '$lib/server/db/schema';
import { eq, and, gte, lte, sql, desc, isNotNull } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	try {
		// Get month and year from query params, default to current month
		const now = new Date();
		const month = parseInt(url.searchParams.get('month') || '') || now.getMonth() + 1;
		const year = parseInt(url.searchParams.get('year') || '') || now.getFullYear();

		// Calculate date range for the month
		const startOfMonth = new Date(year, month - 1, 1);
		const endOfMonth = new Date(year, month, 0);

		const startDateStr = startOfMonth.toISOString().split('T')[0];
		const endDateStr = endOfMonth.toISOString().split('T')[0];

		// Fetch records with expected delivery dates in this month
		const deliveryRecords = await db
			.select({
				recordId: records.recordId,
				dateDropoff: records.dateDropoff,
				datePickup: records.datePickup,
				patientName: records.patientName,
				caseStatus: records.caseStatus,
				doctorName: doctors.doctorName,
				clinicName: clinics.clinicName,
				finishBy: records.finishBy,
				orderItems: sql<
					Array<{
						caseTypeName: string;
						caseNo: string;
						orderDescription: string | null;
						upOrDown: string;
					}>
				>`
					array_agg(
						json_build_object(
							'caseTypeName', ${caseTypes.caseTypeName},
							'caseNo', ${orderItems.caseNo},
							'orderDescription', ${orderItems.orderDescription},
							'upOrDown', ${orderItems.upOrDown}
						)
					)`
			})
			.from(records)
			.innerJoin(orders, eq(records.orderId, orders.orderId))
			.innerJoin(orderItems, eq(orders.orderId, orderItems.orderId))
			.innerJoin(doctors, eq(records.doctorId, doctors.doctorId))
			.innerJoin(clinics, eq(doctors.clinicId, clinics.clinicId))
			.innerJoin(caseTypes, eq(orderItems.caseTypeId, caseTypes.caseTypeId))
			.where(
				and(
					isNotNull(records.dateDropoff),
					sql`records.date_dropoff BETWEEN ${startDateStr} AND ${endDateStr}`
				)
			)
			.groupBy(records.recordId, doctors.doctorName, clinics.clinicName)
			.orderBy(desc(records.dateDropoff));

		// Fetch records with finishBy dates in this month
		const finishByRecords = await db
			.select({
				recordId: records.recordId,
				dateDropoff: records.dateDropoff,
				datePickup: records.datePickup,
				patientName: records.patientName,
				caseStatus: records.caseStatus,
				doctorName: doctors.doctorName,
				clinicName: clinics.clinicName,
				finishBy: records.finishBy,
				orderItems: sql<
					Array<{
						caseTypeName: string;
						caseNo: string;
						orderDescription: string | null;
						upOrDown: string;
					}>
				>`
					array_agg(
						json_build_object(
							'caseTypeName', ${caseTypes.caseTypeName},
							'caseNo', ${orderItems.caseNo},
							'orderDescription', ${orderItems.orderDescription},
							'upOrDown', ${orderItems.upOrDown}
						)
					)`
			})
			.from(records)
			.innerJoin(orders, eq(records.orderId, orders.orderId))
			.innerJoin(orderItems, eq(orders.orderId, orderItems.orderId))
			.innerJoin(doctors, eq(records.doctorId, doctors.doctorId))
			.innerJoin(clinics, eq(doctors.clinicId, clinics.clinicId))
			.innerJoin(caseTypes, eq(orderItems.caseTypeId, caseTypes.caseTypeId))
			.where(
				and(
					isNotNull(records.finishBy),
					sql`DATE(records.finish_by) BETWEEN ${startDateStr} AND ${endDateStr}`
				)
			)
			.groupBy(records.recordId, doctors.doctorName, clinics.clinicName)
			.orderBy(desc(records.finishBy));

		return {
			deliveryRecords,
			finishByRecords,
			month,
			year
		};
	} catch (error) {
		console.error('Error loading calendar data:', error);
		return {
			deliveryRecords: [],
			finishByRecords: [],
			month: new Date().getMonth() + 1,
			year: new Date().getFullYear(),
			error: 'Failed to load calendar data'
		};
	}
};
