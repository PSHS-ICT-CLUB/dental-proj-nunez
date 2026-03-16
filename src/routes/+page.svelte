<script lang="ts">
	import type { PageProps } from './$types';
	import { formatDate, generateRecordsSummary, getCurrentDateTime, getRecordDateRange } from '$lib';
	import { enhance } from '$app/forms';
	import { afterNavigate } from '$app/navigation';
	import { tick } from 'svelte';

	const { data }: PageProps = $props();
	// Search states
	let clinicSearch = $state('');
	let filteredClinics = $derived(
		data.clinics?.filter((c) => c.clinicName.toLowerCase().includes(clinicSearch.toLowerCase()))
	);

	// Date and month states
	let startDate = $state('');
	let endDate = $state('');
	let selectedMonth = $state<number | ''>('');
	let selectedYear = $state(new Date().getFullYear());

	// Add state for selected clinic
	let showAllClinics = $state(false);
	let selectedClinicId = $state<number | null>(null);
	let clinicContainer = $state<HTMLDivElement>();

	// Filter input values
	let caseTypeId = $state('');
	let caseNo = $state('');
	let patientName = $state('');
	let paymentStatus = $state('');
	let caseStatus = $state('');
	let recordId = $state('');

	// Synchronize filter states from URL parameters (data.filters) directly
	$effect(() => {
		const filtersData = data.filters as Record<string, string>;

		if (!filtersData || Object.keys(filtersData).length === 0) {
			// Clear filters
			selectedClinicId = null;
			clinicSearch = '';
			caseTypeId = '';
			caseNo = '';
			patientName = '';
			caseStatus = '';
			paymentStatus = '';
			recordId = '';
			startDate = '';
			endDate = '';
			selectedMonth = '';
			return;
		}

		// Sync Clinic
		if (filtersData.clinic_id) {
			const clinicId = parseInt(filtersData.clinic_id);
			selectedClinicId = clinicId;
			const clinic = data.clinics?.find((c) => c.clinicId === clinicId);
			if (clinic) {
				clinicSearch = clinic.clinicName;
			}
		} else {
			selectedClinicId = null;
			clinicSearch = '';
		}

		// Sync Text/Select inputs
		caseTypeId = filtersData.case_type_id ? String(filtersData.case_type_id) : '';
		caseNo = filtersData.case_no ? String(filtersData.case_no) : '';
		patientName = filtersData.patient_name || '';
		caseStatus = filtersData.case_status || '';
		paymentStatus = filtersData.payment_status || '';
		recordId = filtersData.record_id ? String(filtersData.record_id) : '';

		// Sync Dates
		if (filtersData.start_date && filtersData.end_date) {
			startDate = filtersData.start_date;
			endDate = filtersData.end_date;

			const start = new Date(filtersData.start_date);
			const end = new Date(filtersData.end_date);

			// Detect if a full month was selected
			if (
				start.getDate() === 1 &&
				end.getDate() === new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate() &&
				start.getMonth() === end.getMonth() &&
				start.getFullYear() === end.getFullYear()
			) {
				selectedMonth = start.getMonth() + 1;
				selectedYear = start.getFullYear();
			} else {
				selectedMonth = '';
			}
		} else {
			startDate = '';
			endDate = '';
			selectedMonth = '';
		}
	});

	function handleMonthFilter() {
		if (selectedMonth) {
			const date = new Date(selectedYear, selectedMonth - 1, 1);
			const lastDay = new Date(selectedYear, selectedMonth, 0);
			startDate = date.toISOString().split('T')[0];
			endDate = lastDay.toISOString().split('T')[0];
		}
	}

	console.log(data);

	let customerNames = $derived(
		Object.keys(data.filters).length > 0
			? [...new Set(data.records.map((record) => record.clinicName))]
			: []
	);

	// Add function to handle clinic selection
	function handleClinicSelect(clinic: { clinicId: number; clinicName: string }) {
		clinicSearch = clinic.clinicName;
		selectedClinicId = clinic.clinicId;
	}

	// Pagination states
	let currentPage = $state(1);
	let recordsPerPage = $state(20);

	// Calculate pagination values
	let totalPages = $derived(Math.ceil((data.records?.length || 0) / recordsPerPage));
	let paginatedRecords = $derived(
		data.records?.slice((currentPage - 1) * recordsPerPage, currentPage * recordsPerPage) || []
	);

	// Pagination controls
	function nextPage() {
		if (currentPage < totalPages) currentPage++;
	}

	function prevPage() {
		if (currentPage > 1) currentPage--;
	}

	function goToPage(page: number) {
		currentPage = page;
	}

	function goToFirstPage() {
		currentPage = 1;
	}

	function goToLastPage() {
		if (totalPages > 0) currentPage = totalPages;
	}

	$effect(() => {
		if (totalPages > 0 && currentPage > totalPages) {
			currentPage = totalPages;
		} else if (totalPages === 0) {
			currentPage = 1;
		}
	});

	// Build a compact pagination list with ellipses.
	// Returns an array of numbers and '...' strings. Examples:
	// totalPages=10, current=1  -> [1,2,3,4,5,'...',10]
	// totalPages=10, current=5  -> [1,'...',4,5,6,'...',10]
	function getPageList(totalPages: number, current: number) {
		const pages: Array<number | string> = [];
		if (totalPages <= 7) {
			for (let i = 1; i <= totalPages; i++) pages.push(i);
			return pages;
		}

		if (current <= 4) {
			pages.push(1, 2, 3, 4, 5, '...', totalPages);
			return pages;
		}

		if (current >= totalPages - 3) {
			pages.push(
				1,
				'...',
				totalPages - 4,
				totalPages - 3,
				totalPages - 2,
				totalPages - 1,
				totalPages
			);
			return pages;
		}

		// middle range
		pages.push(1, '...', current - 1, current, current + 1, '...', totalPages);
		return pages;
	}

	// Delete state
	let showDelete = $state(false);

	// Add delete handler
	function handleDelete(recordId: number) {
		if (confirm('Are you sure you want to delete this record?')) {
			// TODO: Implement delete functionality
			console.log('Delete record:', recordId);
		}
	}

	// Password-confirmation modal for deletions
	let showPasswordModal = $state(false);
	let modalDeleteRecordId = $state<number | null>(null);
	let deletePassword = $state('');
	let deleteForm: HTMLFormElement | null = $state(null);

	const modalDeleteRecord = $derived(
		modalDeleteRecordId ? data.records?.find((r) => r.recordId === modalDeleteRecordId) : null
	);

	function openDeleteModal(id: number) {
		modalDeleteRecordId = id;
		deletePassword = '';
		showPasswordModal = true;
	}

	function closeDeleteModal() {
		showPasswordModal = false;
		modalDeleteRecordId = null;
		deletePassword = '';
		if (deleteForm) deleteForm.reset();
	}

	// Computed totals
	let totalOrderAmount = $derived(() => {
		if (!data.records || data.records.length === 0) return '0.00';
		const total = data.records.reduce((sum, record) => sum + (Number(record.orderTotal) || 0), 0);
		return total.toFixed(2);
	});

	let totalPaidAmount = $derived(() => {
		if (!data.records || data.records.length === 0) return '0.00';
		const total = data.records.reduce((sum, record) => sum + (Number(record.paidAmount) || 0), 0);
		return total.toFixed(2);
	});

	let totalBalance = $derived(() => {
		// Balance = paid - order. Positive means clinic/customer has credit (overpaid).
		const total = Number(totalPaidAmount()) - Number(totalOrderAmount());
		return total.toFixed(2);
	});

	// Calendar widget state and functions
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

	let calendarMonth = $state(data.calendarData?.month || new Date().getMonth() + 1);
	let calendarYear = $state(data.calendarData?.year || new Date().getFullYear());
	let showCalendarModal = $state(false);
	let selectedCalendarDate = $state<string | null>(null);
	let selectedDeliveryTab = $state<'delivery' | 'finish'>('delivery');

	let calendarDays = $derived(generateCalendarDays(calendarYear, calendarMonth));
	let deliveryByDate = $derived(
		groupRecordsByDate(data.calendarData?.deliveryRecords || [], 'dateDropoff')
	);
	let finishByDate = $derived(
		groupRecordsByDate(data.calendarData?.finishByRecords || [], 'finishBy')
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

	function groupRecordsByDate(records: Array<any>, dateField: 'dateDropoff' | 'finishBy') {
		const grouped: Record<string, typeof records> = {};
		records.forEach((record) => {
			const dateValue = record[dateField];
			if (!dateValue) return;
			const dateKey = dateValue.split('T')[0];
			if (!grouped[dateKey]) grouped[dateKey] = [];
			grouped[dateKey].push(record);
		});
		return grouped;
	}

	function navigateCalendarMonth(delta: number) {
		let newMonth = calendarMonth + delta;
		let newYear = calendarYear;
		if (newMonth > 12) {
			newMonth = 1;
			newYear++;
		} else if (newMonth < 1) {
			newMonth = 12;
			newYear--;
		}
		calendarMonth = newMonth;
		calendarYear = newYear;
	}

	function openCalendarDayDetail(fullDate: string) {
		selectedCalendarDate = fullDate;
		showCalendarModal = true;
	}

	function closeCalendarModal() {
		showCalendarModal = false;
		selectedCalendarDate = null;
	}

	let selectedDateDeliveries = $derived(
		selectedCalendarDate ? deliveryByDate[selectedCalendarDate] || [] : []
	);
	let selectedDateFinishBys = $derived(
		selectedCalendarDate ? finishByDate[selectedCalendarDate] || [] : []
	);
	let selectedDateTotal = $derived(selectedDateDeliveries.length + selectedDateFinishBys.length);

	// Status mapping for human-readable labels
	const statusLabels: Record<string, string> = {
		'pending': 'Pending',
		'finished': 'Finished',
		'to be deliver': 'Ready for Delivery',
		'to be reviewed': 'Pending Review',
		'to be reviewed by dentist': 'Reviewed by Dentist'
	};

	let pendingCases = $derived(data.records?.filter((r) => r.caseStatus === 'pending') || []);
	let deliverCases = $derived(data.records?.filter((r) => r.caseStatus === 'to be deliver') || []);
	let finishedCases = $derived(data.records?.filter((r) => r.caseStatus === 'finished') || []);

	function formatDateTime(dateStr: string | null | undefined) {
		if (!dateStr) return '-';
		try {
			const date = new Date(dateStr);
			if (isNaN(date.getTime())) return dateStr;
			return date.toLocaleString('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric',
				hour: 'numeric',
				minute: '2-digit',
				hour12: true
			});
		} catch (e) {
			return dateStr;
		}
	}
