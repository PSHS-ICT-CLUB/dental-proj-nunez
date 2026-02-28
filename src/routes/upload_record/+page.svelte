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
	let in_img: HTMLImageElement | undefined = $state();
	let out_img: HTMLImageElement | undefined = $state();
	let show_in: boolean = $state(false);
	let show_out: boolean = $state(false);

	let doctorInputValue = $state('');
	let clinicInputValue = $state('');
	let showDoctorDropdown = $state(false);
	let showClinicDropdown = $state(false);
	let payment_method = $state('cash');
	function handleInImageChange() {
		const file = in_file?.files?.[0];

		if (file) {
			show_in = true;

			const reader = new FileReader();
			reader.addEventListener('load', function () {
				in_img?.setAttribute('src', reader.result?.toString() || '');
			});
			reader.readAsDataURL(file);

			return;
		}
		show_in = false;
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
		class="mb-4 flex w-full flex-col gap-6 rounded-md bg-white p-6 shadow-md md:max-w-[1200px]"
		method="POST"
		enctype="multipart/form-data"
		onsubmit={handleSubmit}
	>
		<h2 class="text-center text-2xl font-semibold text-gray-800">Add New Record</h2>

		<!-- First Row: Patient Information -->
		<div class="grid grid-cols-4 gap-4">
			<!-- Clinic Selection -->
			<div class="relative">
				<label for="clinic_name" class="mb-2 block text-sm font-bold text-gray-700">
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
				<label for="doctor_name" class="mb-2 block text-sm font-bold text-gray-700">
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
				<label for="patient_name" class="mb-2 block text-sm font-bold text-gray-700">
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
					<h3 class="mb-3 text-sm font-bold text-gray-700">Upper</h3>
					<div class="grid grid-cols-5 gap-4">
						<!-- Case Type -->
						<div>
							<label for="case_type_upper" class="block text-sm font-medium text-gray-700">
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
							<label for="case_number_upper" class="block text-sm font-medium text-gray-700">
								Case number
								<input
									type="text"
									name="case_number_upper"
									class="mt-1 block w-full cursor-not-allowed appearance-none rounded-md border border-dashed border-gray-300 bg-gray-100 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
									placeholder="Case number"
									value={next_case_upper}
									disabled
								/>
								<input type="hidden" name="case_number_upper" value={next_case_upper} />
							</label>
						</div>
						<!-- Description -->
						<div>
							<label for="upper_description" class="block text-sm font-medium text-gray-700">
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
							<label for="upper_unit" class="block text-sm font-medium text-gray-700">
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
							<label for="upper_cost" class="block text-sm font-medium text-gray-700">
								Cost
								<input
									type="number"
									id="upper_cost"
									name="upper_cost"
									bind:value={upper_cost}
									class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
									placeholder="Cost per unit"
									min="0"
									required
								/>
							</label>
						</div>
					</div>
				</div>
			{/if}

			<!-- Lower Section (Similar structure to Upper) -->
			{#if selected_jaw === 'U/L' || selected_jaw === 'lower'}
				<div class="rounded-md border border-gray-200 p-4">
					<h3 class="mb-3 text-sm font-bold text-gray-700">Lower</h3>
					<div class="grid grid-cols-5 gap-4">
						<!-- Case Type -->
						<div>
							<label for="case_type_lower" class="block text-sm font-medium text-gray-700">
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
							<label for="case_number_lower" class="block text-sm font-medium text-gray-700">
								Case number
								<input
									type="text"
									name="case_number_lower"
									class="mt-1 block w-full cursor-not-allowed appearance-none rounded-md border border-dashed border-gray-300 bg-gray-100 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
									placeholder="Case number"
									value={next_case_lower}
									disabled
								/>
								<input type="hidden" name="case_number_lower" value={next_case_lower} />
							</label>
						</div>
						<!-- Description -->
						<div>
							<label for="lower_description" class="block text-sm font-medium text-gray-700">
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
							<label for="lower_unit" class="block text-sm font-medium text-gray-700">
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
							<label for="lower_cost" class="block text-sm font-medium text-gray-700">
								Cost
								<input
									type="number"
									id="lower_cost"
									name="lower_cost"
									bind:value={lower_cost}
									class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
									placeholder="Cost per unit"
									min="0"
									required
								/>
							</label>
						</div>
					</div>
				</div>
			{/if}
		</div>

		<!-- Third Row: Image and Payment -->
		<div class="grid grid-cols-2 gap-4">
			<!-- IN Image Column -->
			<div class="rounded-md border border-gray-200 p-4">
				<div class="mb-2 flex flex-col gap-2">
					<span class="block text-sm font-bold text-gray-700"> IN Image </span>
					{#if !show_in}
						<p class="mb-2 text-sm text-gray-500">No image uploaded yet</p>
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
								required
							/>
						</label>
					</div>
				</div>
				{#if show_in}
					<div class="mt-2">
						<img
							class="h-40 w-40 rounded-md object-cover shadow-sm"
							bind:this={in_img}
							alt="IN Preview"
						/>
					</div>
				{/if}
				<div class="mt-4 flex flex-col gap-2">
					<label for="date" class="mb-2 block text-sm font-bold text-gray-700">
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
					<label for="time" class="mb-2 block text-sm font-bold text-gray-700">
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
				<h3 class="mb-3 text-sm font-bold text-gray-700">Payment Information</h3>

				<!-- Total Amount -->
				<div class="mb-4">
					<label for="total_amount" class="mb-2 block text-sm font-bold text-gray-700">
						Total Amount
						<input
							type="number"
							id="total_amount"
							name="total_amount"
							bind:value={total_amount}
							class="block w-full appearance-none rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
							placeholder="0.00"
							min="0"
							step="0.01"
							required
							readonly
						/>
					</label>
				</div>

				<!-- Paid Amount -->
				<div class="mb-4">
					<label for="paid_amount" class="mb-2 block text-sm font-bold text-gray-700">
						Paid Amount
						<input
							type="number"
							id="paid_amount"
							name="paid_amount"
							bind:value={paid_amount}
							class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
							placeholder="0.00"
							min="0"
							step="0.01"
							required
						/>
					</label>
				</div>

				<!-- Payment Method -->
				<div class="mb-4">
					<label for="payment_method" class="mb-2 block text-sm font-bold text-gray-700">
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
