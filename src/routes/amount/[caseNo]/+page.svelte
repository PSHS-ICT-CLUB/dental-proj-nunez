<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	let { data, form }: PageProps = $props();
	const { record } = data;

	let payment_method = $state(record?.paymentMethod || 'cash');
	let other_payment_method = $state('');
	let orderItems = $state(record?.items || []);

	// Initialize case numbers and totals once at startup
	function initializeOrderItems() {
		orderItems = orderItems.map((item) => ({
			...item,
			caseNo: item.caseNo || getNextCaseNumber(item.caseTypeId)
		}));
		calculateTotalAmount();
	}

	function getNextCaseNumber(caseTypeId: number) {
		const caseType = data.caseTypes.find((ct) => ct.caseTypeId === caseTypeId);
		const baseNumber = caseType ? caseType.numberOfCases + 1 : 1;

		// Find the highest case number used in the current order items for this case type
		const highestExistingNumber = orderItems
			.filter((item) => item.caseTypeId === caseTypeId)
			.map((item) => parseInt(item.caseNo))
			.reduce((max, current) => Math.max(max, current || 0), baseNumber - 1);

		return highestExistingNumber + 1;
	}

	function calculateTotalAmount() {
		total_amount = orderItems.reduce(
			(sum, item) => sum + (parseFloat(item.itemCost) || 0) * (item.itemQuantity || 1),
			0
		);
	}

	let total_amount = $state(parseFloat(record?.orderTotal) || 0);
	let paid_amount = $state(parseFloat(record?.paidAmount) || 0);
	let diff = $derived((paid_amount || 0) - (total_amount || 0));
	let isExcess = $derived(diff > 0);
	let isExact = $derived(diff === 0 && paid_amount > 0);
	let isPending = $derived(diff < 0);

	function updateOrderItem(index: number, field: string, value: any) {
		const item = orderItems[index];
		const updates: any = { [field]: value }; // If changing case type, update case number
		if (field === 'caseTypeId') {
			updates.caseNo = getNextCaseNumber(value);
		}

		// Update the item
		orderItems[index] = { ...item, ...updates };

		// Only recalculate total if cost or quantity changed
		if (field === 'itemCost' || field === 'itemQuantity') {
			calculateTotalAmount();
		}
	}

	// Initialize once when component mounts
	initializeOrderItems();

	let isSubmitting = $state(false);

	// Banner state (show success / error returned from form actions)
	let showBanner = $state(!!form?.success || !!form?.error);
	let bannerMessage = $state(form?.success ?? form?.error ?? '');
	let bannerType: 'success' | 'error' | null = $state(
		form?.success ? 'success' : form?.error ? 'error' : null
	);

	onMount(() => {
		if (showBanner) {
			const t = setTimeout(() => (showBanner = false), 4500);
			return () => clearTimeout(t);
		}
	});

	function closeBanner() {
		showBanner = false;
	}
</script>

