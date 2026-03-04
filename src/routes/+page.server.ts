import { db } from '$lib/server/db';
import {
	caseTypes,
	clinics,
	doctors,
	history,
	records,
	orders,
	orderItems
} from '$lib/server/db/schema';
import { desc, eq, and, sql, isNotNull } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { verifyAdminPassword, isPasswordSet } from '$lib/server/auth';
import { canDelete } from '$lib/server/roles';

export const load: PageServerLoad = async ({ params, url, locals }) => {
	const session = await locals.auth();
	try {
		// Get current month/year for calendar data
		const now = new Date();
		const currentMonth = now.getMonth() + 1;
		const currentYear = now.getFullYear();
		const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
		const endOfMonth = new Date(currentYear, currentMonth, 0);
		const startDateStr = startOfMonth.toISOString().split('T')[0];
		const endDateStr = endOfMonth.toISOString().split('T')[0];
		let whereConditions = [];

		// Build where conditions from URL params
		if (url.searchParams.get('record_id') && !isNaN(parseInt(url.searchParams.get('record_id')!))) {
			whereConditions.push(eq(records.recordId, parseInt(url.searchParams.get('record_id')!)));
		}
		if (url.searchParams.get('case_no')) {
			whereConditions.push(eq(orderItems.caseNo, url.searchParams.get('case_no')!));
		}
		if (
			url.searchParams.get('case_type_id') &&
			!isNaN(parseInt(url.searchParams.get('case_type_id')!))
		) {
			whereConditions.push(
				eq(orderItems.caseTypeId, parseInt(url.searchParams.get('case_type_id')!))
			);
		}
		if (url.searchParams.get('clinic_id') && !isNaN(parseInt(url.searchParams.get('clinic_id')!))) {
			whereConditions.push(eq(doctors.clinicId, parseInt(url.searchParams.get('clinic_id')!)));
		}
		if (url.searchParams.get('doctor_id') && !isNaN(parseInt(url.searchParams.get('doctor_id')!))) {
			whereConditions.push(eq(records.doctorId, parseInt(url.searchParams.get('doctor_id')!)));
		}
		if (url.searchParams.get('start_date') && url.searchParams.get('end_date')) {
			whereConditions.push(
				sql`records.date_pickup BETWEEN ${url.searchParams.get('start_date')} AND ${url.searchParams.get('end_date')}`
			);
		}
		if (url.searchParams.get('patient_name')) {
			whereConditions.push(sql`patient_name ILIKE ${`%${url.searchParams.get('patient_name')}%`}`);
		}
		if (url.searchParams.get('payment_status')) {
			whereConditions.push(sql`orders.payment_status = ${url.searchParams.get('payment_status')}`);
		}
		if (url.searchParams.get('case_status')) {
			whereConditions.push(eq(records.caseStatus, url.searchParams.get('case_status')!));
		}
		if (url.searchParams.get('case_notes')) {
			whereConditions.push(sql`case_notes ILIKE ${`%${url.searchParams.get('case_notes')}%`}`);
		}

		const orderItemsAgg = sql<
			Array<{
				caseTypeName: string;
				caseNo: number;
				orderDescription: string | null;
				upOrDown: string;
			}>
		>`array_agg(
			json_build_object(
				'caseTypeName', ${caseTypes.caseTypeName},
				'caseNo', ${orderItems.caseNo},
				'orderDescription', ${orderItems.orderDescription},
				'upOrDown', ${orderItems.upOrDown}
			)
		) FILTER (WHERE ${orderItems.orderItemId} IS NOT NULL)`;

		const baseSelect = {
			recordId: records.recordId,
			datePickup: records.datePickup,
			dateDropoff: records.actualDropoff,
			patientName: records.patientName,
			caseStatus: records.caseStatus,
			caseNotes: records.caseNotes,
			remarksDeprecated: records.remarksDeprecated,
			doctorName: doctors.doctorName,
			clinicName: clinics.clinicName,
			orderTotal: orders.orderTotal,
			paidAmount: orders.paidAmount,
			paymentStatus: orders.paymentStatus,
			orderItems: orderItemsAgg
		};

		const baseGroupBy = [
			records.recordId,
			doctors.doctorName,
			clinics.clinicName,
			orders.orderTotal,
			orders.paidAmount,
			orders.paymentStatus
		] as const;

		let baseQuery;
		if (whereConditions.length > 0) {
			baseQuery = db
				.select(baseSelect)
				.from(records)
				.innerJoin(orders, eq(records.orderId, orders.orderId))
				.leftJoin(orderItems, eq(orders.orderId, orderItems.orderId))
				.innerJoin(doctors, eq(records.doctorId, doctors.doctorId))
				.innerJoin(clinics, eq(doctors.clinicId, clinics.clinicId))
				.leftJoin(caseTypes, eq(orderItems.caseTypeId, caseTypes.caseTypeId))
				.groupBy(...baseGroupBy)
				.where(and(...whereConditions));
		} else {
			baseQuery = db
				.select(baseSelect)
				.from(records)
				.innerJoin(orders, eq(records.orderId, orders.orderId))
				.leftJoin(orderItems, eq(orders.orderId, orderItems.orderId))
				.innerJoin(doctors, eq(records.doctorId, doctors.doctorId))
				.innerJoin(clinics, eq(doctors.clinicId, clinics.clinicId))
				.leftJoin(caseTypes, eq(orderItems.caseTypeId, caseTypes.caseTypeId))
				.groupBy(...baseGroupBy);
		}

		const page = parseInt(url.searchParams.get('page') || '1');
		const limit = parseInt(url.searchParams.get('limit') || '200');
		const offset = (page - 1) * limit;

		const [
			recordData,
			caseTypeData,
			doctorData,
			clinicData,
			calendarDeliveryRecords,
			calendarFinishByRecords
		] = await Promise.all([
			baseQuery.orderBy(desc(records.datePickup)).limit(limit).offset(offset),
			db.select({
				caseTypeId: caseTypes.caseTypeId,
				caseTypeName: caseTypes.caseTypeName
			}).from(caseTypes),
			db.select({
				doctorId: doctors.doctorId,
				doctorName: doctors.doctorName
			}).from(doctors).orderBy(desc(doctors.doctorName)),
			db.select({
				clinicId: clinics.clinicId,
				clinicName: clinics.clinicName
			}).from(clinics).orderBy(desc(clinics.clinicName)),
			// Calendar delivery records
			db
				.select({
					recordId: records.recordId,
					dateDropoff: records.dateDropoff,
					patientName: records.patientName,
					caseStatus: records.caseStatus,
					caseNotes: records.caseNotes,
					remarksDeprecated: records.remarksDeprecated,
					doctorName: doctors.doctorName,
					clinicName: clinics.clinicName,
					orderItems: sql<
						Array<{
							caseTypeName: string;
							caseNo: string;
							orderDescription: string | null;
							upOrDown: string;
						}>
					>`array_agg(
						json_build_object(
							'caseTypeName', ${caseTypes.caseTypeName},
							'caseNo', ${orderItems.caseNo},
							'orderDescription', ${orderItems.orderDescription},
							'upOrDown', ${orderItems.upOrDown}
						)
					) FILTER (WHERE ${orderItems.orderItemId} IS NOT NULL)`
				})
				.from(records)
				.innerJoin(orders, eq(records.orderId, orders.orderId))
				.leftJoin(orderItems, eq(orders.orderId, orderItems.orderId))
				.innerJoin(doctors, eq(records.doctorId, doctors.doctorId))
				.innerJoin(clinics, eq(doctors.clinicId, clinics.clinicId))
				.leftJoin(caseTypes, eq(orderItems.caseTypeId, caseTypes.caseTypeId))
				.where(
					and(
						isNotNull(records.dateDropoff),
						sql`records.date_dropoff BETWEEN ${startDateStr} AND ${endDateStr}`
					)
				)
				.groupBy(records.recordId, doctors.doctorName, clinics.clinicName)
				.orderBy(desc(records.dateDropoff)),
			// Calendar finishBy records
			db
				.select({
					recordId: records.recordId,
					finishBy: records.finishBy,
					patientName: records.patientName,
					caseStatus: records.caseStatus,
					caseNotes: records.caseNotes,
					remarksDeprecated: records.remarksDeprecated,
					doctorName: doctors.doctorName,
					clinicName: clinics.clinicName,
					orderItems: sql<
						Array<{
							caseTypeName: string;
							caseNo: string;
							orderDescription: string | null;
							upOrDown: string;
						}>
					>`array_agg(
						json_build_object(
							'caseTypeName', ${caseTypes.caseTypeName},
							'caseNo', ${orderItems.caseNo},
							'orderDescription', ${orderItems.orderDescription},
							'upOrDown', ${orderItems.upOrDown}
						)
					) FILTER (WHERE ${orderItems.orderItemId} IS NOT NULL)`
				})
				.from(records)
				.innerJoin(orders, eq(records.orderId, orders.orderId))
				.leftJoin(orderItems, eq(orders.orderId, orderItems.orderId))
				.innerJoin(doctors, eq(records.doctorId, doctors.doctorId))
				.innerJoin(clinics, eq(doctors.clinicId, clinics.clinicId))
				.leftJoin(caseTypes, eq(orderItems.caseTypeId, caseTypes.caseTypeId))
				.where(
					and(
						isNotNull(records.finishBy),
						sql`DATE(records.finish_by) BETWEEN ${startDateStr} AND ${endDateStr}`
					)
				)
				.groupBy(records.recordId, doctors.doctorName, clinics.clinicName)
				.orderBy(desc(records.finishBy))
		]);
		console.log({
			records: recordData,
			caseTypes: caseTypeData,
			doctors: doctorData,
			clinics: clinicData,
			calendarDelivery: calendarDeliveryRecords,
			calendarFinishBy: calendarFinishByRecords,
			filters: Object.fromEntries(url.searchParams)
		});
		const passwordIsSet = await isPasswordSet();

		return {
			records: recordData,
			caseTypes: caseTypeData,
			doctors: doctorData,
			clinics: clinicData,
			filters: Object.fromEntries(url.searchParams),
			passwordIsSet,
			user: session?.user,
			calendarData: {
				deliveryRecords: calendarDeliveryRecords,
				finishByRecords: calendarFinishByRecords,
				month: currentMonth,
				year: currentYear
			}
		};
	} catch (error) {
		console.error('Error:', error);
		return { success: false, error: 'Failed to fetch record data' };
	}
};

