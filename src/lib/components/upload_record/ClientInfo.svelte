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
</script>

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
				{#if clinicInputValue.length > 0 && !allClinics.some((c) => c.clinicName.toLowerCase() === clinicInputValue.trim().toLowerCase())}
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
				{#if doctorInputValue.length > 0 && !allDoctors.some((d) => d.clinicId === selectedClinic?.clinicId && d.doctorName.toLowerCase() === doctorInputValue.trim().toLowerCase())}
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
