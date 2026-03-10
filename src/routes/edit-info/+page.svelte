<script lang="ts">
	import type { PageProps } from './$types';

	let { data, form }: PageProps = $props();

let doctors = data.doctors;
let clinics = data.clinics;
let technicians = data.technicians;

let doctorsWithClinic = $derived(
	doctors.map((doctor) => ({
		id: doctor.value,
		name: doctor.label,
		clinicId: doctor.clinicId,
		clinicName: doctor.clinicName || 'Unknown Clinic',
		doctorPhone: doctor.doctorPhone,
		doctorEmail: doctor.doctorEmail
	}))
);

	let caseTypes = $state(
		data.caseTypes.map((ct) => ({
			caseTypeId: ct.caseTypeId,
			caseTypeName: ct.caseTypeName,
			caseTypeAbbrv: ct.caseTypeAbbrv,
			numberOfCases: ct.numberOfCases
		}))
	);

let newDoctorName = $state('');
let newDoctorPhone = $state('');
let newDoctorEmail = $state('');

let newTechnicianName = $state('');
let newTechnicianRole = $state('');
let newTechnicianPhone = $state('');
let newTechnicianEmail = $state('');
let newTechnicianNotes = $state('');
	let newClinicId: number | null = $state(null);
	let newClinicSearch = $state('');
	let filteredClinics: typeof clinics = $state([]);
	let isClinicInputFocused = $state(false);
	let isNewClinic = $state(false);

	let success = form?.success ?? false;
	let message = form?.message ?? '';

	let newCaseType = $state('');
	let newCaseTypeAbbrv = $state('');
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

	function handleDeleteTechnician(id: number) {
		return {
			action: '?/deleteTechnician',
			data: {
				technician_id: id.toString()
			}
		};
	}
