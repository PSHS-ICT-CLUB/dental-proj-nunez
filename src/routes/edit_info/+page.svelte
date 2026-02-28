<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

	let doctors = data.doctors;
	let clinics = data.clinics;

	let doctorsWithClinic = $derived(
		doctors.map((doctor) => ({
			id: doctor.value,
			name: doctor.label,
			clinicId: doctor.clinicId,
			clinicName: doctor.clinicName || 'Unknown Clinic'
		}))
	);

	// Update case types state
	let caseTypes = $state(
		data.caseTypes.map((ct) => ({
			caseTypeId: ct.caseTypeId,
			caseTypeName: ct.caseTypeName,
			numberOfCases: ct.numberOfCases
		}))
	);

	let newDoctorName = $state('');
	let newClinicId: number | null = $state(null);
	let newClinicSearch = $state('');
	let filteredClinics: typeof clinics = $state([]);
	let isClinicInputFocused = $state(false);
	let isNewClinic = $state(false);

	let success = form?.success ?? false;
	let message = form?.message ?? '';

	let newCaseType = $state('');
	// Add these new state variables
	let newField = $state('');
	let selectedCaseType = $state(null);
	let showFieldInput = $state(false);

	$effect(() => {
		if (isClinicInputFocused && !newClinicSearch) {
			filteredClinics = clinics;
		} else if (newClinicSearch) {
			filteredClinics = clinics.filter((clinic) =>
				clinic.label.toLowerCase().includes(newClinicSearch.toLowerCase())
			);
		} else {
			filteredClinics = [];
		}
	});

	function handleAddDoctor() {
		if (newDoctorName && (newClinicId || (isNewClinic && newClinicSearch))) {
			console.log(
				'Adding doctor:',
				newDoctorName,
				'to clinic ID:',
				newClinicId,
				'new clinic:',
				newClinicSearch
			);
			// Form submission will handle the actual add logic
		} else {
			alert('Please enter a doctor name and select or enter a clinic.');
		}
	}

	function selectClinic(clinic: (typeof clinics)[0]) {
		newClinicId = clinic.clinicId;
		newClinicSearch = clinic.label;
		filteredClinics = [];
		isClinicInputFocused = false;
		isNewClinic = false;
	}

	function handleClinicInputFocus() {
		isClinicInputFocused = true;
		isNewClinic = false; // Reset new clinic flag when focus
	}

	function handleClinicInputBlur() {
		setTimeout(() => {
			isClinicInputFocused = false;
			// If the input has text but no clinic is selected, assume it's a new clinic
			if (newClinicSearch && !newClinicId) {
				isNewClinic = true;
			} else if (!newClinicSearch) {
				isNewClinic = false;
			}
		}, 100);
	}

	function handleNewClinicInput() {
		newClinicId = null; // Clear selected clinic if user types
		isNewClinic = true;
	}

	function toggleFieldInput(caseType: (typeof caseTypes)[0]) {
		selectedCaseType = selectedCaseType?.caseTypeId === caseType.caseTypeId ? null : caseType;
		showFieldInput = selectedCaseType !== null;
		newField = '';
	}

	// Update delete doctor handler to use doctorId instead of clinicId
	function handleDeleteDoctor(doctorId: string) {
		return {
			action: '?/deleteDoctor',
			data: {
				doctor_id: doctorId
			}
		};
	}
</script>

