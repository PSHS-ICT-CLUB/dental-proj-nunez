<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { PageProps } from './$types';
	import CameraModal from '$lib/components/CameraModal.svelte';
	import { deserialize } from '$app/forms';

	let { data, form }: PageProps = $props();

	let allDoctors = $state(data?.doctors || []);
	let allClinics = $state(data?.clinics || []);
	let filteredDoctors = $state(allDoctors);
	let filteredClinics = $state(allClinics);

	let selectedDoctor: {
		doctorId: number;
		doctorName: string;
		clinicId: number;
	} | null = $state(null);
	let selectedClinic: {
		clinicId: number;
		clinicName: string;
	} | null = $state(null);

	let total_amount: number | undefined = $state();
	let paid_amount: number | undefined = $state();
	let date: string | undefined = $state();
	let time: string | undefined = $state();

	let case_type_upper: number = $state(1);
	let case_type_lower: number = $state(1);
	let in_file: HTMLInputElement | undefined = $state();
	let out_file: HTMLInputElement | undefined = $state();
	let in_img_urls: string[] = $state([]);
	let out_img_urls: string[] = $state([]);

	let doctorInputValue = $state('');
	let clinicInputValue = $state('');
	let showDoctorDropdown = $state(false);
	let showClinicDropdown = $state(false);
	let payment_method = $state('cash');
	function handleInImageChange() {
		const files = in_file?.files;
		
		// Revoke old object URLs to avoid memory leaks
		for (const url of in_img_urls) {
			URL.revokeObjectURL(url);
		}
		in_img_urls = [];

		if (files && files.length > 0) {
			for (let i = 0; i < files.length; i++) {
				in_img_urls.push(URL.createObjectURL(files[i]));
			}
		}
	}

	function removeInImage(index: number) {
		if (!in_file?.files) return;
		
		const dataTransfer = new DataTransfer();
		const files = Array.from(in_file.files);
		
		files.forEach((file, i) => {
			if (i !== index) {
				dataTransfer.items.add(file);
			}
		});
		
		in_file.files = dataTransfer.files;
		handleInImageChange();
	}

	function filterDoctors() {
		const query = (doctorInputValue || '').toLowerCase();
		filteredDoctors = allDoctors.filter((doctor) =>
			doctor.clinicId === selectedClinic?.clinicId &&
			doctor.doctorName.toLowerCase().includes(query)
		);
		showDoctorDropdown = true;
	}

	function selectDoctor(doctor: { doctorId: number; doctorName: string; clinicId: number }) {
		selectedDoctor = doctor;
		doctorInputValue = doctor.doctorName;
		showDoctorDropdown = false;
	}

	function filterClinics() {
		const query = (clinicInputValue || '').toLowerCase();
		filteredClinics = allClinics.filter((clinic) =>
			clinic.clinicName.toLowerCase().includes(query)
		);
		showClinicDropdown = true;
		// Reset doctor selection when clinic input changes
		selectedDoctor = null;
		doctorInputValue = '';
		filteredDoctors = [];
	}

	function selectClinic(clinic: { clinicId: number; clinicName: string }) {
		selectedClinic = clinic;
		clinicInputValue = clinic.clinicName;
		showClinicDropdown = false;
		// Filter doctors based on the selected clinic
		filteredDoctors = allDoctors.filter((doctor) => doctor.clinicId === clinic.clinicId);
		// If a doctor was previously selected and is not in the new clinic, reset
		if (selectedDoctor && selectedDoctor.clinicId !== clinic.clinicId) {
			selectedDoctor = null;
			doctorInputValue = '';
		} else if (filteredDoctors.length === 1) {
			// Automatically select the doctor if only one is available in the clinic
			selectedDoctor = filteredDoctors[0];
			doctorInputValue = filteredDoctors[0].doctorName;
		}
	}

	// Add these new state variables
	let showCameraModal = $state(false);

	let isRegisteringClinic = $state(false);
	let isRegisteringDoctor = $state(false);

	async function registerClinic() {
		if (!clinicInputValue || isRegisteringClinic) return;
		isRegisteringClinic = true;
		
		const formData = new FormData();
		formData.append('clinic_name', clinicInputValue);
		
		try {
			const response = await fetch('/edit_info?/addClinic', {
				method: 'POST',
				body: formData,
				headers: { 'x-sveltekit-action': 'true' }
			});
			const text = await response.text();
			const result = deserialize(text);
			
			if (result.type === 'success' && result.data?.success) {
				const newClinic = {
					clinicId: result.data.clinicId as number,
					clinicName: clinicInputValue,
					value: (result.data.clinicId as number).toString(),
					label: clinicInputValue
				};
				allClinics.push(newClinic);
				filteredClinics = allClinics;
				selectClinic(newClinic);
			} else if (result.type === 'failure' && result.data?.error) {
				alert(result.data.error.toString());
			} else {
				alert('Failed to register clinic');
			}
		} catch (err) {
			console.error(err);
			alert('An error occurred while registering the clinic.');
		} finally {
			isRegisteringClinic = false;
		}
	}

	async function registerDoctor() {
		if (!doctorInputValue || !selectedClinic || isRegisteringDoctor) return;
		isRegisteringDoctor = true;
		
		const formData = new FormData();
		formData.append('doctor_name', doctorInputValue);
		formData.append('clinic_id', selectedClinic.clinicId.toString());
		
		try {
			const response = await fetch('/edit_info?/addDoctor', {
				method: 'POST',
				body: formData,
				headers: { 'x-sveltekit-action': 'true' }
			});
			const text = await response.text();
			const result = deserialize(text);
			
			if (result.type === 'success' && result.data?.success) {
				const newDoctor = {
					doctorId: result.data.doctorId as number,
					doctorName: doctorInputValue,
					clinicId: selectedClinic.clinicId,
					value: (result.data.doctorId as number).toString(),
					label: doctorInputValue
				};
				allDoctors.push(newDoctor);
				filteredDoctors = allDoctors.filter((d) => d.clinicId === selectedClinic!.clinicId);
				selectDoctor(newDoctor);
			} else if (result.type === 'failure' && result.data?.error) {
				alert(result.data.error.toString());
			} else {
				alert('Failed to register doctor');
			}
		} catch (err) {
			console.error(err);
			alert('An error occurred while registering the doctor.');
		} finally {
			isRegisteringDoctor = false;
		}
	}

	// Add jaw selection state
	let selected_jaw = $state('upper');

	// Removed internal camera logic: using CameraModal component

	// Add function to get next case number
	function getNextCaseNumber(caseTypeId: number) {
		const caseType = data?.caseTypes.find((ct) => ct.caseTypeId === caseTypeId);
		return caseType ? caseType.numberOfCases + 1 : 1;
	}

	// Add function to calculate case numbers based on jaw selection
	function calculateCaseNumbers() {
		const upperNumber = getNextCaseNumber(case_type_upper);
		let lowerNumber = getNextCaseNumber(case_type_lower);

		// If same case type is selected for both jaws and both are visible
		if (case_type_upper === case_type_lower && selected_jaw === 'U/L') {
			lowerNumber = upperNumber + 1;
		}

		return { upperNumber, lowerNumber };
	}

	function formatCaseNumber(num: number, caseTypeId: number) {
		return String(num).padStart(5, '0');
	}

	$effect(() => {
		// Recalculate case numbers whenever case types or jaw selection changes
		const { upperNumber, lowerNumber } = calculateCaseNumbers();
		next_case_upper = upperNumber;
		next_case_lower = lowerNumber;
	});

	let next_case_upper = $state(1);
	let next_case_lower = $state(1);

	onMount(() => {
		date = new Date().toISOString().split('T')[0];
		time = new Date().toLocaleTimeString('en-GB', {
			hour: '2-digit',
			minute: '2-digit'
		});
	});

	onDestroy(() => {
		// Cleanup if needed
	});

	console.log('doctors', data?.doctors);
	console.log('clinics', data?.clinics);

	let isSubmitting = $state(false);

	function handleSubmit(e: SubmitEvent) {
		if (isSubmitting) {
			e.preventDefault();
			return;
		}

		isSubmitting = true;
		setTimeout(() => {
			isSubmitting = false;
		}, 2000); // Reset after 2 seconds
	}

	// Add these variables near the other state declarations at the top
	let upper_unit: number = $state(1);
	let upper_cost: number = $state(0);
	let lower_unit: number = $state(1);
	let lower_cost: number = $state(0);

	// Add this effect to calculate total automatically
	$effect(() => {
		const upperTotal =
			selected_jaw === 'upper' || selected_jaw === 'U/L' ? upper_unit * upper_cost : 0;
		const lowerTotal =
			selected_jaw === 'lower' || selected_jaw === 'U/L' ? lower_unit * lower_cost : 0;
		total_amount = upperTotal + lowerTotal;
	});
