<script lang="ts">
	let {
		allClinics,
		filteredClinics,
		clinicInputValue = $bindable(),
		showClinicDropdown = $bindable(),
		filterClinics,
		selectClinic,
		registerClinic,
		isRegisteringClinic,
		selectedClinic,
		allDoctors,
		filteredDoctors,
		doctorInputValue = $bindable(),
		showDoctorDropdown = $bindable(),
		filterDoctors,
		selectDoctor,
		registerDoctor,
		isRegisteringDoctor,
		selectedDoctor,
		selected_jaw = $bindable()
	}: {
		allClinics: any[];
		filteredClinics: any[];
		clinicInputValue: string;
		showClinicDropdown: boolean;
		filterClinics: () => void;
		selectClinic: (clinic: any) => void;
		registerClinic: () => void;
		isRegisteringClinic: boolean;
		selectedClinic: any;
		allDoctors: any[];
		filteredDoctors: any[];
		doctorInputValue: string;
		showDoctorDropdown: boolean;
		filterDoctors: () => void;
		selectDoctor: (doctor: any) => void;
		registerDoctor: () => void;
		isRegisteringDoctor: boolean;
		selectedDoctor: any;
		selected_jaw: string;
	} = $props();

	let clinicContainer = $state<HTMLDivElement>();
	let doctorContainer = $state<HTMLDivElement>();
</script>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
	<!-- Clinic Selection -->
	<div class="relative" bind:this={clinicContainer}>
		<label
			for="clinic_name"
			class="mb-2 block text-[10px] font-bold tracking-wider text-text-muted uppercase"
		>
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
				onblur={(e) => {
					const relatedTarget = e.relatedTarget as Node;
					if (!relatedTarget || !clinicContainer.contains(relatedTarget)) {
						showClinicDropdown = false;
					}
				}}
				required
				class="block w-full appearance-none rounded-md border border-border px-3 py-2 text-text-primary shadow-sm focus:border-primary focus:ring-primary focus:outline-none sm:text-sm"
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
							class="w-full cursor-pointer border-none bg-transparent py-2 pr-9 pl-3 text-left text-text-primary hover:bg-primary hover:text-white"
							onclick={() => selectClinic(clinic)}
						>
							<span class="block truncate">{clinic.clinicName}</span>
						</button>
						{#if selectedClinic?.clinicId === clinic.clinicId}
							<span
								class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-primary"
							>
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
				{#if clinicInputValue.length > 0 && !allClinics.some((c) => c.clinicName.toLowerCase() === clinicInputValue
								.trim()
								.toLowerCase())}
					<li class="role-none relative text-text-primary">
						<button
							type="button"
							class="flex w-full cursor-pointer items-center gap-2 border-none bg-transparent py-2 pr-9 pl-3 text-left font-medium hover:bg-primary hover:text-white"
							onclick={registerClinic}
							disabled={isRegisteringClinic}
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-4 w-4"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 4v16m8-8H4"
								/>
							</svg>
							{isRegisteringClinic
								? 'Registering...'
								: `Register "${clinicInputValue}" as New Clinic`}
						</button>
					</li>
				{/if}
			</ul>
		{/if}
		<input type="hidden" name="clinic_name" value={selectedClinic?.clinicId} />
	</div>

	<!-- Doctor Selection -->
	<div class="relative" bind:this={doctorContainer}>
		<label
			for="doctor_name"
			class="mb-2 block text-[10px] font-bold tracking-wider text-text-muted uppercase"
		>
			Doctor
			<input
				type="text"
				id="doctor_name"
				autocomplete="off"
				bind:value={doctorInputValue}
				oninput={filterDoctors}
				onfocus={() => (showDoctorDropdown = selectedClinic != null)}
				onblur={(e) => {
					const relatedTarget = e.relatedTarget as Node;
					if (!relatedTarget || !doctorContainer.contains(relatedTarget)) {
						showDoctorDropdown = false;
					}
				}}
				required
				disabled={!selectedClinic}
				class="block w-full appearance-none rounded-md border {selectedClinic
					? 'border-border'
					: 'cursor-not-allowed border-dashed border-border bg-surface-alt'} px-3 py-2 text-text-primary shadow-sm focus:border-primary focus:ring-primary focus:outline-none sm:text-sm"
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
							class="w-full cursor-pointer border-none bg-transparent py-2 pr-9 pl-3 text-left text-text-primary hover:bg-primary hover:text-white"
							onclick={() => selectDoctor(doctor)}
						>
							<span class="block truncate">{doctor.doctorName}</span>
						</button>
						{#if selectedDoctor?.doctorId === doctor.doctorId}
							<span
								class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-primary"
							>
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
				{#if doctorInputValue.length > 0 && !allDoctors.some((d) => d.clinicId === selectedClinic?.clinicId && d.doctorName.toLowerCase() === doctorInputValue
									.trim()
									.toLowerCase())}
					{#if selectedClinic}
						<li class="role-none relative text-text-primary">
							<button
								type="button"
								class="flex w-full cursor-pointer items-center gap-2 border-none bg-transparent py-2 pr-9 pl-3 text-left font-medium hover:bg-primary hover:text-white"
								onclick={registerDoctor}
								disabled={isRegisteringDoctor}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-4 w-4"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M12 4v16m8-8H4"
									/>
								</svg>
								{isRegisteringDoctor
									? 'Registering...'
									: `Register "${doctorInputValue}" as New Doctor`}
							</button>
						</li>
					{:else}
						<li class="relative cursor-default py-2 pr-9 pl-3 text-text-muted select-none">
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
		<label
			for="patient_name"
			class="mb-2 block text-[10px] font-bold tracking-wider text-text-muted uppercase"
		>
			Patient Name
			<input
				type="text"
				name="patient_name"
				placeholder="Patient name"
				autocomplete="off"
				required
				class="block w-full appearance-none rounded-md border border-border px-3 py-2 text-text-primary shadow-sm focus:border-primary focus:ring-primary focus:outline-none sm:text-sm"
			/>
		</label>
	</div>

	<!-- Jaw Selection -->
	<div>
		<label class="mb-2 block text-[10px] font-bold tracking-wider text-text-muted uppercase">
			Jaw Selection
		</label>
		<div class="flex w-full rounded-md border border-border" role="group">
			<button
				type="button"
				class="flex-1 rounded-l-md border-r px-2 py-1.5 text-xs font-medium {selected_jaw ===
				'upper'
					? 'border-indigo-600 bg-primary text-white'
					: 'border-border bg-white text-text-secondary hover:bg-surface'}"
				onclick={() => (selected_jaw = 'upper')}
			>
				Upper
			</button>
			<button
				type="button"
				class="flex-1 border-r px-2 py-1.5 text-xs font-medium {selected_jaw === 'U/L'
					? 'border-indigo-600 bg-primary text-white'
					: 'border-border bg-white text-text-secondary hover:bg-surface'}"
				onclick={() => (selected_jaw = 'U/L')}
			>
				U / L
			</button>
			<button
				type="button"
				class="flex-1 rounded-r-md px-2 py-1.5 text-xs font-medium {selected_jaw === 'lower'
					? 'border-indigo-600 bg-primary text-white'
					: 'border-transparent bg-white text-text-secondary hover:bg-surface'}"
				onclick={() => (selected_jaw = 'lower')}
			>
				Lower
			</button>
			<input type="text" name="selected_jaw" bind:value={selected_jaw} hidden />
		</div>
	</div>
</div>