</script>\n\n
<div class="mx-auto max-w-7xl px-4 py-8">
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

	<div class="mt-6 flex flex-col xl:flex-row gap-12 items-start justify-center">
		<!-- LEFT COLUMN: Tables -->
		<div class="w-full xl:w-[60%] space-y-12">
			
			<section>
				<h2 class="text-xl font-semibold text-gray-900 border-b pb-2 mb-4">Doctors</h2>
				<div class="overflow-x-auto pb-4">
					<table class="w-full min-w-[600px] divide-y divide-gray-200 rounded-md shadow-md">
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
					<th
						scope="col"
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Doctor Contact
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
						<td class="px-6 py-2 text-sm whitespace-nowrap text-gray-500">
							<div class="flex flex-col text-xs">
								{#if doctor.doctorPhone}
									<span class="text-gray-700">📞 {doctor.doctorPhone}</span>
								{/if}
								{#if doctor.doctorEmail}
									<span class="text-gray-700">✉ {doctor.doctorEmail}</span>
								{/if}
								{#if !doctor.doctorPhone && !doctor.doctorEmail}
									<span class="text-gray-400 italic">No contact details</span>
								{/if}
							</div>
						</td>
						<td class="px-6 py-2 text-right text-sm font-medium whitespace-nowrap">
							{#if data.user && (data.user.role === 'admin' || data.user.role === 'dentist')}
							<form action="?/deleteDoctor" method="post">
								<input type="hidden" name="doctor_id" value={doctor.id} />
								<button
									type="submit"
									class="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
								>
									Delete Doctor
								</button>
							</form>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
				</div>
			</section>

			<section>
				<h2 class="text-xl font-semibold text-gray-900 border-b pb-2 mb-4">Clinics</h2>
				<div class="overflow-x-auto pb-4">
					<table class="w-full min-w-[600px] divide-y divide-gray-200 rounded-md shadow-md">
			<thead class="bg-gray-50">
				<tr>
					<th
						scope="col"
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Clinic Name
					</th>
					<th
						scope="col"
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Clinic Contact
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
						<td class="px-6 py-2 text-sm whitespace-nowrap text-gray-500">
							<div class="flex flex-col text-xs">
								{#if clinic.clinicPhone}
									<span class="text-gray-700">📞 {clinic.clinicPhone}</span>
								{/if}
								{#if clinic.clinicEmail}
									<span class="text-gray-700">✉ {clinic.clinicEmail}</span>
								{/if}
								{#if !clinic.clinicPhone && !clinic.clinicEmail}
									<span class="text-gray-400 italic">No contact details</span>
								{/if}
							</div>
						</td>
						<td class="px-6 py-2 text-right text-sm font-medium whitespace-nowrap">
							{#if data.user && (data.user.role === 'admin' || data.user.role === 'dentist')}
							<form action="?/deleteClinic" method="post">
								<input type="hidden" name="clinic_id" value={clinic.clinicId} />
								<button
									type="submit"
									class="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
								>
									Delete Clinic
								</button>
							</form>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
				</div>
			</section>

			<section>
				<h2 class="text-xl font-semibold text-gray-900 border-b pb-2 mb-4">Technicians</h2>
				<div class="overflow-x-auto pb-4">
					<table class="w-full min-w-[600px] divide-y divide-gray-200 rounded-md shadow-md">
			<thead class="bg-gray-50">
				<tr>
					<th
						scope="col"
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Name
					</th>
					<th
						scope="col"
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Role
					</th>
					<th
						scope="col"
						class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
					>
						Contact
					</th>
					<th scope="col" class="relative px-6 py-3">
						<span class="sr-only">Delete</span>
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white">
				{#each technicians as tech}
					<tr>
						<td class="px-6 py-2 text-sm font-medium whitespace-nowrap text-gray-900">
							{tech.name}
						</td>
						<td class="px-6 py-2 text-sm whitespace-nowrap text-gray-500">
							{tech.role || '-'}
						</td>
						<td class="px-6 py-2 text-sm whitespace-nowrap text-gray-500">
							<div class="flex flex-col text-xs">
								{#if tech.phone}
									<span class="text-gray-700">📞 {tech.phone}</span>
								{/if}
								{#if tech.email}
									<span class="text-gray-700">✉ {tech.email}</span>
								{/if}
								{#if tech.notes}
									<span class="text-gray-500">{tech.notes}</span>
								{/if}
								{#if !tech.phone && !tech.email && !tech.notes}
									<span class="text-gray-400 italic">No details</span>
								{/if}
							</div>
						</td>
						<td class="px-6 py-2 text-right text-sm font-medium whitespace-nowrap">
							{#if data.user && (data.user.role === 'admin' || data.user.role === 'dentist')}
							<form action="?/deleteTechnician" method="post">
								<input type="hidden" name="technician_id" value={tech.id} />
								<button
									type="submit"
									class="inline-flex items-center rounded-md border border-transparent bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
								>
									Delete
								</button>
							</form>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
				</div>
			</section>

			<section>
				<h2 class="text-xl font-semibold text-gray-900 border-b pb-2 mb-4">Case Types</h2>
				<div class="overflow-x-auto pb-4">
					<!-- Case Types Table -->
			<table class="w-full min-w-[600px] divide-y divide-gray-200 rounded-md shadow-md">
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
							Code
						</th>
						<th
							scope="col"
							class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
						>
							Case Number Count
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
								<form action="?/updateCaseTypeCount" method="post" id="update-form-{caseType.caseTypeId}" class="flex items-center gap-2">
									<input type="hidden" name="case_type_id" value={caseType.caseTypeId} />
									<input
										type="text"
										name="case_type_name"
										value={caseType.caseTypeName}
										class="w-full min-w-[120px] rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
									/>
								</form>
							</td>
							<td class="px-6 py-2 text-sm whitespace-nowrap">
									<input
										type="text"
										name="case_type_abbrv"
										value={caseType.caseTypeAbbrv}
										form="update-form-{caseType.caseTypeId}"
										class="w-24 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm font-mono"
									/>
							</td>
							<td class="px-6 py-2 text-sm whitespace-nowrap">
									<input
										type="number"
										name="number_of_cases"
										value={caseType.numberOfCases}
										min="0"
										form="update-form-{caseType.caseTypeId}"
										class="w-20 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
									/>
							</td>
							<td class="px-6 py-2 text-right text-sm font-medium flex items-center justify-end gap-2 whitespace-nowrap">
									<button
										type="submit"
										form="update-form-{caseType.caseTypeId}"
										class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
									>
										Save
									</button>
							{#if data.user && (data.user.role === 'admin' || data.user.role === 'dentist')}
								<form action="?/deleteCaseType" method="post" class="inline">
									<input type="hidden" name="case_type_id" value={caseType.caseTypeId} />
									<button
										type="submit"
										class="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
									>
										Delete Case Type
									</button>
								</form>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
				</div>
			</section>
		</div>

		<!-- RIGHT COLUMN: Forms -->
		<div class="w-full xl:w-[40%] space-y-12 xl:sticky xl:top-8">
			<section class="space-y-4">
			    <!-- New section for adding only a clinic -->
		<form method="POST" action="?/addClinic" class="w-full space-y-4">
			<div>
				<h3 class="text-lg font-medium text-gray-900">Add New Clinic</h3>
				<div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
					<div>
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
					<div>
						<label for="clinic_phone_only" class="block text-sm font-medium text-gray-700"
							>Clinic Phone (optional)</label
						>
						<div class="mt-1">
							<input
								type="text"
								name="clinic_phone"
								id="clinic_phone_only"
								class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
								placeholder="e.g. 0917 123 4567"
							/>
						</div>
					</div>
					<div>
						<label for="clinic_email_only" class="block text-sm font-medium text-gray-700"
							>Clinic Email (optional)</label
						>
						<div class="mt-1">
							<input
								type="email"
								name="clinic_email"
								id="clinic_email_only"
								class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
								placeholder="e.g. clinic@example.com"
							/>
						</div>
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
			</section>

			<section class="space-y-4">
			    <!-- Update the existing combined form title -->
		<form
			method="POST"
			action="?/{isNewClinic ? 'addClinicAndDoctor' : 'addDoctor'}"
			class="w-full space-y-4"
		>
			<h3 class="text-lg font-medium text-gray-900">
				{isNewClinic ? 'Add New Clinic with Doctor' : 'Add Doctor to Existing Clinic'}
			</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
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
					<label for="doctor_phone" class="block text-sm font-medium text-gray-700">
						Doctor Phone (optional)
					</label>
					<div class="mt-1">
						<input
							type="text"
							name="doctor_phone"
							id="doctor_phone"
							bind:value={newDoctorPhone}
							class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							placeholder="e.g. 0917 123 4567"
						/>
					</div>
				</div>
				<div>
					<label for="doctor_email" class="block text-sm font-medium text-gray-700">
						Doctor Email (optional)
					</label>
					<div class="mt-1">
						<input
							type="email"
							name="doctor_email"
							id="doctor_email"
							bind:value={newDoctorEmail}
							class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							placeholder="e.g. doctor@example.com"
						/>
					</div>
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
			</section>

			<section class="space-y-4">
			    <!-- Add Technician Form -->
		<form method="POST" action="?/addTechnician" class="w-full space-y-4">
			<h2 class="text-xl font-semibold text-gray-900">Add Technician</h2>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div>
					<label for="tech_name" class="block text-sm font-medium text-gray-700">
						Name
					</label>
					<div class="mt-1">
						<input
							type="text"
							id="tech_name"
							name="name"
							bind:value={newTechnicianName}
							class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							placeholder="Technician name"
							required
						/>
					</div>
				</div>
				<div>
					<label for="tech_role" class="block text-sm font-medium text-gray-700">
						Role (optional)
					</label>
					<div class="mt-1">
						<input
							type="text"
							id="tech_role"
							name="role"
							bind:value={newTechnicianRole}
							class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							placeholder="e.g. Ceramist, Model, Finisher"
						/>
					</div>
				</div>
				<div>
					<label for="tech_phone" class="block text-sm font-medium text-gray-700">
						Phone (optional)
					</label>
					<div class="mt-1">
						<input
							type="text"
							id="tech_phone"
							name="phone"
							bind:value={newTechnicianPhone}
							class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							placeholder="e.g. 0917 123 4567"
						/>
					</div>
				</div>
				<div>
					<label for="tech_email" class="block text-sm font-medium text-gray-700">
						Email (optional)
					</label>
					<div class="mt-1">
						<input
							type="email"
							id="tech_email"
							name="email"
							bind:value={newTechnicianEmail}
							class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							placeholder="e.g. tech@example.com"
						/>
					</div>
				</div>
				<div class="md:col-span-2">
					<label for="tech_notes" class="block text-sm font-medium text-gray-700">
						Notes (optional)
					</label>
					<div class="mt-1">
						<textarea
							id="tech_notes"
							name="notes"
							bind:value={newTechnicianNotes}
							rows="2"
							class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							placeholder="Special skills, schedule, etc."
						></textarea>
					</div>
				</div>
			</div>
			<div>
				<button
					type="submit"
					class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
				>
					Add Technician
				</button>
			</div>
		</form>
			</section>

			<section class="space-y-4">
				<h2 class="text-xl font-semibold text-gray-900">Add Case Type</h2>
				<!-- Add Case Type Form -->
			<form
				method="POST"
				action="?/addCaseType"
				class="flex flex-col sm:flex-row items-end gap-4 rounded-md bg-gray-50 p-4 shadow-sm w-full"
			>
				<div class="flex-1">
					<label for="case_type" class="block text-sm font-medium text-gray-700">
						Full Name
					</label>
					<div class="mt-1">
						<input
							type="text"
							name="case_type"
							id="case_type"
							bind:value={newCaseType}
							class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							placeholder="e.g. Crown"
							required
						/>
					</div>
				</div>
				<div class="flex-1">
					<label for="case_type_abbrv" class="block text-sm font-medium text-gray-700">
						Abbreviation/Code
					</label>
					<div class="mt-1">
						<input
							type="text"
							name="case_type_abbrv"
							id="case_type_abbrv"
							bind:value={newCaseTypeAbbrv}
							class="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
							placeholder="e.g. CRN"
							required
						/>
					</div>
				</div>
				<button
					type="submit"
					class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none h-[38px]"
				>
					Add Case Type
				</button>
			</form>
			</section>

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
