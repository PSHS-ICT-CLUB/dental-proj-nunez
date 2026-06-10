import { db } from '$lib/server/db';
import { and, eq, gte, lte, inArray } from 'drizzle-orm';
import { orders, orderItems, clinics, caseTypes, records, doctors } from '$lib/server/db/schema';
import type { PageServerLoad } from './$types';
import { format } from 'date-fns';

// Define types based on schema
type OrderWithItems = {
	orderId: number;
	orderDate: string;
	orderTotal: number;
	paidAmount: number | null;
	doctorId: number;
	clinicName: string;
	items: {
		caseTypeId: number;
		itemQuantity: number;
		itemCost: number;
	} | null;
};

export const load: PageServerLoad = async ({ url }) => {
	const clinicsParam = url.searchParams.get('clinics') || '';
	const clinicIds = clinicsParam
		? clinicsParam.split(',').filter(id => id && !isNaN(parseInt(id, 10))).map(id => parseInt(id, 10))
		: [];
	const startDate = url.searchParams.get('startDate') || new Date().toISOString().split('T')[0];
	const endDate = url.searchParams.get('endDate') || new Date().toISOString().split('T')[0];
	const period = url.searchParams.get('period') || 'month';

	const baseQuery = {
		orderId: orders.orderId,
		orderDate: orders.orderDate,
		orderTotal: orders.orderTotal,
		paidAmount: orders.paidAmount,
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
			clinicIds.length > 0
				? and(
					gte(orders.orderDate, startDate),
					lte(orders.orderDate, endDate),
					inArray(doctors.clinicId, clinicIds)
				)
				: and(gte(orders.orderDate, startDate), lte(orders.orderDate, endDate))
		);

	const ordersWithItems = (await ordersQuery) as unknown as OrderWithItems[];

	// Get all clinics and case types
	const allClinics = await db.select().from(clinics);
	const allCaseTypes = await db.select().from(caseTypes);

	// --- Summary Metrics ---
	const totalAmount = ordersWithItems.reduce((sum, o) => sum + Number(o.orderTotal || 0), 0);
	const paidAmount = ordersWithItems.reduce((sum, o) => sum + Number(o.paidAmount || 0), 0);
	const unpaidAmount = ordersWithItems.reduce((sum, o) => {
		const total = Number(o.orderTotal || 0);
		const paid = Number(o.paidAmount || 0);
		return sum + Math.max(0, total - paid);
	}, 0);
	const totalCases = ordersWithItems.length;
	const collectionRate = totalAmount > 0 ? (paidAmount / totalAmount) * 100 : 0;
	const avgOrderValue = totalCases > 0 ? totalAmount / totalCases : 0;

	// --- Case Type Totals (quantity) ---
	const caseTypeTotals: Record<string, number> = {};
	const caseTypeRevenue: Record<string, number> = {};
	for (const order of ordersWithItems) {
		if (order.items) {
			const ct = allCaseTypes.find(c => c.caseTypeId === order.items!.caseTypeId);
			if (ct) {
				const name = ct.caseTypeName;
				caseTypeTotals[name] = (caseTypeTotals[name] || 0) + (order.items.itemQuantity || 0);
				caseTypeRevenue[name] = (caseTypeRevenue[name] || 0) + (Number(order.items.itemCost || 0) * (order.items.itemQuantity || 0));
			}
		}
	}

	// --- Clinic breakdown ---
	const clinicRevenueMap: Record<string, { total: number; paid: number; cases: number }> = {};
	for (const order of ordersWithItems) {
		const name = order.clinicName || 'Unknown';
		if (!clinicRevenueMap[name]) clinicRevenueMap[name] = { total: 0, paid: 0, cases: 0 };
		clinicRevenueMap[name].total += Number(order.orderTotal || 0);
		clinicRevenueMap[name].paid += Number(order.paidAmount || 0);
		clinicRevenueMap[name].cases += 1;
	}

	const sortedClinicChartData = Object.fromEntries(
		Object.entries(clinicRevenueMap)
			.sort(([, a], [, b]) => b.total - a.total)
			.map(([name, vals]) => [name, vals.total])
	);

	const clinicBreakdown = Object.entries(clinicRevenueMap)
		.sort(([, a], [, b]) => b.total - a.total)
		.map(([name, vals]) => ({
			name,
			total: vals.total,
			paid: vals.paid,
			cases: vals.cases,
			collectionRate: vals.total > 0 ? (vals.paid / vals.total) * 100 : 0
		}));

	const topClinic = clinicBreakdown[0] ?? null;

	// --- Revenue Flow chart data (grouped by period, per clinic) ---
	const chartDataRaw: Record<string, Record<string, number>> = {};
	for (const order of ordersWithItems) {
		const date = new Date(order.orderDate);
		let key = format(date, 'yyyy-MM-dd');
		if (period === 'month') key = format(date, 'MMMM yyyy');
		else if (period === 'year') key = format(date, 'yyyy');

		const clinicName = order.clinicName || 'Unknown';
		if (!chartDataRaw[key]) chartDataRaw[key] = { total: 0 };
		chartDataRaw[key][clinicName] = (chartDataRaw[key][clinicName] || 0) + Number(order.orderTotal || 0);
		chartDataRaw[key].total += Number(order.orderTotal || 0);
	}

	const sortedChartLabels = Object.keys(chartDataRaw).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
	const activeClinics = Array.from(new Set(ordersWithItems.map(o => o.clinicName || 'Unknown'))).sort();

	const chartData = {
		labels: sortedChartLabels,
		datasets: activeClinics.map(clinic => ({
			label: clinic,
			data: sortedChartLabels.map(label => chartDataRaw[label][clinic] || 0)
		})),
		totals: sortedChartLabels.map(label => chartDataRaw[label].total || 0)
	};

	// --- Collection Rate per period (for trend line chart) ---
	// Build a parallel per-period paid/total map from ordersWithItems
	const collRateRaw: Record<string, { paid: number; total: number }> = {};
	for (const order of ordersWithItems) {
		const date = new Date(order.orderDate);
		let key = format(date, 'yyyy-MM-dd');
		if (period === 'month') key = format(date, 'MMMM yyyy');
		else if (period === 'year') key = format(date, 'yyyy');
		if (!collRateRaw[key]) collRateRaw[key] = { paid: 0, total: 0 };
		collRateRaw[key].total += Number(order.orderTotal || 0);
		collRateRaw[key].paid  += Number(order.paidAmount || 0);
	}
	const collectionRateTrend = {
		labels: sortedChartLabels,
		rates:  sortedChartLabels.map(l => {
			const { paid, total } = collRateRaw[l] ?? { paid: 0, total: 0 };
			return total > 0 ? Math.round((paid / total) * 1000) / 10 : 0;
		})
	};

	// --- Avg Order Value per clinic ---
	const avgOrderValuePerClinic = clinicBreakdown.map(c => ({
		name: c.name,
		avg:  c.cases > 0 ? c.total / c.cases : 0
	})).sort((a, b) => b.avg - a.avg);

	// --- Revenue Trend: % change vs previous period ---
	const midpoint = Math.floor(sortedChartLabels.length / 2);
	const firstHalfTotal  = sortedChartLabels.slice(0, midpoint).reduce((s, l) => s + (chartDataRaw[l]?.total || 0), 0);
	const secondHalfTotal = sortedChartLabels.slice(midpoint).reduce((s, l) => s + (chartDataRaw[l]?.total || 0), 0);
	const revenueTrendPct = firstHalfTotal > 0
		? ((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100
		: null;

	return {
		summary: {
			totalCases,
			totalAmount,
			paidAmount,
			unpaidAmount,
			collectionRate,
			avgOrderValue,
			caseTypeTotals,
			caseTypeRevenue,
			paymentStatusData: { paid: paidAmount, unpaid: unpaidAmount },
			topClinic,
			revenueTrendPct
		},
		clinics: allClinics.map(c => ({ id: c.clinicId, name: c.clinicName })),
		selectedClinics: clinicsParam ? clinicsParam.split(',') : [],
		selectedPeriod: period,
		dateRange: { start: startDate, end: endDate },
		chartData,
		clinicChartData: sortedClinicChartData,
		clinicBreakdown,
		collectionRateTrend,
		avgOrderValuePerClinic
	} as const;
};
