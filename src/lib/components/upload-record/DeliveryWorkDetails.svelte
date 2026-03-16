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

<div class="rounded-md border border-border">
	<!-- Header with toggle -->
	<button
		type="button"
		onclick={() => (showDeliveryDetails = !showDeliveryDetails)}
		class="flex w-full items-center justify-between bg-surface p-3 transition-colors hover:bg-surface-alt"
	>
		<div class="flex items-center gap-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4 text-text-muted"
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
			<h3 class="text-[10px] font-bold tracking-wider text-text-secondary uppercase">
				Delivery & Work Details
			</h3>
			<span class="text-[9px] text-text-muted">(optional)</span>
		</div>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			class="h-4 w-4 text-text-muted transition-transform {showDeliveryDetails ? 'rotate-180' : ''}"
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
				<h4 class="border-b border-surface-alt pb-1 text-[10px] font-semibold text-text-muted uppercase">
					Delivery Information
				</h4>
				<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
					<div>
						<label
							class="block text-[10px] font-medium tracking-wider text-text-muted uppercase"
							for="date_dropoff"
						>
							Expected Delivery Date
							<input
								type="datetime-local"
								id="date_dropoff"
								name="date_dropoff"
								bind:value={dateDropoff}
								class="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-primary"
							/>
						</label>
						<p class="mt-1 text-[10px] text-text-muted">When the case should be delivered</p>
					</div>
					<div>
						<label
							class="block text-[10px] font-medium tracking-wider text-text-muted uppercase"
							for="actual_dropoff"
						>
							Actual Delivery Date
							<input
								type="datetime-local"
								id="actual_dropoff"
								name="actual_dropoff"
								bind:value={actualDropoff}
								class="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-primary"
							/>
						</label>
						<p class="mt-1 text-[10px] text-text-muted">When the case was actually delivered</p>
					</div>
				</div>
				<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
					<div>
						<label
							class="block text-[10px] font-medium tracking-wider text-text-muted uppercase"
							for="delivery_courier"
						>
							Delivery Courier
							<input
								type="text"
								id="delivery_courier"
								name="delivery_courier"
								bind:value={deliveryCourier}
								class="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-primary"
								placeholder="e.g. Lalamove, Grab, In-house"
							/>
						</label>
					</div>
					<div>
						<label
							class="block text-[10px] font-medium tracking-wider text-text-muted uppercase"
							for="delivery_fee"
						>
							Delivery Fee
							<div class="relative mt-1">
								<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5">
									<span class="font-medium text-text-muted sm:text-sm">₱</span>
								</div>
								<input
									type="number"
									id="delivery_fee"
									name="delivery_fee"
									bind:value={deliveryFee}
									class="block w-full rounded-md border border-border py-2 pr-3 pl-7 text-sm focus:border-primary focus:ring-primary"
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
						class="block text-[10px] font-medium tracking-wider text-text-muted uppercase"
						for="delivery_notes"
					>
						Delivery Notes
						<textarea
							id="delivery_notes"
							name="delivery_notes"
							bind:value={deliveryNotes}
							rows="2"
							class="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-primary"
							placeholder="Optional delivery instructions or remarks"
						></textarea>
					</label>
				</div>
			</div>

			<!-- Divider -->
			<div class="border-t border-border"></div>

			<!-- Work Assignment Section -->
			<div class="space-y-3">
				<h4 class="border-b border-surface-alt pb-1 text-[10px] font-semibold text-text-muted uppercase">
					Work Assignment
				</h4>
				<div>
					<label
						class="block text-[10px] font-medium tracking-wider text-text-muted uppercase"
						for="finish_by"
					>
						To be finished at
						<input
							type="datetime-local"
							id="finish_by"
							name="finish_by"
							bind:value={finishBy}
							class="mt-1 block w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-primary"
						/>
					</label>
				</div>

				<div>
					<label class="block text-[10px] font-medium tracking-wider text-text-muted uppercase"
						>Assigned Technicians</label
					>

					{#if selectedTechnicians.length > 0}
						<div class="mb-2 flex flex-wrap gap-1.5">
							{#each selectedTechnicians as tech}
								<span
									class="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-1 text-xs text-primary-dark"
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
							class="block w-full appearance-none rounded-md border border-border px-3 py-2 text-text-primary shadow-sm focus:border-primary focus:ring-primary focus:outline-none sm:text-sm transition-all"
							placeholder="Search technician..."
						/>

						{#if showTechnicianDropdown && (filteredTechnicians.length > 0 || technicianInputValue.trim())}
							<ul
								class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white p-1 shadow-2xl ring-1 ring-black/5 focus:outline-none"
								role="listbox"
							>
								{#if filteredTechnicians.length > 0}
									<div class="px-2 py-1.5 text-[10px] font-bold text-text-muted uppercase tracking-wider">Select Technician</div>
									{#each filteredTechnicians as tech}
										<li class="p-0.5">
											<button
												type="button"
												class="group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-all hover:bg-primary/10 text-text-primary"
												onclick={() => addTechnician(tech.name)}
											>
												<div class="flex items-center gap-2">
													<div class="flex h-7 w-7 items-center justify-center rounded-full bg-surface text-[10px] font-bold text-primary border border-border group-hover:bg-white group-hover:border-primary/30">
														{tech.name.split(' ').map(n => n[0]).join('').toUpperCase()}
													</div>
													<div class="flex flex-col">
														<span class="font-medium">{tech.name}</span>
														{#if tech.role}
															<span class="text-[10px] text-text-muted">{tech.role}</span>
														{/if}
													</div>
												</div>
												<svg class="h-4 w-4 text-primary opacity-0 transition-opacity group-hover:opacity-100" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
													<path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
												</svg>
											</button>
										</li>
									{/each}
								{/if}
								{#if technicianInputValue.trim() && !filteredTechnicians.some((t) => t.name.toLowerCase() === technicianInputValue.toLowerCase())}
									<div class="border-t border-border/50 my-1"></div>
									<li class="p-1">
										<button
											type="button"
											class="flex w-full items-center gap-3 rounded-lg bg-primary/5 px-3 py-2.5 text-left text-sm font-bold text-primary transition-all hover:bg-primary hover:text-white"
											onclick={() => addTechnician(technicianInputValue.trim())}
										>
											<div class="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 group-hover:bg-white/20">
												<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
												</svg>
											</div>
											<span class="truncate">Add "{technicianInputValue}"</span>
										</button>
									</li>
								{/if}
							</ul>
						{/if}
					</div>

					<input type="hidden" name="assigned_technicians" value={assignedTechnicians} />

					<p class="mt-1 text-[10px] text-text-muted">
						Select from existing technicians or type a new name and press Enter.
					</p>
				</div>
			</div>
		</div>
	{/if}
</div>
