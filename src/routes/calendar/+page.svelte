<script lang="ts">
	import { goto } from '$app/navigation';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	const monthNames = [
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

	const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

	let currentMonth = $state(data.month);
	let currentYear = $state(data.year);
	let selectedDate = $state<string | null>(null);

	let calendarDays = $derived(generateCalendarDays(currentYear, currentMonth));

	let deliveryByDate = $derived(groupRecordsByDate(data.deliveryRecords, 'dateDropoff'));
	let finishByDate = $derived(groupRecordsByDate(data.finishByRecords, 'finishBy'));

	let selectedDateDeliveries = $derived(selectedDate ? deliveryByDate[selectedDate] || [] : []);
	let selectedDateFinishBys = $derived(selectedDate ? finishByDate[selectedDate] || [] : []);
	let selectedDateTotal = $derived(selectedDateDeliveries.length + selectedDateFinishBys.length);

	let selectedDeliveryTab = $state<'delivery' | 'finish'>('delivery');
	let displayedRecords = $derived(
		selectedDeliveryTab === 'delivery' ? selectedDateDeliveries : selectedDateFinishBys
	);

	function generateCalendarDays(year: number, month: number) {
		const firstDay = new Date(year, month - 1, 1);
		const lastDay = new Date(year, month, 0);
		const startDayOfWeek = firstDay.getDay();
		const daysInMonth = lastDay.getDate();

		const days: Array<{ date: number | null; fullDate: string | null }> = [];

		for (let i = 0; i < startDayOfWeek; i++) {
			days.push({ date: null, fullDate: null });
		}

		for (let i = 1; i <= daysInMonth; i++) {
			const fullDate = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
			days.push({ date: i, fullDate });
		}

		return days;
	}

	function groupRecordsByDate(
		records: Array<{
			recordId: number;
			dateDropoff: string | null;
			datePickup: string | null;
			patientName: string;
			remarks: string | null;
			doctorName: string;
			clinicName: string;
			finishBy: string | null;
			orderItems: Array<{
				caseTypeName: string;
				caseNo: string;
				orderDescription: string | null;
				upOrDown: string;
			}>;
		}>,
		dateField: 'dateDropoff' | 'finishBy'
	) {
		const grouped: Record<string, typeof records> = {};

		records.forEach((record) => {
			const dateValue = dateField === 'dateDropoff' ? record.dateDropoff : record.finishBy;
			if (!dateValue) return;

			const dateKey = dateValue.split('T')[0];

			if (!grouped[dateKey]) {
				grouped[dateKey] = [];
			}
			grouped[dateKey].push(record);
		});

		return grouped;
	}

	function navigateMonth(delta: number) {
		let newMonth = currentMonth + delta;
		let newYear = currentYear;

		if (newMonth > 12) {
			newMonth = 1;
			newYear++;
		} else if (newMonth < 1) {
			newMonth = 12;
			newYear--;
		}

		goto(`?month=${newMonth}&year=${newYear}`);
	}

	function goToToday() {
		const now = new Date();
		goto(`?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
	}

	function selectDate(fullDate: string) {
		selectedDate = fullDate;
		selectedDeliveryTab = 'delivery';
	}

	function formatCaseTypes(orderItems: Array<{ caseTypeName: string }>) {
		const types = [...new Set(orderItems.map((item) => item.caseTypeName))];
		return types.join(', ');
	}

	function formatDisplayDate(dateStr: string) {
		const date = new Date(dateStr);
		return date.toLocaleDateString('en-US', {
			weekday: 'long',
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
	}
</script>

<div class="min-h-screen bg-gray-50 p-4">
	<div class="mx-auto max-w-7xl">
		<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 class="text-2xl font-bold text-gray-900">Calendar</h1>
				<p class="text-sm text-gray-500">
					View delivery dates and deadlines - Click a date to see details
				</p>
			</div>

			<div class="flex items-center gap-3">
				<button
					onclick={goToToday}
					class="rounded border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50"
				>
					Today
				</button>
				<div class="flex items-center rounded border border-gray-300 bg-white shadow-sm">
					<button
						onclick={() => navigateMonth(-1)}
						class="px-3 py-1.5 text-gray-600 transition-all hover:bg-gray-50"
						aria-label="Previous month"
					>
						←
					</button>
					<span class="min-w-[140px] px-4 py-1.5 text-center text-sm font-semibold text-gray-900">
						{monthNames[currentMonth - 1]}
						{currentYear}
					</span>
					<button
						onclick={() => navigateMonth(1)}
						class="px-3 py-1.5 text-gray-600 transition-all hover:bg-gray-50"
						aria-label="Next month"
					>
						→
					</button>
				</div>
			</div>
		</div>

		<div class="mb-4 flex flex-wrap gap-4">
			<div class="flex items-center gap-2">
				<div class="h-4 w-4 rounded bg-amber-500"></div>
				<span class="text-sm text-gray-600">Delivery Date (Dropoff)</span>
			</div>
			<div class="flex items-center gap-2">
				<div class="h-4 w-4 rounded bg-blue-500"></div>
				<span class="text-sm text-gray-600">To Be Finished By</span>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div class="lg:col-span-1">
				<div class="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
					<div class="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
						{#each daysOfWeek as day}
							<div
								class="px-2 py-3 text-center text-xs font-semibold tracking-wide text-gray-500 uppercase"
							>
								{day}
							</div>
						{/each}
					</div>

					<div class="grid grid-cols-7">
						{#each calendarDays as { date, fullDate }}
							{#if date !== null && fullDate !== null}
								{@const deliveries = deliveryByDate[fullDate] || []}
								{@const finishBys = finishByDate[fullDate] || []}
								{@const totalRecords = deliveries.length + finishBys.length}
								{@const isToday = fullDate === new Date().toISOString().split('T')[0]}
								{@const isSelected = selectedDate === fullDate}
								{@const hasRecords = totalRecords > 0}

								<button
									class="min-h-[80px] border-r border-b border-gray-100 p-1.5 text-center transition-all {isSelected
										? 'bg-indigo-50 ring-2 ring-indigo-500 ring-inset'
										: 'hover:bg-gray-50'} {hasRecords ? 'cursor-pointer' : 'cursor-default'}"
									onclick={() => hasRecords && selectDate(fullDate)}
									disabled={!hasRecords}
								>
									<div class="mb-1">
										<span
											class="text-sm font-medium {isToday
												? 'font-bold text-indigo-600'
												: 'text-gray-900'}"
										>
											{date}
										</span>
									</div>

									{#if deliveries.length > 0 || finishBys.length > 0}
										<div class="space-y-0.5">
											{#if deliveries.length > 0}
												<div
													class="truncate rounded bg-amber-100 px-1 py-0.5 text-[10px] text-amber-800"
												>
													{deliveries.length} delivery
												</div>
											{/if}
											{#if finishBys.length > 0}
												<div
													class="truncate rounded bg-blue-100 px-1 py-0.5 text-[10px] text-blue-800"
												>
													{finishBys.length} finish
												</div>
											{/if}
										</div>
									{/if}
								</button>
							{:else}
								<div class="min-h-[80px] border-r border-b border-gray-100 bg-gray-50/50"></div>
							{/if}
						{/each}
					</div>
				</div>

				<div class="mt-4 grid grid-cols-2 gap-3">
					<div class="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
						<div class="text-sm text-gray-500">Deliveries This Month</div>
						<div class="text-2xl font-bold text-amber-600">{data.deliveryRecords.length}</div>
					</div>
					<div class="rounded-lg border border-blue-200 bg-white p-4 shadow-sm">
						<div class="text-sm text-gray-500">Deadlines This Month</div>
						<div class="text-2xl font-bold text-blue-600">{data.finishByRecords.length}</div>
					</div>
				</div>
			</div>

			<div class="lg:col-span-2">
				<div
					class="min-h-[500px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
				>
					{#if selectedDate}
						<div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
							<h2 class="text-lg font-bold text-gray-900">{formatDisplayDate(selectedDate)}</h2>
							<p class="text-sm text-gray-500">
								{selectedDateTotal} case{selectedDateTotal !== 1 ? 's' : ''} scheduled
							</p>
						</div>

						<div class="border-b border-gray-200">
							<nav class="flex">
								<button
									onclick={() => (selectedDeliveryTab = 'delivery')}
									class="flex-1 px-6 py-3 text-sm font-medium transition-colors {selectedDeliveryTab ===
									'delivery'
										? 'border-b-2 border-indigo-600 bg-indigo-50 text-indigo-600'
										: 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}"
								>
									<span class="flex items-center justify-center gap-2">
										<span class="h-2 w-2 rounded-full bg-amber-500"></span>
										To Be Delivered ({selectedDateDeliveries.length})
									</span>
								</button>
								<button
									onclick={() => (selectedDeliveryTab = 'finish')}
									class="flex-1 px-6 py-3 text-sm font-medium transition-colors {selectedDeliveryTab ===
									'finish'
										? 'border-b-2 border-indigo-600 bg-indigo-50 text-indigo-600'
										: 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'}"
								>
									<span class="flex items-center justify-center gap-2">
										<span class="h-2 w-2 rounded-full bg-blue-500"></span>
										To Be Finished ({selectedDateFinishBys.length})
									</span>
								</button>
							</nav>
						</div>

						<div class="max-h-[500px] overflow-y-auto p-6">
							{#if displayedRecords.length === 0}
								<div class="py-8 text-center text-gray-500">
									No cases in this category for this date.
								</div>
							{:else}
								<div class="space-y-4">
									{#each displayedRecords as record}
										<a
											href="/details/{record.recordId}"
											class="block rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:border-indigo-300 hover:shadow-md"
										>
											<div
												class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
											>
												<div class="flex-1">
													<div class="mb-1 flex items-center gap-2">
														<span
															class="rounded-full px-2 py-0.5 text-xs font-medium {selectedDeliveryTab ===
															'delivery'
																? 'bg-amber-100 text-amber-800'
																: 'bg-blue-100 text-blue-800'}"
														>
															#{record.recordId}
														</span>
														<span class="text-lg font-semibold text-gray-900"
															>{record.patientName}</span
														>
													</div>
													<div class="mb-1 text-sm text-gray-600">
														<span class="font-medium">{record.doctorName}</span>
														<span class="text-gray-400"> • </span>
														<span>{record.clinicName}</span>
													</div>
													{#if record.remarks}
														<div class="mt-1 text-sm text-gray-500">{record.remarks}</div>
													{/if}

													<div class="mt-3 flex flex-wrap gap-2">
														{#each record.orderItems as item}
															<span
																class="inline-flex items-center rounded border border-gray-200 bg-gray-100 px-2.5 py-1 text-xs text-gray-700"
															>
																<span class="font-medium">{item.caseTypeName}</span>
																<span class="mx-1 text-gray-400">#</span>
																<span>{item.caseNo}</span>
																<span class="mx-1 text-gray-400">({item.upOrDown})</span>
																{#if item.orderDescription}
																	<span class="ml-1 text-gray-500">- {item.orderDescription}</span>
																{/if}
															</span>
														{/each}
													</div>
												</div>
												<div class="text-right">
													<span
														class="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-800"
													>
														View Details
													</span>
												</div>
											</div>
										</a>
									{/each}
								</div>
							{/if}
						</div>
					{:else}
						<div class="flex h-[500px] items-center justify-center">
							<div class="text-center">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="mx-auto h-12 w-12 text-gray-300"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="1.5"
										d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
								<p class="mt-4 text-lg font-medium text-gray-900">Select a date</p>
								<p class="mt-1 text-sm text-gray-500">
									Click on a day in the calendar to view case details
								</p>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
</div>
