import type { Actions, PageServerLoad } from '../$types';
import { db } from '$lib/server/db';
import {
	clinics,
	doctors,
	history,
	records,
	supply,
	orders,
	orderItems,
	inventoryItems,
	recordInventoryUsages
} from '$lib/server/db/schema';
import { desc, sql, and, eq, isNotNull, between } from 'drizzle-orm';
import { convertFileToBytea } from '$lib';
import { redirect } from '@sveltejs/kit';
// // dev-only mocks
// let devMocks: typeof import('$lib/mock/sales') | null = null;
// if (import.meta.env && import.meta.env.DEV) {
//   // dynamic import to avoid bundling mocks into production
//   // eslint-disable-next-line @typescript-eslint/no-var-requires
//   devMocks = await import('$lib/mock/sales');
// }

// Function to format a Date object into the desired string format
const timestampDate = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	const hours = String(date.getHours()).padStart(2, '0');
	const minutes = String(date.getMinutes()).padStart(2, '0');
	const seconds = String(date.getSeconds()).padStart(2, '0');
	const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
	const offset = '+08'; // Assuming the timezone is +08

	return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}${offset}`;
};
const formatDate = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');

	return `${year}-${month}-${day}`;
};
export const load: PageServerLoad = async ({ url }) => {
	const searchParams = url.searchParams;
	const status = searchParams.get('status') || null;
	const exactDate = searchParams.get('date');
	// If remarks parameter exists but is empty string, show all (null)
	// If remarks parameter doesn't exist, default to 'finished'
	// If remarks parameter has a value, use that value
	const caseStatusParam = searchParams.get('case_status');
	const caseStatus = caseStatusParam === null ? 'finished' : caseStatusParam === '' ? null : caseStatusParam;
	const caseNotesSearch = searchParams.get('case_notes');
	const clinicId = searchParams.get('clinic_id') || null;
	// if (import.meta.env && import.meta.env.DEV && devMocks) {
	//   // Use mock data in development
	//   const recordData = devMocks.getMockRecords({ status, exactDate, remarks });
	//   const supplies = devMocks.getMockSupplies({ exactDate });

	//   const date = exactDate ? new Date(exactDate) : new Date();
	//   return {
	//     currentDate: exactDate,
	//     currentMonth: date.getMonth() + 1,
	//     currentYear: date.getFullYear(),
	//     recordData,
	//     supplies
	//   };
	// }

	if (exactDate) {
		const date = new Date(exactDate);
		// Build conditions array, filtering out undefined values
		const conditions = [
			sql`DATE(${records.dateDropoff}) = ${exactDate}`,
			status && status !== '' ? eq(orders.paymentStatus, status) : undefined,
			caseStatus && caseStatus !== '' ? eq(records.caseStatus, caseStatus) : undefined,
			caseNotesSearch && caseNotesSearch !== '' ? sql`case_notes ILIKE ${`%${caseNotesSearch}%`}` : undefined,
			clinicId && clinicId !== '' ? eq(clinics.clinicId, parseInt(clinicId)) : undefined
		].filter((condition): condition is NonNullable<typeof condition> => condition !== undefined);

		// Query for exact date with proper joins
		const recordData = await db
			.select({
				record: {
					recordId: records.recordId,
					patientName: records.patientName,
					dateDropoff: records.dateDropoff,
					caseStatus: records.caseStatus,
					caseNotes: records.caseNotes
				},
				order: {
					orderTotal: orders.orderTotal,
					paidAmount: orders.paidAmount,
					paymentStatus: orders.paymentStatus,
					paymentMethod: orders.paymentMethod
				},
				clinicName: clinics.clinicName,
				items: sql<
					Array<{
						caseNo: string;
						orderDescription: string | null;
						itemCost: string;
						itemQuantity: number;
					}>
				>`
          json_agg(
            json_build_object(
              'caseNo', ${orderItems.caseNo},
              'orderDescription', ${orderItems.orderDescription},
              'itemCost', ${orderItems.itemCost},
              'itemQuantity', ${orderItems.itemQuantity}
            )
          )`,
				balance: sql<number>`(${orders.orderTotal} - COALESCE(${orders.paidAmount}, 0))`
			})
			.from(records)
			.innerJoin(orders, eq(records.orderId, orders.orderId))
			.innerJoin(orderItems, eq(orders.orderId, orderItems.orderId))
			.innerJoin(doctors, eq(records.doctorId, doctors.doctorId))
			.innerJoin(clinics, eq(doctors.clinicId, clinics.clinicId))
			.where(and(...conditions))
			.groupBy(records.recordId, orders.orderId, doctors.doctorId, clinics.clinicId);

		const supplies = await db
			.select()
			.from(supply)
			.where(sql`DATE(supply_date) = ${exactDate}`);

		// Get all clinics for the filter dropdown
		const allClinics = await db
			.select({
				clinicId: clinics.clinicId,
				clinicName: clinics.clinicName
			})
			.from(clinics)
			.orderBy(clinics.clinicName);

		const inventoryUsages = await db
			.select({
				usageId: recordInventoryUsages.id,
				recordId: recordInventoryUsages.recordId,
				quantityUsed: recordInventoryUsages.quantityUsed,
				itemName: inventoryItems.name,
				itemUnit: inventoryItems.unit,
				itemId: inventoryItems.id,
				cost: inventoryItems.cost
			})
			.from(recordInventoryUsages)
			.innerJoin(inventoryItems, eq(recordInventoryUsages.itemId, inventoryItems.id))
			.innerJoin(records, eq(recordInventoryUsages.recordId, records.recordId))
			.where(and(...conditions));

		return {
			currentDate: exactDate,
			currentMonth: date.getMonth() + 1,
			currentYear: date.getFullYear(),
			recordData,
			supplies,
			clinics: allClinics,
			inventoryUsages
		};
	} else {
		const currentDate = new Date();

		// Get month and year from URL params or use current date
		const yearParam = searchParams.get('year');
		let selectedYear = yearParam ? parseInt(yearParam, 10) : currentDate.getFullYear();
		if (isNaN(selectedYear)) selectedYear = currentDate.getFullYear();

		const monthParam = searchParams.get('month');
		let selectedMonth = monthParam ? parseInt(monthParam, 10) : currentDate.getMonth() + 1;
		if (isNaN(selectedMonth)) selectedMonth = currentDate.getMonth() + 1;

		// Get the first and last day of the selected month
		const startDate = new Date(selectedYear, selectedMonth - 1, 1);
		const endDate = new Date(selectedYear, selectedMonth, 0);

		// Build conditions array, filtering out undefined values
		const conditions = [
			isNotNull(records.dateDropoff),
			sql`${records.dateDropoff} BETWEEN ${formatDate(startDate)} AND ${formatDate(endDate)}`,
			status && status !== '' ? eq(orders.paymentStatus, status) : undefined,
			caseStatus && caseStatus !== '' ? eq(records.caseStatus, caseStatus) : undefined,
			caseNotesSearch && caseNotesSearch !== '' ? sql`case_notes ILIKE ${`%${caseNotesSearch}%`}` : undefined,
			clinicId && clinicId !== '' ? eq(clinics.clinicId, parseInt(clinicId)) : undefined
		].filter((condition): condition is NonNullable<typeof condition> => condition !== undefined);

		const recordData = await db
			.select({
				record: {
					recordId: records.recordId,
					patientName: records.patientName,
					dateDropoff: records.dateDropoff,
					caseStatus: records.caseStatus,
					caseNotes: records.caseNotes
				},
				order: {
					orderTotal: orders.orderTotal,
					paidAmount: orders.paidAmount,
					paymentStatus: orders.paymentStatus,
					paymentMethod: orders.paymentMethod
				},
				clinicName: clinics.clinicName,
				items: sql<
					Array<{
						caseNo: string;
						orderDescription: string | null;
						itemCost: string;
						itemQuantity: number;
					}>
				>`
          json_agg(
            json_build_object(
              'caseNo', ${orderItems.caseNo},
              'orderDescription', ${orderItems.orderDescription},
              'itemCost', ${orderItems.itemCost},
              'itemQuantity', ${orderItems.itemQuantity}
            )
          )`,
				balance: sql<number>`(${orders.orderTotal} - COALESCE(${orders.paidAmount}, 0))`
			})
			.from(records)
			.innerJoin(orders, eq(records.orderId, orders.orderId))
			.innerJoin(orderItems, eq(orders.orderId, orderItems.orderId))
			.innerJoin(doctors, eq(records.doctorId, doctors.doctorId))
			.innerJoin(clinics, eq(doctors.clinicId, clinics.clinicId))
			.where(and(...conditions))
			.groupBy(records.recordId, orders.orderId, doctors.doctorId, clinics.clinicId);
		// .where(sql`records.date_dropoff IS NOT NULL AND records.date_dropoff BETWEEN ${formatDate(startDate)} AND ${formatDate(endDate)}`)
		// .where(status ? sql`(${orders.paymentStatus} = ${status})` : sql`TRUE`)
		// .groupBy(records.recordId, orders.orderId, doctors.doctorId, clinics.clinicId);

		const supplies = await db
			.select()
			.from(supply)
			.where(sql`supply_date BETWEEN ${formatDate(startDate)} AND ${formatDate(endDate)}`);

		// Get all clinics for the filter dropdown
		const allClinics = await db
			.select({
				clinicId: clinics.clinicId,
				clinicName: clinics.clinicName
			})
			.from(clinics)
			.orderBy(clinics.clinicName);

		const inventoryUsages = await db
			.select({
				usageId: recordInventoryUsages.id,
				recordId: recordInventoryUsages.recordId,
				quantityUsed: recordInventoryUsages.quantityUsed,
				itemName: inventoryItems.name,
				itemUnit: inventoryItems.unit,
				itemId: inventoryItems.id,
				cost: inventoryItems.cost
			})
			.from(recordInventoryUsages)
			.innerJoin(inventoryItems, eq(recordInventoryUsages.itemId, inventoryItems.id))
			.innerJoin(records, eq(recordInventoryUsages.recordId, records.recordId))
			.where(and(...conditions));

		return {
			currentMonth: selectedMonth,
			currentYear: selectedYear,
			recordData,
			supplies,
			clinics: allClinics,
			inventoryUsages
		};
	}
};

export const actions = {
	changeDate: async ({ request }) => {
		const data = await request.formData();
		const exactDate = data.get('exact_date')?.toString();

		if (exactDate) {
			// Handle exact date query
			return redirect(303, `?date=${exactDate}`);
		} else {
			// Handle month/year query
			const month = data.get('month')?.toString() || '';
			const year = data.get('year')?.toString() || '';
			return redirect(303, `?month=${month}&year=${year}`);
		}
	}
} satisfies Actions;
