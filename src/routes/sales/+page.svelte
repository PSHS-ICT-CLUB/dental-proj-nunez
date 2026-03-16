<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import MonthYearPicker from '$lib/components/MonthYearPicker.svelte';
	import SearchableSelect from '$lib/components/SearchableSelect.svelte';
	import { onMount } from 'svelte';

	let { data, form }: PageProps = $props();
	let { currentMonth, currentYear, recordData, supplies, inventoryUsages } = data;
	let selectedMonth = $state(currentMonth);
	let selectedYear = $state(currentYear);
	let caseStatusValue = $state('finished');
	let caseNotesValue = $state('');
	let statusValue = $state('');
	let clinicValue = $state('');

	const clinicOptions = $derived([
		{ value: '', label: 'All Clinics' },
		...((data as { clinics?: any[] }).clinics?.map((clinic: any) => ({
			value: clinic.clinicId.toString(),
			label: clinic.clinicName
		})) || [])
	]);

	onMount(() => {
		try {
			const p = new URLSearchParams(window.location.search);
			const caseStatusParam = p.get('case_status');
			if (caseStatusParam === null) {
				caseStatusValue = 'finished';
				p.set('case_status', 'finished');
				const base = window.location.pathname + '?' + p.toString();
				window.history.replaceState({}, '', base);
			} else {
				caseStatusValue = caseStatusParam || '';
			}
			caseNotesValue = p.get('case_notes') || '';
			statusValue = p.get('status') || '';
			clinicValue = p.get('clinic_id') || '';
		} catch (e) {
			// noop
		}
	});

	interface ClientTransaction {
		name: string;
		transactions: Array<{
			dateDropoff: string;
			patientName: string;
			paidAmount: number;
			orderTotal: number;
			paymentMethod: string;
			paymentStatus: string;
			caseStatus: string;
			caseNotes: string;
		}>;
		totalIncome: number;
	}

	function calculateClientIncome(records: any[]): ClientTransaction[] {
		const clientData: { [key: string]: { transactions: any[]; totalIncome: number } } = {};

		records.forEach((record) => {
			const clinic = record.clinicName;
			const paid = parseFloat(record.order?.paidAmount || 0);
			const dropoff = record.record?.dateDropoff;

			// Only process records that have a dropoff date
			if (clinic && dropoff) {
				if (!clientData[clinic]) {
					clientData[clinic] = { transactions: [], totalIncome: 0 };
				}

				clientData[clinic].transactions.push({
					dateDropoff: dropoff,
					patientName: record.record.patientName,
					paidAmount: paid,
					orderTotal: parseFloat(record.order?.orderTotal || 0),
					paymentMethod: record.order?.paymentMethod,
					paymentStatus: record.order?.paymentStatus,
					record: record.record // Add the full record object
				});

				clientData[clinic].totalIncome += paid;
			}
		});

		return Object.entries(clientData).map(([name, data]) => ({
			name,
			transactions: data.transactions,
			totalIncome: data.totalIncome
		}));
	}

	// Also update the total income calculation
	function calculateTotalIncome(records: any[]): number {
		return records.reduce((total, record) => {
			// Only include in total if there's a dropoff date
			if (record.record?.dateDropoff) {
				return total + parseFloat(record.order?.paidAmount || 0);
			}
			return total;
		}, 0);
	}

	function calculateTotalSupply(supplies: any[]): number {
		return supplies.reduce((total, supply) => {
			return total + (parseFloat(supply.supplyCost) || 0);
		}, 0);
	}

	const clients: ClientTransaction[] = calculateClientIncome(recordData);
	const totalIncome: number = calculateTotalIncome(recordData);

	// Calculate total supply from supplies array
	const totalSupply: number = calculateTotalSupply(supplies);
	let staffSalaries = $state([]);
	let newStaffName = $state('');
	let newStaffSalary = $state('');

	// Format date for display
	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleDateString();
	}

	function fmt(v: unknown) {
		const n = Number(v ?? 0) || 0;
		return n.toLocaleString('en-PH', {
			style: 'currency',
			currency: 'PHP',
			minimumFractionDigits: 2
		});
	}

	function addSalary() {
		if (newStaffName && newStaffSalary) {
			staffSalaries = [
				...staffSalaries,
				{
					name: newStaffName,
					salary: parseFloat(newStaffSalary)
				}
			];
			newStaffName = '';
			newStaffSalary = '';
		}
	}

	function removeSalary(index: number) {
		staffSalaries = staffSalaries.filter((_, i) => i !== index);
	}

	// Centralized financial data state
	let financialData = $state({
		weekly: [] as WeeklyTransactions[],
		totalIncome: 0,
		totalSupply: 0,
		totalSalaries: 0,
		totalExpenses: 0,
		totalWeeklyExpenses: 0,
		totalProfit: 0
	});

	// Controls ordering of weeks (e.g. Week 4 → Week 1 or Week 1 → Week 4)
	let weekSortDirection = $state<'asc' | 'desc'>('desc');

	function recalculateFinancialData() {
		// Calculate weekly data
		const weeklyRaw = groupTransactionsByWeek(recordData, supplies, staffSalaries, inventoryUsages || []);
		// Apply week sort (week 4 → 1 or 1 → 4)
		const weekly = weekSortDirection === 'asc' ? weeklyRaw : [...weeklyRaw].reverse();

		// Calculate totals
		const totalIncome = calculateTotalIncome(recordData);
		const totalSupply = calculateTotalSupply(supplies);
		const totalSalaries = staffSalaries.reduce((total, staff) => total + staff.salary, 0);
		const totalWeeklyExpenses = weekly.reduce((total, week) => total + week.totalExpenses, 0);
		// FIX: totalExpenses should only be totalWeeklyExpenses (no double counting)
		const totalExpenses = totalWeeklyExpenses;
		const totalProfit = totalIncome - totalExpenses;
		financialData = {
			weekly,
			totalIncome,
			totalSupply,
			totalSalaries,
			totalExpenses,
			totalWeeklyExpenses,
			totalProfit
		};
	}

	// Recalculate whenever dependencies change
	$effect(() => {
		recalculateFinancialData();
	});

	// Add weekly salary from input
	function addWeeklySalary(weekRange: string, staffName: string, amount: number) {
		if (amount > 0 && staffName) {
			// Find the week and update it
			const weekIndex = financialData.weekly.findIndex((w) => w.weekRange === weekRange);
			if (weekIndex !== -1) {
				const newExpense = {
					date: weekRange.split(' - ')[0],
					description: `Weekly Salary - ${staffName}`,
					amount,
					type: 'salary' as const
				};
				const updatedWeek = {
					...financialData.weekly[weekIndex],
					expenses: [...financialData.weekly[weekIndex].expenses, newExpense],
					totalExpenses: financialData.weekly[weekIndex].totalExpenses + amount,
					weeklyProfit:
						financialData.weekly[weekIndex].totalAmount -
						(financialData.weekly[weekIndex].totalExpenses + amount)
				};
				// Update the array
				const updatedWeekly = [
					...financialData.weekly.slice(0, weekIndex),
					updatedWeek,
					...financialData.weekly.slice(weekIndex + 1)
				];
				// Recalculate totals based only on updated weekly data
				const totalWeeklyExpenses = updatedWeekly.reduce(
					(total, week) => total + week.totalExpenses,
					0
				);
				const totalExpenses = totalWeeklyExpenses;
				const totalProfit = financialData.totalIncome - totalExpenses;
				financialData = {
					...financialData,
					weekly: updatedWeekly,
					totalWeeklyExpenses,
					totalExpenses,
					totalProfit
				};
			}
		}
	}
	// Add this near the top of your script section
	interface WeeklySalaryInput {
		staffName: string;
		amount: number;
	}

	let salaryInputs = $state(new Map<string, WeeklySalaryInput>());

	// Add these helper functions after the interface definition
	function getWeekRange(date: Date): string {
		const startOfWeek = new Date(date);
		startOfWeek.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
		const endOfWeek = new Date(startOfWeek);
		endOfWeek.setDate(startOfWeek.getDate() + 6); // End of week (Saturday)

		return `${formatDate(startOfWeek.toISOString())} - ${formatDate(endOfWeek.toISOString())}`;
	}

	interface WeeklyTransactions {
		weekRange: string;
		transactions: Array<{
			clinic: string;
			dateDropoff: string;
			patientName: string;
			paidAmount: number;
			orderTotal: number;
			paymentMethod: string;
			paymentStatus: string;
			balance?: number;
			record?: {
				caseStatus: string;
				caseNotes: string;
				patientName: string;
				dateDropoff: string;
			};
		}>;
		expenses: Array<{
			date: string;
			description: string;
			amount: number;
			type: 'supply' | 'salary' | 'inventory';
		}>;
		inventoryUsages: Array<{
			usageId: number;
			date: string;
			itemName: string;
			quantityUsed: number;
			itemUnit: string;
			cost: number;
			totalCost: number;
			patientName: string;
		}>;
		totalAmount: number;
		totalExpenses: number;
		weeklyProfit: number;
	}

	function groupTransactionsByWeek(
		records: any[],
		supplies: any[],
		salaries: any[],
		inventoryUsagesData: any[]
	): WeeklyTransactions[] {
		const weeklyData = new Map<string, WeeklyTransactions>();

		// Helper function to get or create week data
		const getWeekData = (date: Date) => {
			const weekRange = getWeekRange(date);
			if (!weeklyData.has(weekRange)) {
				weeklyData.set(weekRange, {
					weekRange,
					transactions: [],
					expenses: [],
					inventoryUsages: [],
					totalAmount: 0,
					totalExpenses: 0,
					weeklyProfit: 0
				});
			}
			const weekData = weeklyData.get(weekRange)!;
			// Calculate profit whenever expenses or income changes
			weekData.weeklyProfit = weekData.totalAmount - weekData.totalExpenses;
			return weekData;
		};

		// Group transactions by week
		records.forEach((record) => {
			if (record.record?.dateDropoff) {
				const dropoffDate = new Date(record.record.dateDropoff);
				const weekData = getWeekData(dropoffDate);
				const paidAmount = parseFloat(record.order?.paidAmount || 0);

				const balance =
					record.order?.balance ?? parseFloat(record.order?.orderTotal || 0) - paidAmount;

				weekData.transactions.push({
					clinic: record.clinicName,
					dateDropoff: record.record.dateDropoff,
					patientName: record.record.patientName,
					paidAmount,
					orderTotal: parseFloat(record.order?.orderTotal || 0),
					balance,
					paymentMethod: record.order?.paymentMethod,
					paymentStatus: record.order?.paymentStatus,
					record: {
						caseStatus: record.record.caseStatus || 'pending',
						caseNotes: record.record.caseNotes || '',
						patientName: record.record.patientName,
						dateDropoff: record.record.dateDropoff
					}
				});
				weekData.totalAmount += paidAmount;
				// Sort transactions by date after adding new one
				weekData.transactions.sort((a, b) => sortByDate(a.dateDropoff, b.dateDropoff));
				// Update profit after adding income
				weekData.weeklyProfit = weekData.totalAmount - weekData.totalExpenses;
			}
		});

		// Group supplies by week
		supplies.forEach((supply) => {
			const supplyDate = new Date(supply.supplyDate);
			const weekData = getWeekData(supplyDate);
			const amount = parseFloat(supply.supplyCost || 0);

			weekData.expenses.push({
				date: supply.supplyDate,
				description: supply.supplyDescription || 'Supply Cost',
				amount,
				type: 'supply'
			});
			weekData.totalExpenses += amount;
			// Sort expenses by date after adding new one
			weekData.expenses.sort((a, b) => sortByDate(a.date, b.date));
			// Update profit after adding expense
			weekData.weeklyProfit = weekData.totalAmount - weekData.totalExpenses;
		});

		// Group inventory usages by week
		inventoryUsagesData.forEach((usage) => {
			const record = records.find((r) => r.record.recordId === usage.recordId);
			if (record?.record?.dateDropoff) {
				const dropoffDate = new Date(record.record.dateDropoff);
				const weekData = getWeekData(dropoffDate);
				const costPerUnit = parseFloat(usage.cost || 0);
				const totalCost = costPerUnit * usage.quantityUsed;
				const patientName = record.record.patientName;

				weekData.inventoryUsages.push({
					usageId: usage.usageId,
					date: record.record.dateDropoff,
					itemName: usage.itemName,
					quantityUsed: usage.quantityUsed,
					itemUnit: usage.itemUnit,
					cost: costPerUnit,
					totalCost: totalCost,
					patientName
				});

				// Add as an expense
				if (totalCost > 0) {
					weekData.expenses.push({
						date: record.record.dateDropoff,
						description: `Inventory Usage - ${usage.itemName} (${usage.quantityUsed} ${usage.itemUnit || ''}) for ${patientName}`,
						amount: totalCost,
						type: 'inventory'
					});
					weekData.totalExpenses += totalCost;
                    weekData.weeklyProfit = weekData.totalAmount - weekData.totalExpenses;
				}
			}
		});

		// Add staff salaries to each week
		const weeks = Array.from(weeklyData.keys());

		if (weeks.length > 0) {
			salaries.forEach((staff) => {
				const weeklySalary = staff.salary / 4; // Monthly to weekly

				weeks.forEach((weekRange) => {
					const weekData = weeklyData.get(weekRange)!;

					// Add salary expense for the week
					const salaryExpense = {
						date: weekRange.split(' - ')[0],
						description: `Weekly Salary - ${staff.name}`,
						amount: weeklySalary,
						type: 'salary' as const
					};

					weekData.expenses.push(salaryExpense);
					weekData.totalExpenses += weeklySalary;
					// Update profit after adding salary expense
					weekData.weeklyProfit = weekData.totalAmount - weekData.totalExpenses;
				});
			});
		}

		// Sort all data by date
		const sortedData = Array.from(weeklyData.values());

		// First sort all internal arrays by date
		sortedData.forEach((week) => {
			week.transactions.sort((a, b) => sortByDate(a.dateDropoff, b.dateDropoff));
			week.expenses.sort((a, b) => sortByDate(a.date, b.date));
		});

		// Then sort weeks themselves
		return sortedData.sort((a, b) =>
			sortByDate(a.weekRange.split(' - ')[0], b.weekRange.split(' - ')[0])
		);
	}

	// Helper function for sorting
	function sortByDate(a: string, b: string): number {
		return new Date(a).getTime() - new Date(b).getTime();
	}

	type IncomeSortColumn =
		| 'date'
		| 'clinic'
		| 'patient'
		| 'orderTotal'
		| 'paidAmount'
		| 'status'
		| 'case_status';

	type ExpensesSortColumn = 'date' | 'description' | 'amount' | 'type';

	type SortDirection = 'asc' | 'desc';

	let incomeSort = $state<{ column: IncomeSortColumn; direction: SortDirection }>({
		column: 'date',
		direction: 'asc'
	});

	let expensesSort = $state<{ column: ExpensesSortColumn; direction: SortDirection }>({
		column: 'date',
		direction: 'asc'
	});

	function toggleIncomeSort(column: IncomeSortColumn) {
		if (incomeSort.column === column) {
			incomeSort = {
				...incomeSort,
				direction: incomeSort.direction === 'asc' ? 'desc' : 'asc'
			};
		} else {
			incomeSort = { column, direction: 'asc' };
		}

		// Keep week ordering in sync with the date sort on the income table
		if (column === 'date') {
			weekSortDirection = incomeSort.direction;
		}
	}

	function toggleExpensesSort(column: ExpensesSortColumn) {
		if (expensesSort.column === column) {
			expensesSort = {
				...expensesSort,
				direction: expensesSort.direction === 'asc' ? 'desc' : 'asc'
			};
		} else {
			expensesSort = { column, direction: 'asc' };
		}
	}

	function compareValues(a: string | number, b: string | number, direction: SortDirection): number {
		let result: number;

		if (typeof a === 'number' && typeof b === 'number') {
			result = a - b;
		} else {
			const aStr = String(a).toLowerCase();
			const bStr = String(b).toLowerCase();
			if (aStr < bStr) result = -1;
			else if (aStr > bStr) result = 1;
			else result = 0;
		}

		return direction === 'asc' ? result : -result;
	}

	function sortIncomeTransactions(
		a: WeeklyTransactions['transactions'][number],
		b: WeeklyTransactions['transactions'][number]
	): number {
		switch (incomeSort.column) {
			case 'date':
				return incomeSort.direction === 'asc'
					? sortByDate(a.dateDropoff, b.dateDropoff)
					: sortByDate(b.dateDropoff, a.dateDropoff);
			case 'clinic':
				return compareValues(a.clinic, b.clinic, incomeSort.direction);
			case 'patient':
				return compareValues(a.patientName, b.patientName, incomeSort.direction);
			case 'orderTotal':
				return compareValues(a.orderTotal, b.orderTotal, incomeSort.direction);
			case 'paidAmount':
				return compareValues(a.paidAmount, b.paidAmount, incomeSort.direction);
			case 'status':
				return compareValues(a.paymentStatus, b.paymentStatus, incomeSort.direction);
			case 'case_status':
				return compareValues(
					a.record?.caseStatus ?? 'pending',
					b.record?.caseStatus ?? 'pending',
					incomeSort.direction
				);
		}
	}

	function sortExpenses(
		a: WeeklyTransactions['expenses'][number],
		b: WeeklyTransactions['expenses'][number]
	): number {
		switch (expensesSort.column) {
			case 'date':
				return expensesSort.direction === 'asc'
					? sortByDate(a.date, b.date)
					: sortByDate(b.date, a.date);
			case 'description':
				return compareValues(a.description, b.description, expensesSort.direction);
			case 'amount':
				return compareValues(a.amount, b.amount, expensesSort.direction);
			case 'type':
				return compareValues(a.type, b.type, expensesSort.direction);
		}
	}

	function getSortedTransactions(week: WeeklyTransactions) {
		return [...week.transactions].sort((a, b) => sortIncomeTransactions(a, b));
	}

	function getSortedExpenses(week: WeeklyTransactions) {
		return [...week.expenses].sort((a, b) => sortExpenses(a, b));
	}

	function deleteWeeklySalaryExpense(weekRange: string, expenseIndex: number) {
		const weekIndex = financialData.weekly.findIndex((w) => w.weekRange === weekRange);
		if (weekIndex !== -1) {
			const week = financialData.weekly[weekIndex];
			const expenseToDelete = week.expenses[expenseIndex];
			if (expenseToDelete && expenseToDelete.type === 'salary') {
				const updatedExpenses = week.expenses.filter((_, i) => i !== expenseIndex);
				const updatedTotalExpenses = week.totalExpenses - expenseToDelete.amount;
				const updatedWeek = {
					...week,
					expenses: updatedExpenses,
					totalExpenses: updatedTotalExpenses,
					weeklyProfit: week.totalAmount - updatedTotalExpenses
				};
				const updatedWeekly = [
					...financialData.weekly.slice(0, weekIndex),
					updatedWeek,
					...financialData.weekly.slice(weekIndex + 1)
				];
				financialData = {
					...financialData,
					weekly: updatedWeekly
				};
				// Ensure all totals and summaries are recalculated
				recalculateFinancialData();
			}
		}
	}

	// Status mapping for human-readable labels
	const statusLabels: Record<string, string> = {
		'pending': 'Pending',
		'finished': 'Finished',
		'to be deliver': 'Ready for Delivery',
		'to be reviewed': 'Pending Review',
		'to be reviewed by dentist': 'Reviewed by Dentist'
	};