<div>
	<div class="flex flex-col items-center justify-center overflow-x-auto">
		{#if success && message}
			<div class="mb-4 rounded-md bg-green-100 p-4">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg
							class="h-5 w-5 text-green-400"
							viewBox="0 0 20 20"
							fill="currentColor"
							aria-hidden="true"
						>
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 00-1.414-1.414z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<div class="ml-3">
						<p class="text-sm font-medium text-green-800">{message}</p>
					</div>
				</div>
			</div>
		{:else if form?.error}
			<div class="mb-4 rounded-md bg-red-100 p-4">
				<div class="flex">
					<div class="flex-shrink-0">
						<svg
							class="h-5 w-5 text-red-400"
							viewBox="0 0 20 20"
							fill="currentColor"
							aria-hidden="true"
						>
							<path
								fill-rule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586l-1.293-1.293z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<div class="ml-3">
						<h3 class="text-sm font-medium text-red-800">There was an error:</h3>
						<div class="mt-2 text-sm text-red-700">
							<p>{form.error}</p>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<h2 class="mt-10 text-xl font-semibold text-gray-900">Doctors</h2>
		<table class="mt-4 w-lg divide-y divide-gray-200 rounded-md shadow-md">
			<thead class="bg-gray-50">
				<tr>
					<th
						scope="col"
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Doctor Name
					</th>
					<th
						scope="col"
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Clinic
					</th>
					<th scope="col" class="relative px-6 py-3">
						<span class="sr-only">Delete</span>
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white">
				{#each doctorsWithClinic as doctor}
					<tr>
						<td class="px-6 py-2 text-sm font-medium whitespace-nowrap text-gray-900">
							{doctor.name}
						</td>
						<td class="px-6 py-2 text-sm whitespace-nowrap text-gray-500">{doctor.clinicName}</td>
						<td class="px-6 py-2 text-right text-sm font-medium whitespace-nowrap">
							<form action="?/deleteDoctor" method="post">
								<input type="hidden" name="doctor_id" value={doctor.id} />
								<button
									type="submit"
									class="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
								>
									Delete Doctor
								</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<h2 class="mt-10 text-xl font-semibold text-gray-900">Clinics</h2>
		<table class="mt-4 w-lg divide-y divide-gray-200 rounded-md shadow-md">
			<thead class="bg-gray-50">
				<tr>
					<th
						scope="col"
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Clinic Name
					</th>
					<th scope="col" class="relative px-6 py-3">
						<span class="sr-only">Delete</span>
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white">
				{#each clinics as clinic}
					<tr>
						<td class="px-6 py-2 text-sm font-medium whitespace-nowrap text-gray-900">
							{clinic.label}
						</td>
						<td class="px-6 py-2 text-right text-sm font-medium whitespace-nowrap">
							<form action="?/deleteClinic" method="post">
								<input type="hidden" name="clinic_id" value={clinic.clinicId} />
								<button
									type="submit"
									class="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
								>
									Delete Clinic
								</button>
							</form>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<!-- New section for adding only a clinic -->
		<form method="POST" action="?/addClinic" class="mt-8 w-lg space-y-4">
			<div>
				<h3 class="text-lg font-medium text-gray-900">Add New Clinic</h3>
				<div class="mt-4">
					<label for="clinic_name_only" class="block text-sm font-medium text-gray-700"
						>Clinic Name</label
					>
					<div class="mt-1">
						<input
							type="text"
							name="clinic_name"
							id="clinic_name_only"
							class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							placeholder="Enter clinic name"
							required
						/>
					</div>
				</div>
				<div class="mt-4">
					<button
						type="submit"
						class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
					>
						Add Clinic Only
					</button>
				</div>
			</div>
		</form>

		<!-- Update the existing combined form title -->
		<form
			method="POST"
			action="?/{isNewClinic ? 'addClinicAndDoctor' : 'addDoctor'}"
			class="mt-8 w-lg space-y-4"
		>
			<h3 class="text-lg font-medium text-gray-900">
				{isNewClinic ? 'Add New Clinic with Doctor' : 'Add Doctor to Existing Clinic'}
			</h3>
			<div>
				<label for="clinic_name" class="block text-sm font-medium text-gray-700"> Clinic </label>
				<div class="relative mt-1">
					<input
						type="text"
						name="clinic_name"
						bind:value={newClinicSearch}
						class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
						placeholder="Search for a clinic or enter a new one"
						onfocus={handleClinicInputFocus}
						onblur={handleClinicInputBlur}
						oninput={handleNewClinicInput}
						autocomplete="off"
						required
					/>
					{#if (isClinicInputFocused || newClinicSearch) && filteredClinics.length > 0}
						<ul
							class="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md bg-white shadow-lg"
						>
							{#each filteredClinics as clinic}
								<li>
									<button
										type="button"
										class="w-full cursor-pointer appearance-none px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100"
										onclick={() => selectClinic(clinic)}
									>
										{clinic.label}
									</button>
								</li>
							{/each}
						</ul>
					{/if}
				</div>
				{#if newClinicId}
					<p class="mt-1 text-sm text-gray-500">
						Selected Clinic: {clinics.find((c) => c.clinicId === newClinicId)?.label}
					</p>
					<input type="hidden" name="clinic_id" value={newClinicId} />
				{/if}
			</div>
			<div>
				<label for="doctor_name" class="block text-sm font-medium text-gray-700">
					Doctor Name
				</label>
				<div class="mt-1">
					<input
						type="text"
						name="doctor_name"
						bind:value={newDoctorName}
						class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
						placeholder="Enter doctor's name"
					/>
				</div>
			</div>
			<div>
				<button
					type="submit"
					class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
				>
					Add
				</button>
			</div>
		</form>

		<h2 class="mt-10 text-xl font-semibold text-gray-900">Case Types</h2>
		<div class="mt-4 flex flex-col gap-4">
			<!-- Add Case Type Form -->
			<form
				method="POST"
				action="?/addCaseType"
				class="flex items-end gap-4 rounded-md bg-gray-50 p-4 shadow-sm"
			>
				<div class="flex-1">
					<label for="case_type" class="block text-sm font-medium text-gray-700">
						New Case Type
					</label>
					<div class="mt-1">
						<input
							type="text"
							name="case_type"
							id="case_type"
							bind:value={newCaseType}
							class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							placeholder="Enter case type"
							required
						/>
					</div>
				</div>
				<button
					type="submit"
					class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
				>
					Add Case Type
				</button>
			</form>

			<!-- Case Types Table -->
			<table class="w-lg divide-y divide-gray-200 rounded-md shadow-md">
				<thead class="bg-gray-50">
					<tr>
						<th
							scope="col"
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Case Type
						</th>
						<th
							scope="col"
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Number of Cases
						</th>
						<th scope="col" class="relative px-6 py-3">
							<span class="sr-only">Actions</span>
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#each caseTypes as caseType}
						<tr>
							<td class="px-6 py-2 text-sm font-medium whitespace-nowrap text-gray-900">
								{caseType.caseTypeName}
							</td>
							<td class="px-6 py-2 text-sm whitespace-nowrap">
								<form action="?/updateCaseTypeCount" method="post" class="flex items-center gap-2">
									<input type="hidden" name="case_type_id" value={caseType.caseTypeId} />
									<input
										type="number"
										name="number_of_cases"
										value={caseType.numberOfCases}
										min="0"
										class="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
									/>
									<button
										type="submit"
										class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-2 py-1 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
									>
										Update
									</button>
								</form>
							</td>
							<td class="px-6 py-2 text-right text-sm font-medium whitespace-nowrap">
								<form action="?/deleteCaseType" method="post" class="inline">
									<input type="hidden" name="case_type_id" value={caseType.caseTypeId} />
									<button
										type="submit"
										class="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
									>
										Delete Case Type
									</button>
								</form>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>

			<!-- Conditionally render the new field input -->
			{#if showFieldInput}
				<form
					method="POST"
					action="?/addField"
					class="mt-4 flex items-center gap-4 rounded-md bg-gray-50 p-4 shadow-sm"
				>
					<div class="flex-1">
						<label for="new_field" class="block text-sm font-medium text-gray-700">
							New Field for {selectedCaseType?.caseType}
						</label>
						<div class="mt-1">
							<input
								type="text"
								name="new_field"
								id="new_field"
								bind:value={newField}
								class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
								placeholder="Enter new field value"
								required
							/>
						</div>
					</div>
					<button
						type="submit"
						class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
					>
						Add Field
					</button>
				</form>
			{/if}
		</div>
	</div>
</div>
