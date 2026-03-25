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
	import DentalChart from '$lib/components/upload-record/DentalChart.svelte';
	import { deserialize, enhance } from '$app/forms';

	let { data, form }: PageProps = $props();

	let stepError = $state('');

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
			} else if (result.type === 'failure' && (result.data as any)?.error) {
				stepError = (result.data as any).error.toString();
			} else {
				stepError = 'Failed to register clinic';
			}
		} catch (err) {
			console.error(err);
			stepError = 'An error occurred while registering the clinic.';
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
			} else if (result.type === 'failure' && (result.data as any)?.error) {
				stepError = (result.data as any).error.toString();
			} else {
				stepError = 'Failed to register doctor';
			}
		} catch (err) {
			console.error(err);
			stepError = 'An error occurred while registering the doctor.';
		} finally {
			isRegisteringDoctor = false;
		}
	}

	// Add jaw selection state
	let selected_jaw = $state('upper');

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
		const prefix = caseType ? caseType.caseTypeAbbrv : '';
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
		}
	}

	// Single-page submission validation
	function validateForm(): boolean {
		stepError = '';
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
	}

</script>

<div class="flex justify-center px-4 md:px-8 pb-32">
	<form
		class="w-full max-w-[1400px]"
		method="POST"
		enctype="multipart/form-data"
		onsubmit={(e) => {
			if (!validateForm()) {
				e.preventDefault();
				window.scrollTo({ top: 0, behavior: 'smooth' });
			}
		}}
		use:enhance={() => {
			isSubmitting = true;
			return async ({ update, result }) => {
				if (
					result.type === 'failure' ||
					(result.type === 'success' && (result.data as any)?.success === false)
				) {
					stepError = ((result as any).data?.error as string) || 'An error occurred during submission.';
					await update({ reset: false });
				} else {
					await update();
				}
				isSubmitting = false;
			};
		}}
	>
		<!-- Header -->
		<div class="mb-6 mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
			<div>
				<h2 class="text-3xl font-extrabold tracking-tight text-text-primary sm:text-4xl">Add New Record</h2>
				<p class="mt-2 text-base font-medium text-text-muted">
					Create a new case record for processing. All required fields are across the dashboard.
				</p>
			</div>
			
			{#if stepError}
				<div class="rounded-md bg-error-light p-3 text-sm text-error-dark border border-red-200">
					{stepError}
				</div>
			{:else if form?.success}
				<div class="rounded-md bg-green-50 p-3 text-sm text-green-700 border border-green-200 font-medium">
					{form.success}
				</div>
			{:else if form?.error}
				<div class="rounded-md bg-error-light p-3 text-sm text-error-dark border border-red-200">
					Error: {form.error}
				</div>
			{/if}
		</div>

		<!-- Main Grid Layout -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
			
			<!-- Column 1: Client, Case, & Payment Data -->
			<div class="flex flex-col gap-6">
				<!-- Client Info Card -->
				<section class="rounded-xl border-2 border-border bg-white shadow-md transition-all hover:shadow-lg">
					<div class="border-b-2 border-border bg-surface px-4 py-3">
						<h3 class="font-bold text-text-primary flex items-center gap-2 uppercase tracking-wide text-sm">
							<svg class="w-4 h-4 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
							</svg>
							Client Details
						</h3>
					</div>
					<div class="p-4">
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
				</section>
				
				<!-- Case Details Card -->
				<section class="rounded-xl border-2 border-border bg-white shadow-md transition-all hover:shadow-lg">
					<div class="border-b-2 border-border bg-surface px-4 py-3">
						<h3 class="font-bold text-text-primary flex items-center gap-2 uppercase tracking-wide text-sm">
							<svg class="w-4 h-4 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
							</svg>
							Case Configuration
						</h3>
					</div>
					<div class="p-4 bg-surface/30">
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
				</section>

				<!-- Payment Details Card -->
				<section class="rounded-xl border-2 border-border bg-white shadow-md transition-all hover:shadow-lg">
					<div class="border-b-2 border-border bg-surface px-4 py-3">
						<h3 class="font-bold text-text-primary flex items-center gap-2 uppercase tracking-wide text-sm">
							<svg class="w-4 h-4 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
							</svg>
							Billing Details
						</h3>
					</div>
					<div class="p-4">
						<PaymentInfo
							{total_amount}
							bind:paid_amount
							{excess_payment}
							{payInFull}
							bind:payment_method
						/>
					</div>
				</section>
			</div>

			<!-- Column 2: Logistics & Materials -->
			<div class="flex flex-col gap-6">

				<!-- Documentation In Card -->
				<section class="rounded-xl border-2 border-border bg-white shadow-md transition-all hover:shadow-lg">
					<div class="border-b-2 border-border bg-surface px-4 py-3">
						<h3 class="font-bold text-text-primary flex items-center gap-2 uppercase tracking-wide text-sm">
							<svg class="w-4 h-4 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
							</svg>
							Time IN & Documentation
						</h3>
					</div>
					<div class="p-4">
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
				</section>

				<!-- Materials Usage Card -->
				<section class="rounded-xl border-2 border-border bg-white shadow-md transition-all hover:shadow-lg">
					<div class="border-b-2 border-border bg-surface px-4 py-3">
						<h3 class="font-bold text-text-primary flex items-center gap-2 uppercase tracking-wide text-sm">
							<svg class="w-4 h-4 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
							</svg>
							Inventory Usage
						</h3>
					</div>
					<div class="p-4">
						<InventoryUsage
							{data}
							bind:inventoryUsages
							{addInventoryRow}
							{removeInventoryRow}
							{handleInventorySelect}
						/>
					</div>
				</section>
				
				<!-- Delivery & Work Details Card -->
				<section class="rounded-xl border-2 border-border bg-white shadow-md flex-1 flex flex-col transition-all hover:shadow-lg">
					<div class="border-b-2 border-border bg-surface px-4 py-3">
						<h3 class="font-bold text-text-primary flex items-center gap-2 uppercase tracking-wide text-sm">
							<svg class="w-4 h-4 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
							Logistics & Team
						</h3>
					</div>
					<div class="p-4 flex-1">
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
				</section>
			</div>
		</div>

		<!-- Dental Chart Card (full width) -->
		<section class="mt-6 rounded-xl border-2 border-border bg-white shadow-md transition-all hover:shadow-lg">
			<div class="border-b-2 border-border bg-surface px-4 py-3">
				<h3 class="font-bold text-text-primary flex items-center gap-2 uppercase tracking-wide text-sm">
					<svg class="w-4 h-4 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
					</svg>
					Dental Chart
					<span class="ml-2 text-xs font-normal normal-case text-text-muted">
						Click a tooth to mark it · Right-click to edit surfaces
					</span>
				</h3>
			</div>
			<div class="p-4">
				<DentalChart />
			</div>
		</section>

		<!-- Sticky Footer Bar -->
		<div class="fixed bottom-0 left-0 right-0 border-t border-border bg-white/90 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] backdrop-blur-md z-40">
			<div class="mx-auto flex w-full max-w-[1400px] flex-col sm:flex-row flex-wrap items-center justify-between gap-4 px-4 md:px-8">
				<div class="flex flex-wrap items-baseline gap-3">
					<span class="text-sm font-medium text-text-muted uppercase tracking-wider">Total Amount</span>
					<span class="text-2xl font-bold text-text-primary">
						<span class="text-sm font-medium text-text-muted">₱</span>{total_amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
					</span>
				</div>
				<button
					type="submit"
					disabled={isSubmitting}
					class="w-full sm:w-auto rounded-lg bg-primary px-10 py-3 text-sm font-bold tracking-wide text-white shadow-md transition-all hover:bg-indigo-700 hover:shadow-lg focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:bg-indigo-400 disabled:opacity-70 active:scale-[0.98]"
				>
					{isSubmitting ? 'Submitting...' : 'Add Record'}
				</button>
			</div>
		</div>
	</form>
</div>

<CameraModal bind:show={showCameraModal} bind:fileInput={in_file} onCapture={handleInImageChange} />
