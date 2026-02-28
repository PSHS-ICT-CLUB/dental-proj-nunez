<script lang="ts">
	import type { PageProps } from './$types';
	const { data }: PageProps = $props();
	const balances: any[] = data?.balances || [];
	const caseTypes: any[] = data?.caseTypes || [];

	// Date and month states
	let startDate = $state(data.filters?.start_date || '');
	let endDate = $state(data.filters?.end_date || '');
	let selectedCaseTypeId = $state(data.filters?.case_type_id || '');
	let selectedMonth = $state<number | ''>('');
	let selectedYear = $state(new Date().getFullYear());

	type SortColumn = 'clinicName' | 'pendingOrders' | 'finishedOrders' | 'totalOrders' | 'totalPaid' | 'balance';
	type SortDirection = 'asc' | 'desc';

	let sortColumn = $state<SortColumn | null>('balance');
	let sortDirection = $state<SortDirection>('asc');
	let searchQuery = $state('');

	function fmt(v: unknown) {
		const n = Number(v ?? 0) || 0;
		// Format using Philippine Peso (PHP) and en-PH locale to show ₱
		return n.toLocaleString('en-PH', {
			style: 'currency',
			currency: 'PHP',
			minimumFractionDigits: 2
		});
	}

	function handleSort(column: SortColumn) {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
	}

	function handleMonthFilter() {
		if (selectedMonth) {
			const date = new Date(selectedYear, selectedMonth - 1, 1);
			const lastDay = new Date(selectedYear, selectedMonth, 0);
			startDate = date.toISOString().split('T')[0];
			endDate = lastDay.toISOString().split('T')[0];
		}
	}

	function clearFilters() {
		window.location.href = '/balance';
	}

	const sortedBalances = $derived.by(() => {
		let filtered = balances;
		if (searchQuery) {
			const query = searchQuery.toLowerCase();
			filtered = balances.filter((b) => (b.clinicName ?? '').toLowerCase().includes(query));
		}

		if (!sortColumn) return filtered;

		const sorted = [...filtered].sort((a, b) => {
			let aVal: any;
			let bVal: any;

			switch (sortColumn) {
				case 'clinicName':
					aVal = (a.clinicName ?? '').toLowerCase();
					bVal = (b.clinicName ?? '').toLowerCase();
					break;
				case 'pendingOrders':
					aVal = Number(a.pendingOrders ?? 0);
					bVal = Number(b.pendingOrders ?? 0);
					break;
				case 'finishedOrders':
					aVal = Number(a.finishedOrders ?? 0);
					bVal = Number(b.finishedOrders ?? 0);
					break;
				case 'totalOrders':
					aVal = Number(a.totalOrders ?? 0);
					bVal = Number(b.totalOrders ?? 0);
					break;
				case 'totalPaid':
					aVal = Number(a.totalPaid ?? 0);
					bVal = Number(b.totalPaid ?? 0);
					break;
				case 'balance':
					aVal = Number(a.totalPaid ?? 0) - Number(a.totalOrders ?? 0);
					bVal = Number(b.totalPaid ?? 0) - Number(b.totalOrders ?? 0);
					break;
				default:
					return 0;
			}

			if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
			if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
			return 0;
		});

		return sorted;
	});

	function isSorted(column: SortColumn): boolean {
		return sortColumn === column;
	}

	function getRowClass(balance: any): string {
		const balanceValue = Number(balance.totalPaid ?? 0) - Number(balance.totalOrders ?? 0);
		if (balanceValue > 0) {
			return 'bg-green-300 ';
		} else if (balanceValue < 0) {
			return 'bg-red-300 ';
		} else {
			return 'bg-white ';
		}
	}

	const summaryTotals = $derived.by(() => {
		const totals = sortedBalances.reduce(
			(acc, b) => {
				acc.pendingOrders += Number(b.pendingOrders ?? 0);
				acc.finishedOrders += Number(b.finishedOrders ?? 0);
				acc.totalOrders += Number(b.totalOrders ?? 0);
				acc.totalPaid += Number(b.totalPaid ?? 0);
				return acc;
			},
			{ pendingOrders: 0, finishedOrders: 0, totalOrders: 0, totalPaid: 0 }
		);
		totals.balance = totals.totalPaid - totals.totalOrders;
		return totals;
	});
</script>

