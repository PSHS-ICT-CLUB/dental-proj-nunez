import { db } from '$lib/server/db';
import { and, eq, gte, lte } from 'drizzle-orm';
import { orders, orderItems, clinics, caseTypes, records, doctors } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';
import { format } from 'date-fns';

// Define types based on schema
type OrderWithItems = {
	orderId: number;
	orderDate: string;
	orderTotal: number;
	paidAmount: number | null;
	paymentStatus: string | null;
	doctorId: number;
	clinicName: string;
	items: {
		caseTypeId: number;
		itemQuantity: number;
		itemCost: number;
	} | null;
};

type CaseTypeTotal = {
	caseTypeId: number;
	caseTypeName: string;
	total: number;
};

type Summary = {
	totalCases: number;
	totalAmount: number;
	paidAmount: number;
	unpaidAmount: number;
	balance: number;
	averageOrderValue: number;
	caseTypes: Record<string, number>;
	caseTypeTotals: Record<string, number>;
	paymentStatusBreakdown: {
		paid: number;
		unpaid: number;
	};
};

export const load: PageServerLoad = async ({ url }) => {
	const clinicId = url.searchParams.get('clinic') || 'all';
	const startDate = url.searchParams.get('startDate') || new Date().toISOString().split('T')[0];
	const endDate = url.searchParams.get('endDate') || new Date().toISOString().split('T')[0];
	const period = url.searchParams.get('period') || 'month';

	const baseQuery = {
		orderId: orders.orderId,
		orderDate: orders.orderDate,
		orderTotal: orders.orderTotal,
		paidAmount: orders.paidAmount,
		paymentStatus: orders.paymentStatus,
		doctorId: records.doctorId,
		clinicName: clinics.clinicName,
		items: {
			caseTypeId: orderItems.caseTypeId,
			itemQuantity: orderItems.itemQuantity,
			itemCost: orderItems.itemCost
		}
	};

	const ordersQuery = db
		.select(baseQuery)
		.from(orders)
		.leftJoin(orderItems, eq(orders.orderId, orderItems.orderId))
		.leftJoin(records, eq(orders.orderId, records.orderId))
		.leftJoin(doctors, eq(records.doctorId, doctors.doctorId))
		.leftJoin(clinics, eq(doctors.clinicId, clinics.clinicId))
		.where(
			clinicId !== 'all'
				? and(
						gte(orders.orderDate, startDate),
						lte(orders.orderDate, endDate),
						eq(doctors.clinicId, parseInt(clinicId))
					)
				: and(gte(orders.orderDate, startDate), lte(orders.orderDate, endDate))
		);

	const ordersWithItems = (await ordersQuery) as unknown as OrderWithItems[];

	// Get all clinics and case types with proper typing
	const allClinics = await db.select().from(clinics);
	const allCaseTypes = await db.select().from(caseTypes);

	// Calculate summaries with proper typing
	const totalAmount = ordersWithItems.reduce(
		(sum, order) => sum + Number(order.orderTotal || 0),
		0
	);
	const paidAmount = ordersWithItems.reduce((sum, order) => sum + Number(order.paidAmount || 0), 0);
	const unpaidAmount = totalAmount - paidAmount;
	const balance = paidAmount - totalAmount; // Positive = overpaid, Negative = underpaid

	const summary: Summary = {
		totalCases: ordersWithItems.length,
		totalAmount,
		paidAmount,
		unpaidAmount,
		balance,
		averageOrderValue: ordersWithItems.length > 0 ? totalAmount / ordersWithItems.length : 0,
		caseTypes: ordersWithItems.reduce(
			(acc, order) => {
				if (order.items) {
					const caseType = allCaseTypes.find((ct) => ct.caseTypeId === order.items.caseTypeId);
					if (caseType) {
						acc[caseType.caseTypeName] =
							(acc[caseType.caseTypeName] || 0) + (order.items.itemQuantity || 0);
					}
				}
				return acc;
			},
			{} as Record<string, number>
		),
		caseTypeTotals: ordersWithItems.reduce(
			(acc, order) => {
				if (order.items) {
					const caseType = allCaseTypes.find((ct) => ct.caseTypeId === order.items.caseTypeId);
					if (caseType) {
						acc[caseType.caseTypeName] =
							(acc[caseType.caseTypeName] || 0) + (order.items.itemQuantity || 0);
					}
				}
				return acc;
			},
			{} as Record<string, number>
		),
		paymentStatusBreakdown: {
			paid: ordersWithItems.filter((order) => order.paymentStatus === 'paid').length,
			unpaid: ordersWithItems.filter((order) => order.paymentStatus === 'unpaid').length
		}
	};

	// Prepare chart data with proper typing
	const chartData = ordersWithItems.reduce(
		(acc, order) => {
			const date = new Date(order.orderDate);
			const key = period === 'day' ? format(date, 'yyyy-MM-dd') : format(date, 'MMMM yyyy');

			acc[key] = (acc[key] || 0) + Number(order.orderTotal || 0);
			return acc;
		},
		{} as Record<string, number>
	);

	const sortedChartData = Object.fromEntries(
		Object.entries(chartData).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
	);

	const clinicChartData = ordersWithItems.reduce(
		(acc, order) => {
			const clinicName = order.clinicName || 'Unknown';
			acc[clinicName] = (acc[clinicName] || 0) + Number(order.orderTotal || 0);
			return acc;
		},
		{} as Record<string, number>
	);

	const sortedClinicChartData = Object.fromEntries(
		Object.entries(clinicChartData).sort(([, a], [, b]) => b - a)
	);

	return {
		summary,
		clinics: allClinics.map((clinic) => ({
			id: clinic.clinicId,
			name: clinic.clinicName
		})),
		selectedClinic: clinicId,
		selectedPeriod: period,
		dateRange: {
			start: startDate,
			end: endDate
		},
		chartData: sortedChartData,
		clinicChartData: sortedClinicChartData
	} as const;
};
