<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: PageProps = $props();
	let { currentMonth, currentYear, recordData } = data;

	let today = new Date();
	let selectedDate = $state(today.toISOString().split('T')[0]);

	// Format currency
	function fmt(v: unknown) {
		const n = Number(v ?? 0) || 0;
		return n.toLocaleString('en-PH', {
			style: 'currency',
			currency: 'PHP',
			minimumFractionDigits: 2
		});
	}

	let selectedMonth = $state(currentMonth);
	let selectedYear = $state(currentYear);

	function changeMonth() {
		// Just submit the form hiddenly or rely on the form
		document.getElementById('month-filter-form')?.dispatchEvent(
			new Event('submit', { cancelable: true, bubbles: true })
		);
	}
	
	const totalExpenses = $derived(
		recordData.reduce((sum, record) => sum + Number(record.supplyCost || 0), 0)
	);

</script>

<div class="mx-auto max-w-4xl px-4 py-8">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold">Expenses</h1>
	</div>

	<!-- Filter Card & Add Expense Modal/Section -->
	<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
		<!-- Month Filter -->
		<div class="col-span-1 rounded-lg border border-gray-200 bg-gray-50 p-6 shadow-sm">
			<h2 class="mb-4 text-sm font-semibold tracking-wider text-gray-500 uppercase">
				Select Period
			</h2>
			<form id="month-filter-form" method="POST" action="?/changeMonth" class="space-y-4">
				<div>
					<label class="mb-1 block text-[10px] font-medium tracking-wider text-gray-500 uppercase"
						>Quick Month Filter</label
					>
					<select
						name="month"
						bind:value={selectedMonth}
						onchange={changeMonth}
						class="w-full rounded border border-gray-200 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
					>
						{#each Array.from({ length: 12 }, (_, i) => i + 1) as month}
							<option value={month}>
								{new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
							</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="mb-1 block text-[10px] font-medium tracking-wider text-gray-500 uppercase"
						>Year</label
					>
					<select
						name="year"
						bind:value={selectedYear}
						onchange={changeMonth}
						class="w-full rounded border border-gray-200 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
					>
						{#each Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i) as year}
							<option value={year}>{year}</option>
						{/each}
					</select>
				</div>
				<button type="submit" class="hidden">Update</button>
			</form>
		</div>

		<!-- Add Expense Form -->
		<div class="col-span-1 rounded-lg border border-gray-200 bg-white p-6 shadow-sm md:col-span-2">
			<h2 class="mb-4 text-sm font-semibold tracking-wider text-gray-500 uppercase">
				Add New Expense
			</h2>

			{#if form?.success}
				<div class="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
					{form?.message}
				</div>
			{/if}
			{#if form?.error}
				<div class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
					{form?.error}
				</div>
			{/if}

			<form method="POST" action="?/add" class="space-y-4">
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
					<div>
						<label for="supply_date" class="mb-1 block text-[10px] font-medium tracking-wider text-gray-500 uppercase">Date</label>
						<input
							type="date"
							id="supply_date"
							name="supply_date"
							required
							bind:value={selectedDate}
							class="w-full rounded border border-gray-200 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
						/>
					</div>
					<div>
						<label for="supply_cost" class="mb-1 block text-[10px] font-medium tracking-wider text-gray-500 uppercase">Cost (PHP)</label>
						<div class="relative">
							<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
								<span class="text-gray-500 sm:text-sm">&#8369;</span>
							</div>
							<input
								type="number"
								id="supply_cost"
								name="supply_cost"
								required
								step="0.01"
								class="block w-full rounded border border-gray-200 py-2 pl-8 pr-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
							/>
						</div>
					</div>
				</div>
				<div>
					<label for="description" class="mb-1 block text-[10px] font-medium tracking-wider text-gray-500 uppercase">Description</label>
					<input
						type="text"
						id="description"
						name="description"
						required
						placeholder="What was this expense for?"
						class="w-full rounded border border-gray-200 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
					/>
				</div>
				<div class="flex justify-end pt-2">
					<button
						type="submit"
						class="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500"
					>
						Add Expense
					</button>
				</div>
			</form>
		</div>
	</div>

	<!-- Expenses Table -->
	<div class="overflow-x-auto">
		<table class="min-w-full border-collapse rounded-lg border border-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
						Date
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
						Description
					</th>
					<th class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase">
						Cost
					</th>
					<th class="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">
						Actions
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white">
				{#if recordData && recordData.length > 0}
					{#each recordData as record}
						<tr class="transition-colors hover:bg-gray-50 border-b border-gray-200">
							<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
								{record.supplyDate}
							</td>
							<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
								{record.supplyDescription || '—'}
							</td>
							<td class="px-6 py-4 text-right text-sm whitespace-nowrap text-red-600 font-medium">
								{fmt(record.supplyCost)}
							</td>
							<td class="px-6 py-4 text-center text-sm whitespace-nowrap">
								{#if data.user && (data.user.role === 'admin' || data.user.role === 'dentist')}
								<form method="POST" action="?/deleteExpenses" class="inline-block" use:enhance>
									<input type="hidden" name="supply_id" value={record.supplyId} />
									<button
										type="submit"
										class="text-red-500 hover:text-red-700 focus:outline-none transition-colors"
										title="Delete expense"
										aria-label="Delete expense"
									>
										<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
										</svg>
									</button>
								</form>
								{/if}
							</td>
						</tr>
					{/each}
				{:else}
					<tr>
						<td colspan="4" class="px-6 py-12 text-center text-sm text-gray-500">
							<div class="flex flex-col items-center justify-center space-y-3">
								<svg class="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
								</svg>
								<p>No expenses recorded for this month.</p>
							</div>
						</td>
					</tr>
				{/if}
			</tbody>
			{#if recordData && recordData.length > 0}
				<tfoot>
					<tr class="border-t-2 border-gray-400 bg-gray-200 font-semibold">
						<td colspan="2" class="px-6 py-4 text-sm text-gray-900">
							TOTAL EXPENSES
						</td>
						<td class="px-6 py-4 text-right text-sm text-red-700 whitespace-nowrap">
							{fmt(totalExpenses)}
						</td>
						<td class="px-6 py-4"></td>
					</tr>
				</tfoot>
			{/if}
		</table>
	</div>
</div>
