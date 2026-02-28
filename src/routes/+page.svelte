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

	// Filter input values
	let caseTypeId = $state('');
	let caseNo = $state('');
	let patientName = $state('');
	let paymentStatus = $state('');
	let remarks = $state('');
	let recordId = $state('');

	// Restore filter states from URL parameters
	let isRestoring = $state(false);
	let lastRestoredFiltersKey = $state<string>('');

	async function restoreFiltersFromData() {
		const filtersData = data.filters;
		if (!filtersData || typeof filtersData !== 'object') {
			return;
		}

		const hasFilters = Object.keys(filtersData).length > 0;
		if (!hasFilters || isRestoring) {
			return;
		}

		const currentFiltersKey = JSON.stringify(filtersData);
		if (currentFiltersKey === lastRestoredFiltersKey) {
			return; // Filters haven't changed, don't restore
		}

		isRestoring = true;

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

		caseTypeId = filtersData.case_type_id ? String(filtersData.case_type_id) : '';
		caseNo = filtersData.case_no ? String(filtersData.case_no) : '';
		patientName = filtersData.patient_name || '';
		remarks = filtersData.remarks || '';
		paymentStatus = filtersData.payment_status || '';
		recordId = filtersData.record_id ? String(filtersData.record_id) : '';

		if (filtersData.start_date && filtersData.end_date) {
			startDate = filtersData.start_date;
			endDate = filtersData.end_date;
			
			const start = new Date(filtersData.start_date);
			const end = new Date(filtersData.end_date);
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

		lastRestoredFiltersKey = currentFiltersKey;

		setTimeout(() => {
			isRestoring = false;
		}, 0);
	}

	afterNavigate(() => {
		isRestoring = false;
		lastRestoredFiltersKey = '';
		restoreFiltersFromData();
	});

	$effect(() => {
		const filtersData = data.filters;
		if (!filtersData) return;

		const currentKey = JSON.stringify(filtersData);
		if (currentKey !== lastRestoredFiltersKey) {
			restoreFiltersFromData();
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
	let recordsPerPage = $state(10);

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
</script>

<!-- Filter Form -->
<div class="w-full bg-gray-50 p-2 print:hidden pb-1 border-b border-gray-200">
	<form method="GET" class="mx-auto max-w-7xl">
		<div class="rounded-lg bg-white p-3 shadow-sm border border-gray-100">
            <div class="flex items-center justify-between mb-2">
                <h3 class="text-sm font-semibold text-gray-700">Quick Filters</h3>
                <div class="flex gap-2">
					<button
						type="reset"
						class="rounded bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm ring-1 ring-gray-300 hover:bg-gray-50 transition"
						onclick={() => window.location.href = '/'}
					>
						Clear
					</button>
					<button
						type="submit"
						class="rounded bg-indigo-600 px-3 py-1 text-xs font-medium text-white shadow-sm hover:bg-indigo-500 transition"
					>
						Apply Filters
					</button>
                </div>
            </div>

			<div class="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6 items-end">
                <div class="relative">
					<label class="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Clinic</label>
                    <input
                        type="text"
                        bind:value={clinicSearch}
                        placeholder="Search clinic..."
                        autocomplete="off"
                        class="w-full rounded border border-gray-200 p-1.5 text-xs shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        onfocus={() => { showAllClinics = true; }}
                        onblur={() => { setTimeout(() => showAllClinics = false, 200); }}
                        oninput={() => { selectedClinicId = null; }}
                    />
                    <input type="hidden" name="clinic_id" value={selectedClinicId || ''} />
                    {#if showAllClinics && filteredClinics && filteredClinics.length > 0}
                        <div class="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md border bg-white shadow-lg">
                            {#each filteredClinics as clinic}
                                <button
                                    type="button"
                                    class="w-full p-2 text-left text-xs hover:bg-gray-50"
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
                    <label class="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Case Type</label>
                    <select name="case_type_id" bind:value={caseTypeId} class="w-full rounded border border-gray-200 p-1.5 text-xs shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                        <option value="">All Types</option>
                        {#each data.caseTypes as type}
                            <option value={String(type.caseTypeId)}>{type.caseTypeName}</option>
                        {/each}
                    </select>
                </div>

                <div>
                    <label class="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Case No</label>
                    <input type="text" name="case_no" bind:value={caseNo} placeholder="Case #" class="w-full rounded border border-gray-200 p-1.5 text-xs shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                </div>

                <div>
                    <label class="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Patient</label>
                    <input type="text" name="patient_name" bind:value={patientName} placeholder="Patient Name" class="w-full rounded border border-gray-200 p-1.5 text-xs shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                </div>

                <div>
                    <label class="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Payment</label>
                    <select name="payment_status" bind:value={paymentStatus} class="w-full rounded border border-gray-200 p-1.5 text-xs shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                        <option value="">All Status</option>
                        <option value="paid">Paid</option>
                        <option value="unpaid">Unpaid</option>
                    </select>
                </div>

                <div>
                    <label class="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Status</label>
                    <select name="remarks" bind:value={remarks} class="w-full rounded border border-gray-200 p-1.5 text-xs shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                        <option value="">All Remarks</option>
                        <option value="pending">Pending</option>
                        <option value="finished">Finished</option>
                    </select>
                </div>
            </div>

			<div class="grid grid-cols-1 gap-3 md:grid-cols-3 mt-3 pt-3 border-t border-gray-100 items-end">
                <div class="flex items-center gap-2">
                    <div class="flex-1">
                        <label class="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Start Date</label>
                        <input type="date" name="start_date" bind:value={startDate} class="w-full rounded border border-gray-200 p-1.5 text-xs shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div class="flex-1">
                        <label class="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">End Date</label>
                        <input type="date" name="end_date" bind:value={endDate} class="w-full rounded border border-gray-200 p-1.5 text-xs shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <div class="flex-1">
                        <label class="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Filter by Month</label>
                        <select bind:value={selectedMonth} onchange={handleMonthFilter} class="w-full rounded border border-gray-200 p-1.5 text-xs shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                            <option value="">Select Month</option>
                            {#each Array.from({ length: 12 }, (_, i) => i + 1) as month}
                                <option value={month}>
                                    {new Date(2000, month - 1).toLocaleString('default', { month: 'short' })}
                                </option>
                            {/each}
                        </select>
                    </div>
                    <div class="w-24">
                        <label class="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Year</label>
                        <select bind:value={selectedYear} onchange={handleMonthFilter} class="w-full rounded border border-gray-200 p-1.5 text-xs shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                            {#each Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i) as year}
                                <option value={year}>{year}</option>
                            {/each}
                        </select>
                    </div>
                </div>

                <div class="flex items-center justify-between gap-3">
                    <div class="flex-1">
                        <label class="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Record ID</label>
                        <input type="number" name="record_id" bind:value={recordId} placeholder="Record #" class="w-full rounded border border-gray-200 p-1.5 text-xs shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500" />
                    </div>
                    <div class="flex items-center pt-[18px]">
                        <label class="inline-flex items-center gap-2 cursor-pointer bg-red-50/50 hover:bg-red-50 px-2.5 py-1.5 rounded border border-red-100 transition-colors">
                            <input type="checkbox" bind:checked={showDelete} class="h-3.5 w-3.5 rounded text-red-600 focus:ring-red-500 border-gray-300" />
                            <span class="text-[10px] font-bold text-red-600 uppercase tracking-wider">Show Delete</span>
                        </label>
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
			<div class="border-b border-gray-200 bg-white p-8">
				<div class="flex flex-row items-start justify-between space-x-12">
					<div class="flex flex-col">
						<h1 class="text-2xl font-bold text-gray-900">NUNEZ DENTAL LABORATORY</h1>
						<h2 class="mt-1 text-xl font-semibold text-gray-700">STATEMENT OF ACCOUNT</h2>
					</div>

					<div class="flex flex-col items-start space-y-1.5 pt-1 text-sm text-gray-800">
						<div class="flex items-baseline">
							<span class="w-32 pr-2 text-right font-medium text-gray-600">PRINT DATE:</span>
							<span class="inline-block w-40 border-b border-gray-500">
								{getCurrentDateTime().fullDateTime}
							</span>
						</div>
						{#if customerNames.length == 1}
							<div class="flex items-baseline">
								<span class="w-fit pr-2 text-right font-medium text-gray-600">CUSTOMER NAME:</span>
								<span class="inline-block w-40 border-b border-gray-500">
									{customerNames.join(', ')}
								</span>
							</div>
						{/if}
						<div class="flex items-baseline">
							<span class="w-32 pr-2 text-right font-medium text-gray-600">START DATE:</span>
							<span class="inline-block w-40 border-b border-gray-500">
								{formatDate(getRecordDateRange(data.records).startingDate)}
							</span>
						</div>
						<div class="flex items-baseline">
							<span class="w-32 pr-2 text-right font-medium text-gray-600">END DATE:</span>
							<span class="inline-block w-40 border-b border-gray-500">
								{formatDate(getRecordDateRange(data.records).recentDate)}
							</span>
						</div>
						<div class="flex items-baseline">
							<span class="w-32 pr-2 text-right font-medium text-gray-600">STATUS:</span>
							<span class="inline-block w-40 font-semibold text-gray-900">
								{generateRecordsSummary(data.records).processStatus} -
								{generateRecordsSummary(data.records).financialStatus}
							</span>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Color Legend -->
		<div class="mb-3 flex flex-wrap items-center gap-4 px-1 text-[10px] font-medium text-gray-500 uppercase tracking-wider print:hidden">
			<div class="flex items-center gap-1.5">
				<div class="h-3 w-3 inline-block rounded-full bg-green-200 border border-green-300"></div>
				<span>Paid & Finished</span>
			</div>
			<div class="flex items-center gap-1.5">
				<div class="h-3 w-3 inline-block rounded-full bg-red-300 border border-red-400"></div>
				<span>Unpaid & Finished</span>
			</div>
			<div class="flex items-center gap-1.5">
				<div class="h-3 w-3 inline-block rounded-full bg-violet-300 border border-violet-400"></div>
				<span>Other / Partial</span>
			</div>
			<div class="flex items-center gap-1.5">
				<div class="h-3 w-3 inline-block rounded-full bg-white border border-gray-300"></div>
				<span>Pending / Normal</span>
			</div>
		</div>

		<!-- Table -->
		<div class="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm pt-1">
			<table class="min-w-full table-fixed divide-y divide-gray-200">
				<thead class="bg-gray-50/50">
					<tr>
						<th scope="col" class="sticky top-0 bg-gray-50/50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
							Date Pickup
						</th>
						<th scope="col" class="bg-gray-50/50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
							Date Dropoff
						</th>
						{#if Object.keys(data.filters).length === 0 || customerNames.length > 1}
							<th scope="col" class="bg-gray-50/50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
								Clinic
							</th>
						{/if}
						<th scope="col" class="bg-gray-50/50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
							Patient Name
						</th>
						<th scope="col" class="bg-gray-50/50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
							Case Info
						</th>
						<th scope="col" class="bg-gray-50/50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
							Description
						</th>
						<th scope="col" class="bg-gray-50/50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
							Total Amount
						</th>
						<th scope="col" class="bg-gray-50/50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
							Paid Amount
						</th>
						<th scope="col" class="bg-gray-50/50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
							Balance
						</th>
						<th scope="col" class="bg-gray-50/50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
							Status
						</th>
						<th scope="col" class="bg-gray-50/50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider print:hidden">
							Actions
						</th>
						<th scope="col" class="bg-gray-50/50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider print:hidden">
							History
						</th>
						{#if showDelete}
							<th scope="col" class="bg-gray-50/50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider print:hidden">
								Delete
							</th>
						{/if}
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100 bg-white">
					{#each paginatedRecords as record}
						<tr
							class={`
							border-b border-gray-100 transition-colors hover:bg-black/5
							${
								record.paymentStatus === 'paid' && record.remarks === 'finished'
									? 'bg-green-200'
									: record.paymentStatus === 'unpaid' && record.remarks === 'finished'
										? 'bg-red-300'
										: record.paymentStatus === 'unpaid' && record.remarks === 'pending'
											? 'bg-white'
											: 'bg-violet-300'
							}
						`}
						>
							<td class="px-3 py-2 text-xs whitespace-nowrap text-black">
								{record.datePickup}
							</td>
							<td class="px-3 py-2 text-xs whitespace-nowrap text-black">
								{record.dateDropoff ? record.dateDropoff : '-'}
							</td>
							{#if Object.keys(data.filters).length === 0 || customerNames.length > 1}
								<td class="px-3 py-2 text-xs whitespace-nowrap text-black">
									{record.clinicName}
								</td>
							{/if}
							<td class="px-3 py-2 text-xs whitespace-nowrap text-black">
								{record.patientName}
							</td>
							<td class="px-3 py-2 text-xs whitespace-nowrap text-black">
								<div class="flex flex-col gap-1">
									{#each record.orderItems as item}
										<span>{item.caseTypeName} - {item.caseNo}</span>
									{/each}
								</div>
							</td>
							<td class="px-3 py-2 text-xs whitespace-nowrap text-black">
								<div class="flex flex-col gap-1">
									{#each record.orderItems as item}
										<span>{item.orderDescription || '-'}</span>
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
									<span class="font-medium">{record.remarks || 'No remarks'}</span>
									<span
										class={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium 
										${record.paymentStatus === 'paid' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
									>
										{record.paymentStatus}
									</span>
								</span>
							</td>
							<td class="px-3 py-2 text-xs whitespace-nowrap print:hidden">
								<div class="flex gap-1.5">
									<a
										href={`/details/${record.recordId}`}
										class="inline-flex items-center rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10 hover:bg-blue-100"
									>
										View
									</a>
									<a
										href={`/invoice/${record.recordId}`}
										class="inline-flex items-center rounded bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10 hover:bg-blue-100"
									>
										Invoice
									</a>
									<a
										href={`/IN/${record.recordId}`}
										class="inline-flex items-center rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-green-700/10 hover:bg-green-100"
									>
										In
									</a>
									<a
										href={`/OUT/${record.recordId}`}
										class="inline-flex items-center rounded bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-yellow-700/10 hover:bg-yellow-100"
									>
										Out
									</a>
									<a
										href={`/EDIT/${record.recordId}`}
										class="inline-flex items-center rounded bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-purple-700/10 hover:bg-purple-100"
									>
										Edit
									</a>
									<a
										href={`/AMOUNT/${record.recordId}`}
										class="inline-flex items-center rounded bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-indigo-700/10 hover:bg-indigo-100"
									>
										Amount
									</a>
								</div>
							</td>
							<td class="px-3 py-2 text-xs whitespace-nowrap print:hidden">
								<a
									href={`/history/${record.recordId}`}
									class="inline-flex items-center rounded bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700 ring-1 ring-gray-700/10 hover:bg-gray-100"
								>
									History
								</a>
							</td>
							{#if showDelete}
								<td class="px-3 py-2 text-sm font-medium whitespace-nowrap print:hidden">
									<button
										type="button"
										onclick={() => openDeleteModal(record.recordId)}
										class="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-red-700/10 hover:bg-red-100"
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
						<tr class="border-t-2 border-gray-300 bg-gray-50 font-medium">
							<td colspan={showDelete ? 6 : 5} class="px-3 py-2 text-right text-xs"> Total: </td>
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
				class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 print:hidden"
			>
				<div class="flex flex-1 justify-between sm:hidden">
					<button
						onclick={goToFirstPage}
						class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
						disabled={currentPage === 1}
					>
						First
					</button>
					<button
						onclick={prevPage}
						class="relative ml-2 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
						disabled={currentPage === 1}
					>
						Prev
					</button>
					<button
						onclick={nextPage}
						class="relative ml-2 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
						disabled={currentPage === totalPages}
					>
						Next
					</button>
					<button
						onclick={goToLastPage}
						class="relative ml-2 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
						disabled={currentPage === totalPages}
					>
						Last
					</button>
				</div>
				<div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
					<div class="flex items-center gap-6">
						<p class="text-sm text-gray-700">
							Showing <span class="font-medium">{totalOrderAmount() === '0.00' ? 0 : (currentPage - 1) * recordsPerPage + 1}</span> to
							<span class="font-medium"
								>{Math.min(currentPage * recordsPerPage, data.records?.length || 0)}</span
							>
							of <span class="font-medium">{data.records?.length || 0}</span> results
						</p>
						<div class="flex items-center gap-2">
							<label for="rows-per-page" class="text-sm font-medium text-gray-700">Rows per page:</label>
							<select
								id="rows-per-page"
								bind:value={recordsPerPage}
								class="rounded-md border border-gray-300 py-1 pl-2 pr-6 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
								class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
								disabled={currentPage === 1}
								title="First Page"
							>
								<span class="sr-only">First</span>
								<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
									<path fill-rule="evenodd" d="M15.79 14.77a.75.75 0 01-1.06.02l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 111.04 1.08L11.832 10l3.938 3.71a.75.75 0 01.02 1.06zm-6 0a.75.75 0 01-1.06.02l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 111.04 1.08L5.832 10l3.938 3.71a.75.75 0 01.02 1.06z" clip-rule="evenodd" />
								</svg>
							</button>
							<button
								onclick={prevPage}
								class="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
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
									<span class="relative inline-flex items-center px-4 py-2 text-sm text-gray-500 ring-1 ring-inset ring-gray-300"
										>{pageItem}</span
									>
								{:else}
									<button
										onclick={() => goToPage(Number(pageItem))}
										class={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
											pageItem === currentPage
												? 'z-10 bg-indigo-600 text-white'
												: 'text-gray-900 ring-1 ring-gray-300 ring-inset hover:bg-gray-50'
										}`}
									>
										{pageItem}
									</button>
								{/if}
							{/each}
							<button
								onclick={nextPage}
								class="relative inline-flex items-center px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
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
								class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-gray-300 ring-inset hover:bg-gray-50"
								disabled={currentPage === totalPages}
								title="Last Page"
							>
								<span class="sr-only">Last</span>
								<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
									<path fill-rule="evenodd" d="M4.21 5.23a.75.75 0 011.06-.02l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.04-1.08L8.168 10 4.23 6.29a.75.75 0 01-.02-1.06zm6 0a.75.75 0 011.06-.02l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.04-1.08L14.168 10 10.23 6.29a.75.75 0 01-.02-1.06z" clip-rule="evenodd" />
								</svg>
							</button>
						</nav>
					</div>
				</div>
			</div>
		{/if}
	{:else}
		<div class="flex h-96 items-center justify-center">
			<p class="text-center text-gray-500">
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
				<h3 class="text-lg font-medium text-gray-900">Confirm delete</h3>
				<div class="mt-3 rounded-md bg-gray-50 p-3 text-sm">
					<p class="mb-2 font-semibold text-gray-900">Record Information:</p>
					<div class="space-y-1.5 text-gray-700">
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
											? 'bg-green-100 text-green-800'
											: 'bg-red-100 text-red-800'
									}`}
								>
									{modalDeleteRecord.paymentStatus}
								</span>
								<span class="text-xs text-gray-600"
									>({modalDeleteRecord.remarks || 'No remarks'})</span
								>
							</span>
						</div>
					</div>
				</div>
				<p class="mt-3 text-sm text-gray-600">
					Enter your password to confirm deletion of this record.
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
								alert('Wrong password');
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
					<label for="confirm_password" class="block text-sm font-medium text-gray-700"
						>Password</label
					>
					<input
						id="confirm_password"
						name="confirm_password"
						type="password"
						bind:value={deletePassword}
						class="mt-1 w-full rounded-md border border-gray-200 p-2 text-sm shadow-sm"
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
