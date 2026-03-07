<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, PageProps } from './$types';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data, form }: PageProps = $props();

	let { record } = data;

	// State management for dropdowns
	let allDoctors = $state(data?.doctors);
	let allClinics = $state(data?.clinics);
	// Simplify state management - remove dropdown visibility states
	let selectedDoctor = $state(data.record.doctorId);
	let selectedClinic = $state(data.record.clinicId);
	let availableDoctors = $state(allDoctors.filter((d) => d.clinicId === record.clinicId));
	let filteredDoctors = $state(allDoctors.filter((d) => d.clinicId === record.clinicId));

	// Additional state for searchable dropdowns
	let doctorInputValue = $state(record.doctorName);
	let clinicInputValue = $state(record.clinicName);
	let showDoctorDropdown = $state(false);
	let showClinicDropdown = $state(false);
	let filteredClinics = $state(allClinics);

	// State for form fields to preserve user input
	let caseNotes = $state(record.caseNotes || '');

	// Delivery & scheduling fields
	let deliveryCourier = $state(record.deliveryCourier || '');
	let deliveryFee = $state(record.deliveryFee ? String(record.deliveryFee) : '');
	let deliveryNotes = $state(record.deliveryNotes || '');
	let finishBy = $state(record.finishBy ? record.finishBy.slice(0, 16) : '');
	let assignedTechnicians = $state(record.assignedTechnicians || '');

	// Initialize with current values
	onMount(() => {
		// Set initial clinic
		const clinic = allClinics.find((c) => c.clinicId === record.clinicId);
		if (clinic) {
			clinicInputValue = clinic.clinicName;
			selectedClinic = clinic.clinicId;

			// Filter doctors for this clinic
			availableDoctors = allDoctors.filter((d) => d.clinicId === clinic.clinicId);
			filteredDoctors = availableDoctors;

			// Set initial doctor
			const doctor = availableDoctors.find((d) => d.doctorId === record.doctorId);
			if (doctor) {
				doctorInputValue = doctor.doctorName;
				selectedDoctor = doctor.doctorId;
			}
		}
	});

	function filterDoctors() {
		filteredDoctors = availableDoctors.filter((doctor) =>
			doctor.doctorName.toLowerCase().includes(doctorInputValue.toLowerCase())
		);
		showDoctorDropdown = doctorInputValue.length > 0 && filteredDoctors.length > 0;
	}

	function selectDoctor(doctor: (typeof allDoctors)[0]) {
		selectedDoctor = doctor.doctorId;
		doctorInputValue = doctor.doctorName;
		showDoctorDropdown = false;
	}

	function filterClinics() {
		filteredClinics = allClinics.filter((clinic) =>
			clinic.clinicName.toLowerCase().includes(clinicInputValue.toLowerCase())
		);
		showClinicDropdown = clinicInputValue.length > 0 && filteredClinics.length > 0;
		selectedDoctor = null;
		doctorInputValue = '';
	}

	function selectClinic(clinic: (typeof allClinics)[0]) {
		selectedClinic = clinic.clinicId;
		clinicInputValue = clinic.clinicName;
		showClinicDropdown = false;

		// Reset doctor selection first
		selectedDoctor = null;
		doctorInputValue = '';

		// Update available doctors for this clinic
		availableDoctors = allDoctors.filter((doctor) => doctor.clinicId === clinic.clinicId);
		filteredDoctors = availableDoctors;

		// Auto-select if only one doctor
		if (availableDoctors.length === 1) {
			const doctor = availableDoctors[0];
			selectedDoctor = doctor.doctorId;
			doctorInputValue = doctor.doctorName;
		}
	}

	// Password-confirmation modal for updates
	let showPasswordModal = $state(false);
	let editPassword = $state('');
	let editForm: HTMLFormElement | null = $state(null);

	// Compute changes that will be made
	const changes = $derived.by(() => {
		const changesList: Array<{ field: string; oldValue: string; newValue: string }> = [];

		// Check clinic change
		const originalClinicName = record.clinicName || '';
		if (clinicInputValue !== originalClinicName) {
			changesList.push({
				field: 'Clinic',
				oldValue: originalClinicName,
				newValue: clinicInputValue
			});
		}

		// Check doctor change
		const originalDoctorName = record.doctorName || '';
		if (doctorInputValue !== originalDoctorName) {
			changesList.push({
				field: 'Doctor',
				oldValue: originalDoctorName,
				newValue: doctorInputValue
			});
		}

		// Check patient name change
		const originalPatientName = record.patientName || '';
		if (patientName !== originalPatientName) {
			changesList.push({
				field: 'Patient Name',
				oldValue: originalPatientName,
				newValue: patientName
			});
		}

		// Check notes change
		const originalNotes = record.caseNotes || '';
		if (caseNotes !== originalNotes) {
			changesList.push({
				field: 'Case Notes',
				oldValue: originalNotes,
				newValue: caseNotes
			});
		}

		// Check delivery courier change
		const originalCourier = record.deliveryCourier || '';
		if (deliveryCourier !== originalCourier) {
			changesList.push({
				field: 'Delivery Courier',
				oldValue: originalCourier,
				newValue: deliveryCourier
			});
		}

		// Check delivery fee change
		const originalFee = record.deliveryFee ? String(record.deliveryFee) : '';
		if (deliveryFee !== originalFee) {
			changesList.push({
				field: 'Delivery Fee',
				oldValue: originalFee,
				newValue: deliveryFee
			});
		}

		// Check delivery notes change
		const originalDeliveryNotes = record.deliveryNotes || '';
		if (deliveryNotes !== originalDeliveryNotes) {
			changesList.push({
				field: 'Delivery Notes',
				oldValue: originalDeliveryNotes,
				newValue: deliveryNotes
			});
		}

		// Check finish-by change
		const originalFinishBy = record.finishBy ? record.finishBy.slice(0, 16) : '';
		if (finishBy !== originalFinishBy) {
			changesList.push({
				field: 'To be finished at',
				oldValue: originalFinishBy,
				newValue: finishBy
			});
		}

		// Check assigned technicians change
		const originalTechnicians = record.assignedTechnicians || '';
		if (assignedTechnicians !== originalTechnicians) {
			changesList.push({
				field: 'Assigned Technicians',
				oldValue: originalTechnicians,
				newValue: assignedTechnicians
			});
		}

		return changesList;
	});

	function openPasswordModal() {
		if (!data.passwordIsSet) {
			alert('No password is set. Please set a password first in the Change Password page.');
			return;
		}
		editPassword = '';
		showPasswordModal = true;
	}

	function closePasswordModal() {
		showPasswordModal = false;
		editPassword = '';
		// Don't reset the form - preserve user's input
	}

	let isSubmitting = $state(false);
