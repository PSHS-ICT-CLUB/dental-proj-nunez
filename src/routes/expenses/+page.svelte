<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: PageProps = $props();
	let { currentMonth, currentYear, recordData } = data;

	// Fix: Use local timezone date formatting
	let today = new Date();
	let selectedDate = $state(today.toISOString().split('T')[0]);

	// Generate array of months for the select
	const months = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	// Generate array of years (current year -5 to current year +5)
	const currentYearNum = new Date().getFullYear();
	const years = Array.from({ length: 11 }, (_, i) => currentYearNum - 5 + i);

	let selectedMonth = $state(currentMonth);
	let selectedYear = $state(currentYear);
	console.log(data.recordData);
</script>

<div class="container mx-auto rounded-md bg-white p-6 shadow-md">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold text-gray-800">Expenses</h1>

		<!-- Month Picker Form -->
		<form method="POST" action="?/changeMonth" class="flex gap-4">
			<div class="flex items-center gap-2">
				<select
					name="month"
					class="rounded-md border-gray-300 py-2 pr-10 pl-3 text-base focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
					bind:value={selectedMonth}
				>
					{#each months as month, i}
						<option value={i + 1}>{month}</option>
					{/each}
				</select>

				<select
					name="year"
					class="rounded-md border-gray-300 py-2 pr-10 pl-3 text-base focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none"
					bind:value={selectedYear}
				>
					{#each years as year}
						<option value={year}>{year}</option>
					{/each}
				</select>

				<button
					type="submit"
					class="rounded-md bg-indigo-100 px-3 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-200"
				>
					Update
				</button>
			</div>
		</form>
	</div>

	<!-- Add Expense Form -->
	<form method="POST" action="?/add" class="mb-8">
		<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
			<div>
				<label for="supply_date" class="block text-sm font-semibold text-gray-700">Date:</label>
				<input
					type="date"
					id="supply_date"
					name="supply_date"
					required
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
					bind:value={selectedDate}
				/>
			</div>
			<div>
				<label for="supply_cost" class="block text-sm font-semibold text-gray-700">Cost:</label>
				<input
					type="number"
					id="supply_cost"
					name="supply_cost"
					required
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
				/>
			</div>
			<div>
				<label for="description" class="block text-sm font-semibold text-gray-700"
					>Description:</label
				>
				<input
					type="text"
					id="description"
					name="description"
					required
					placeholder="Enter expense description"
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
				/>
			</div>
		</div>
		<button
			type="submit"
			class="mt-6 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
		>
			Add Expense
		</button>
	</form>

	{#if form?.success}
		<div class="mb-6 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
			{form?.message}
		</div>
	{/if}
	{#if form?.error}
		<div class="mb-6 rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
			{form?.error}
		</div>
	{/if}

	<h2 class="mb-4 text-xl font-semibold text-gray-800">
		Expenses for {months[currentMonth - 1]}
		{currentYear}
	</h2>

	{#if recordData && recordData.length > 0}
		<div class="overflow-x-auto rounded-md shadow-sm">
			<table class="min-w-full divide-y divide-gray-200">
				<thead class="bg-gray-50">
					<tr>
						<th
							scope="col"
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Date
						</th>
						<th
							scope="col"
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Description
						</th>
						<th
							scope="col"
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Cost
						</th>
						<th
							scope="col"
							class="px-6 py-3 text-right text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Actions
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each recordData as record}
						<tr>
							<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
								{record.supplyDate}
							</td>
							<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
								{record.supplyDescription || '-'}
							</td>
							<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
								&#8369;{record.supplyCost}
							</td>
							<td class="px-6 py-4 text-right text-sm whitespace-nowrap">
								<form method="POST" action="?/deleteExpenses">
									<input type="hidden" name="supply_id" value={record.supplyId} />
									<button
										type="submit"
										class="text-red-600 hover:text-red-900 focus:outline-none"
										title="Delete expense"
										aria-label="Delete expense"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fill-rule="evenodd"
												d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
												clip-rule="evenodd"
											/>
										</svg>
									</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<p class="text-gray-600">No expenses recorded for this month.</p>
	{/if}
</div>