</script>

<div class=" flex justify-center px-4 md:px-8">
	<form
		class="mb-4 flex w-full flex-col gap-6 rounded-md bg-white p-4 sm:p-6 shadow-md md:max-w-[1200px]"
		method="POST"
		enctype="multipart/form-data"
		onsubmit={handleSubmit}
	>
		<h2 class="text-center text-2xl font-semibold text-gray-800">Add New Record</h2>

		<!-- First Row: Patient Information -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<!-- Clinic Selection -->
			<div class="relative">
				<label for="clinic_name" class="mb-2 block text-[10px] font-bold tracking-wider text-gray-500 uppercase">
					Clinic
					<input
						type="text"
						id="clinic_name"
						autocomplete="off"
						bind:value={clinicInputValue}
						oninput={filterClinics}
						onfocus={() => {
							showClinicDropdown = true;
						}}
						onblur={() => setTimeout(() => (showClinicDropdown = false), 200)}
						required
						class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
						placeholder="Clinic name"
					/>
				</label>
				{#if showClinicDropdown}
					<ul
						class="ring-opacity-5 absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black focus:outline-none"
						tabindex="-1"
						role="listbox"
						aria-labelledby="clinic_name"
					>
						{#each filteredClinics as clinic}
							<li class="role-none relative" id={`clinic-option-${clinic.clinicId}`}>
								<button
									type="button"
									class="w-full cursor-pointer border-none bg-transparent text-left text-gray-900 hover:bg-indigo-600 hover:text-white py-2 pr-9 pl-3"
									onclick={() => selectClinic(clinic)}
								>
									<span class="block truncate">{clinic.clinicName}</span>
								</button>
								{#if selectedClinic?.clinicId === clinic.clinicId}
									<span class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-indigo-600">
										<svg
											class="h-5 w-5"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
											aria-hidden="true"
										>
											<path
												fill-rule="evenodd"
												d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
												clip-rule="evenodd"
											></path>
										</svg>
									</span>
								{/if}
							</li>
						{/each}
						{#if clinicInputValue.length > 0 && !allClinics.some(c => c.clinicName.toLowerCase() === clinicInputValue.trim().toLowerCase())}
							<li class="role-none relative text-gray-900">
								<button
									type="button"
									class="w-full text-left bg-transparent border-none cursor-pointer hover:bg-indigo-600 hover:text-white flex items-center gap-2 font-medium py-2 pr-9 pl-3"
									onclick={registerClinic}
									disabled={isRegisteringClinic}
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
									</svg>
									{isRegisteringClinic ? 'Registering...' : `Register "${clinicInputValue}" as New Clinic`}
								</button>
							</li>
						{/if}
					</ul>
				{/if}
				<input type="hidden" name="clinic_name" value={selectedClinic?.clinicId} />
			</div>

			<!-- Doctor Selection -->
			<div class="relative">
				<label for="doctor_name" class="mb-2 block text-[10px] font-bold tracking-wider text-gray-500 uppercase">
					Doctor
					<input
						type="text"
						id="doctor_name"
						autocomplete="off"
						bind:value={doctorInputValue}
						oninput={filterDoctors}
						onfocus={() => (showDoctorDropdown = selectedClinic != null)}
						onblur={() => setTimeout(() => (showDoctorDropdown = false), 200)}
						required
						disabled={!selectedClinic}
						class="block w-full appearance-none rounded-md border {selectedClinic
							? 'border-gray-300'
							: 'cursor-not-allowed border-dashed border-gray-300 bg-gray-100'} px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
						placeholder="Doctor name"
					/>
				</label>
				{#if showDoctorDropdown}
					<ul
						class="ring-opacity-5 absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black focus:outline-none"
						tabindex="-1"
						role="listbox"
						aria-labelledby="doctor_name"
					>
						{#each filteredDoctors as doctor}
							<li class="role-none relative" id={`doctor-option-${doctor.doctorId}`}>
								<button
									type="button"
									class="w-full cursor-pointer border-none bg-transparent text-left text-gray-900 hover:bg-indigo-600 hover:text-white py-2 pr-9 pl-3"
									onclick={() => selectDoctor(doctor)}
								>
									<span class="block truncate">{doctor.doctorName}</span>
								</button>
								{#if selectedDoctor?.doctorId === doctor.doctorId}
									<span class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-indigo-600">
										<svg
											class="h-5 w-5"
											xmlns="http://www.w3.org/2000/svg"
											viewBox="0 0 20 20"
											fill="currentColor"
											aria-hidden="true"
										>
											<path
												fill-rule="evenodd"
												d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
												clip-rule="evenodd"
											></path>
										</svg>
									</span>
								{/if}
							</li>
						{/each}
						{#if doctorInputValue.length > 0 && !allDoctors.some(d => d.clinicId === selectedClinic?.clinicId && d.doctorName.toLowerCase() === doctorInputValue.trim().toLowerCase())}
							{#if selectedClinic}
								<li class="role-none relative text-gray-900">
									<button
										type="button"
										class="w-full text-left bg-transparent border-none cursor-pointer hover:bg-indigo-600 hover:text-white flex items-center gap-2 font-medium py-2 pr-9 pl-3"
										onclick={registerDoctor}
										disabled={isRegisteringDoctor}
									>
										<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
										</svg>
										{isRegisteringDoctor ? 'Registering...' : `Register "${doctorInputValue}" as New Doctor`}
									</button>
								</li>
							{:else}
								<li class="relative cursor-default py-2 pr-9 pl-3 text-gray-500 select-none">
									Select a clinic first to register.
								</li>
							{/if}
						{/if}
					</ul>
				{/if}
				<input type="hidden" name="doctor_name" value={selectedDoctor?.doctorId} />
			</div>

			<!-- Patient Name -->
			<div>
				<label for="patient_name" class="mb-2 block text-[10px] font-bold tracking-wider text-gray-500 uppercase">
					Patient Name
					<input
						type="text"
						name="patient_name"
						placeholder="Patient name"
						autocomplete="off"
						required
						class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
					/>
				</label>
			</div>
			<!-- Jaw Selection -->
			<div class="flex items-center justify-center">
				<div class="inline-flex rounded-md border border-gray-200" role="group">
					<button
						type="button"
						class="rounded-l-md px-2 py-3 text-xs font-medium {selected_jaw === 'upper'
							? 'bg-indigo-600 text-white'
							: 'bg-white text-gray-700 hover:bg-gray-50'}"
						onclick={() => (selected_jaw = 'upper')}
					>
						Upper Only
					</button>
					<button
						type="button"
						class="border-r border-l px-2 text-xs font-medium {selected_jaw === 'U/L'
							? 'bg-indigo-600 text-white'
							: 'bg-white text-gray-700 hover:bg-gray-50'}"
						onclick={() => (selected_jaw = 'U/L')}
					>
						Upper/Lower
					</button>
					<button
						type="button"
						class="rounded-r-md px-2 text-xs font-medium {selected_jaw === 'lower'
							? 'bg-indigo-600 text-white'
							: 'bg-white text-gray-700 hover:bg-gray-50'}"
						onclick={() => (selected_jaw = 'lower')}
					>
						Lower Only
					</button>
					<input type="text" name="selected_jaw" bind:value={selected_jaw} hidden />
				</div>
			</div>
		</div>

		<!-- Second Row: Upper/Lower Sections -->
		<div class="flex flex-col gap-4">
			<!-- Upper Section -->
			{#if selected_jaw === 'U/L' || selected_jaw === 'upper'}
				<div class="rounded-md border border-gray-200 p-4">
					<h3 class="mb-3 text-[10px] font-bold tracking-wider text-gray-500 uppercase">Upper</h3>
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
						<!-- Case Type -->
						<div>
							<label for="case_type_upper" class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase">
								Case type
								<select
									name="case_type_upper"
									bind:value={case_type_upper}
									required
									class="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
								>
									{#each data?.caseTypes as caseType}
										<option value={caseType.caseTypeId}>{caseType.caseTypeName}</option>
									{/each}
								</select>
							</label>
						</div>

						<!-- Case Number -->
						<div>
							<label for="case_number_upper" class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase">
								Case number
								<input
									type="text"
									name="case_number_upper"
									class="mt-1 block w-full cursor-not-allowed appearance-none rounded-md border border-dashed border-indigo-200 bg-indigo-50 px-3 py-2 text-center font-mono font-bold text-indigo-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
									placeholder="Case number"
									value={formatCaseNumber(next_case_upper, case_type_upper)}
									disabled
								/>
							</label>
						</div>
						<!-- Description -->
						<div class="sm:col-span-2 lg:col-span-1">
							<label for="upper_description" class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase">
								Description
								<textarea
									name="upper_description"
									class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
									rows="1"
								></textarea>
							</label>
						</div>
						<!-- Unit -->
						<div>
							<label for="upper_unit" class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase">
								Unit
								<input
									type="number"
									id="upper_unit"
									name="upper_unit"
									bind:value={upper_unit}
									class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
									placeholder="Units"
									min="1"
									defaultvalue="1"
								/>
							</label>
						</div>

						<!-- Cost -->
						<div>
							<label class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase" for="upper_cost">Cost</label>
							<div class="relative mt-1">
								<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
									<span class="text-gray-500 sm:text-sm font-medium">₱</span>
								</div>
								<input
									type="number"
									id="upper_cost"
									name="upper_cost"
									bind:value={upper_cost}
									class="block w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 text-sm focus:border-indigo-500 focus:ring-indigo-500"
									placeholder="0.00"
									min="0"
									required
								/>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Lower Section (Similar structure to Upper) -->
			{#if selected_jaw === 'U/L' || selected_jaw === 'lower'}
				<div class="rounded-md border border-gray-200 p-4">
					<h3 class="mb-3 text-[10px] font-bold tracking-wider text-gray-500 uppercase">Lower</h3>
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
						<!-- Case Type -->
						<div>
							<label for="case_type_lower" class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase">
								Case type
								<select
									name="case_type_lower"
									bind:value={case_type_lower}
									required
									class="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
								>
									{#each data?.caseTypes as caseType}
										<option value={caseType.caseTypeId}>{caseType.caseTypeName}</option>
									{/each}
								</select>
							</label>
						</div>

						<!-- Case Number -->
						<div>
							<label for="case_number_lower" class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase">
								Case number
								<input
									type="text"
									name="case_number_lower"
									class="mt-1 block w-full cursor-not-allowed appearance-none rounded-md border border-dashed border-indigo-200 bg-indigo-50 px-3 py-2 text-center font-mono font-bold text-indigo-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
									placeholder="Case number"
									value={formatCaseNumber(next_case_lower, case_type_lower)}
									disabled
								/>
							</label>
						</div>
						<!-- Description -->
						<div class="sm:col-span-2 lg:col-span-1">
							<label for="lower_description" class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase">
								Description
								<textarea
									name="lower_description"
									class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
									rows="1"
								></textarea>
							</label>
						</div>
						<!-- Unit -->
						<div>
							<label for="lower_unit" class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase">
								Unit
								<input
									type="number"
									id="lower_unit"
									name="lower_unit"
									bind:value={lower_unit}
									class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
									placeholder="Units"
									min="1"
									defaultvalue="1"
								/>
							</label>
						</div>

						<!-- Cost -->
						<div>
							<label class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase" for="lower_cost">Cost</label>
							<div class="relative mt-1">
								<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
									<span class="text-gray-500 sm:text-sm font-medium">₱</span>
								</div>
								<input
									type="number"
									id="lower_cost"
									name="lower_cost"
									bind:value={lower_cost}
									class="block w-full rounded-md border border-gray-300 py-2 pl-7 pr-3 text-sm focus:border-indigo-500 focus:ring-indigo-500"
									placeholder="0.00"
									min="0"
									required
								/>
							</div>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Third Row: Image and Payment -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
			<!-- IN Image Column -->
			<div class="rounded-md border border-gray-200 p-4">
				<div class="mb-2 flex flex-col gap-2">
					<span class="block text-[10px] font-bold tracking-wider text-gray-500 uppercase"> IN Image </span>
					{#if in_img_urls.length === 0}
						<p class="mb-2 text-sm text-gray-500">No images uploaded yet</p>
					{/if}
					<div class="flex gap-2">
						<button
							type="button"
							class="flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
							onclick={() => {
								showCameraModal = true;
							}}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="mr-2 h-5 w-5"
								viewBox="0 0 20 20"
								fill="currentColor"
							>
								<path
									fill-rule="evenodd"
									d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
									clip-rule="evenodd"
								/>
							</svg>
							Use Camera
						</button>
						<label
							class="flex cursor-pointer items-center justify-center rounded-md bg-gray-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-600"
						>
							<input
								type="file"
								name="in-img"
								class="w-24"
								accept="image/*"
								bind:this={in_file}
								onchange={handleInImageChange}
								multiple
								required
							/>
						</label>
					</div>
				</div>
				{#if in_img_urls.length > 0}
					<div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
						{#each in_img_urls as url, i}
							<div class="relative group">
								<img
									class="h-24 w-full rounded-md object-cover shadow-sm border border-gray-100"
									src={url}
									alt="IN Preview"
								/>
								<button
									type="button"
									class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 focus:outline-none transition-colors"
									onclick={() => removeInImage(i)}
									title="Remove image"
									aria-label="Remove image"
								>
									<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
									</svg>
								</button>
							</div>
						{/each}
					</div>
				{/if}
				<div class="mt-4 flex flex-col gap-2">
					<label for="date" class="mb-2 block text-[10px] font-bold tracking-wider text-gray-500 uppercase">
						IN Date
						<input
							type="date"
							name="date"
							placeholder="Date"
							required
							bind:value={date}
							class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
						/>
					</label>
					<label for="time" class="mb-2 block text-[10px] font-bold tracking-wider text-gray-500 uppercase">
						IN Time
						<input
							type="time"
							name="time"
							placeholder="Time"
							required
							bind:value={time}
							class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
						/>
					</label>
				</div>
			</div>

			<!-- Payment Information Column -->
			<div class="rounded-md border border-gray-200 p-4">
				<h3 class="mb-3 text-[10px] font-bold tracking-wider text-gray-500 uppercase">Payment Information</h3>

				<!-- Total Amount -->
				<div class="mb-5">
					<label for="total_amount" class="mb-2 block text-[10px] font-bold tracking-wider text-gray-500 uppercase">
						Total Amount
					</label>
					<div class="block w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-2xl font-bold text-gray-900 shadow-sm relative overflow-hidden">
						<div class="absolute top-0 right-0 w-1.5 h-full bg-indigo-500"></div>
						<span class="text-gray-400 font-medium mr-1 text-lg">₱</span>{total_amount?.toFixed(2) || '0.00'}
					</div>
					<input type="hidden" id="total_amount" name="total_amount" value={total_amount} />
				</div>

				<!-- Paid Amount -->
				<div class="mb-4">
					<label class="mb-2 block text-[10px] font-bold tracking-wider text-gray-500 uppercase" for="paid_amount">Paid Amount</label>
					<div class="relative">
						<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
							<span class="text-gray-500 sm:text-sm font-medium">₱</span>
						</div>
						<input
							type="number"
							id="paid_amount"
							name="paid_amount"
							bind:value={paid_amount}
							class="block w-full appearance-none rounded-md border border-gray-300 py-2 pl-7 pr-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
							placeholder="0.00"
							min="0"
							step="0.01"
							required
						/>
					</div>
				</div>

				<!-- Payment Method -->
				<div class="mb-4">
					<label for="payment_method" class="mb-2 block text-[10px] font-bold tracking-wider text-gray-500 uppercase">
						Payment Method
					</label>
					<select
						name="payment_method"
						bind:value={payment_method}
						class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
					>
						<option value="cash">Cash</option>
						<option value="gcash">GCash</option>
						<option value="bank">Bank Transfer</option>
						<option value="others">Others</option>
					</select>
				</div>
			</div>
		</div>

		<!-- Submit Button -->
		<div class="flex flex-col items-center justify-center pt-4">
			<button
				class="rounded-md bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
				type="submit"
				disabled={isSubmitting}
			>
				{isSubmitting ? 'Submitting...' : 'Add Record'}
			</button>
			{#if form?.success}
				<p class="mt-2 font-semibold text-green-500">{form.success}</p>
			{:else if form?.error}
				<p class="mt-2 text-red-500">Error: {form?.error}</p>
			{/if}
		</div>
	</form>
</div>

<CameraModal bind:show={showCameraModal} bind:fileInput={in_file} onCapture={handleInImageChange} />
