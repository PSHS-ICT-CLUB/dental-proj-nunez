<script lang="ts">
	import type { PageData } from '../../../routes/upload-record/$types';

	let showUpper = $state(true);
	let showLower = $state(true);

	let {
		data,
		selected_jaw,
		case_type_upper = $bindable(),
		case_type_lower = $bindable(),
		next_case_upper,
		next_case_lower,
		formatCaseNumber,
		upper_unit = $bindable(),
		upper_cost = $bindable(),
		lower_unit = $bindable(),
		lower_cost = $bindable()
	}: {
		data: PageData;
		selected_jaw: string;
		case_type_upper: number;
		case_type_lower: number;
		next_case_upper: number;
		next_case_lower: number;
		formatCaseNumber: (num: number, caseTypeId: number) => string;
		upper_unit: number;
		upper_cost: number;
		lower_unit: number;
		lower_cost: number;
	} = $props();
</script>

<div class="flex flex-col gap-4">
	<!-- Upper Section -->
	{#if selected_jaw === 'U/L' || selected_jaw === 'upper'}
		<div class="overflow-hidden rounded-md border border-gray-200">
			<button
				type="button"
				onclick={() => (showUpper = !showUpper)}
				class="flex w-full items-center justify-between bg-gray-50 p-3 transition-colors hover:bg-gray-100"
			>
				<h3 class="text-[10px] font-bold tracking-wider text-gray-600 uppercase">Upper</h3>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 text-gray-500 transition-transform {showUpper ? 'rotate-180' : ''}"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>

			<div class="p-4 {showUpper ? '' : 'hidden'}">
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
					<!-- Case Type -->
					<div>
						<label
							for="case_type_upper"
							class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase"
						>
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
						<label
							for="case_number_upper"
							class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase"
						>
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
						<label
							for="upper_description"
							class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase"
						>
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
						<label
							for="upper_unit"
							class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase"
						>
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
						<label
							class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase"
							for="upper_cost">Cost</label
						>
						<div class="relative mt-1">
							<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
								<span class="font-medium text-gray-500 sm:text-sm">₱</span>
							</div>
							<input
								type="number"
								id="upper_cost"
								name="upper_cost"
								bind:value={upper_cost}
								class="block w-full rounded-md border border-gray-300 py-2 pr-3 pl-7 text-sm focus:border-indigo-500 focus:ring-indigo-500"
								placeholder="0.00"
								min="0"
								required
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Lower Section -->
	{#if selected_jaw === 'U/L' || selected_jaw === 'lower'}
		<div class="overflow-hidden rounded-md border border-gray-200">
			<button
				type="button"
				onclick={() => (showLower = !showLower)}
				class="flex w-full items-center justify-between bg-gray-50 p-3 transition-colors hover:bg-gray-100"
			>
				<h3 class="text-[10px] font-bold tracking-wider text-gray-600 uppercase">Lower</h3>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4 text-gray-500 transition-transform {showLower ? 'rotate-180' : ''}"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M19 9l-7 7-7-7"
					/>
				</svg>
			</button>

			<div class="p-4 {showLower ? '' : 'hidden'}">
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
					<!-- Case Type -->
					<div>
						<label
							for="case_type_lower"
							class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase"
						>
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
						<label
							for="case_number_lower"
							class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase"
						>
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
						<label
							for="lower_description"
							class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase"
						>
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
						<label
							for="lower_unit"
							class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase"
						>
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
						<label
							class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase"
							for="lower_cost">Cost</label
						>
						<div class="relative mt-1">
							<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
								<span class="font-medium text-gray-500 sm:text-sm">₱</span>
							</div>
							<input
								type="number"
								id="lower_cost"
								name="lower_cost"
								bind:value={lower_cost}
								class="block w-full rounded-md border border-gray-300 py-2 pr-3 pl-7 text-sm focus:border-indigo-500 focus:ring-indigo-500"
								placeholder="0.00"
								min="0"
								required
							/>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