</script>

<!-- Compact Calendar Widget -->
{#if data.calendarData}
	<div class="border-border bg-surface w-full border-b p-2 print:hidden">
		<div class="mx-auto max-w-7xl">
			<div class="card p-3">
				<div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
					<!-- Mini Calendar -->
					<div class="lg:col-span-1">
						<div class="mb-2 flex items-center justify-between gap-2">
							<div class="flex items-center gap-1.5">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="text-text-muted h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
									/>
								</svg>
								<span class="text-text-primary text-sm font-medium"
									>{monthNames[calendarMonth - 1]} {calendarYear}</span
								>
							</div>
							<div class="flex items-center gap-2">
								<div class="flex items-center gap-1 text-[10px]">
									<div class="bg-warning h-2 w-2 rounded-full"></div>
									<span class="text-text-muted">{data.calendarData.deliveryRecords.length}</span>
								</div>
								<div class="flex items-center gap-1 text-[10px]">
									<div class="bg-info-light0 h-2 w-2 rounded-full"></div>
									<span class="text-text-muted">{data.calendarData.finishByRecords.length}</span>
								</div>
								<a
									href="/calendar"
									class="text-primary hover:text-primary-light text-[10px] font-medium">Full →</a
								>
							</div>
						</div>

						<div class="bg-surface-alt grid grid-cols-7 gap-px overflow-hidden rounded">
							{#each daysOfWeek as day}
								<div class="text-text-muted bg-surface py-1 text-center text-[9px] font-medium">
									{day[0]}
								</div>
							{/each}
							{#each calendarDays as { date, fullDate }}
								{#if date !== null && fullDate !== null}
									{@const deliveries = deliveryByDate[fullDate] || []}
									{@const finishBys = finishByDate[fullDate] || []}
									{@const totalRecords = deliveries.length + finishBys.length}
									{@const isToday = fullDate === new Date().toISOString().split('T')[0]}
									{@const hasRecords = totalRecords > 0}
									{@const isSelected = selectedCalendarDate === fullDate}
									<button
										class="relative h-7 bg-white text-[10px] transition-all {isToday
											? 'bg-primary/10'
											: ''} {isSelected ? 'ring-2 ring-indigo-500 ring-inset' : ''} {hasRecords
											? 'hover:bg-surface cursor-pointer'
											: 'cursor-default'}"
										onclick={() => hasRecords && (selectedCalendarDate = fullDate)}
										disabled={!hasRecords}
									>
										<span class={isToday ? 'text-primary font-bold' : 'text-text-secondary'}
											>{date}</span
										>
										{#if totalRecords > 0}
											<div class="absolute right-0 bottom-0.5 left-0 flex justify-center gap-px">
												{#if deliveries.length > 0}
													<div class="bg-warning h-1 w-1 rounded-full"></div>
												{/if}
												{#if finishBys.length > 0}
													<div class="bg-info-light0 h-1 w-1 rounded-full"></div>
												{/if}
											</div>
										{/if}
									</button>
								{:else}
									<div class="bg-surface h-7"></div>
								{/if}
							{/each}
						</div>
					</div>

					<!-- Selected Date Preview -->
					<div class="lg:col-span-2">
						{#if selectedCalendarDate}
							<div class="h-full">
								<div class="mb-2">
									<h3 class="text-text-primary text-sm font-semibold">
										{new Date(selectedCalendarDate).toLocaleDateString('en-US', {
											weekday: 'short',
											month: 'short',
											day: 'numeric'
										})}
									</h3>
								</div>
								<div class="mb-2 flex gap-2">
									<button
										onclick={() => {
											selectedDeliveryTab = 'delivery';
										}}
										class="rounded px-3 py-1 text-xs font-medium transition-colors {selectedDeliveryTab ===
										'delivery'
											? 'bg-warning-light text-warning-dark'
											: 'bg-surface-alt text-text-secondary hover:bg-surface-alt'}"
									>
										Delivery ({selectedDateDeliveries.length})
									</button>
									<button
										onclick={() => {
											selectedDeliveryTab = 'finish';
										}}
										class="rounded px-3 py-1 text-xs font-medium transition-colors {selectedDeliveryTab ===
										'finish'
											? 'text-info-dark bg-info-light'
											: 'bg-surface-alt text-text-secondary hover:bg-surface-alt'}"
									>
										Finish ({selectedDateFinishBys.length})
									</button>
								</div>
								<div class="max-h-[100px] space-y-1.5 overflow-y-auto">
									{#each selectedDeliveryTab === 'delivery' ? selectedDateDeliveries : selectedDateFinishBys as record}
										<a
											href="/details/{record.recordId}"
											class="bg-surface hover:bg-surface-alt flex items-center gap-2 rounded p-1.5 transition-colors"
										>
											<span
												class="h-2 w-2 rounded-full {selectedDeliveryTab === 'delivery'
													? 'bg-warning'
													: 'bg-info-light0'}"
											></span>
											<span class="text-text-secondary text-xs font-medium"
												>{record.patientName}</span
											>
											<span class="text-text-muted text-xs">{record.clinicName}</span>
										</a>
									{/each}
								</div>
							</div>
						{:else}
							<div class="text-text-muted flex h-full items-center justify-center text-sm">
								<span>Click a date to preview cases</span>
							</div>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Case Status Overview -->
{#if data.records && data.records.length > 0 && Object.keys(data.filters).length === 0}
	<div class="bg-surface border-border w-full border-b p-2 print:hidden">
		<div class="mx-auto max-w-7xl">
			<div class="mb-2 flex items-center justify-between">
				<h3 class="text-text-secondary ml-1 text-sm font-semibold">Case Status Overview</h3>
			</div>
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
				<!-- Pending -->
				<div class="border-border flex h-64 flex-col rounded border bg-white shadow-sm">
					<div
						class="bg-surface/50 border-border flex items-center justify-between border-b px-3 py-2"
					>
						<span class="text-text-secondary text-xs font-semibold tracking-wider uppercase"
							>Pending</span
						>
						<span
							class="text-text-secondary bg-surface-alt rounded-full px-1.5 py-0.5 text-[10px] font-bold"
							>{pendingCases.length}</span
						>
					</div>
					<div class="flex-1 space-y-1.5 overflow-y-auto p-2">
						{#each pendingCases as record}
							<div
								class="hover:bg-surface border-border block rounded border bg-white p-2 transition-colors"
							>
								<div class="mb-1 flex items-start justify-between">
									<span class="text-text-primary truncate pr-2 text-xs font-medium"
										>{record.patientName}</span
									>
									<span class="text-error-dark text-[10px] font-medium whitespace-nowrap"
										>{record.finishBy ? record.finishBy.split('T')[0] : 'No Date'}</span
									>
								</div>
								<div class="text-text-muted mb-2 truncate text-[10px]">{record.clinicName}</div>
								<div class="flex gap-1.5">
									<a
										href="/status/{record.recordId}"
										class="rounded bg-pink-50 px-1.5 py-0.5 text-[9px] font-medium text-pink-700 ring-1 ring-pink-700/10 hover:bg-pink-100"
										>Timeline</a
									>
									<a
										href="/amount/{record.recordId}"
										class="text-primary-dark bg-primary/10 hover:bg-primary/20 rounded px-1.5 py-0.5 text-[9px] font-medium ring-1 ring-indigo-700/10"
										>Amount</a
									>
									<a
										href="/details/{record.recordId}"
										class="text-info-dark bg-info-light hover:bg-info-light rounded px-1.5 py-0.5 text-[9px] font-medium ring-1 ring-blue-700/10"
										>Details</a
									>
								</div>
							</div>
						{:else}
							<div class="flex h-full items-center justify-center text-[10px] text-text-muted">
								No pending cases
							</div>
						{/each}
					</div>
				</div>

				<!-- To Be Delivered -->
				<div class="border-border flex h-64 flex-col rounded border bg-white shadow-sm">
					<div
						class="bg-info-light/50 border-border flex items-center justify-between border-b px-3 py-2"
					>
						<span class="text-info-dark text-xs font-semibold tracking-wider uppercase"
							>Ready to Deliver</span
						>
						<span
							class="text-info-dark bg-info-light rounded-full px-1.5 py-0.5 text-[10px] font-bold"
							>{deliverCases.length}</span
						>
					</div>
					<div class="flex-1 space-y-1.5 overflow-y-auto p-2">
						{#each deliverCases as record}
							<div
								class="hover:bg-info-light block rounded border border-blue-100/50 bg-white p-2 transition-colors"
							>
								<div class="mb-1 flex items-start justify-between">
									<span class="text-text-primary truncate pr-2 text-xs font-medium"
										>{record.patientName}</span
									>
									<span class="text-error-dark text-[10px] font-medium whitespace-nowrap"
										>{record.finishBy ? record.finishBy.split('T')[0] : 'No Date'}</span
									>
								</div>
								<div class="text-text-muted mb-2 truncate text-[10px]">{record.clinicName}</div>
								<div class="flex gap-1.5">
									<a
										href="/status/{record.recordId}"
										class="rounded bg-pink-50 px-1.5 py-0.5 text-[9px] font-medium text-pink-700 ring-1 ring-pink-700/10 hover:bg-pink-100"
										>Timeline</a
									>
									<a
										href="/amount/{record.recordId}"
										class="text-primary-dark bg-primary/10 hover:bg-primary/20 rounded px-1.5 py-0.5 text-[9px] font-medium ring-1 ring-indigo-700/10"
										>Amount</a
									>
									<a
										href="/details/{record.recordId}"
										class="text-info-dark bg-info-light hover:bg-info-light rounded px-1.5 py-0.5 text-[9px] font-medium ring-1 ring-blue-700/10"
										>Details</a
									>
								</div>
							</div>
						{:else}
							<div class="flex h-full items-center justify-center text-[10px] text-text-muted">
								No cases to deliver
							</div>
						{/each}
					</div>
				</div>

				<!-- Finished -->
				<div class="border-border flex h-64 flex-col rounded border bg-white shadow-sm">
					<div
						class="border-border flex items-center justify-between border-b bg-green-50/50 px-3 py-2"
					>
						<span class="text-success-dark text-xs font-semibold tracking-wider uppercase"
							>Finished</span
						>
						<span
							class="text-success-dark bg-success-light rounded-full px-1.5 py-0.5 text-[10px] font-bold"
							>{finishedCases.length}</span
						>
					</div>
					<div class="flex-1 space-y-1.5 overflow-y-auto p-2">
						{#each finishedCases as record}
							<div
								class="block rounded border border-green-100/50 bg-white p-2 transition-colors hover:bg-green-50"
							>
								<div class="mb-1 flex items-start justify-between">
									<span class="text-text-primary truncate pr-2 text-xs font-medium"
										>{record.patientName}</span
									>
									<span class="text-error-dark text-[10px] font-medium whitespace-nowrap"
										>{record.finishBy ? record.finishBy.split('T')[0] : 'No Date'}</span
									>
								</div>
								<div class="text-text-muted mb-2 truncate text-[10px]">{record.clinicName}</div>
								<div class="flex gap-1.5">
									<a
										href="/status/{record.recordId}"
										class="rounded bg-pink-50 px-1.5 py-0.5 text-[9px] font-medium text-pink-700 ring-1 ring-pink-700/10 hover:bg-pink-100"
										>Timeline</a
									>
									<a
										href="/amount/{record.recordId}"
										class="text-primary-dark bg-primary/10 hover:bg-primary/20 rounded px-1.5 py-0.5 text-[9px] font-medium ring-1 ring-indigo-700/10"
										>Amount</a
									>
									<a
										href="/details/{record.recordId}"
										class="text-info-dark bg-info-light hover:bg-info-light rounded px-1.5 py-0.5 text-[9px] font-medium ring-1 ring-blue-700/10"
										>Details</a
									>
								</div>
							</div>
						{:else}
							<div class="flex h-full items-center justify-center text-[10px] text-text-muted">
								No finished cases
							</div>
						{/each}
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Filter Form -->
<div class="bg-surface border-border w-full border-b p-2 pb-1 print:hidden">
	<form method="GET" class="mx-auto max-w-7xl">
		<div class="border-border rounded-lg border bg-white p-3 shadow-sm">
			<div class="mb-2 flex items-center justify-between">
				<h3 class="text-text-secondary text-sm font-semibold">Quick Filters</h3>
				<div class="flex gap-2">
					<button
						type="reset"
						class="text-text-secondary hover:bg-surface ring-border rounded bg-white px-2 py-1 text-xs font-medium shadow-sm ring-1 transition"
						onclick={() => (window.location.href = '/')}
					>
						Clear
					</button>
					<button
						type="submit"
						class="hover:bg-primary/100 rounded bg-primary px-3 py-1 text-xs font-medium text-white shadow-sm transition"
					>
						Apply Filters
					</button>
				</div>
			</div>

			<div class="grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-7">
				<div class="relative" bind:this={clinicContainer}>
					<label class="text-text-muted mb-1 block text-[10px] font-medium tracking-wider uppercase"
						>Clinic</label
					>
					<input
						type="text"
						bind:value={clinicSearch}
						placeholder="Search clinic..."
						autocomplete="off"
						class="border-border w-full rounded border p-1.5 text-xs shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
						onfocus={() => {
							showAllClinics = true;
						}}
						onblur={(e) => {
							const relatedTarget = e.relatedTarget as Node;
							if (!relatedTarget || !clinicContainer.contains(relatedTarget)) {
								showAllClinics = false;
							}
						}}
						oninput={() => {
							selectedClinicId = null;
						}}
					/>
					<input type="hidden" name="clinic_id" value={selectedClinicId || ''} />
					{#if showAllClinics && filteredClinics && filteredClinics.length > 0}
						<div
							class="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md border bg-white shadow-lg"
						>
							{#each filteredClinics as clinic}
								<button
									type="button"
									class="hover:bg-surface w-full p-2 text-left text-xs"
									onclick={() => {
										handleClinicSelect(clinic);
										showAllClinics = false;
									}}
								>
									{clinic.clinicName}
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<div>
					<label class="text-text-muted mb-1 block text-[10px] font-medium tracking-wider uppercase"
						>Case Type</label
					>
					<select
						name="case_type_id"
						bind:value={caseTypeId}
						class="border-border w-full rounded border p-1.5 text-xs shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
					>
						<option value="">All Types</option>
						{#each data.caseTypes as type}
							<option value={String(type.caseTypeId)}>{type.caseTypeName}</option>
						{/each}
					</select>
				</div>

				<div>
					<label class="text-text-muted mb-1 block text-[10px] font-medium tracking-wider uppercase"
						>Case Number</label
					>
					<input
						type="text"
						name="case_no"
						bind:value={caseNo}
						placeholder="Case #"
						class="border-border w-full rounded border p-1.5 text-xs shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
					/>
				</div>

				<div>
					<label class="text-text-muted mb-1 block text-[10px] font-medium tracking-wider uppercase"
						>Patient Name</label
					>
					<input
						type="text"
						name="patient_name"
						bind:value={patientName}
						placeholder="Patient Name"
						class="border-border w-full rounded border p-1.5 text-xs shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
					/>
				</div>

				<div>
					<label class="text-text-muted mb-1 block text-[10px] font-medium tracking-wider uppercase"
						>Payment</label
					>
					<select
						name="payment_status"
						bind:value={paymentStatus}
						class="border-border w-full rounded border p-1.5 text-xs shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
					>
						<option value="">All Status</option>
						<option value="paid">Paid</option>
						<option value="unpaid">Unpaid</option>
					</select>
				</div>

				<div>
					<label class="text-text-muted mb-1 block text-[10px] font-medium tracking-wider uppercase"
						>Status</label
					>
					<select
						name="case_status"
						bind:value={caseStatus}
						class="border-border w-full rounded border p-1.5 text-xs shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
					>
						<option value="">All Status</option>
						<option value="pending">Pending</option>
						<option value="finished">Finished</option>
						<option value="to be reviewed">To Be Reviewed</option>
						<option value="to be deliver">To Be Delivered</option>
						<option value="to be reviewed by dentist">Reviewed by Dentist</option>
					</select>
				</div>
			</div>

			<div
				class="border-border mt-3 grid grid-cols-1 gap-4 border-t pt-3 md:grid-cols-3 md:items-end md:gap-3"
			>
				<div class="flex flex-col items-center gap-2 sm:flex-row">
					<div class="w-full sm:flex-1">
						<label
							class="text-text-muted mb-1 block text-[10px] font-medium tracking-wider uppercase"
							>Start Date</label
						>
						<input
							type="date"
							name="start_date"
							bind:value={startDate}
							class="border-border w-full rounded border p-1.5 text-xs shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
						/>
					</div>
					<div class="w-full sm:flex-1">
						<label
							class="text-text-muted mb-1 block text-[10px] font-medium tracking-wider uppercase"
							>End Date</label
						>
						<input
							type="date"
							name="end_date"
							bind:value={endDate}
							class="border-border w-full rounded border p-1.5 text-xs shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
						/>
					</div>
				</div>

				<div class="flex flex-col items-center gap-2 sm:flex-row">
					<div class="w-full sm:flex-1">
						<label
							class="text-text-muted mb-1 block text-[10px] font-medium tracking-wider uppercase"
							>Filter by Month</label
						>
						<select
							bind:value={selectedMonth}
							onchange={handleMonthFilter}
							class="border-border w-full rounded border p-1.5 text-xs shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
						>
							<option value="">Select Month</option>
							{#each Array.from({ length: 12 }, (_, i) => i + 1) as month}
								<option value={month}>
									{new Date(2000, month - 1).toLocaleString('default', { month: 'short' })}
								</option>
							{/each}
						</select>
					</div>
					<div class="w-full sm:w-24">
						<label
							class="text-text-muted mb-1 block text-[10px] font-medium tracking-wider uppercase"
							>Year</label
						>
						<select
							bind:value={selectedYear}
							onchange={handleMonthFilter}
							class="border-border w-full rounded border p-1.5 text-xs shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
						>
							{#each Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i) as year}
								<option value={year}>{year}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
					<div class="w-full sm:flex-1">
						<label
							class="text-text-muted mb-1 block text-[10px] font-medium tracking-wider uppercase"
							>Record ID</label
						>
						<input
							type="number"
							name="record_id"
							bind:value={recordId}
							placeholder="Record #"
							class="border-border w-full rounded border p-1.5 text-xs shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
						/>
					</div>
					<div class="flex items-center sm:pt-[18px]">
						{#if data.user && (data.user.role === 'admin' || data.user.role === 'dentist')}
							<label
								class="bg-error-light/50 hover:bg-error-light inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded border border-red-100 px-2.5 py-1.5 transition-colors sm:w-auto"
							>
								<input
									type="checkbox"
									bind:checked={showDelete}
									class="text-error-dark border-border h-3.5 w-3.5 rounded focus:ring-red-500"
								/>
								<span class="text-error-dark text-[10px] font-bold tracking-wider uppercase"
									>Show Delete</span
								>
							</label>
						{/if}
					</div>
				</div>
			</div>
		</div>
	</form>
</div>

<!-- Records Section -->
<div class="min-h-[400px] bg-white">
	{#if data.records && data.records.length > 0}
		<!-- Statement Header -->
		{#if Object.keys(data.filters).length > 0}
			<div class="border-border border-b bg-white p-8">
				<div class="flex flex-row items-start justify-between space-x-12">
					<div class="flex flex-col">
						<h1 class="text-text-primary text-2xl font-bold">NUNEZ DENTAL LABORATORY</h1>
						<h2 class="text-text-secondary mt-1 text-xl font-semibold">STATEMENT OF ACCOUNT</h2>
					</div>

					<div class="text-text-primary flex flex-col items-start space-y-1.5 pt-1 text-sm">
						<div class="flex items-baseline">
							<span class="text-text-secondary w-32 pr-2 text-right font-medium">PRINT DATE:</span>
							<span class="border-text-secondary inline-block w-40 border-b">
								{getCurrentDateTime().fullDateTime}
							</span>
						</div>
						{#if customerNames.length == 1}
							<div class="flex items-baseline">
								<span class="text-text-secondary w-fit pr-2 text-right font-medium"
									>CUSTOMER NAME:</span
								>
								<span class="border-text-secondary inline-block w-40 border-b">
									{customerNames.join(', ')}
								</span>
							</div>
						{/if}
						<div class="flex items-baseline">
							<span class="text-text-secondary w-32 pr-2 text-right font-medium">START DATE:</span>
							<span class="border-text-secondary inline-block w-40 border-b">
								{formatDate(getRecordDateRange(data.records).startingDate)}
							</span>
						</div>
						<div class="flex items-baseline">
							<span class="text-text-secondary w-32 pr-2 text-right font-medium">END DATE:</span>
							<span class="border-text-secondary inline-block w-40 border-b">
								{formatDate(getRecordDateRange(data.records).recentDate)}
							</span>
						</div>
						<div class="flex items-baseline">
							<span class="text-text-secondary w-32 pr-2 text-right font-medium">STATUS:</span>
							<span class="text-text-primary inline-block w-40 font-semibold">
								{generateRecordsSummary(data.records).processStatus} -
								{generateRecordsSummary(data.records).financialStatus}
							</span>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Color Legend -->
		<div
			class="text-text-muted mb-3 flex flex-wrap items-center gap-4 px-1 text-[10px] font-medium tracking-wider uppercase print:hidden"
		>
			<div class="flex items-center gap-1.5">
				<div
					class="bg-success-light inline-block h-3 w-3 rounded-full border border-green-300"
				></div>
				<span>Paid & Delivered</span>
			</div>
			<div class="flex items-center gap-1.5">
				<div class="inline-block h-3 w-3 rounded-full border border-red-400 bg-red-300"></div>
				<span>Unpaid & Delivered</span>
			</div>
			<div class="flex items-center gap-1.5">
				<div class="inline-block h-3 w-3 rounded-full border border-violet-400 bg-violet-300"></div>
				<span>In Progress / Other</span>
			</div>
			<div class="flex items-center gap-1.5">
				<div class="border-border inline-block h-3 w-3 rounded-full border bg-white"></div>
				<span>Pending / Normal</span>
			</div>
		</div>

		<!-- Table -->
		<div class="border-border overflow-x-auto rounded-lg border bg-white pt-1 shadow-sm">
			<table class="divide-border min-w-full table-fixed divide-y">
				<thead class="bg-surface/50">
					<tr>
						<th
							scope="col"
							class="text-text-muted bg-surface/50 sticky top-0 px-3 py-2.5 text-left text-[10px] font-semibold tracking-wider uppercase"
						>
							Date Pickup
						</th>
						<th
							scope="col"
							class="text-text-muted bg-surface/50 px-3 py-2.5 text-left text-[10px] font-semibold tracking-wider uppercase"
						>
							Date Dropoff
						</th>
						<th
							scope="col"
							class="text-text-muted bg-surface/50 px-3 py-2.5 text-left text-[10px] font-semibold tracking-wider uppercase"
						>
							Deadline
						</th>
						{#if Object.keys(data.filters).length === 0 || customerNames.length > 1}
							<th
								scope="col"
								class="text-text-muted bg-surface/50 px-3 py-2.5 text-left text-[10px] font-semibold tracking-wider uppercase"
							>
								Clinic
							</th>
						{/if}
						<th
							scope="col"
							class="text-text-muted bg-surface/50 px-3 py-2.5 text-left text-[10px] font-semibold tracking-wider uppercase"
						>
							Patient Name
						</th>
						<th
							scope="col"
							class="text-text-muted bg-surface/50 px-3 py-2.5 text-left text-[10px] font-semibold tracking-wider uppercase"
						>
							Case Info
						</th>
						<th
							scope="col"
							class="text-text-muted bg-surface/50 px-3 py-2.5 text-left text-[10px] font-semibold tracking-wider uppercase"
						>
							Description
						</th>
						<th
							scope="col"
							class="text-text-muted bg-surface/50 px-3 py-2.5 text-left text-[10px] font-semibold tracking-wider uppercase"
						>
							Total Amount
						</th>
						<th
							scope="col"
							class="text-text-muted bg-surface/50 px-3 py-2.5 text-left text-[10px] font-semibold tracking-wider uppercase"
						>
							Paid Amount
						</th>
						<th
							scope="col"
							class="text-text-muted bg-surface/50 px-3 py-2.5 text-left text-[10px] font-semibold tracking-wider uppercase"
						>
							Balance
						</th>
						<th
							scope="col"
							class="text-text-muted bg-surface/50 px-3 py-2.5 text-left text-[10px] font-semibold tracking-wider uppercase"
						>
							Status
						</th>
						<th
							scope="col"
							class="text-text-muted bg-surface/50 px-3 py-2.5 text-left text-[10px] font-semibold tracking-wider uppercase print:hidden"
						>
							Actions
						</th>
						<th
							scope="col"
							class="text-text-muted bg-surface/50 px-3 py-2.5 text-left text-[10px] font-semibold tracking-wider uppercase print:hidden"
						>
							History
						</th>
						{#if showDelete && data.user && data.user.role === 'admin'}
							<th
								scope="col"
								class="text-text-muted bg-surface/50 px-3 py-2.5 text-left text-[10px] font-semibold tracking-wider uppercase print:hidden"
							>
								Delete
							</th>
						{/if}
					</tr>
				</thead>
				<tbody class="divide-border divide-y bg-white">
					{#each paginatedRecords as record}
						<tr
							class={`
							border-border border-b transition-colors hover:bg-black/5
							${
								record.paymentStatus === 'paid' && record.caseStatus === 'delivered'
									? 'bg-success-light'
									: record.paymentStatus === 'unpaid' && record.caseStatus === 'delivered'
										? 'bg-red-300'
										: record.paymentStatus === 'unpaid' && record.caseStatus === 'pending'
											? 'bg-white'
											: 'bg-violet-300'
							}
						`}
						>
							<td class="px-3 py-2 text-xs whitespace-nowrap text-black">
								{formatDateTime(record.datePickup)}
							</td>
							<td class="px-3 py-2 text-xs whitespace-nowrap text-black">
								{formatDateTime(record.dateDropoff)}
							</td>
							<td
								class="text-error-dark px-3 py-2 text-xs font-medium tracking-tight whitespace-nowrap"
							>
								{record.finishBy ? formatDateTime(record.finishBy) : 'None'}
							</td>
							{#if Object.keys(data.filters).length === 0 || customerNames.length > 1}
								<td class="px-3 py-2 text-xs whitespace-nowrap text-black">
									<span class="font-medium">{record.clinicName}</span>
								</td>
							{/if}
							<td class="px-3 py-2 text-xs whitespace-nowrap text-black">
								<span class="font-medium">{record.patientName}</span>
							</td>
							<td class="px-3 py-2 text-xs whitespace-nowrap text-black">
								<div class="flex flex-col gap-2">
									{#each record.orderItems as item}
										<div class="leading-none">
											<span class="text-text-primary font-bold">{item.caseTypeName}</span>
											{#if item.caseTypeAbbrv}
												<span class="text-text-muted ml-0.5 text-[10px] font-medium"
													>({item.caseTypeAbbrv})</span
												>
											{/if}
											<div class="text-text-secondary mt-1 text-[10px] font-medium">
												{item.caseNo}
											</div>
										</div>
									{/each}
								</div>
							</td>
							<td class="min-w-[150px] px-3 py-2 text-xs text-black">
								<div class="flex flex-col gap-2">
									{#each record.orderItems as item}
										<div
											class="text-text-secondary bg-surface/50 rounded-r-sm border-l-[3px] border-indigo-200 py-0.5 pl-2 text-[11px] leading-tight break-words whitespace-normal"
										>
											{item.orderDescription || '-'}
										</div>
									{/each}
								</div>
							</td>
							<td class="px-3 py-2 text-xs whitespace-nowrap text-black">
								₱{record.orderTotal}
							</td>
							<td class="px-3 py-2 text-xs whitespace-nowrap text-black">
								₱{record.paidAmount}
							</td>
							<td class="px-3 py-2 text-xs whitespace-nowrap text-black">
								{#if Number(record.paidAmount) - Number(record.orderTotal) < 0}
									-₱{Math.abs(Number(record.paidAmount) - Number(record.orderTotal)).toFixed(2)}
								{:else}
									+₱{(Number(record.paidAmount) - Number(record.orderTotal)).toFixed(2)}
								{/if}
							</td>
							<td class="px-3 py-2 text-xs whitespace-nowrap">
								<span class="flex flex-col gap-0.5">
									<span class="font-medium">{statusLabels[record.caseStatus] || record.caseStatus || 'No status'}</span>
									{#if record.caseNotes}
										<span
											class="text-text-muted max-w-[150px] truncate text-[10px]"
											title={record.caseNotes}>{record.caseNotes}</span
										>
									{/if}
									<span
										class={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium 
										${record.paymentStatus === 'paid' ? 'text-success-dark bg-success-light' : 'text-error-dark bg-error-light'}`}
									>
										{record.paymentStatus}
									</span>
								</span>
							</td>
							<td class="px-3 py-2 text-xs print:hidden">
								<div class="flex max-w-[280px] min-w-[150px] flex-wrap gap-1.5">
									<a
										href={`/details/${record.recordId}`}
										class="text-info-dark bg-info-light hover:bg-info-light inline-flex items-center rounded px-2 py-1 text-xs font-medium ring-1 ring-blue-700/10"
									>
										View
									</a>
									<a
										href={`/invoice/${record.recordId}`}
										class="text-info-dark bg-info-light hover:bg-info-light inline-flex items-center rounded px-2 py-1 text-xs font-medium ring-1 ring-blue-700/10"
									>
										Invoice
									</a>
									<a
										href={`/status/${record.recordId}`}
										class="inline-flex items-center rounded bg-pink-50 px-2 py-1 text-xs font-medium text-pink-700 ring-1 ring-pink-700/10 hover:bg-pink-100"
									>
										Timeline
									</a>
									<a
										href={`/edit/${record.recordId}`}
										class="inline-flex items-center rounded bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-purple-700/10 hover:bg-purple-100"
									>
										Edit
									</a>
									<a
										href={`/amount/${record.recordId}`}
										class="text-primary-dark bg-primary/10 hover:bg-primary/20 inline-flex items-center rounded px-2 py-1 text-xs font-medium ring-1 ring-indigo-700/10"
									>
										Amount
									</a>
								</div>
							</td>
							<td class="px-3 py-2 text-xs whitespace-nowrap print:hidden">
								<a
									href={`/history/${record.recordId}`}
									class="text-text-secondary bg-surface hover:bg-surface-alt ring-primary-dark/10 inline-flex items-center rounded px-2 py-1 text-xs font-medium ring-1"
								>
									History
								</a>
							</td>
							{#if showDelete && data.user && data.user.role === 'admin'}
								<td class="px-3 py-2 text-sm font-medium whitespace-nowrap print:hidden">
									<button
										type="button"
										onclick={() => openDeleteModal(record.recordId)}
										class="hover:bg-error-light bg-error-light inline-flex items-center rounded-md px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-700/10"
									>
										Delete
									</button>
								</td>
							{/if}
						</tr>
					{/each}
				</tbody>
				{#if Object.keys(data.filters).length > 0}
					<tfoot>
						<tr class="bg-surface border-border border-t-2 font-medium">
							<td colspan={showDelete ? 7 : 6} class="px-3 py-2 text-right text-xs"> Total: </td>
							<td class="px-3 py-2 text-xs whitespace-nowrap">₱{totalOrderAmount()}</td>
							<td class="px-3 py-2 text-xs whitespace-nowrap">₱{totalPaidAmount()}</td>
							<td class="px-3 py-2 text-xs whitespace-nowrap">
								{#if Number(totalBalance()) < 0}
									-₱{Math.abs(Number(totalBalance())).toFixed(2)}
								{:else}
									+₱{Number(totalBalance()).toFixed(2)}
								{/if}
							</td>
							<td colspan={showDelete ? 2 : 1}></td>
						</tr>
					</tfoot>
				{/if}
			</table>
		</div>

		{#if data.records && data.records.length > 0}
			<div
				class="border-border flex items-center justify-between border-t bg-white px-4 py-3 sm:px-6 print:hidden"
			>
				<div class="flex flex-1 justify-between sm:hidden">
					<button
						onclick={goToFirstPage}
						class="text-text-secondary hover:bg-surface border-border relative inline-flex items-center rounded-md border bg-white px-4 py-2 text-sm font-medium"
						disabled={currentPage === 1}
					>
						First
					</button>
					<button
						onclick={prevPage}
						class="text-text-secondary hover:bg-surface border-border relative ml-2 inline-flex items-center rounded-md border bg-white px-4 py-2 text-sm font-medium"
						disabled={currentPage === 1}
					>
						Prev
					</button>
					<button
						onclick={nextPage}
						class="text-text-secondary hover:bg-surface border-border relative ml-2 inline-flex items-center rounded-md border bg-white px-4 py-2 text-sm font-medium"
						disabled={currentPage === totalPages}
					>
						Next
					</button>
					<button
						onclick={goToLastPage}
						class="text-text-secondary hover:bg-surface border-border relative ml-2 inline-flex items-center rounded-md border bg-white px-4 py-2 text-sm font-medium"
						disabled={currentPage === totalPages}
					>
						Last
					</button>
				</div>
				<div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
					<div class="flex items-center gap-6">
						<p class="text-text-secondary text-sm">
							Showing <span class="font-medium"
								>{totalOrderAmount() === '0.00' ? 0 : (currentPage - 1) * recordsPerPage + 1}</span
							>
							to
							<span class="font-medium"
								>{Math.min(currentPage * recordsPerPage, data.records?.length || 0)}</span
							>
							of <span class="font-medium">{data.records?.length || 0}</span> results
						</p>
						<div class="flex items-center gap-2">
							<label for="rows-per-page" class="text-text-secondary text-sm font-medium"
								>Rows per page:</label
							>
							<select
								id="rows-per-page"
								bind:value={recordsPerPage}
								class="border-border rounded-md border py-1 pr-6 pl-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary focus:outline-none"
							>
								<option value={10}>10</option>
								<option value={20}>20</option>
								<option value={50}>50</option>
								<option value={100}>100</option>
							</select>
						</div>
					</div>
					<div>
						<nav
							class="isolate inline-flex -space-x-px rounded-md shadow-sm"
							aria-label="Pagination"
						>
							<button
								onclick={goToFirstPage}
								class="hover:bg-surface text-text-muted ring-border relative inline-flex items-center rounded-l-md px-2 py-2 ring-1 ring-inset"
								disabled={currentPage === 1}
								title="First Page"
							>
								<span class="sr-only">First</span>
								<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
									<path
										fill-rule="evenodd"
										d="M15.79 14.77a.75.75 0 01-1.06.02l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 111.04 1.08L11.832 10l3.938 3.71a.75.75 0 01.02 1.06zm-6 0a.75.75 0 01-1.06.02l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 111.04 1.08L5.832 10l3.938 3.71a.75.75 0 01.02 1.06z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
							<button
								onclick={prevPage}
								class="hover:bg-surface text-text-muted ring-border relative inline-flex items-center px-2 py-2 ring-1 ring-inset"
								disabled={currentPage === 1}
								title="Previous Page"
							>
								<span class="sr-only">Previous</span>
								<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
									<path
										fill-rule="evenodd"
										d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
							{#each getPageList(totalPages, currentPage) as pageItem}
								{#if pageItem === '...'}
									<span
										class="text-text-muted ring-border relative inline-flex items-center px-4 py-2 text-sm ring-1 ring-inset"
										>{pageItem}</span
									>
								{:else}
									<button
										onclick={() => goToPage(Number(pageItem))}
										class={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
											pageItem === currentPage
												? 'z-10 bg-primary text-white'
												: 'text-text-primary hover:bg-surface ring-border ring-1 ring-inset'
										}`}
									>
										{pageItem}
									</button>
								{/if}
							{/each}
							<button
								onclick={nextPage}
								class="hover:bg-surface text-text-muted ring-border relative inline-flex items-center px-2 py-2 ring-1 ring-inset"
								disabled={currentPage === totalPages}
								title="Next Page"
							>
								<span class="sr-only">Next</span>
								<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
									<path
										fill-rule="evenodd"
										d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
							<button
								onclick={goToLastPage}
								class="hover:bg-surface text-text-muted ring-border relative inline-flex items-center rounded-r-md px-2 py-2 ring-1 ring-inset"
								disabled={currentPage === totalPages}
								title="Last Page"
							>
								<span class="sr-only">Last</span>
								<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
									<path
										fill-rule="evenodd"
										d="M4.21 5.23a.75.75 0 011.06-.02l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.04-1.08L8.168 10 4.23 6.29a.75.75 0 01-.02-1.06zm6 0a.75.75 0 011.06-.02l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.04-1.08L14.168 10 10.23 6.29a.75.75 0 01-.02-1.06z"
										clip-rule="evenodd"
									/>
								</svg>
							</button>
						</nav>
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<div class="flex h-96 items-center justify-center">
			<p class="text-text-muted text-center">
				<span class="block text-2xl font-semibold">No records found</span>
				<span class="mt-2 block text-sm">Try adjusting your filters or create a new record</span>
			</p>
		</div>
	{/if}
</div>

{#if showPasswordModal && modalDeleteRecord}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 print:hidden">
		<div class="mx-4 w-full max-w-lg rounded-lg bg-white shadow-lg">
			<div class="p-4">
				<h3 class="text-error-dark text-lg font-medium">Confirm Deletion</h3>
				<div class="bg-surface mt-3 rounded-md p-3 text-sm">
					<p class="text-text-primary mb-2 font-semibold">Record Information:</p>
					<div class="text-text-secondary space-y-1.5">
						<div class="flex">
							<span class="w-28 font-medium">Record ID:</span>
							<span>{modalDeleteRecord.recordId}</span>
						</div>
						<div class="flex">
							<span class="w-28 font-medium">Patient:</span>
							<span>{modalDeleteRecord.patientName}</span>
						</div>
						<div class="flex">
							<span class="w-28 font-medium">Clinic:</span>
							<span>{modalDeleteRecord.clinicName}</span>
						</div>
						<div class="flex">
							<span class="w-28 font-medium">Date Pickup:</span>
							<span>{modalDeleteRecord.datePickup || '-'}</span>
						</div>
						<div class="flex">
							<span class="w-28 font-medium">Date Dropoff:</span>
							<span>{modalDeleteRecord.dateDropoff || '-'}</span>
						</div>
						<div class="flex">
							<span class="w-28 font-medium">Total Amount:</span>
							<span>₱{modalDeleteRecord.orderTotal}</span>
						</div>
						<div class="flex">
							<span class="w-28 font-medium">Paid Amount:</span>
							<span>₱{modalDeleteRecord.paidAmount}</span>
						</div>
						<div class="flex">
							<span class="w-28 font-medium">Status:</span>
							<span class="flex items-center gap-2">
								<span
									class={`rounded-full px-2 py-0.5 text-xs font-medium ${
										modalDeleteRecord.paymentStatus === 'paid'
											? 'text-success-dark bg-success-light'
											: 'text-error-dark bg-error-light'
									}`}
								>
									{modalDeleteRecord.paymentStatus}
								</span>
								<span class="text-text-secondary text-xs"
									>({modalDeleteRecord.caseStatus || 'No status'})</span
								>
							</span>
						</div>
					</div>
				</div>
				<p class="text-text-secondary mt-3 text-sm">
					Enter your <strong>Account Password</strong> to confirm deletion.
				</p>
				<form
					bind:this={deleteForm}
					action="?/deleteRecord"
					method="POST"
					class="mt-4"
					use:enhance={({ cancel }) => {
						return async ({ result, update }) => {
							if (result.type === 'failure') {
								cancel();
								closeDeleteModal();
								alert('Incorrect account password');
								return;
							}
							if (result.type === 'redirect') {
								closeDeleteModal();
								alert('Record deleted');
							}
							await update();
						};
					}}
				>
					<input type="hidden" name="record_id" value={modalDeleteRecordId} />
					<label for="confirm_password" class="text-text-secondary block text-sm font-medium"
						>Password</label
					>
					<input
						id="confirm_password"
						name="confirm_password"
						type="password"
						bind:value={deletePassword}
						class="border-border mt-1 w-full rounded-md border p-2 text-sm shadow-sm"
						required
					/>
					<div class="mt-4 flex justify-end gap-2">
						<button
							type="button"
							class="rounded bg-white px-3 py-1 text-sm"
							onclick={closeDeleteModal}>Cancel</button
						>
						<button
							type="submit"
							class="rounded bg-red-600 px-3 py-1 text-sm text-white"
							disabled={!deletePassword}>Confirm Delete</button
						>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

<style>
	@media print {
		@page {
			size: landscape;
			margin: 1cm;
			-webkit-print-color-adjust: exact !important; /* Chrome, Safari 6 – 15.3, Edge */
			color-adjust: exact !important; /* Firefox 48 – 96 */
			print-color-adjust: exact !important;
		}
	}

	/* Add these styles for better table appearance */
	table {
		border-collapse: separate;
		border-spacing: 0;
	}

	th {
		position: sticky;
		top: 0;
		z-index: 10;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
	}
</style>