</script>

<div class="mx-auto max-w-6xl px-4 py-8">
	<div class="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
		<h1 class="text-2xl font-bold">Financial Summary</h1>
		<div class="text-sm text-text-muted">
			Showing data for: <span class="font-semibold text-text-secondary">{new Date(selectedYear, selectedMonth - 1).toLocaleString('default', {
				month: 'long',
				year: 'numeric'
			})}</span>
		</div>
	</div>

	<!-- Filters Card -->
	<div class="mb-8 rounded-lg border border-border bg-surface p-6 shadow-sm">
		<h2 class="mb-4 text-sm font-semibold tracking-wider text-text-muted uppercase">
			Filter & Navigate
		</h2>
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
			<!-- Month Year Picker Form -->
			<div class="col-span-1 sm:col-span-2 lg:col-span-2">
				<label for="period" class="mb-1 block text-[10px] font-medium tracking-wider text-text-muted uppercase"
					>Period</label
				>
				<form method="POST" action="?/changeDate" class="flex flex-col sm:flex-row items-start sm:items-center gap-3 print:hidden">
					<div class="w-full sm:w-auto flex-1">
						<MonthYearPicker bind:selectedMonth bind:selectedYear />
					</div>
					<button
						type="submit"
						class="w-full sm:w-auto rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary focus:outline-none focus:ring-2 focus:ring-primary"
					>
						Update
					</button>
				</form>
			</div>

			<div class="col-span-1 flex flex-col justify-end">
				<label for="payment-status-filter" class="mb-1 block text-[10px] font-medium tracking-wider text-text-muted uppercase">Payment Status</label>
				<select
					id="payment-status-filter"
					class="w-full rounded border border-border p-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
					value={statusValue}
					onchange={(e) => {
						const val = (e.target as HTMLSelectElement).value;
						statusValue = val;
						const params = new URLSearchParams(window.location.search);
						if (val) params.set('status', val);
						else params.delete('status');
						const base = window.location.pathname + '?' + params.toString();
						window.location.href = base;
					}}
				>
					<option value="">All</option>
					<option value="paid">Paid</option>
					<option value="unpaid">Unpaid</option>
				</select>
			</div>

			<div class="col-span-1 flex flex-col justify-end">
				<!-- Case Status filter -->
				<label for="case-status-filter" class="mb-1 block text-[10px] font-medium tracking-wider text-text-muted uppercase">Case Status</label>
				<select
					id="case-status-filter"
					class="w-full rounded border border-border p-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
					value={caseStatusValue}
					onchange={(e) => {
						const val = (e.target as HTMLSelectElement).value;
						caseStatusValue = val;
						const params = new URLSearchParams(window.location.search);
						params.set('case_status', val || '');
						const base = window.location.pathname + '?' + params.toString();
						window.location.href = base;
					}}
				>
					<option value="">All</option>
					<option value="finished">Finished</option>
					<option value="pending">Pending</option>
					<option value="to be deliver">To Be Delivered</option>
				</select>
			</div>

			<div class="col-span-1 flex flex-col justify-end">
				<label for="case-notes-filter" class="mb-1 block text-[10px] font-medium tracking-wider text-text-muted uppercase">Notes</label>
				<input
					id="case-notes-filter"
					type="text"
					class="w-full rounded border border-border p-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
					placeholder="Search notes..."
					value={caseNotesValue}
					onchange={(e) => {
						const val = (e.target as HTMLInputElement).value;
						caseNotesValue = val;
						const params = new URLSearchParams(window.location.search);
						if (val) params.set('case_notes', val);
						else params.delete('case_notes');
						const base = window.location.pathname + '?' + params.toString();
						window.location.href = base;
					}}
				/>
			</div>

			<div class="col-span-1 flex flex-col justify-end relative z-10 w-full">
				<!-- Clinic filter -->
				<SearchableSelect
					options={clinicOptions}
					bind:value={clinicValue}
					label="Clinic"
					placeholder="Search clinic..."
					onchange={(val) => {
						const params = new URLSearchParams(window.location.search);
						if (val) params.set('clinic_id', val);
						else params.delete('clinic_id');
						const base = window.location.pathname + '?' + params.toString();
						window.location.href = base;
					}}
				/>
			</div>
		</div>
	</div>

	<!-- Total Profit Section -->
	<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-lg border border-border bg-white p-6 shadow-sm">
			<p class="mb-1 text-[10px] font-semibold tracking-wider text-text-muted uppercase">Total Income</p>
			<p class="text-2xl font-bold text-text-primary">
				{fmt(financialData.totalIncome)}
			</p>
		</div>
		<div class="rounded-lg border border-border bg-white p-6 shadow-sm">
			<p class="mb-1 text-[10px] font-semibold tracking-wider text-text-muted uppercase">Total Expenses</p>
			<p class="text-2xl font-bold text-text-primary">
				{fmt(financialData.totalExpenses)}
			</p>
		</div>
		<div class="rounded-lg border border-border bg-white p-6 shadow-sm">
			<p class="mb-1 text-[10px] font-semibold tracking-wider text-text-muted uppercase">Total Unpaid</p>
			<p class="text-2xl font-bold text-error-dark">
				{fmt(financialData.weekly
					.reduce(
						(total, week) =>
							total +
							week.transactions.reduce(
								(weekTotal, t) => weekTotal + (t.orderTotal - t.paidAmount),
								0
							),
						0
					))}
			</p>
		</div>
		<div class="rounded-lg border border-border bg-white p-6 shadow-sm relative overflow-hidden">
			<div class={`absolute top-0 right-0 w-2 h-full ${financialData.totalProfit > 0 ? 'bg-green-500' : 'bg-error-light0'}`}></div>
			<p class="mb-1 text-[10px] font-semibold tracking-wider text-text-muted uppercase">Total Profit</p>
			<p class={`text-2xl font-bold ${financialData.totalProfit > 0 ? 'text-green-600' : 'text-red-500'}`}>
				{fmt(financialData.totalProfit)}
			</p>
		</div>
	</div>
	<!-- Main Income Section -->
	<div class=" w-full rounded-lg bg-white p-6 shadow-md">
		<h2 class="mb-4 text-xl font-semibold">Income</h2>
		<div class="overflow-x-auto">
			{#each financialData.weekly as week}
				<div class="mb-8">
					<h3 class="mb-4 text-lg font-semibold">Week: {week.weekRange}</h3>

					<!-- Tables Container -->
					<div class="mb-4 flex flex-col gap-4 lg:flex-row">
						<!-- Income Table -->
						<div class="w-full lg:w-3/5">
							<h4 class="text-md mb-2 font-semibold">Income</h4>
							<div class="overflow-x-auto">
								<table class="min-w-full border-collapse rounded-lg border border-border">
									<thead class="bg-surface">
										<tr>
											<th
												class="cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider text-text-muted uppercase select-none"
												onclick={() => toggleIncomeSort('date')}
											>
												Drop-off Date
												{#if incomeSort.column === 'date'}
													<span>{incomeSort.direction === 'asc' ? ' ▲' : ' ▼'}</span>
												{/if}
											</th>
											<th
												class="cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider text-text-muted uppercase select-none"
												onclick={() => toggleIncomeSort('clinic')}
											>
												Clinic Name
												{#if incomeSort.column === 'clinic'}
													<span>{incomeSort.direction === 'asc' ? ' ▲' : ' ▼'}</span>
												{/if}
											</th>
											<th
												class="cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider text-text-muted uppercase select-none"
												onclick={() => toggleIncomeSort('patient')}
											>
												Patient Name
												{#if incomeSort.column === 'patient'}
													<span>{incomeSort.direction === 'asc' ? ' ▲' : ' ▼'}</span>
												{/if}
											</th>
											<th
												class="cursor-pointer px-6 py-3 text-right text-xs font-medium tracking-wider text-text-muted uppercase select-none"
												onclick={() => toggleIncomeSort('orderTotal')}
											>
												Order Total
												{#if incomeSort.column === 'orderTotal'}
													<span>{incomeSort.direction === 'asc' ? ' ▲' : ' ▼'}</span>
												{/if}
											</th>
											<th
												class="cursor-pointer px-6 py-3 text-right text-xs font-medium tracking-wider text-text-muted uppercase select-none"
												onclick={() => toggleIncomeSort('paidAmount')}
											>
												Paid Amount
												{#if incomeSort.column === 'paidAmount'}
													<span>{incomeSort.direction === 'asc' ? ' ▲' : ' ▼'}</span>
												{/if}
											</th>
											<th
												class="cursor-pointer px-6 py-3 text-center text-xs font-medium tracking-wider text-text-muted uppercase select-none"
												onclick={() => toggleIncomeSort('case_status')}
											>
												Status
												{#if incomeSort.column === 'case_status'}
													<span>{incomeSort.direction === 'asc' ? ' ▲' : ' ▼'}</span>
												{/if}
											</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-border-border bg-white">
										{#each getSortedTransactions(week) as transaction}
											<tr
												class={`
												border-b border-border transition-colors
												${
													transaction.paymentStatus === 'paid' &&
													(transaction.record?.caseStatus || 'pending') === 'finished'
														? 'bg-success-light'
														: transaction.paymentStatus === 'unpaid' &&
															  (transaction.record?.caseStatus || 'pending') === 'finished'
															? 'bg-red-300'
															: transaction.paymentStatus === 'unpaid' &&
																  (transaction.record?.caseStatus || 'pending') === 'pending'
																? 'bg-white'
																: 'bg-violet-300'
												}
											`}
											>
												<td class="px-6 py-4 text-sm whitespace-nowrap text-text-primary">
													{formatDate(transaction.dateDropoff)}
												</td>
												<td class="px-6 py-4 text-sm whitespace-nowrap text-text-primary">
													{transaction.clinic}
												</td>
												<td class="px-6 py-4 text-sm whitespace-nowrap text-text-primary">
													{transaction.patientName}
												</td>
												<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-text-primary">
													{fmt(transaction.orderTotal)}
												</td>
												<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-text-primary">
													{fmt(transaction.paidAmount)}
												</td>

												<td class="px-6 py-4 text-center text-sm whitespace-nowrap">
													<span
														class={`rounded-full px-2 py-1 text-xs font-semibold 
														${transaction.paymentStatus === 'paid' ? 'bg-success-light text-success-dark' : 'bg-error-light text-error-dark'}`}
													>
														{transaction.paymentStatus}
													</span>
													<span
														class="ml-2 rounded-full px-2 py-1 text-xs font-semibold"
														class:bg-success-light={transaction.record?.caseStatus === 'finished'}
														class:text-success-dark={transaction.record?.caseStatus === 'finished'}
														class:bg-yellow-100={transaction.record?.caseStatus === 'pending'}
														class:text-yellow-800={transaction.record?.caseStatus === 'pending'}
													>
														{statusLabels[transaction.record?.caseStatus] || transaction.record?.caseStatus || 'pending'}
													</span>
												</td>
											</tr>
										{/each}
										<tr class="bg-surface border-t-2 border-border">
											<td
												colspan="4"
												class="px-6 py-4 text-sm font-semibold whitespace-nowrap text-text-primary"
											>
												Weekly Total
											</td>
											<td
												colspan="2"
												class="px-6 py-4 text-right text-sm font-semibold whitespace-nowrap text-text-primary"
											>
												{fmt(week.totalAmount)}
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>

						<!-- Inventory Items Used Table -->
						{#if week.inventoryUsages && week.inventoryUsages.length > 0}
						<div class="w-full lg:w-2/5 mt-4 lg:mt-0 lg:ml-4">
							<h4 class="text-md mb-2 font-semibold">Inventory Items Used</h4>
							<div class="overflow-x-auto">
								<table class="mb-4 min-w-full border-collapse rounded-lg border border-border">
									<thead class="bg-surface">
										<tr>
											<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-text-muted uppercase">
												Date
											</th>
											<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-text-muted uppercase">
												Item
											</th>
											<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-text-muted uppercase">
												Patient
											</th>
											<th class="px-6 py-3 text-right text-xs font-medium tracking-wider text-text-muted uppercase">
												Qty
											</th>
											<th class="px-6 py-3 text-right text-xs font-medium tracking-wider text-text-muted uppercase">
												Total Cost
											</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-border-border bg-white">
										{#each week.inventoryUsages as usage}
											<tr>
												<td class="px-6 py-4 text-sm whitespace-nowrap text-text-primary">
													{formatDate(usage.date)}
												</td>
												<td class="px-6 py-4 text-sm whitespace-nowrap text-text-primary">
													{usage.itemName}
												</td>
												<td class="px-6 py-4 text-sm whitespace-nowrap text-text-muted">
													{usage.patientName}
												</td>
												<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-text-primary font-medium">
													{usage.quantityUsed} {usage.itemUnit || ''}
												</td>
												<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-text-primary">
													{fmt(usage.totalCost)}
												</td>
											</tr>
										{/each}
										<tr class="bg-surface border-t-2 border-border">
											<td colspan="4" class="px-6 py-4 text-sm font-semibold whitespace-nowrap text-text-primary text-right">
												Total Inventory Cost
											</td>
											<td class="px-6 py-4 text-right text-sm font-semibold text-text-primary whitespace-nowrap">
												{fmt(week.inventoryUsages.reduce((sum, u) => sum + u.totalCost, 0))}
											</td>
										</tr>
									</tbody>
								</table>
							</div>
						</div>
						{/if}

						<!-- Expenses Table -->
						<div class="w-full lg:w-2/5">
							<h4 class="text-md mb-2 font-semibold">Expenses</h4>
							<div class="overflow-x-auto">
								<table class="mb-4 min-w-full border-collapse rounded-lg border border-border">
									<thead class="bg-surface">
										<tr>
											<th
												class="cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider text-text-muted uppercase select-none"
												onclick={() => toggleExpensesSort('date')}
											>
												Date
												{#if expensesSort.column === 'date'}
													<span>{expensesSort.direction === 'asc' ? ' ▲' : ' ▼'}</span>
												{/if}
											</th>
											<th
												class="cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider text-text-muted uppercase select-none"
												onclick={() => toggleExpensesSort('description')}
											>
												Description
												{#if expensesSort.column === 'description'}
													<span>{expensesSort.direction === 'asc' ? ' ▲' : ' ▼'}</span>
												{/if}
											</th>
											<th
												class="cursor-pointer px-6 py-3 text-right text-xs font-medium tracking-wider text-text-muted uppercase select-none"
												onclick={() => toggleExpensesSort('amount')}
											>
												Amount
												{#if expensesSort.column === 'amount'}
													<span>{expensesSort.direction === 'asc' ? ' ▲' : ' ▼'}</span>
												{/if}
											</th>
											<th
												class="cursor-pointer px-6 py-3 text-center text-xs font-medium tracking-wider text-text-muted uppercase select-none"
												onclick={() => toggleExpensesSort('type')}
											>
												Type
												{#if expensesSort.column === 'type'}
													<span>{expensesSort.direction === 'asc' ? ' ▲' : ' ▼'}</span>
												{/if}
											</th>
										</tr>
									</thead>
									<tbody class="divide-y divide-border-border bg-white">
										{#each getSortedExpenses(week) as expense, expenseIndex}
											<tr>
												<td class="px-6 py-4 text-sm whitespace-nowrap text-text-primary">
													{formatDate(expense.date)}
												</td>
												<td class="px-6 py-4 text-sm whitespace-nowrap text-text-primary">
													{expense.description}
												</td>
												<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-error-dark font-medium">
													{fmt(expense.amount)}
												</td>
												<td class="px-6 py-4 text-center text-sm whitespace-nowrap">
													<span
														class={`rounded-full px-2 py-1 text-xs font-semibold 
														${
															expense.type === 'supply'
																? 'bg-info-light text-info-dark'
																: expense.type === 'salary'
																	? 'bg-purple-100 text-purple-800'
																	: expense.type === 'inventory'
																	? 'bg-teal-100 text-teal-800'
																	: ''
														}`}
													>
														{expense.type}
													</span>
													{#if expense.type === 'salary'}
														<button
															type="button"
															class="ml-2 rounded bg-error-light0 px-2 py-1 text-xs text-white hover:bg-red-700"
															onclick={() =>
																deleteWeeklySalaryExpense(week.weekRange, expenseIndex)}
														>
															Delete
														</button>
													{/if}
												</td>
											</tr>
										{/each}
										<tr class="bg-surface border-t-2 border-border">
											<td
												colspan="2"
												class="px-6 py-4 text-sm font-semibold whitespace-nowrap text-text-primary"
											>
												Weekly Total Expenses
											</td>
											<td
												colspan="2"
												class="px-6 py-4 text-right text-sm font-semibold text-error-dark whitespace-nowrap"
											>
												{fmt(week.totalExpenses)}
											</td>
										</tr>
									</tbody>
								</table>
							</div>

							<!-- Weekly Staff Salary Input -->
							<div class="mt-4 rounded-lg bg-surface p-4 border border-border">
								<h5 class="mb-3 text-sm font-semibold tracking-wider text-text-secondary uppercase">Add Weekly Staff Salary</h5>
								<div class="flex flex-col sm:flex-row gap-4 items-end">
									<div class="flex-1 w-full">
										<label class="mb-1 block text-[10px] font-medium tracking-wider text-text-muted uppercase">Staff Name</label>
										<input
											type="text"
											class="w-full rounded-md border-border py-2 px-3 text-sm shadow-sm focus:border-primary focus:ring-primary"
											placeholder="Enter staff name"
											value={salaryInputs.get(week.weekRange)?.staffName ?? ''}
											oninput={(e) => {
												const current = salaryInputs.get(week.weekRange) ?? {
													staffName: '',
													amount: 0
												};
												salaryInputs.set(week.weekRange, {
													...current,
													staffName: (e.target as HTMLInputElement).value
												});
											}}
										/>
									</div>
									<div class="flex-1 w-full">
										<label class="mb-1 block text-[10px] font-medium tracking-wider text-text-muted uppercase">Amount (PHP)</label>
										<div class="relative">
											<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
												<span class="text-text-muted sm:text-sm">&#8369;</span>
											</div>
											<input
												type="number"
												class="block w-full rounded border border-border py-2 pl-8 pr-3 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
												placeholder="Weekly salary amount"
												min="0"
												step="0.01"
												value={salaryInputs.get(week.weekRange)?.amount ?? 0}
												oninput={(e) => {
													const current = salaryInputs.get(week.weekRange) ?? {
														staffName: '',
														amount: 0
													};
													salaryInputs.set(week.weekRange, {
														...current,
														amount: Number((e.target as HTMLInputElement).value)
													});
												}}
											/>
										</div>
									</div>
									<button
										class="w-full sm:w-auto rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-primary focus:outline-none"
										onclick={(e) => {
											e.preventDefault();
											const input = salaryInputs.get(week.weekRange);
											if (input?.amount > 0 && input?.staffName) {
												addWeeklySalary(week.weekRange, input.staffName, input.amount);
												salaryInputs.delete(week.weekRange);
											}
										}}
									>
										Add
									</button>
								</div>
							</div>
						</div>
					</div>

					<!-- Weekly Summary -->
					<div class="mt-4 rounded-lg bg-surface p-6 border border-border">
						<div class="grid grid-cols-2 md:grid-cols-4 gap-4">
							<div>
								<p class="mb-1 text-[10px] font-semibold tracking-wider text-text-muted uppercase">Weekly Income</p>
								<p class="text-lg font-bold text-text-primary">
									{fmt(week.totalAmount)}
								</p>
							</div>
							<div>
								<p class="mb-1 text-[10px] font-semibold tracking-wider text-text-muted uppercase">Weekly Expenses</p>
								<p class="text-lg font-bold text-text-primary">
									{fmt(week.totalExpenses)}
								</p>
							</div>
							<div>
								<p class="mb-1 text-[10px] font-semibold tracking-wider text-text-muted uppercase">Total Unpaid</p>
								<p class="text-lg font-bold text-error-dark">
									{fmt(week.transactions.reduce((total, t) => total + (t.orderTotal - t.paidAmount), 0))}
								</p>
							</div>
							<div class="relative overflow-hidden pl-4 border-l-2 border-border">
        						<div class={`absolute top-0 left-0 w-1 h-full ${week.weeklyProfit >= 0 ? 'bg-green-500' : 'bg-error-light0'}`}></div>
								<p class="mb-1 text-[10px] font-semibold tracking-wider text-text-muted uppercase">Weekly Profit</p>
								<p
									class={`text-lg font-bold ${week.weeklyProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}
								>
									{fmt(week.weeklyProfit)}
								</p>
							</div>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
