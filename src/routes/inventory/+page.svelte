<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: PageProps = $props();
	let { items, suppliers } = data;

	let isAddItemModalOpen = $state(false);
	let isAdjustStockModalOpen = $state(false);
	let isSubmitting = $state(false);
	
	let selectedItemId = $state<number | null>(null);
	let selectedItemName = $state<string>('');
	let selectedItemCurrentStock = $state<number>(0);
	
	function openAdjustStock(id: number, name: string, stock: number) {
		selectedItemId = id;
		selectedItemName = name;
		selectedItemCurrentStock = stock;
		isAdjustStockModalOpen = true;
	}

</script>

<div class="mx-auto max-w-6xl px-4 py-8">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold">Inventory Dashboard</h1>
		<div class="flex gap-2">
            <a href="/inventory/suppliers" class="rounded border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:bg-surface">Manage Suppliers</a>
            <a href="/inventory/logs" class="rounded border border-border bg-white px-4 py-2 text-sm font-medium text-text-secondary shadow-sm transition-colors hover:bg-surface">View History Logs</a>
			<button
				onclick={() => (isAddItemModalOpen = true)}
				class="rounded bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-primary"
			>
				+ Add New Item
			</button>
		</div>
	</div>

	{#if form?.success}
		<div class="mb-6 rounded-md bg-green-50 p-4 text-sm text-green-700 shadow-sm">
			{form?.message}
		</div>
	{/if}
	{#if form?.error}
		<div class="mb-6 rounded-md bg-error-light p-4 text-sm text-red-700 shadow-sm">
			{form?.error}
		</div>
	{/if}

	<!-- Items Table -->
	<div class="overflow-x-auto rounded-lg border border-border bg-white shadow-sm">
		<table class="min-w-full border-collapse">
			<thead class="bg-surface">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-text-muted uppercase">
						Item Name
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-text-muted uppercase">
						Category
					</th>
					<th class="px-6 py-3 text-right text-xs font-medium tracking-wider text-text-muted uppercase">
						Cost / Unit
					</th>
					<th class="px-6 py-3 text-center text-xs font-medium tracking-wider text-text-muted uppercase">
						Stock Level
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-text-muted uppercase">
						Supplier
					</th>
					<th class="px-6 py-3 text-center text-xs font-medium tracking-wider text-text-muted uppercase">
						Actions
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-border-border bg-white">
				{#if items && items.length > 0}
					{#each items as item}
						<tr class="transition-colors hover:bg-surface">
							<td class="px-6 py-4 text-sm text-text-primary font-medium whitespace-nowrap">
								{item.name}
							</td>
							<td class="px-6 py-4 text-sm text-text-muted whitespace-nowrap">
								<span class="inline-flex items-center rounded-full bg-surface-alt px-2.5 py-0.5 text-xs font-medium text-text-primary">
									{item.category || 'Uncategorized'}
								</span>
							</td>
							<td class="px-6 py-4 text-right text-sm text-text-primary whitespace-nowrap font-medium">
								₱{item.cost ? parseFloat(item.cost).toFixed(2) : '0.00'}
							</td>
							<td class="px-6 py-4 text-center whitespace-nowrap">
								<div class="flex flex-col items-center justify-center">
									<span class={`text-lg font-bold ${item.currentStock <= item.minimumStockLevel ? 'text-error-dark' : 'text-emerald-600'}`}>
										{item.currentStock} {item.unit || ''}
									</span>
									{#if item.currentStock <= item.minimumStockLevel}
										<span class="mt-1 text-[10px] font-bold text-red-500 uppercase tracking-widest bg-error-light px-2 py-0.5 rounded-full">Low Stock</span>
									{/if}
								</div>
							</td>
							<td class="px-6 py-4 text-sm text-text-muted whitespace-nowrap">
								{item.supplierName || '—'}
							</td>
							<td class="px-6 py-4 text-center text-sm whitespace-nowrap font-medium">
								<div class="flex items-center justify-center gap-3">
									<button
										onclick={() => openAdjustStock(item.id, item.name, item.currentStock)}
										class="text-amber-600 hover:text-amber-900 transition-colors"
									>
										Adjust Stock
									</button>
									<span class="text-border-border">|</span>
									{#if data.user && (data.user.role === 'admin' || data.user.role === 'dentist')}
									<form method="POST" action="?/deleteItem" use:enhance={() => {
										isSubmitting = true;
										return async ({ update }) => {
											await update();
											isSubmitting = false;
										};
									}} class="inline-flex">
										<input type="hidden" name="item_id" value={item.id} />
										<button
											type="submit"
											disabled={isSubmitting}
											class="text-red-500 hover:text-red-700 transition-colors disabled:opacity-50"
											onclick={(e) => {
												if (!confirm('Are you sure you want to delete this item?')) e.preventDefault();
											}}
										>
											{isSubmitting ? 'Deleting...' : 'Delete'}
										</button>
									</form>
									{/if}
								</div>
							</td>
						</tr>
					{/each}
				{:else}
					<tr>
						<td colspan="5" class="px-6 py-12 text-center text-sm text-text-muted">
							<div class="flex flex-col items-center justify-center space-y-3">
								<svg class="h-10 w-10 text-border-border" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
								</svg>
								<p>No inventory items found. Add your first item to start tracking stock.</p>
							</div>
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>

<!-- Add Item Modal -->
{#if isAddItemModalOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-text-text-primary/50 px-4">
		<div class="w-full max-w-md rounded-lg bg-white shadow-xl">
			<div class="flex items-center justify-between border-b border-border p-4">
				<h3 class="text-lg font-semibold text-text-primary">Add New Inventory Item</h3>
				<button onclick={() => (isAddItemModalOpen = false)} class="text-text-muted hover:text-text-muted" aria-label="Close">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="p-6">
				<form method="POST" action="?/addItem" class="space-y-4" use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						isAddItemModalOpen = false;
						await update();
						isSubmitting = false;
					};
				}}>
					<div>
						<label for="name" class="mb-1 block text-sm font-medium text-text-secondary">Item Name *</label>
						<input type="text" id="name" name="name" required class="w-full rounded border border-border p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary" />
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="category" class="mb-1 block text-sm font-medium text-text-secondary">Category</label>
							<input type="text" id="category" name="category" placeholder="E.g. Disposables" class="w-full rounded border border-border p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary" />
						</div>
						<div>
							<label for="unit" class="mb-1 block text-sm font-medium text-text-secondary">Unit</label>
							<input type="text" id="unit" name="unit" placeholder="E.g. Box, Piece" class="w-full rounded border border-border p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary" />
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="cost" class="mb-1 block text-sm font-medium text-text-secondary">Unit Price (PHP)</label>
							<input type="number" id="cost" name="cost" value="0.00" min="0" step="0.01" class="w-full rounded border border-border p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary" />
						</div>
						<div>
							<label for="current_stock" class="mb-1 block text-sm font-medium text-text-secondary">Starting Stock</label>
							<input type="number" id="current_stock" name="current_stock" value="0" min="0" class="w-full rounded border border-border p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary" />
						</div>
					</div>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="minimum_stock_level" class="mb-1 block text-sm font-medium text-text-secondary">Minimum Stock Level</label>
							<input type="number" id="minimum_stock_level" name="minimum_stock_level" value="10" min="0" class="w-full rounded border border-border p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary" />
						</div>
					</div>
					<div>
						<label for="supplier_id" class="mb-1 block text-sm font-medium text-text-secondary">Supplier</label>
						<select id="supplier_id" name="supplier_id" class="w-full rounded border border-border p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary">
							<option value="">None</option>
							{#each suppliers as supplier}
								<option value={supplier.id}>{supplier.name}</option>
							{/each}
						</select>
					</div>
					<div class="mt-6 flex justify-end gap-3">
						<button type="button" disabled={isSubmitting} onclick={() => (isAddItemModalOpen = false)} class="rounded border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface disabled:opacity-50">Cancel</button>
						<button type="submit" disabled={isSubmitting} class="rounded bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary disabled:opacity-50">
							{isSubmitting ? 'Saving...' : 'Save Item'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}

<!-- Adjust Stock Modal -->
{#if isAdjustStockModalOpen && selectedItemId !== null}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-text-text-primary/50 px-4">
		<div class="w-full max-w-md rounded-lg bg-white shadow-xl">
			<div class="flex items-center justify-between border-b border-border bg-surface p-4 rounded-t-lg">
				<h3 class="text-lg font-bold text-text-primary">Adjust Stock</h3>
				<button onclick={() => (isAdjustStockModalOpen = false)} class="text-text-muted hover:text-text-muted" aria-label="Close">
					<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
					</svg>
				</button>
			</div>
			<div class="p-6">
				<div class="mb-4">
					<p class="text-sm text-text-muted">Item Name: <span class="font-bold text-text-primary px-2 min-w-[200px]">{selectedItemName}</span></p>
					<p class="text-sm text-text-muted">Current Stock: <span class="font-bold text-text-primary px-2">{selectedItemCurrentStock}</span></p>
				</div>
				<form method="POST" action="?/adjustStock" class="space-y-4" use:enhance={() => {
					isSubmitting = true;
					return async ({ update }) => {
						isAdjustStockModalOpen = false;
						await update();
						isSubmitting = false;
					};
				}}>
					<input type="hidden" name="item_id" value={selectedItemId} />
					
					<div>
						<label for="action_type" class="mb-1 block text-sm font-medium text-text-secondary">Action Type</label>
						<select id="action_type" name="action_type" required class="w-full rounded border border-border p-2 text-sm font-medium focus:border-primary focus:ring-1 focus:ring-primary">
							<option value="OUT">Use Stock</option>
							<option value="IN">Restock</option>
						</select>
					</div>

					<div>
						<label for="quantity" class="mb-1 block text-sm font-medium text-text-secondary">Adjustment Quantity</label>
						<input type="number" id="quantity" name="quantity" required min="1" placeholder="Enter quantity" class="w-full rounded border border-border p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary" />
					</div>

					<div>
						<label for="remarks" class="mb-1 block text-sm font-medium text-text-secondary">Remarks (Optional)</label>
						<input type="text" id="remarks" name="remarks" placeholder="Reason for adjustment" class="w-full rounded border border-border p-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary" />
					</div>

					<div class="mt-6 flex justify-end gap-3 pt-4 border-t border-surface-alt">
						<button type="button" disabled={isSubmitting} onclick={() => (isAdjustStockModalOpen = false)} class="rounded border border-border px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface disabled:opacity-50">Cancel</button>
						<button type="submit" disabled={isSubmitting} class="rounded bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary disabled:opacity-50">
							{isSubmitting ? 'Confirming...' : 'Confirm Adjustment'}
						</button>
					</div>
				</form>
			</div>
		</div>
	</div>
{/if}
