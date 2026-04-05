<script lang="ts">
	import type { PageProps } from './$types';
	import DentalChart from '$lib/components/upload-record/DentalChart.svelte';

	let { data }: PageProps = $props();
	const { record, orderItems, history } = data;

	// Format currency
	function formatCurrency(amount: number | null): string {
		if (!amount) return '₱0.00';
		return new Intl.NumberFormat('en-PH', {
			style: 'currency',
			currency: 'PHP'
		}).format(amount);
	}

	// Format date and time
	function formatDateTime(date: string | null, time: string | null): string {
		if (!date) return 'Not set';
		const formattedDate = new Date(date).toLocaleDateString();
		return time ? `${formattedDate} ${time}` : formattedDate;
	}

	function formatDateOnly(date: string | null): string {
		if (!date) return 'Not set';
		return new Date(date).toLocaleString();
	}

	function formatDeliveryFee(amount: number | null): string {
		if (!amount) return '₱0.00';
		return new Intl.NumberFormat('en-PH', {
			style: 'currency',
			currency: 'PHP'
		}).format(amount);
	}
</script>

<div class="container mx-auto px-4 py-8 print:m-0 print:w-full print:p-0">
	<div class="mb-8 print:mb-2">
		<h1 class="text-3xl font-bold text-text-primary print:mb-1 print:text-xl">
			Case Details #{record.recordId}
		</h1>
		<p class="text-sm text-text-muted print:text-xs">
			Created on {new Date(record.createdAt).toLocaleDateString()}
		</p>
	</div>

	<!-- Case Details Card -->
	<div class="mb-8 overflow-hidden rounded-lg bg-white shadow-lg print:mb-3 print:border-0 print:shadow-none">
		<div class="border-b border-surface-alt bg-surface/50 px-6 py-4 print:p-0">
			<h2 class="text-lg font-semibold text-text-primary flex items-center gap-2 print:text-base">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-text-muted" viewBox="0 0 20 20" fill="currentColor">
					<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
				</svg>
				Case Information
			</h2>
		</div>

		<div class="p-6 print:p-0">
			<!-- General Section -->
			<div class="mb-6">
				<h3 class="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
						<path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
					</svg>
					General Info
				</h3>
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4 print:grid-cols-4 print:gap-2">
					<div>
						<p class="text-[11px] font-medium text-text-muted uppercase tracking-wide">Record ID</p>
						<p class="text-base font-medium text-text-primary">#{record.recordId}</p>
					</div>
					<div>
						<p class="text-[11px] font-medium text-text-muted uppercase tracking-wide">Patient Name</p>
						<p class="text-base text-text-primary">{record.patientName}</p>
					</div>
					<div>
						<p class="text-[11px] font-medium text-text-muted uppercase tracking-wide">Sex</p>
						<p class="text-base text-text-primary">{record.patientSex || '-'}</p>
					</div>
					<div>
						<p class="text-[11px] font-medium text-text-muted uppercase tracking-wide">Contact No.</p>
						<p class="text-base text-text-primary">{record.patientContact || '-'}</p>
					</div>
					<div>
						<p class="text-[11px] font-medium text-text-muted uppercase tracking-wide">Clinic</p>
						<p class="text-base text-text-primary">{record.clinicName}</p>
					</div>
					<div>
						<p class="text-[11px] font-medium text-text-muted uppercase tracking-wide">Doctor</p>
						<p class="text-base text-text-primary">{record.doctorName}</p>
					</div>
				</div>
			</div>

			<!-- Schedule Section -->
			<div class="mb-6 border-t border-surface-alt pt-6">
				<h3 class="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd" />
					</svg>
					Schedule
				</h3>
				<div class="grid gap-4 md:grid-cols-2 print:grid-cols-2 print:gap-2">
					<div>
						<p class="text-[11px] font-medium text-text-muted uppercase tracking-wide">Pickup Date & Time</p>
						<p class="text-base text-text-primary">
							{formatDateTime(record.datePickup, record.timePickup)}
						</p>
					</div>
					<div>
						<p class="text-[11px] font-medium text-text-muted uppercase tracking-wide">Dropoff Date & Time</p>
						<p class="text-base text-text-primary">
							{formatDateTime(record.dateDropoff, record.timeDropoff)}
						</p>
					</div>
				</div>
			</div>

			<!-- Delivery & Technicians Section -->
			{#if record.deliveryCourier || record.deliveryFee || record.finishBy || record.assignedTechnicians || record.deliveryNotes}
				<div class="mb-6 border-t border-surface-alt pt-6">
					<h3 class="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
							<path d="M3 4a1 1 0 011-1h7a1 1 0 01.894.553L13.618 6H17a1 1 0 01.894 1.447l-2.5 5A1 1 0 0114.5 13H6.382l-.894 1.447A1 1 0 014 15H3V4z" />
						</svg>
						Delivery & Technicians
					</h3>
					<div class="grid gap-4 md:grid-cols-2 print:grid-cols-2 print:gap-2">
						{#if record.deliveryCourier || record.deliveryFee}
							<div>
								<p class="text-[11px] font-medium text-text-muted uppercase tracking-wide">
									Delivery
								</p>
								<p class="text-base text-text-primary">
									{#if record.deliveryCourier}{record.deliveryCourier}{/if}
									{#if record.deliveryFee}
										<span class="ml-1 text-text-secondary">
											({formatDeliveryFee(+record.deliveryFee)})
										</span>
									{/if}
									{#if !record.deliveryCourier && !record.deliveryFee}
										<span class="text-text-muted">Not set</span>
									{/if}
								</p>
							</div>
						{/if}
						{#if record.finishBy}
							<div>
								<p class="text-[11px] font-medium text-text-muted uppercase tracking-wide">
									To be finished at
								</p>
								<p class="text-base text-text-primary">
									{formatDateOnly(record.finishBy)}
								</p>
							</div>
						{/if}
						{#if record.assignedTechnicians}
							<div class="md:col-span-2">
								<p class="text-[11px] font-medium text-text-muted uppercase tracking-wide">
									Assigned Technician(s)
								</p>
								<p class="text-base text-text-primary">
									{record.assignedTechnicians}
								</p>
							</div>
						{/if}
						{#if record.deliveryNotes}
							<div class="md:col-span-2">
								<p class="text-[11px] font-medium text-text-muted uppercase tracking-wide">
									Delivery Notes
								</p>
								<div class="rounded bg-surface p-3 text-sm text-text-secondary border border-surface-alt">
									{record.deliveryNotes}
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Finance Section -->
			{#if record.orderInfo}
			<div class="mb-6 border-t border-surface-alt pt-6">
				<h3 class="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
						<path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
						<path fill-rule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clip-rule="evenodd" />
					</svg>
					Payment Details
				</h3>
				<div class="grid gap-4 md:grid-cols-3 print:grid-cols-3 print:gap-2">
					<div>
						<p class="text-[11px] font-medium text-text-muted uppercase tracking-wide">Order Total</p>
						<p class="text-lg font-bold text-text-primary">
							{formatCurrency(+record.orderInfo.orderTotal)}
						</p>
					</div>
					<div>
						<p class="text-[11px] font-medium text-text-muted uppercase tracking-wide">Status</p>
						<p class="mt-1 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize {record.orderInfo.paymentStatus === 'paid' ? 'bg-success-light text-success-dark' : 'bg-error-light text-error-dark'}">
							{record.orderInfo.paymentStatus}
						</p>
					</div>
					<div>
						<p class="text-[11px] font-medium text-text-muted uppercase tracking-wide">Method</p>
						<p class="text-base text-text-primary capitalize">
							{record.orderInfo.paymentMethod}
						</p>
					</div>
				</div>
			</div>
			{/if}

			<!-- Remarks -->
			<div class="border-t border-surface-alt pt-6">
				<h3 class="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clip-rule="evenodd" />
					</svg>
					Remarks
				</h3>
				<div class="rounded bg-surface p-3 text-sm text-text-secondary w-full border border-surface-alt">
					{record.caseStatus || 'No remarks provided.'}
				</div>
			</div>
			<!-- Dental Chart (readonly) -->
			{#if record.dentalChart}
				<div class="border-t border-surface-alt pt-6 mt-4">
					<h3 class="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
						<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
						Dental Chart
					</h3>
					<DentalChart initialState={record.dentalChart} readonly={true} />
				</div>
			{/if}
			<!-- Inventory Usage Section -->
			{#if data.inventoryUsages && data.inventoryUsages.length > 0}
			<div class="border-t border-surface-alt pt-6">
				<h3 class="mb-3 text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-2">
					<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
						<path fill-rule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clip-rule="evenodd" />
					</svg>
					Materials Used
				</h3>
				<ul class="divide-y divide-bg-surface-alt rounded border border-surface-alt bg-surface/50">
					{#each data.inventoryUsages as usage}
						<li class="flex items-center justify-between p-3 text-sm">
							<span class="font-medium text-text-primary">{usage.itemName}</span>
							<span class="text-text-muted bg-white border border-border px-2 py-0.5 rounded text-xs">
								{usage.quantityUsed} {usage.itemUnit || ''}
							</span>
						</li>
					{/each}
				</ul>
			</div>
			{/if}
		</div>
	</div>

	<!-- Order Items -->
	{#if orderItems && orderItems.length > 0}
		<div class="mb-8 rounded-lg bg-white p-6 shadow-lg print:mb-3 print:p-0 print:shadow-none">
			<h2 class="mb-4 text-xl font-semibold text-text-primary print:mb-2 print:text-base">
				Order Items
			</h2>
			<div class="overflow-x-auto print:overflow-visible rounded-lg border border-surface-alt">
				<table class="min-w-full divide-y divide-border-border print:text-sm">
					<thead class="bg-surface/50">
						<tr>
							<th class="px-6 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider print:px-2 print:py-1 print:text-[10px]">
								Type
							</th>
							<th class="px-6 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider print:px-2 print:py-1 print:text-[10px]">
								Case No
							</th>
							<th class="px-6 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider print:px-2 print:py-1 print:text-[10px]">
								Case Type
							</th>
							<th class="px-6 py-3 text-right text-[11px] font-bold text-text-muted uppercase tracking-wider print:px-2 print:py-1 print:text-[10px]">
								Quantity
							</th>
							<th class="px-6 py-3 text-right text-[11px] font-bold text-text-muted uppercase tracking-wider print:px-2 print:py-1 print:text-[10px]">
								Cost
							</th>
							<th class="px-6 py-3 text-left text-[11px] font-bold text-text-muted uppercase tracking-wider print:px-2 print:py-1 print:text-[10px]">
								Description
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-bg-surface-alt bg-white">
						{#each orderItems as item}
							<tr class="hover:bg-surface transition-colors print:text-xs text-sm">
								<td class="px-6 py-4 whitespace-nowrap print:px-2 print:py-1">
									<span class="inline-flex items-center rounded-full bg-info-light px-2.5 py-0.5 text-xs font-medium text-info-dark uppercase">
										{item.upOrDown}
									</span>
								</td>
								<td class="px-6 py-4 whitespace-nowrap font-medium text-text-primary print:px-2 print:py-1">
									{item.caseNo}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-text-muted print:px-2 print:py-1">
									{item.caseTypeName}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-right text-text-muted print:px-2 print:py-1">
									{item.itemQuantity}
								</td>
								<td class="px-6 py-4 whitespace-nowrap text-right font-medium text-text-primary print:px-2 print:py-1">
									{formatCurrency(+item.itemCost)}
								</td>
								<td class="px-6 py-4 text-text-muted">
									{item.orderDescription || '-'}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<!-- Case History -->
	{#if history && history.length > 0}
		<div class="rounded-lg bg-white p-6 shadow-lg print:p-0 print:shadow-none">
			<h2 class="mb-4 text-xl font-semibold text-text-primary print:mb-2 print:text-base">
				Case History
			</h2>
			<div class="flow-root">
				<ul class="-mb-8 print:mb-0 print:text-sm">
					{#each history as event, index}
						<li>
							<div class="relative pb-8 print:pb-2">
								{#if index !== history.length - 1}
									<span
										class="absolute top-4 left-4 -ml-px h-full w-0.5 bg-border-border print:hidden"
										aria-hidden="true"
									></span>
								{/if}
								<div class="relative flex items-start space-x-3 print:space-x-2">
									<div class="relative">
										{#if event.historyType.toLowerCase() === 'in'}
											<div class="flex h-8 w-8 items-center justify-center rounded-full bg-success-light ring-8 ring-white print:h-4 print:w-4 print:ring-0">
												<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-green-600 print:h-3 print:w-3" viewBox="0 0 20 20" fill="currentColor">
													<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-3.293-7.293a1 1 0 001.414 1.414L10 10.414l1.879 1.879a1 1 0 101.414-1.414L11.414 9l1.879-1.879a1 1 0 10-1.414-1.414L10 7.586 8.121 5.707a1 1 0 10-1.414 1.414L8.586 9l-1.879 1.879z" clip-rule="evenodd" />
												</svg>
											</div>
										{:else if event.historyType.toLowerCase() === 'out'}
											<div class="flex h-8 w-8 items-center justify-center rounded-full bg-error-light ring-8 ring-white print:h-4 print:w-4 print:ring-0">
												<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-error-dark print:h-3 print:w-3" viewBox="0 0 20 20" fill="currentColor">
													<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clip-rule="evenodd" />
												</svg>
											</div>
										{:else}
											<div class="flex h-8 w-8 items-center justify-center rounded-full bg-info-light ring-8 ring-white print:h-4 print:w-4 print:ring-0">
												<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-blue-600 print:h-3 print:w-3" viewBox="0 0 20 20" fill="currentColor">
													<path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd" />
												</svg>
											</div>
										{/if}
									</div>
									<div class="min-w-0 flex-1 pt-1.5">
										<div class="text-sm text-text-muted print:text-xs">
											<span class="font-medium text-text-primary uppercase">
												{event.historyType}
											</span>
											<span class="ml-2">
												{new Date(event.historyDate).toLocaleDateString()}
											</span>
										</div>
										{#if event.imageData}
											<div class="mt-3">
												<img
													src={event.imageData}
													alt="{event.historyType} capture"
													class="max-h-64 rounded-md object-contain shadow-sm border border-border"
												/>
											</div>
										{/if}
									</div>
								</div>
							</div>
						</li>
					{/each}
				</ul>
			</div>
		</div>
	{/if}

	<!-- Action Buttons remain hidden in print -->
	<div class="mt-6 flex justify-end space-x-4 print:hidden">
		<a
			href="/"
			class="rounded-md bg-surface-alt px-4 py-2 text-sm font-medium text-text-secondary hover:bg-border-border focus:ring-2 focus:ring-text-text-muted focus:ring-offset-2 focus:outline-none"
		>
			Back to List
		</a>
	</div>
</div>
