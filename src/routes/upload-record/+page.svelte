<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import CameraModal from '$lib/components/CameraModal.svelte';
	import InventoryUsage from '$lib/components/upload-record/InventoryUsage.svelte';
	import DocumentationIn from '$lib/components/upload-record/DocumentationIn.svelte';
	import PaymentInfo from '$lib/components/upload-record/PaymentInfo.svelte';
	import ClientInfo from '$lib/components/upload-record/ClientInfo.svelte';
	import CaseSpecs from '$lib/components/upload-record/CaseSpecs.svelte';
	import DeliveryWorkDetails from '$lib/components/upload-record/DeliveryWorkDetails.svelte';
	import { deserialize, enhance } from '$app/forms';

	let { data, form }: PageProps = $props();

	// Wizard state
	let currentStep = $state(1);
	const totalSteps = 3;
	let stepError = $state('');
	const stepTitles = ['Client & Case Info', 'Materials & Logistics', 'Documentation & Payment'];

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
	let excess_payment: number = $state(0);

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

	// Delivery & technician details for new record
	let deliveryCourier = $state('');
	let deliveryFee: number | undefined = $state();
	let deliveryNotes = $state('');
	let dateDropoff = $state('');
	let actualDropoff = $state('');
	let finishBy = $state('');
	let assignedTechnicians = $state('');

	// Collapsible section state
	let showDeliveryDetails = $state(true);

	// Technician autocomplete state
	let technicianInputValue = $state('');
	let showTechnicianDropdown = $state(false);
	let selectedTechnicians: string[] = $state([]);
	let filteredTechnicians = $derived(
		data?.technicians?.filter(
			(t) =>
				t.name.toLowerCase().includes(technicianInputValue.toLowerCase()) &&
				!selectedTechnicians.includes(t.name)
		) || []
	);

	function addTechnician(techName: string) {
		if (!selectedTechnicians.includes(techName)) {
			selectedTechnicians = [...selectedTechnicians, techName];
			assignedTechnicians = selectedTechnicians.join(', ');
		}
		technicianInputValue = '';
		showTechnicianDropdown = false;
	}

	function removeTechnician(techName: string) {
		selectedTechnicians = selectedTechnicians.filter((t) => t !== techName);
		assignedTechnicians = selectedTechnicians.join(', ');
	}

	function handleTechnicianInputKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && technicianInputValue.trim()) {
			event.preventDefault();
			addTechnician(technicianInputValue.trim());
		}
	}

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
		filteredDoctors = allDoctors.filter(
			(doctor) =>
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
			const response = await fetch('/edit-info?/addClinic', {
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
					clinicPhone: '',
					clinicEmail: '',
					clinicAddress: '',
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
			const response = await fetch('/edit-info?/addDoctor', {
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
					doctorPhone: '',
					doctorEmail: '',
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
		const caseType = data?.caseTypes.find((ct) => ct.caseTypeId === caseTypeId);
		const prefix = caseType ? caseType.caseTypeName : '';
		return prefix ? `${prefix}-${String(num).padStart(5, '0')}` : String(num).padStart(5, '0');
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

	console.log('doctors', data?.doctors);
	console.log('clinics', data?.clinics);

	let isSubmitting = $state(false);

	// Add these variables near the other state declarations at the top
	let upper_unit: number = $state(1);
	let upper_cost: number = $state(0);
	let lower_unit: number = $state(1);
	let lower_cost: number = $state(0);

	$effect(() => {
		const upperTotal =
			selected_jaw === 'upper' || selected_jaw === 'U/L' ? upper_unit * upper_cost : 0;
		const lowerTotal =
			selected_jaw === 'lower' || selected_jaw === 'U/L' ? lower_unit * lower_cost : 0;
		total_amount = upperTotal + lowerTotal;

		// Calculate excess or balance
		if (paid_amount !== undefined && total_amount !== undefined) {
			if (paid_amount > total_amount) {
				excess_payment = paid_amount - total_amount;
			} else {
				excess_payment = 0;
			}
		} else {
			excess_payment = 0;
		}
	});

	function payInFull() {
		if (total_amount !== undefined) {
			paid_amount = total_amount;
		}
	}

	// Inventory Usage Tracking State
	let inventoryUsages = $state<{ itemId: number; quantity: number; maxStock: number }[]>([]);
	function addInventoryRow() {
		inventoryUsages.push({ itemId: 0, quantity: 1, maxStock: 0 });
	}

	function removeInventoryRow(index: number) {
		inventoryUsages.splice(index, 1);
	}

	function handleInventorySelect(index: number, itemIdStr: string) {
		const id = parseInt(itemIdStr, 10);
		const item = data?.inventoryTableItems?.find((i) => i.id === id);
		if (item) {
			inventoryUsages[index].itemId = id;
			inventoryUsages[index].maxStock = item.currentStock;
			if (inventoryUsages[index].quantity > item.currentStock) {
				inventoryUsages[index].quantity = item.currentStock;
			}
		}
	}

	// Wizard navigation functions
	function canProceed(): boolean {
		stepError = '';
		switch (currentStep) {
			case 1:
				if (!selectedClinic) {
					stepError = 'Please select a clinic';
					return false;
				}
				if (!selectedDoctor) {
					stepError = 'Please select a doctor';
					return false;
				}
				if (
					(selected_jaw === 'upper' || selected_jaw === 'U/L') &&
					(!upper_unit || upper_cost === undefined)
				) {
					stepError = 'Please fill in upper case details';
					return false;
				}
				if (
					(selected_jaw === 'lower' || selected_jaw === 'U/L') &&
					(!lower_unit || lower_cost === undefined)
				) {
					stepError = 'Please fill in lower case details';
					return false;
				}
				return true;
			default:
				return true;
		}
	}

	function nextStep() {
		if (canProceed() && currentStep < totalSteps) {
			currentStep++;
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	function prevStep() {
		if (currentStep > 1) {
			currentStep--;
			stepError = '';
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}

	function goToStep(step: number) {
		if (step < currentStep) {
			currentStep = step;
			stepError = '';
			window.scrollTo({ top: 0, behavior: 'smooth' });
		}
	}
</script>

<div class=" flex justify-center px-4 md:px-8">
	<form
		class="mb-4 flex w-full flex-col gap-6 rounded-md bg-white p-4 shadow-md sm:p-6 md:max-w-[1200px]"
		method="POST"
		enctype="multipart/form-data"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ update, result }) => {
				if (
					result.type === 'failure' ||
					(result.type === 'success' && result.data?.success === false)
				) {
					alert(result.data?.error || 'An error occurred during submission.');
					await update({ reset: false });
				} else {
					await update();
				}
				isSubmitting = false;
			};
		}}
	>
		<!-- Wizard Header -->
		<div class="text-center">
			<h2 class="text-2xl font-semibold text-gray-800">Add New Record</h2>
			<p class="mt-1 text-sm text-gray-500">
				Step {currentStep} of {totalSteps}: {stepTitles[currentStep - 1]}
			</p>
		</div>

		<!-- Progress Bar -->
		<div class="relative">
			<div class="flex items-center justify-between">
				{#each stepTitles as title, i}
					{@const stepNum = i + 1}
					<button
						type="button"
						onclick={() => goToStep(stepNum)}
						class="group flex flex-col items-center gap-1"
					>
						<div
							class="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors
								{stepNum < currentStep ? 'bg-green-500 text-white' : ''}
								{stepNum === currentStep ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' : ''}
								{stepNum > currentStep ? 'bg-gray-200 text-gray-500 group-hover:bg-gray-300' : ''}"
						>
							{#if stepNum < currentStep}
								<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									/>
								</svg>
							{:else}
								{stepNum}
							{/if}
						</div>
						<span class="hidden text-[10px] font-medium text-gray-500 sm:block">{title}</span>
					</button>
					{#if i < stepTitles.length - 1}
						<div class="mx-2 h-0.5 flex-1 bg-gray-200">
							<div
								class="h-full bg-green-500 transition-all"
								style="width: {stepNum < currentStep ? '100%' : '0%'}"
							></div>
						</div>
					{/if}
				{/each}
			</div>
		</div>

		<!-- Step Error -->
		{#if stepError}
			<div class="rounded-md bg-red-50 p-3 text-sm text-red-600">
				{stepError}
			</div>
		{/if}

		<!-- Step 1: Client Information -->
		{#if currentStep === 1}
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h3 class="mb-4 text-lg font-semibold text-gray-800">Client Information</h3>
				<ClientInfo
					{allClinics}
					{filteredClinics}
					bind:clinicInputValue
					bind:showClinicDropdown
					{filterClinics}
					{selectClinic}
					{registerClinic}
					{isRegisteringClinic}
					{selectedClinic}
					{allDoctors}
					{filteredDoctors}
					bind:doctorInputValue
					bind:showDoctorDropdown
					{filterDoctors}
					{selectDoctor}
					{registerDoctor}
					{isRegisteringDoctor}
					{selectedDoctor}
					bind:selected_jaw
				/>
			</div>
		{/if}

		<!-- Step 1: Case Details (merged with Client Info) -->
		{#if currentStep === 1}
			<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<h3 class="mb-4 text-lg font-semibold text-gray-800">Case Details</h3>
					<CaseSpecs
						{data}
						{selected_jaw}
						bind:case_type_upper
						bind:case_type_lower
						{next_case_upper}
						{next_case_lower}
						{formatCaseNumber}
						bind:upper_unit
						bind:upper_cost
						bind:lower_unit
						bind:lower_cost
					/>
				</div>

				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<h3 class="mb-4 text-lg font-semibold text-gray-800">Materials</h3>
					<InventoryUsage
						{data}
						bind:inventoryUsages
						{addInventoryRow}
						{removeInventoryRow}
						{handleInventorySelect}
					/>
				</div>
			</div>
		{/if}

		<!-- Step 2: Materials & Logistics -->
		{#if currentStep === 2}
			<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
				<h3 class="mb-4 text-lg font-semibold text-gray-800">Materials & Logistics</h3>
				<div class="flex flex-col gap-4">
					<DeliveryWorkDetails
						bind:showDeliveryDetails
						bind:deliveryCourier
						bind:deliveryFee
						bind:deliveryNotes
						bind:dateDropoff
						bind:actualDropoff
						bind:finishBy
						bind:technicianInputValue
						bind:showTechnicianDropdown
						{selectedTechnicians}
						{filteredTechnicians}
						{addTechnician}
						{removeTechnician}
						{handleTechnicianInputKeydown}
						{assignedTechnicians}
					/>
				</div>
			</div>
		{/if}

		<!-- Step 3: Documentation & Payment -->
		{#if currentStep === 3}
			<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<h3 class="mb-4 text-lg font-semibold text-gray-800">Documentation</h3>
					<DocumentationIn
						{in_img_urls}
						bind:in_file
						bind:showCameraModal
						{handleInImageChange}
						{removeInImage}
						bind:date
						bind:time
					/>
				</div>

				<!-- Payment -->
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<h4 class="mb-4 text-lg font-semibold text-gray-800">Payment</h4>
					<PaymentInfo
						{total_amount}
						bind:paid_amount
						{excess_payment}
						{payInFull}
						bind:payment_method
					/>
				</div>
			</div>
		{/if}

		<!-- Navigation Buttons -->
		<div class="flex items-center justify-between border-t border-gray-200 pt-4">
			<button
				type="button"
				onclick={prevStep}
				disabled={currentStep === 1}
				class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
			>
				← Back
			</button>

			{#if currentStep < totalSteps}
				<button
					type="button"
					onclick={nextStep}
					class="rounded-md bg-indigo-600 px-6 py-2 text-sm font-medium text-white hover:bg-indigo-500"
				>
					Next Step →
				</button>
			{:else}
				<button
					type="submit"
					disabled={isSubmitting}
					class="rounded-md bg-green-600 px-6 py-2 text-sm font-medium text-white hover:bg-green-500 disabled:cursor-not-allowed disabled:opacity-50"
				>
					{isSubmitting ? 'Submitting...' : '✓ Add Record'}
				</button>
			{/if}
		</div>

		{#if form?.success}
			<p class="text-center font-semibold text-green-500">{form.success}</p>
		{:else if form?.error}
			<p class="text-center text-red-500">Error: {form?.error}</p>
		{/if}
	</form>
</div>

<CameraModal bind:show={showCameraModal} bind:fileInput={in_file} onCapture={handleInImageChange} />