export const actions = {
	deleteRecord: async ({ request, locals }) => {
		const session = await locals.auth();

		if (!session?.user) {
			return fail(401, { error: 'You must be logged in to delete records' });
		}

		// @ts-ignore
		if (!canDelete(session.user.role)) {
			return fail(403, { error: 'Unauthorized: Only admins and dentists can delete records' });
		}

		const data = await request.formData();
		const recordId = data.get('record_id')?.toString();
		const confirmPassword = data.get('confirm_password')?.toString() ?? '';
		console.log(recordId);
		if (!recordId) {
			return { success: false, error: 'Record ID for deletion is required' };
		}

		// Check if password is set
		const passwordIsSet = await isPasswordSet();
		if (!passwordIsSet) {
			return fail(400, {
				error: 'No password is set. Please set a password first in the Change Password page.'
			});
		}

		const ok = await verifyAdminPassword(confirmPassword);
		if (!ok) {
			return fail(400, { error: 'Wrong password' });
		}

		try {
			await db.transaction(async (tx) => {
				const record = await tx
					.select()
					.from(records)
					.where(eq(records.recordId, parseInt(recordId)))
					.limit(1);

				if (record.length > 0) {
					await tx.delete(history).where(eq(history.recordId, parseInt(recordId)));
					await tx.delete(orderItems).where(eq(orderItems.orderId, record[0].orderId!));
					await tx.delete(records).where(eq(records.recordId, parseInt(recordId)));
					await tx.delete(orders).where(eq(orders.orderId, record[0].orderId!));
				}
			});
		} catch (error) {
			console.error('Error deleting record:', error);
			return fail(500, { error: 'Failed to delete record data' });
		}
		throw redirect(303, `/`);
	}
} satisfies Actions;
