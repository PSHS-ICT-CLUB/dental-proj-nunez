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
			class="mb-2 block text-xs font-bold tracking-wider text-text-secondary uppercase"
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
				class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white p-1 shadow-2xl ring-1 ring-black/5 focus:outline-none"
				tabindex="-1"
				role="listbox"
				aria-labelledby="clinic_name"
			>
				{#if filteredClinics.length > 0}
					<div class="px-2 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider">Select Clinic</div>
					{#each filteredClinics as clinic}
						<li class="relative p-0.5" id={`clinic-option-${clinic.clinicId}`}>
							<button
								type="button"
								class="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-all hover:bg-primary/10 {selectedClinic?.clinicId === clinic.clinicId ? 'bg-primary/5 text-primary font-semibold' : 'text-text-primary'}"
								onclick={() => selectClinic(clinic)}
							>
								<span class="block truncate">{clinic.clinicName}</span>
								{#if selectedClinic?.clinicId === clinic.clinicId}
									<svg class="h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
										<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
									</svg>
								{/if}
							</button>
						</li>
					{/each}
				{:else if clinicInputValue.trim()}
					<div class="px-3 py-4 text-center">
						<p class="text-sm text-text-muted">No clinics found matching "{clinicInputValue}"</p>
					</div>
				{/if}

				{#if clinicInputValue.length > 0 && !allClinics.some((c) => c.clinicName.toLowerCase() === clinicInputValue.trim().toLowerCase())}
					<div class="border-t border-border/50 my-1"></div>
					<li class="p-1">
						<button
							type="button"
							class="flex w-full items-center gap-3 rounded-lg bg-primary/5 px-3 py-2.5 text-left text-sm font-bold text-primary transition-all hover:bg-primary hover:text-white"
							onclick={registerClinic}
							disabled={isRegisteringClinic}
						>
							<div class="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 group-hover:bg-white/20">
								<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
								</svg>
							</div>
							<span class="truncate">
								{isRegisteringClinic ? 'Registering...' : `Register "${clinicInputValue}"`}
							</span>
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
			class="mb-2 block text-xs font-bold tracking-wider text-text-secondary uppercase"
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
				class="block w-full appearance-none rounded-md border border-border px-3 py-2 text-text-primary shadow-md focus:border-primary focus:ring-primary focus:outline-none sm:text-sm transition-all"
				placeholder="Doctor name"
			/>
		</label>
		{#if showDoctorDropdown}
			<ul
				class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white p-1 shadow-2xl ring-1 ring-black/5 focus:outline-none"
				tabindex="-1"
				role="listbox"
				aria-labelledby="doctor_name"
			>
				{#if filteredDoctors.length > 0}
					<div class="px-2 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider">Select Doctor</div>
					{#each filteredDoctors as doctor}
						<li class="relative p-0.5" id={`doctor-option-${doctor.doctorId}`}>
							<button
								type="button"
								class="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-all hover:bg-primary/10 {selectedDoctor?.doctorId === doctor.doctorId ? 'bg-primary/5 text-primary font-semibold' : 'text-text-primary'}"
								onclick={() => selectDoctor(doctor)}
							>
								<span class="block truncate">{doctor.doctorName}</span>
								{#if selectedDoctor?.doctorId === doctor.doctorId}
									<svg class="h-4 w-4 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
										<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
									</svg>
								{/if}
							</button>
						</li>
					{/each}
				{:else if doctorInputValue.trim()}
					<div class="px-3 py-4 text-center">
						<p class="text-sm text-text-muted">No doctors found matching "{doctorInputValue}"</p>
					</div>
				{/if}

				{#if doctorInputValue.length > 0 && !allDoctors.some((d) => d.clinicId === selectedClinic?.clinicId && d.doctorName.toLowerCase() === doctorInputValue.trim().toLowerCase())}
					<div class="border-t border-border/50 my-1"></div>
					<li class="p-1">
						<button
							type="button"
							class="flex w-full items-center gap-3 rounded-lg bg-primary/5 px-3 py-2.5 text-left text-sm font-bold text-primary transition-all hover:bg-primary hover:text-white"
							onclick={registerDoctor}
							disabled={isRegisteringDoctor}
						>
							<div class="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 group-hover:bg-white/20">
								<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
								</svg>
							</div>
							<span class="truncate">
								{isRegisteringDoctor ? 'Registering...' : `Register "${doctorInputValue}"`}
							</span>
						</button>
					</li>
				{/if}
			</ul>
		{/if}
		<input type="hidden" name="doctor_name" value={selectedDoctor?.doctorId} />
	</div>

	<!-- Patient Details -->
	<div class="sm:col-span-2 grid grid-cols-[1fr_1fr_80px] sm:grid-cols-[1fr_1fr_100px] gap-2 sm:gap-4">
		<label for="patient_name" class="block text-xs font-bold tracking-wider text-text-secondary uppercase">
			Patient Name
			<input type="text" id="patient_name" name="patient_name" placeholder="Patient name" autocomplete="off" required maxlength="100" class="mt-2 block w-full appearance-none rounded-md border border-border px-3 py-2 text-text-primary shadow-sm focus:border-primary focus:ring-primary focus:outline-none sm:text-sm" />
		</label>
		<label for="patient_contact" class="block text-xs font-bold tracking-wider text-text-secondary uppercase">
			Contact No.
			<input type="text" id="patient_contact" name="patient_contact" placeholder="Contact number" maxlength="50" class="mt-2 block w-full appearance-none rounded-md border border-border px-3 py-2 text-text-primary shadow-sm focus:border-primary focus:ring-primary focus:outline-none sm:text-sm" />
		</label>
		<label for="patient_sex" class="block text-xs font-bold tracking-wider text-text-secondary uppercase">
			Sex
			<select id="patient_sex" name="patient_sex" class="mt-2 block w-full appearance-none rounded-md border border-border px-2 py-2 text-text-primary shadow-sm focus:border-primary focus:ring-primary focus:outline-none sm:text-sm">
				<option value="">-</option>
				<option value="M">M</option>
				<option value="F">F</option>
			</select>
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
