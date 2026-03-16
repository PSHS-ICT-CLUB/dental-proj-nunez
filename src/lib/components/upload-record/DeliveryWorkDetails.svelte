<script lang="ts">
	let {
		showDeliveryDetails = $bindable(),
		deliveryCourier = $bindable(),
		deliveryFee = $bindable(),
		deliveryNotes = $bindable(),
		dateDropoff = $bindable(),
		actualDropoff = $bindable(),
		finishBy = $bindable(),
		technicianInputValue = $bindable(),
		showTechnicianDropdown = $bindable(),
		selectedTechnicians,
		filteredTechnicians,
		addTechnician,
		removeTechnician,
		handleTechnicianInputKeydown,
		assignedTechnicians
	}: {
		showDeliveryDetails: boolean;
		deliveryCourier: string;
		deliveryFee: number | undefined;
		deliveryNotes: string;
		dateDropoff: string;
		actualDropoff: string;
		finishBy: string;
		technicianInputValue: string;
		showTechnicianDropdown: boolean;
		selectedTechnicians: string[];
		filteredTechnicians: any[];
		addTechnician: (name: string) => void;
		removeTechnician: (name: string) => void;
		handleTechnicianInputKeydown: (event: KeyboardEvent) => void;
		assignedTechnicians: string;
	} = $props();

	let technicianContainer = $state<HTMLDivElement>();
</script>

<div class="overflow-hidden rounded-md border border-gray-200">
	<!-- Header with toggle -->
	<button
		type="button"
		onclick={() => (showDeliveryDetails = !showDeliveryDetails)}
		class="flex w-full items-center justify-between bg-gray-50 p-3 transition-colors hover:bg-gray-100"
	>
		<div class="flex items-center gap-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4 text-gray-500"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
				/>
			</svg>
			<h3 class="text-[10px] font-bold tracking-wider text-gray-600 uppercase">
				Delivery & Work Details
			</h3>
			<span class="text-[9px] text-gray-400">(optional)</span>
		</div>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-4 w-4 text-gray-500 transition-transform {showDeliveryDetails ? 'rotate-180' : ''}"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	{#if showDeliveryDetails}
		<div class="space-y-4 p-4">
			<!-- Delivery Details Section -->
			<div class="space-y-3">
				<h4 class="border-b border-gray-100 pb-1 text-[10px] font-semibold text-gray-500 uppercase">
					Delivery Information
				</h4>
				<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
					<div>
						<label
							class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase"
							for="date_dropoff"
						>
							Expected Delivery Date
							<input
								type="datetime-local"
								id="date_dropoff"
								name="date_dropoff"
								bind:value={dateDropoff}
								class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
							/>
						</label>
						<p class="mt-1 text-[10px] text-gray-400">When the case should be delivered</p>
					</div>
					<div>
						<label
							class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase"
							for="actual_dropoff"
						>
							Actual Delivery Date
							<input
								type="datetime-local"
								id="actual_dropoff"
								name="actual_dropoff"
								bind:value={actualDropoff}
								class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
							/>
						</label>
						<p class="mt-1 text-[10px] text-gray-400">When the case was actually delivered</p>
					</div>
				</div>
				<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
					<div>
						<label
							class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase"
							for="delivery_courier"
						>
							Delivery Courier
							<input
								type="text"
								id="delivery_courier"
								name="delivery_courier"
								bind:value={deliveryCourier}
								class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
								placeholder="e.g. Lalamove, Grab, In-house"
							/>
						</label>
					</div>
					<div>
						<label
							class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase"
							for="delivery_fee"
						>
							Delivery Fee
							<div class="relative mt-1">
								<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
									<span class="font-medium text-gray-500 sm:text-sm">₱</span>
								</div>
								<input
									type="number"
									id="delivery_fee"
									name="delivery_fee"
									bind:value={deliveryFee}
									class="block w-full rounded-md border border-gray-300 py-2 pr-3 pl-7 text-sm focus:border-indigo-500 focus:ring-indigo-500"
									min="0"
									step="0.01"
									placeholder="0.00"
								/>
							</div>
						</label>
					</div>
				</div>
				<div>
					<label
						class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase"
						for="delivery_notes"
					>
						Delivery Notes
						<textarea
							id="delivery_notes"
							name="delivery_notes"
							bind:value={deliveryNotes}
							rows="2"
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
							placeholder="Optional delivery instructions or remarks"
						></textarea>
					</label>
				</div>
			</div>

			<!-- Divider -->
			<div class="border-t border-gray-200"></div>

			<!-- Work Assignment Section -->
			<div class="space-y-3">
				<h4 class="border-b border-gray-100 pb-1 text-[10px] font-semibold text-gray-500 uppercase">
					Work Assignment
				</h4>
				<div>
					<label
						class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase"
						for="finish_by"
					>
						To be finished at
						<input
							type="datetime-local"
							id="finish_by"
							name="finish_by"
							bind:value={finishBy}
							class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
						/>
					</label>
				</div>

				<div>
					<label class="block text-[10px] font-medium tracking-wider text-gray-500 uppercase"
						>Assigned Technicians</label
					>

					{#if selectedTechnicians.length > 0}
						<div class="mb-2 flex flex-wrap gap-1.5">
							{#each selectedTechnicians as tech}
								<span
									class="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-1 text-xs text-indigo-700"
								>
									{tech}
									<button
										type="button"
										onclick={() => removeTechnician(tech)}
										class="hover:text-indigo-900"
									>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-3 w-3"
											viewBox="0 0 20 20"
											fill="currentColor"
										>
											<path
												fill-rule="evenodd"
												d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
												clip-rule="evenodd"
											/>
										</svg>
									</button>
								</span>
							{/each}
						</div>
					{/if}

					<div class="relative" bind:this={technicianContainer}>
						<input
							type="text"
							bind:value={technicianInputValue}
							onfocus={() => (showTechnicianDropdown = true)}
							onblur={(e) => {
								const relatedTarget = e.relatedTarget as Node;
								if (!relatedTarget || !technicianContainer.contains(relatedTarget)) {
									showTechnicianDropdown = false;
								}
							}}
							onkeydown={handleTechnicianInputKeydown}
							class="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
							placeholder="Type to search technicians or press Enter to add new"
						/>

						{#if showTechnicianDropdown && (filteredTechnicians.length > 0 || technicianInputValue.trim())}
							<div
								class="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg"
							>
								{#if filteredTechnicians.length > 0}
									{#each filteredTechnicians as tech}
										<button
											type="button"
											class="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-indigo-50"
											onclick={() => addTechnician(tech.name)}
										>
											<span class="font-medium">{tech.name}</span>
											{#if tech.role}
												<span class="text-xs text-gray-500">({tech.role})</span>
											{/if}
										</button>
									{/each}
								{/if}
								{#if technicianInputValue.trim() && !filteredTechnicians.some((t) => t.name.toLowerCase() === technicianInputValue.toLowerCase())}
									<button
										type="button"
										class="w-full px-3 py-2 text-left text-sm text-indigo-600 italic hover:bg-indigo-50"
										onclick={() => addTechnician(technicianInputValue.trim())}
									>
										+ Add "{technicianInputValue}" as new technician
									</button>
								{/if}
							</div>
						{/if}
					</div>

					<input type="hidden" name="assigned_technicians" value={assignedTechnicians} />

					<p class="mt-1 text-[10px] text-gray-500">
						Select from existing technicians or type a new name and press Enter.
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>