<div class="min-h-screen bg-gray-50 py-8">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<!-- Header -->
		<div class="mb-8 flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold text-gray-900">Payment Details</h1>
				<p class="mt-2 text-sm text-gray-600">Review order items and process payment for Case #{record.recordId}</p>
			</div>
			<!-- Optional back button -->
			<a href="/" class="rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
				Cancel
			</a>
		</div>

		<form
			method="POST"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					isSubmitting = false;
					if (form?.success || form?.error) {
						showBanner = true;
						bannerMessage = form?.success ?? form?.error ?? '';
						bannerType = form?.success ? 'success' : form?.error ? 'error' : null;
						setTimeout(() => (showBanner = false), 4500);
					}
				};
			}}
		>
			{#if showBanner}
				<div class="mb-6 rounded-md p-4 {bannerType === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}">
					<div class="flex items-start justify-between">
						<div class="text-sm font-medium">
							{bannerMessage !== 'true' ? bannerMessage : (bannerType === 'success' ? 'Payment submitted successfully.' : 'An error occurred.')}
						</div>
						<button type="button" class="ml-auto inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 {bannerType === 'success' ? 'text-green-500 hover:bg-green-100 focus:ring-green-600' : 'text-red-500 hover:bg-red-100 focus:ring-red-600'}" onclick={closeBanner}>
							<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
								<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
							</svg>
						</button>
					</div>
				</div>
			{/if}

			<div class="lg:grid lg:grid-cols-12 lg:gap-x-8">
				<!-- Left Column: Order Items -->
				<div class="lg:col-span-8 space-y-6">
					<div class="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
						<div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
							<h3 class="text-base font-semibold leading-6 text-gray-900">Order Items</h3>
						</div>
						
						<div class="divide-y divide-gray-200">
							{#each orderItems as item, i}
								<div class="p-6 transition-colors hover:bg-gray-50">
									<div class="mb-4 flex items-center justify-between">
										<h4 class="text-sm font-bold text-indigo-600 tracking-wide uppercase">
											{item.upOrDown === 'up' ? 'Upper Case' : 'Lower Case'}
										</h4>
										<div class="text-sm font-medium text-gray-500">
											Subtotal: <span class="text-gray-900 font-bold ml-1">₱{((parseFloat(item.itemCost) || 0) * (item.itemQuantity || 1)).toFixed(2)}</span>
										</div>
									</div>

									<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12">
										<!-- Case Type & No -->
										<div class="sm:col-span-1 lg:col-span-4 flex gap-2">
											<div class="flex-1">
												<label class="block text-xs font-semibold text-gray-600 mb-1">Case Type</label>
												<select
													class="block w-full rounded-md border border-gray-300 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
													value={item.caseTypeId}
													onchange={(e) => updateOrderItem(i, 'caseTypeId', parseInt(e.currentTarget.value))}
												>
													{#each data.caseTypes as caseType}
														<option value={caseType.caseTypeId}>{caseType.caseTypeName}</option>
													{/each}
												</select>
											</div>
											<div class="w-16 shrink-0">
												<label class="block text-xs font-semibold text-gray-600 mb-1">No.</label>
												<input
													type="text"
													value={item.caseNo}
													disabled
													class="block w-full cursor-not-allowed rounded-md border-gray-200 bg-gray-100 py-2 text-center text-sm font-medium text-gray-500"
												/>
												<input type="hidden" name={`caseNo_${i}`} value={item.caseNo} />
											</div>
										</div>

										<!-- Description -->
										<div class="sm:col-span-1 lg:col-span-4">
											<label class="block text-xs font-semibold text-gray-600 mb-1">Description</label>
											<input
												type="text"
												value={item.orderDescription || ''}
												oninput={(e) => updateOrderItem(i, 'orderDescription', e.currentTarget.value)}
												class="block w-full rounded-md border-gray-300 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
												placeholder="Tooth details, shade, etc."
											/>
										</div>

										<!-- Units & Cost -->
										<div class="sm:col-span-2 lg:col-span-4 flex gap-3">
											<div class="w-20 shrink-0">
												<label class="block text-xs font-semibold text-gray-600 mb-1">Units</label>
												<input
													type="number"
													value={item.itemQuantity}
													min="1"
													oninput={(e) => updateOrderItem(i, 'itemQuantity', parseInt(e.currentTarget.value))}
													class="block w-full rounded-md border-gray-300 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
												/>
											</div>
											<div class="flex-1">
												<label class="block text-xs font-semibold text-gray-600 mb-1">Cost per Unit</label>
												<div class="relative">
													<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
														<span class="text-gray-500 sm:text-sm">₱</span>
													</div>
													<input
														type="number"
														value={item.itemCost}
														step="0.01"
														oninput={(e) => updateOrderItem(i, 'itemCost', parseFloat(e.currentTarget.value))}
														class="block w-full rounded-md border-gray-300 py-2 pl-8 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
													/>
												</div>
											</div>
										</div>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>

				<!-- Right Column: Payment Summary -->
				<div class="mt-8 lg:col-span-4 lg:mt-0">
					<div class="sticky top-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
						<div class="border-b border-gray-200 bg-gray-50 px-6 py-4">
							<h3 class="text-base font-semibold leading-6 text-gray-900">Payment Summary</h3>
						</div>
						
						<div class="p-6 border-b border-gray-100">
							<div class="flex items-center justify-between">
								<dt class="text-sm text-gray-600 text-lg font-medium">Total Amount</dt>
								<dd class="text-2xl font-bold tracking-tight text-gray-900">₱{total_amount?.toFixed(2) || '0.00'}</dd>
							</div>
							<input type="hidden" name="total_amount" value={total_amount} />
							<input type="hidden" name="orderItems" value={JSON.stringify(orderItems)} />
							<input type="hidden" name="orderId" value={record.orderId} />
							<input type="hidden" name="recordId" value={record.recordId} />
						</div>

						<div class="p-6 space-y-6">
							<div>
								<label for="paid_amount" class="block text-sm font-semibold text-gray-700 mb-2">Paid Amount</label>
								<div class="relative">
									<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
										<span class="text-gray-500 text-lg font-medium">₱</span>
									</div>
									<input
										type="number"
										step="0.01"
										bind:value={paid_amount}
										id="paid_amount"
										name="paid_amount"
										placeholder="0.00"
										required
										class="block w-full rounded-lg border-2 border-indigo-100 bg-indigo-50/30 py-4 pl-10 pr-4 text-xl font-bold text-gray-900 focus:border-indigo-500 focus:bg-white focus:ring-0 transition-colors"
									/>
								</div>
							</div>

							<div>
								<label for="payment_method" class="block text-sm font-semibold text-gray-700 mb-2">Payment Method</label>
								<select
									name="payment_method"
									bind:value={payment_method}
									class="block w-full rounded-md border-gray-300 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
									required
								>
									<option value="cash">Cash</option>
									<option value="gcash">GCash</option>
									<option value="bank">Bank Transfer</option>
									<option value="others">Others...</option>
								</select>

								{#if payment_method === 'others'}
									<div class="mt-3 animate-in fade-in slide-in-from-top-1">
										<input
											type="text"
											bind:value={other_payment_method}
											name="other_payment_method"
											placeholder="Specify payment method"
											required
											class="block w-full rounded-md border-gray-300 py-2.5 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
										/>
									</div>
								{/if}
								<input hidden name="final_payment_method" value={payment_method === 'others' ? other_payment_method : payment_method} />
							</div>

							<div class="rounded-lg p-4 {isExcess ? 'bg-green-50 border border-green-200' : isExact ? 'bg-indigo-50 border border-indigo-200' : 'bg-red-50 border border-red-200'} transition-colors">
								<div class="flex items-center justify-between">
									<dt class="text-sm font-semibold {isExcess ? 'text-green-700' : isExact ? 'text-indigo-700' : 'text-red-700'}">
										{isExcess ? 'Change Due (Excess)' : isExact ? 'Fully Paid' : 'Remaining Balance'}
									</dt>
									<dd class="text-lg font-bold {isExcess ? 'text-green-700' : isExact ? 'text-indigo-700' : 'text-red-700'}">
										{isExact ? '₱0.00' : `₱${Math.abs(diff).toFixed(2)}`}
									</dd>
								</div>
							</div>
							<input type="hidden" value={diff} name="excess_payment" />
						</div>

						<div class="border-t border-gray-100 bg-gray-50 p-6">
							<button
								type="submit"
								disabled={isSubmitting}
								class="flex w-full items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
							>
								{#if isSubmitting}
									<svg class="mr-3 h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
										<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
										<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									Processing Payment...
								{:else}
									Confirm & Process Payment
								{/if}
							</button>
						</div>
					</div>
				</div>
			</div>
		</form>
	</div>
</div>
