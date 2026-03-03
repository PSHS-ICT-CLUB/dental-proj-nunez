<script lang="ts">
	import type { PageData } from '../../../routes/upload_record/$types';

	let showInventory = $state(false);

	let {
		data,
		inventoryUsages = $bindable(),
		addInventoryRow,
		removeInventoryRow,
		handleInventorySelect
	}: {
		data: PageData;
		inventoryUsages: { itemId: number; quantity: number; maxStock: number }[];
		addInventoryRow: () => void;
		removeInventoryRow: (index: number) => void;
		handleInventorySelect: (index: number, itemIdStr: string) => void;
	} = $props();
</script>

<div class="rounded-md border border-gray-200 overflow-hidden h-full flex flex-col">
	<button
		type="button"
		onclick={() => (showInventory = !showInventory)}
		class="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
	>
		<h3 class="text-[10px] items-center flex font-bold tracking-wider text-gray-600 uppercase">
			Inventory Usage
			<span class="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-[9px] font-semibold text-gray-500">Optional</span>
		</h3>

		<div class="flex items-center gap-3">
			<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
			<span
				onclick={(e) => {
					e.stopPropagation();
					addInventoryRow();
					showInventory = true;
				}}
				class="text-xs font-semibold text-indigo-600 hover:text-indigo-500 flex items-center gap-1 cursor-pointer"
			>
				<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
				</svg>
				Material
			</span>

			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-4 w-4 text-gray-500 transition-transform {showInventory ? 'rotate-180' : ''}"
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
			<div class="flex-1 overflow-y-auto pr-1">
		{#if inventoryUsages.length === 0}
			<div class="h-full flex items-center justify-center min-h-[100px] border-2 border-dashed border-gray-100 rounded">
				<p class="text-sm text-gray-400 italic text-center px-4">Click "Material" to track supplies used.</p>
			</div>
		{:else}
			<div class="flex flex-col gap-3">
				{#each inventoryUsages as usage, i}
					<div class="flex flex-col gap-2 w-full bg-gray-50 p-3 rounded border border-gray-100 relative group">
						<div class="w-full pr-6">
							<select
								class="block w-full appearance-none rounded border border-gray-300 px-3 py-1.5 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
								onchange={(e) => handleInventorySelect(i, e.currentTarget.value)}
								required
							>
								<option value="" disabled selected={usage.itemId === 0}>Select material...</option>
								{#each data?.inventoryItems || [] as item}
									{#if item.currentStock > 0 || usage.itemId === item.id}
										<option value={item.id} selected={usage.itemId === item.id}>
											{item.name} ({item.currentStock} {item.unit || ''} left)
										</option>
									{/if}
								{/each}
							</select>
						</div>
						<div class="w-full flex items-center gap-2">
							<div class="flex items-center border border-gray-300 rounded shadow-sm overflow-hidden bg-white w-24">
								<input
									type="number"
									min="1"
									max={usage.maxStock > 0 ? usage.maxStock : undefined}
									bind:value={usage.quantity}
									disabled={usage.itemId === 0}
									class="block w-full py-1.5 px-2 text-sm text-center focus:outline-none disabled:bg-gray-100 disabled:text-gray-400"
									required
								/>
							</div>
							<span class="text-xs text-gray-500 font-medium">used</span>
						</div>
						<button
							type="button"
							onclick={() => removeInventoryRow(i)}
							class="absolute top-2 right-2 text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-white transition-colors"
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
