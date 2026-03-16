<script lang="ts">
	import type { PageData } from '../../../routes/upload-record/$types';

	let showInventory = $state(false);

	let {
		data,
		inventoryUsages = $bindable(),
		addInventoryRow,
		removeInventoryRow,
		handleInventorySelect
	}: {
		data: PageData;
		inventoryUsages: { itemId: number; quantity: number; maxStock: number; searchTerm?: string; showDropdown?: boolean }[];
		addInventoryRow: () => void;
		removeInventoryRow: (index: number) => void;
		handleInventorySelect: (index: number, itemIdStr: string) => void;
	} = $props();

	function getItemName(itemId: number) {
		const item = data?.inventoryTableItems?.find(i => i.id === itemId);
		return item ? item.name : '';
	}

	function handleSearch(index: number, value: string) {
		inventoryUsages[index].searchTerm = value;
		inventoryUsages[index].showDropdown = true;
	}

	function selectItem(index: number, item: any) {
		handleInventorySelect(index, item.id.toString());
		inventoryUsages[index].searchTerm = item.name;
		inventoryUsages[index].showDropdown = false;
	}
</script>

<div class="rounded-md border border-border h-full flex flex-col">
	<button
		type="button"
		onclick={() => (showInventory = !showInventory)}
		class="w-full flex items-center justify-between p-3 bg-surface hover:bg-surface-alt transition-colors"
	>
		<h3 class="text-[10px] items-center flex font-bold tracking-wider text-text-secondary uppercase">
			Inventory Usage
			<span class="ml-2 rounded-full bg-surface-alt px-2 py-0.5 text-[9px] font-semibold text-text-muted">Optional</span>
		</h3>

		<div class="flex items-center gap-3">
			<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
			<span
				onclick={(e) => {
					e.stopPropagation();
					addInventoryRow();
					showInventory = true;
				}}
				class="text-xs font-semibold text-primary hover:text-primary-light flex items-center gap-1 cursor-pointer"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
				</svg>
				Material
			</span>

			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4 text-text-muted transition-transform {showInventory ? 'rotate-180' : ''}"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
			</svg>
		</div>
	</button>

	{#if showInventory}
		<div class="p-4 pt-3 flex-1 flex flex-col">
			<div class="flex-1 pr-1">
		{#if inventoryUsages.length === 0}
			<div class="h-full flex items-center justify-center min-h-[100px] border-2 border-dashed border-surface-alt rounded">
				<p class="text-sm text-text-muted italic text-center px-4">Click "Material" to track supplies used.</p>
			</div>
		{:else}
			<div class="flex flex-col gap-3">
				{#each inventoryUsages as usage, i}
					<div class="flex flex-col gap-2 w-full bg-surface p-3 rounded border border-surface-alt relative group">
						<div class="w-full pr-6 relative">
							<div class="relative">
								<input
									type="text"
									placeholder="Search material..."
									class="block w-full rounded border border-border px-3 py-1.5 text-sm text-text-primary shadow-sm focus:border-primary focus:ring-primary"
									value={usage.searchTerm ?? getItemName(usage.itemId)}
									oninput={(e) => handleSearch(i, e.currentTarget.value)}
									onfocus={() => inventoryUsages[i].showDropdown = true}
									onblur={(e) => {
										// Delay blur to allow click on dropdown
										setTimeout(() => {
											if (inventoryUsages[i]) inventoryUsages[i].showDropdown = false;
										}, 200);
									}}
								/>
								<div class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
									<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
									</svg>
								</div>
							</div>

							{#if usage.showDropdown}
								{@const filteredItems = (data?.inventoryTableItems || []).filter(item => 
									!usage.searchTerm || 
									item.name.toLowerCase().includes(usage.searchTerm.toLowerCase())
								)}
								<ul class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl bg-white p-1 shadow-2xl ring-1 ring-black/5 focus:outline-none">
									{#if filteredItems.length > 0}
										{#each filteredItems as item}
											<li class="relative p-0.5">
												<button
													type="button"
													class="flex w-full items-center justify-between rounded px-2 py-1.5 text-left text-sm transition-colors hover:bg-primary/10 {usage.itemId === item.id ? 'bg-primary/5 text-primary font-medium' : 'text-text-primary'}"
													onclick={() => selectItem(i, item)}
												>
													<div class="flex flex-col">
														<span class="truncate">{item.name}</span>
														<span class="text-[10px] text-text-muted">{item.currentStock} {item.unit || ''} available</span>
													</div>
													{#if usage.itemId === item.id}
														<svg class="h-3.5 w-3.5 text-primary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
															<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
														</svg>
													{/if}
												</button>
											</li>
										{/each}
									{:else}
										<li class="px-3 py-2 text-xs text-text-muted italic">No materials found</li>
									{/if}
								</ul>
							{/if}
						</div>
						<div class="w-full flex items-center gap-2">
							<div class="flex items-center border border-border rounded shadow-sm overflow-hidden bg-white w-24">
								<input
									type="number"
									min="1"
									bind:value={usage.quantity}
									disabled={usage.itemId === 0}
									class="block w-full py-1.5 px-2 text-sm text-center focus:outline-none disabled:bg-surface-alt disabled:text-text-muted"
									required
								/>
							</div>
							<span class="text-xs text-text-muted font-medium">used</span>
						</div>
						<button
							type="button"
							onclick={() => removeInventoryRow(i)}
							class="absolute top-2 right-2 text-text-muted hover:text-red-500 p-1 rounded-full hover:bg-white transition-colors"
							title="Remove Item"
						>
							<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
							</svg>
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>
		</div>
{/if}

<input type="hidden" name="inventory_usage" value={JSON.stringify(inventoryUsages)} />
</div>
