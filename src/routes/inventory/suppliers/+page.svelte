<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: PageProps = $props();
	let { suppliers } = data;
</script>

<div class="mx-auto max-w-6xl px-4 py-8">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold">Inventory Suppliers</h1>
	</div>

	<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
		<!-- Add Supplier Form -->
		<div class="col-span-1 rounded-lg border border-gray-200 bg-white p-6 shadow-sm md:col-span-1 h-fit">
			<h2 class="mb-4 text-sm font-semibold tracking-wider text-gray-500 uppercase">
				Add New Supplier
			</h2>

			{#if form?.success}
				<div class="mb-4 rounded-md bg-green-50 p-3 text-sm text-green-700">
					{form?.message}
				</div>
			{/if}
			{#if form?.error}
				<div class="mb-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
					{form?.error}
				</div>
			{/if}

			<form method="POST" action="?/add" class="space-y-4">
				<div>
					<label for="name" class="mb-1 block text-[10px] font-medium tracking-wider text-gray-500 uppercase">Supplier Name *</label>
					<input
						type="text"
						id="name"
						name="name"
						required
						placeholder="E.g. XYZ Dental Supply"
						class="w-full rounded border border-gray-200 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
					/>
				</div>
				<div>
					<label for="contact_person" class="mb-1 block text-[10px] font-medium tracking-wider text-gray-500 uppercase">Contact Person</label>
					<input
						type="text"
						id="contact_person"
						name="contact_person"
						placeholder="Jane Doe"
						class="w-full rounded border border-gray-200 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
					/>
				</div>
				<div>
					<label for="phone" class="mb-1 block text-[10px] font-medium tracking-wider text-gray-500 uppercase">Phone</label>
					<input
						type="text"
						id="phone"
						name="phone"
						placeholder="+63 912 345 6789"
						class="w-full rounded border border-gray-200 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
					/>
				</div>
				<div>
					<label for="email" class="mb-1 block text-[10px] font-medium tracking-wider text-gray-500 uppercase">Email</label>
					<input
						type="email"
						id="email"
						name="email"
						placeholder="contact@supplier.com"
						class="w-full rounded border border-gray-200 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
					/>
				</div>
				<div>
					<label for="address" class="mb-1 block text-[10px] font-medium tracking-wider text-gray-500 uppercase">Address</label>
					<textarea
						id="address"
						name="address"
						rows="2"
						placeholder="123 Manila St."
						class="w-full rounded border border-gray-200 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
					></textarea>
				</div>
				<div>
					<label for="notes" class="mb-1 block text-[10px] font-medium tracking-wider text-gray-500 uppercase">Notes</label>
					<input
						type="text"
						id="notes"
						name="notes"
						placeholder="Delivery only on Mondays"
						class="w-full rounded border border-gray-200 p-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
					/>
				</div>
				<div class="flex justify-end pt-2">
					<button
						type="submit"
						class="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-500"
					>
						Add Supplier
					</button>
				</div>
			</form>
		</div>

		<!-- Suppliers Table -->
		<div class="col-span-1 md:col-span-2 overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm h-fit">
			<table class="min-w-full border-collapse">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
							Name
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
							Contact Info
						</th>
						<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
							Address / Notes
						</th>
						<th class="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">
							Actions
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200 bg-white">
					{#if suppliers && suppliers.length > 0}
						{#each suppliers as supplier}
							<tr class="transition-colors hover:bg-gray-50">
								<td class="px-6 py-4 text-sm text-gray-900 font-medium">
									{supplier.name}
								</td>
								<td class="px-6 py-4 text-sm text-gray-900">
									{#if supplier.contactPerson}<div><span class="font-medium text-gray-500 text-xs uppercase tracking-wider">Person:</span> {supplier.contactPerson}</div>{/if}
									{#if supplier.phone}<div><span class="font-medium text-gray-500 text-xs uppercase tracking-wider">Phone:</span> {supplier.phone}</div>{/if}
									{#if supplier.email}<div><span class="font-medium text-gray-500 text-xs uppercase tracking-wider">Email:</span> {supplier.email}</div>{/if}
								</td>
								<td class="px-6 py-4 text-sm text-gray-500">
									{#if supplier.address}<div class="mb-1">{supplier.address}</div>{/if}
									{#if supplier.notes}<div class="text-xs italic text-gray-400">{supplier.notes}</div>{/if}
								</td>
								<td class="px-6 py-4 text-center text-sm whitespace-nowrap">
									<form method="POST" action="?/deleteSupplier" class="inline-block" use:enhance>
										<input type="hidden" name="id" value={supplier.id} />
										<button
											type="submit"
											class="text-red-500 hover:text-red-700 focus:outline-none transition-colors"
											title="Delete supplier"
											aria-label="Delete supplier"
										>
											<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
											</svg>
										</button>
									</form>
								</td>
							</tr>
						{/each}
					{:else}
						<tr>
							<td colspan="4" class="px-6 py-12 text-center text-sm text-gray-500">
								<div class="flex flex-col items-center justify-center space-y-3">
									<svg class="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
									</svg>
									<p>No suppliers found. Add your first supplier using the form.</p>
								</div>
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>
