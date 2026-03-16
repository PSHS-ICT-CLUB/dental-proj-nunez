const fs = require('fs');
const filepath = 'c:/Users/Adrian/projects/dental-proj-nunez/src/routes/+page.svelte';
let content = fs.readFileSync(filepath, 'utf8');

const regexScript =
	/\/\/ Filter states[\s\S]*?function handleClinicSelect\(clinic: \{ clinicId: number; clinicName: string \}\) \{[\s\S]*?selectedClinicId = clinic\.clinicId;\s*\}/;

const newScript = `// Search states
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
	}`;

const regexForm = /<!-- Filter Form -->[\s\S]*?<!-- Records Section -->/;

const newForm = `<!-- Filter Form -->
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
                <div class="relative" bind:this={clinicContainer}>
					<label class="block text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-1">Clinic</label>
                    <input
                        type="text"
                        bind:value={clinicSearch}
                        placeholder="Search clinic..."
                        autocomplete="off"
                        class="w-full rounded border border-gray-200 p-1.5 text-xs shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        onfocus={() => { showAllClinics = true; }}
                        onblur={(e) => {
                            const relatedTarget = e.relatedTarget as Node;
                            if (!relatedTarget || !clinicContainer.contains(relatedTarget)) {
                                showAllClinics = false;
                            }
                        }}
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

<!-- Records Section -->`;

content = content.replace(regexScript, newScript);
content = content.replace(regexForm, newForm);

fs.writeFileSync(filepath, content, 'utf8');
console.log('File updated successfully.');