</script>

<div class="mx-auto max-w-2xl px-4 py-8">
	<div class="mb-8 flex items-center justify-between">
		<h1 class="text-2xl font-bold text-gray-900">Edit Record #{record.recordId}</h1>
		<a
			href="/"
			class="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
		>
			Back to List
		</a>
	</div>

	{#if !data.passwordIsSet}
		<div class="mb-4 rounded-md bg-yellow-50 p-4 text-yellow-800">
			<p class="font-semibold">⚠️ No password is set</p>
			<p class="mt-1 text-sm">
				You need to set a password before you can edit records. Please
				<a href="/change_password" class="font-medium underline">set a password</a> first.
			</p>
		</div>
	{/if}
	{#if form?.message}
		<div
			class="mb-4 rounded-md p-4 {form.success
				? 'bg-green-50 text-green-700'
				: 'bg-red-50 text-red-700'}"
		>
			{form.message}
		</div>
	{/if}
	{#if form?.error}
		<div class="mb-4 rounded-md bg-red-50 p-4 text-red-700">
			{form.error}
		</div>
	{/if}

	<form
		bind:this={editForm}
		method="POST"
		action="?/update"
		use:enhance={({ cancel }) => {
			isSubmitting = true;
			return async ({ result }) => {
				if (result.type === 'failure') {
					cancel();
					// Only close modal and clear password, don't reset form
					showPasswordModal = false;
					editPassword = '';
					alert(result.data?.error || 'Wrong password');
					isSubmitting = false;
					return;
				}
				if (result.type === 'success') {
					closePasswordModal();
					goto('/', { replaceState: true });
					isSubmitting = false;
				}
			};
		}}
		class="space-y-6 rounded-lg bg-white p-6 shadow-lg"
	>
		<input type="hidden" name="recordId" value={record.recordId} />

		<div class="grid gap-6 md:grid-cols-2">
			<!-- Clinic Name with Dropdown -->
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
					>
						{#each filteredClinics as clinic}
							<li class="role-none relative py-2 pr-9 pl-3">
								<button
									type="button"
									class="w-full cursor-pointer border-none bg-transparent text-left text-gray-900 hover:bg-indigo-600 hover:text-white"
									onclick={() => selectClinic(clinic)}
								>
									<span class="block truncate">{clinic.clinicName}</span>
								</button>
								{#if selectedClinic === clinic.clinicId}
									<span class="absolute inset-y-0 right-0 flex items-center pr-2 text-indigo-600"
										>✓</span
									>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
				<input type="hidden" name="clinicId" value={selectedClinic} />
			</div>

			<!-- Doctor Name with Dropdown -->
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
						placeholder={selectedClinic ? 'Doctor name' : 'Select a clinic first'}
					/>
				</label>
				{#if showDoctorDropdown}
					<ul
						class="ring-opacity-5 absolute z-10 mt-1 w-full rounded-md bg-white shadow-lg ring-1 ring-black focus:outline-none"
					>
						{#each filteredDoctors as doctor}
							<li class="role-none relative py-2 pr-9 pl-3">
								<button
									type="button"
									class="w-full cursor-pointer border-none bg-transparent text-left text-gray-900 hover:bg-indigo-600 hover:text-white"
									onclick={() => selectDoctor(doctor)}
								>
									<span class="block truncate">{doctor.doctorName}</span>
								</button>
								{#if selectedDoctor === doctor.doctorId}
									<span class="absolute inset-y-0 right-0 flex items-center pr-2 text-indigo-600"
										>✓</span
									>
								{/if}
							</li>
						{/each}
					</ul>
				{/if}
				<input type="hidden" name="doctorId" value={selectedDoctor} />
			</div>

			<!-- Patient Name -->
			<div>
				<label for="patient_name" class="mb-2 block text-sm font-bold text-gray-700">
					Patient Name
					<input
						type="text"
						id="patient_name"
						name="patientName"
						bind:value={patientName}
						required
						class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
						placeholder="Patient name"
					/>
				</label>
			</div>

			<!-- Timeline Redirect -->
			<div class="md:col-span-2 rounded bg-indigo-50 p-4 border border-indigo-100 flex flex-col sm:flex-row items-center justify-between gap-4">
				<div>
					<h3 class="text-sm font-bold text-indigo-900">Manage Workflow Status</h3>
					<p class="text-xs text-indigo-700 mt-1">Status changes are now managed in the dedicated workflow timeline to enforce proper staging logic.</p>
				</div>
				<a
					href={`/status/${record.recordId}`}
					class="whitespace-nowrap rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus-visible:outline flex items-center gap-2"
				>
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd" />
					</svg>
					Go to Timeline
				</a>
			</div>

			<!-- Case Notes -->
			<div class="md:col-span-2">
				<label for="caseNotes" class="block text-sm font-bold text-gray-700">Case Notes</label>
				<textarea
					id="caseNotes"
					name="caseNotes"
					rows="3"
					bind:value={caseNotes}
					class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
					placeholder="Enter patient observations, treatment notes, etc."
				></textarea>
			</div>

			<!-- Delivery Details -->
			<div>
				<label class="mb-1 block text-sm font-bold text-gray-700">Delivery Details (Optional)</label>
				<div class="space-y-2">
					<div>
						<label for="delivery_courier" class="block text-xs font-medium text-gray-600">
							Courier
						</label>
						<input
							type="text"
							id="delivery_courier"
							name="deliveryCourier"
							bind:value={deliveryCourier}
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
							placeholder="e.g. Lalamove, Grab, In-house"
						/>
					</div>
					<div>
						<label for="delivery_fee" class="block text-xs font-medium text-gray-600">
							Delivery Fee
						</label>
						<input
							type="number"
							step="0.01"
							min="0"
							id="delivery_fee"
							name="deliveryFee"
							bind:value={deliveryFee}
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
							placeholder="e.g. 150.00"
						/>
					</div>
					<div>
						<label for="delivery_notes" class="block text-xs font-medium text-gray-600">
							Notes
						</label>
						<textarea
							id="delivery_notes"
							name="deliveryNotes"
							rows="2"
							bind:value={deliveryNotes}
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
							placeholder="Optional delivery instructions or remarks"
						/>
					</div>
				</div>
			</div>

			<!-- To be finished at -->
			<div>
				<label for="finish_by" class="mb-1 block text-sm font-bold text-gray-700">
					To be finished at (Optional)
				</label>
				<input
					type="datetime-local"
					id="finish_by"
					name="finishBy"
					bind:value={finishBy}
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
				/>
			</div>

			<!-- Assigned Technicians -->
			<div class="md:col-span-2">
				<label for="assigned_technicians" class="mb-1 block text-sm font-bold text-gray-700">
					Assigned Technician(s)
				</label>
				<textarea
					id="assigned_technicians"
					name="assignedTechnicians"
					rows="2"
					bind:value={assignedTechnicians}
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
					placeholder="Enter one or more technician names (e.g. Juan, Maria, Pedro)"
				/>
				<p class="mt-1 text-xs text-gray-500">
					You can assign multiple technicians by separating names with commas.
				</p>
			</div>

			<!-- Submit Button -->
			<div class="flex justify-end">
				<button
					type="button"
					onclick={() => {
						openPasswordModal();
					}}
					class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
				>
					Update Record
				</button>
			</div>
		</div>
		<!-- Hidden password field that will be populated by modal -->
		<input type="hidden" name="confirm_password" value={editPassword} />
	</form>

	<!-- Password Confirmation Modal -->
	{#if showPasswordModal}
		<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 print:hidden">
			<div class="mx-4 w-full max-w-lg rounded-lg bg-white shadow-lg">
				<div class="p-4">
					<h3 class="text-lg font-medium text-gray-900">Confirm update</h3>
					<div class="mt-3 rounded-md bg-gray-50 p-3 text-sm">
						<p class="mb-2 font-semibold text-gray-900">Record Information:</p>
						<div class="space-y-1.5 text-gray-700">
							<div class="flex">
								<span class="w-28 font-medium">Record ID:</span>
								<span>{record.recordId}</span>
							</div>
							<div class="flex">
								<span class="w-28 font-medium">Patient:</span>
								<span>{record.patientName}</span>
							</div>
							<div class="flex">
								<span class="w-28 font-medium">Clinic:</span>
								<span>{record.clinicName}</span>
							</div>
							<div class="flex">
								<span class="w-28 font-medium">Doctor:</span>
								<span>{record.doctorName || '-'}</span>
							</div>
							<div class="flex">
								<span class="w-28 font-medium">Date Pickup:</span>
								<span>{record.datePickup || '-'}</span>
							</div>
							<div class="flex">
								<span class="w-28 font-medium">Date Dropoff:</span>
								<span>{record.dateDropoff || '-'}</span>
							</div>
							<div class="flex">
								<span class="w-28 font-medium">Status:</span>
								<span>{record.caseStatus || 'No status'}</span>
							</div>
							{#if record.caseNotes}
								<div class="flex">
									<span class="w-28 font-medium">Notes:</span>
									<span class="truncate">{record.caseNotes}</span>
								</div>
							{/if}
						</div>
					</div>

					{#if changes.length > 0}
						<div class="mt-3 rounded-md bg-blue-50 p-3 text-sm">
							<p class="mb-2 font-semibold text-blue-900">Changes to be made:</p>
							<div class="space-y-2 text-blue-800">
								{#each changes as change}
									<div class="flex flex-col gap-1">
										<div class="font-medium">{change.field}:</div>
										<div class="flex items-center gap-2 pl-2">
											<span class="rounded bg-red-100 px-2 py-0.5 text-xs line-through">
												{change.oldValue || '(empty)'}
											</span>
											<span class="text-blue-600">→</span>
											<span class="rounded bg-green-100 px-2 py-0.5 text-xs font-medium">
												{change.newValue || '(empty)'}
											</span>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{:else}
						<div class="mt-3 rounded-md bg-yellow-50 p-3 text-sm">
							<p class="text-yellow-800">No changes detected. All values remain the same.</p>
						</div>
					{/if}

					<p class="mt-3 text-sm text-gray-600">
						Enter your password to confirm updating this record.
					</p>
					<div class="mt-4">
						<label for="edit_password" class="block text-sm font-medium text-gray-700"
							>Password</label
						>
						<input
							id="edit_password"
							type="password"
							bind:value={editPassword}
							class="mt-1 w-full rounded-md border border-gray-200 p-2 text-sm shadow-sm"
							required
							disabled={isSubmitting}
							onkeydown={(e) => {
								if (e.key === 'Enter' && editPassword && editForm && !isSubmitting) {
									e.preventDefault();
									// Update the hidden password field
									const hiddenField = editForm.querySelector(
										'input[name="confirm_password"]'
									) as HTMLInputElement;
									if (hiddenField) {
										hiddenField.value = editPassword;
									}
									// Submit the original form
									editForm.requestSubmit();
								}
							}}
						/>
						<div class="mt-4 flex justify-end gap-2">
							<button
								type="button"
								class="rounded border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50"
								onclick={closePasswordModal}>Cancel</button
							>
							<button
								type="button"
								class="rounded bg-indigo-600 px-3 py-1 text-sm text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
								disabled={!editPassword || isSubmitting}
								onclick={() => {
									if (editPassword && editForm && !isSubmitting) {
										// Update the hidden password field
										const hiddenField = editForm.querySelector(
											'input[name="confirm_password"]'
										) as HTMLInputElement;
										if (hiddenField) {
											hiddenField.value = editPassword;
										}
										// Submit the original form
										editForm.requestSubmit();
									}
								}}>{isSubmitting ? 'Updating...' : 'Confirm Update'}</button
							>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