<div class="mx-auto max-w-4xl px-4 py-8">
	<div class="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
		<h1 class="text-2xl font-bold">Clinic Balances</h1>
		<div class="relative w-full sm:w-64">
			<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
				<svg
					class="h-4 w-4 text-gray-400"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
					/>
				</svg>
			</div>
			<input
				type="text"
				bind:value={searchQuery}
				placeholder="Search clinics..."
				class="block w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder-gray-500 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
			/>
		</div>
	</div>

	<!-- Filter Form -->
	<div class="mb-8 rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
		<form method="GET" class="space-y-4">
			<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
				<div>
					<label class="mb-1 block text-[10px] font-medium text-gray-500 uppercase tracking-wider">Start Date</label>
					<input
						type="date"
						name="start_date"
						bind:value={startDate}
						class="w-full rounded border border-gray-200 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
					/>
				</div>
				<div>
					<label class="mb-1 block text-[10px] font-medium text-gray-500 uppercase tracking-wider">End Date</label>
					<input
						type="date"
						name="end_date"
						bind:value={endDate}
						class="w-full rounded border border-gray-200 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
					/>
				</div>
				<div>
					<label class="mb-1 block text-[10px] font-medium text-gray-500 uppercase tracking-wider">Case Type</label>
					<select
						name="case_type_id"
						bind:value={selectedCaseTypeId}
						class="w-full rounded border border-gray-200 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
					>
						<option value="">All Types</option>
						{#each caseTypes as type}
							<option value={String(type.caseTypeId)}>{type.caseTypeName}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="flex flex-col justify-between gap-4 border-t border-gray-200 pt-4 sm:flex-row sm:items-end">
				<div class="flex flex-1 gap-4">
					<div class="flex-1">
						<label class="mb-1 block text-[10px] font-medium text-gray-500 uppercase tracking-wider">Quick Month Filter</label>
						<select
							bind:value={selectedMonth}
							onchange={handleMonthFilter}
							class="w-full rounded border border-gray-200 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
						>
							<option value="">Select Month</option>
							{#each Array.from({ length: 12 }, (_, i) => i + 1) as month}
								<option value={month}>
									{new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
								</option>
							{/each}
						</select>
					</div>
					<div class="w-24">
						<label class="mb-1 block text-[10px] font-medium text-gray-500 uppercase tracking-wider">Year</label>
						<select
							bind:value={selectedYear}
							onchange={handleMonthFilter}
							class="w-full rounded border border-gray-200 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
						>
							{#each Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i) as year}
								<option value={year}>{year}</option>
							{/each}
						</select>
					</div>
				</div>
				<div class="flex gap-2">
					<button
						type="button"
						onclick={clearFilters}
						class="rounded bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 transition-colors"
					>
						Clear
					</button>
					<button
						type="submit"
						class="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 transition-colors"
					>
						Apply Filters
					</button>
				</div>
			</div>
		</form>
	</div>

	<div class="overflow-x-auto">
		<table class="min-w-full border-collapse rounded-lg border border-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th
						class="cursor-pointer px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase select-none hover:bg-gray-100"
						onclick={() => handleSort('clinicName')}
					>
						<div class="flex items-center">
							Clinic
							{#if !isSorted('clinicName')}
								<svg
									class="ml-1 inline-block h-4 w-4 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
									/>
								</svg>
							{:else if sortDirection === 'asc'}
								<svg
									class="ml-1 inline-block h-4 w-4 text-indigo-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 15l7-7 7 7"
									/>
								</svg>
							{:else}
								<svg
									class="ml-1 inline-block h-4 w-4 text-indigo-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							{/if}
						</div>
					</th>
					<th
						class="cursor-pointer px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase select-none hover:bg-gray-100"
						onclick={() => handleSort('pendingOrders')}
					>
						<div class="flex items-center justify-end">
							Pending Orders
							{#if !isSorted('pendingOrders')}
								<svg class="ml-1 inline-block h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
								</svg>
							{:else if sortDirection === 'asc'}
								<svg class="ml-1 inline-block h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" /></svg>
							{:else}
								<svg class="ml-1 inline-block h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
							{/if}
						</div>
					</th>
					<th
						class="cursor-pointer px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase select-none hover:bg-gray-100"
						onclick={() => handleSort('finishedOrders')}
					>
						<div class="flex items-center justify-end">
							Finished Orders
							{#if !isSorted('finishedOrders')}
								<svg class="ml-1 inline-block h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
								</svg>
							{:else if sortDirection === 'asc'}
								<svg class="ml-1 inline-block h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" /></svg>
							{:else}
								<svg class="ml-1 inline-block h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
							{/if}
						</div>
					</th>
					<th
						class="cursor-pointer px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase select-none hover:bg-gray-100"
						onclick={() => handleSort('totalOrders')}
					>
						<div class="flex items-center justify-end">
							Total Orders
							{#if !isSorted('totalOrders')}
								<svg
									class="ml-1 inline-block h-4 w-4 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
									/>
								</svg>
							{:else if sortDirection === 'asc'}
								<svg
									class="ml-1 inline-block h-4 w-4 text-indigo-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 15l7-7 7 7"
									/>
								</svg>
							{:else}
								<svg
									class="ml-1 inline-block h-4 w-4 text-indigo-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							{/if}
						</div>
					</th>
					<th
						class="cursor-pointer px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase select-none hover:bg-gray-100"
						onclick={() => handleSort('totalPaid')}
					>
						<div class="flex items-center justify-end">
							Total Paid
							{#if !isSorted('totalPaid')}
								<svg
									class="ml-1 inline-block h-4 w-4 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
									/>
								</svg>
							{:else if sortDirection === 'asc'}
								<svg
									class="ml-1 inline-block h-4 w-4 text-indigo-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 15l7-7 7 7"
									/>
								</svg>
							{:else}
								<svg
									class="ml-1 inline-block h-4 w-4 text-indigo-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							{/if}
						</div>
					</th>
					<th
						class="cursor-pointer px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase select-none hover:bg-gray-100"
						onclick={() => handleSort('balance')}
					>
						<div class="flex items-center justify-end">
							Balance
							{#if !isSorted('balance')}
								<svg
									class="ml-1 inline-block h-4 w-4 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
									/>
								</svg>
							{:else if sortDirection === 'asc'}
								<svg
									class="ml-1 inline-block h-4 w-4 text-indigo-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 15l7-7 7 7"
									/>
								</svg>
							{:else}
								<svg
									class="ml-1 inline-block h-4 w-4 text-indigo-600"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
							{/if}
						</div>
					</th>
					<th
						class="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Actions
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white">
				{#if sortedBalances.length === 0}
					<tr>
						<td class="px-6 py-6 text-sm text-gray-700" colspan="7">No data available.</td>
					</tr>
				{/if}
				{#each sortedBalances as b}
					<tr class={`border-b border-gray-200 transition-colors ${getRowClass(b)}`}>
						<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">{b.clinicName ?? '—'}</td>
						<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900"
							>{fmt(b.pendingOrders)}</td
						>
						<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900"
							>{fmt(b.finishedOrders)}</td
						>
						<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900"
							>{fmt(b.totalOrders)}</td
						>
						<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900"
							>{fmt(b.totalPaid)}</td
						>
						<td
							class={`px-6 py-4 text-right text-sm whitespace-nowrap ${Number(b.totalPaid) - Number(b.totalOrders) > 0 ? 'text-green-600' : 'text-red-600'}`}
						>
							{#if Number(b.totalPaid) - Number(b.totalOrders) < 0}
								-{fmt(Math.abs(Number(b.totalPaid) - Number(b.totalOrders)))}
							{:else}
								+{fmt(Math.abs(Number(b.totalPaid) - Number(b.totalOrders)))}
							{/if}
						</td>
						<td class="px-6 py-4 text-center text-sm whitespace-nowrap">
							<a
								href={`/?clinic_id=${b.clinicId}${startDate ? `&start_date=${startDate}` : ''}${endDate ? `&end_date=${endDate}` : ''}${selectedCaseTypeId ? `&case_type_id=${selectedCaseTypeId}` : ''}`}
								class="inline-block rounded bg-blue-600 px-3 py-1 text-sm font-medium text-white hover:bg-blue-500"
								>Details</a
							>
						</td>
					</tr>
				{/each}
			</tbody>
			<tfoot>
				<tr class="border-t-2 border-gray-400 bg-gray-200 font-semibold">
					<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">TOTAL</td>
					<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900">
						{fmt(summaryTotals.pendingOrders)}
					</td>
					<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900">
						{fmt(summaryTotals.finishedOrders)}
					</td>
					<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900">
						{fmt(summaryTotals.totalOrders)}
					</td>
					<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-gray-900">
						{fmt(summaryTotals.totalPaid)}
					</td>
					<td
						class={`px-6 py-4 text-right text-sm whitespace-nowrap ${
							summaryTotals.balance > 0
								? 'text-green-700'
								: summaryTotals.balance < 0
									? 'text-red-700'
									: 'text-gray-700'
						}`}
					>
						{#if summaryTotals.balance < 0}
							-{fmt(Math.abs(summaryTotals.balance))}
						{:else}
							+{fmt(Math.abs(summaryTotals.balance))}
						{/if}
					</td>
					<td class="px-6 py-4 text-center text-sm whitespace-nowrap"></td>
				</tr>
			</tfoot>
		</table>
	</div>
</div>
