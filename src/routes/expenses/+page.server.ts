import type { Actions, PageServerLoad } from '../$types';
import { db } from '$lib/server/db';
import { clinics, doctors, history, records, supply } from '$lib/server/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import { requireDeletePermission } from '$lib/server/roles';

const formatDate = (date: Date): string => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

export const load: PageServerLoad = async ({ url, locals }) => {
	const session = await locals.auth();
	// Get the month and year from URL params or use current date
	const searchParams = url.searchParams;
	const currentDate = new Date();

	const yearParam = searchParams.get('year');
	let selectedYear = yearParam ? parseInt(yearParam, 10) : currentDate.getFullYear();
	if (isNaN(selectedYear)) selectedYear = currentDate.getFullYear();

	const monthParam = searchParams.get('month');
	let selectedMonth = monthParam ? parseInt(monthParam, 10) : currentDate.getMonth() + 1;
	if (isNaN(selectedMonth)) selectedMonth = currentDate.getMonth() + 1;

	// Get the first and last day of the selected month
	const startDate = new Date(selectedYear, selectedMonth - 1, 1);
	const endDate = new Date(selectedYear, selectedMonth, 0);

	const formattedStartDate = formatDate(startDate);
	const formattedEndDate = formatDate(endDate);

	const recordData = await db
		.select()
		.from(supply)
		.where(sql`"supply_date" BETWEEN ${formattedStartDate} AND ${formattedEndDate}`);

	return {
		currentMonth: selectedMonth,
		currentYear: selectedYear,
		recordData,
		user: session?.user
	};
};

export const actions = {
	add: async ({ request }) => {
		const data = await request.formData();
		const supplyDate = data.get('supply_date')?.toString();
		const supplyCost = data.get('supply_cost')?.toString();
		const description = data.get('description')?.toString() || '';

		if (!supplyDate || !supplyCost) {
			return {
				success: false,
				error: 'Missing required fields'
			};
		}

		try {
			await db.insert(supply).values({
				supplyDate,
				supplyCost,
				supplyDescription: description
			} as typeof supply.$inferInsert);

			return {
				success: true,
				message: 'Expense added successfully'
			};
		} catch (error) {
			console.error('Error adding expense:', error);
			return {
				success: false,
				error: 'Failed to add expense'
			};
		}
	},

	changeMonth: async ({ request }) => {
		const data = await request.formData();
		const month = data.get('month')?.toString() || '';
		const year = data.get('year')?.toString() || '';

		// Redirect to the same page with new query parameters
		throw redirect(303, `?month=${month}&year=${year}`);
	},

	deleteExpenses: async ({ request, locals }) => {
		const denied = await requireDeletePermission(locals);
		if (denied) return denied;

		const data = await request.formData();
		const supplyId = data.get('supply_id')?.toString();

		if (!supplyId) {
			return {
				success: false,
				error: 'Supply ID is required'
			};
		}

		try {
			await db.delete(supply).where(eq(supply.supplyId, parseInt(supplyId, 10)));

			return {
				success: true,
				message: 'Expense deleted successfully'
			};
		} catch (error) {
			console.error('Error deleting expense:', error);
			return {
				success: false,
				error: 'Failed to delete expense'
			};
		}
	}
} satisfies Actions;
