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

<div class="flex min-h-screen items-center justify-center bg-gray-100">
	<form
		method="POST"
		class="mb-4 w-full max-w-4xl rounded bg-white px-8 pt-6 pb-8 shadow-md"
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
			<div
				class={bannerType === 'success'
					? 'mb-4 rounded-md bg-green-50 p-4 text-green-800'
					: 'mb-4 rounded-md bg-red-50 p-4 text-red-800'}
			>
				<div class="flex items-start justify-between">
					<div class="mr-4 text-sm font-medium">
						{bannerMessage !== 'true' ? 'Success' : 'Error'}
					</div>
				</div>
			</div>
		{/if}
		<!-- Order Items Section -->
		<div class="mb-6">
			<h3 class="mb-4 text-lg font-semibold text-gray-900">Order Items</h3>
			<div class="space-y-4">
				{#each orderItems as item, i}
					<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 rounded-lg border border-gray-200 p-4">
						<h1 class="col-span-1 sm:col-span-2 lg:col-span-5 text-sm font-bold text-gray-900">
							{item.upOrDown === 'up' ? 'Upper' : 'Lower'}
						</h1>
						<!-- Case Type -->

						<div>
							<label class="block text-sm font-medium text-gray-700">
								Case Type
								<select
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
									value={item.caseTypeId}
									onchange={(e) =>
										updateOrderItem(i, 'caseTypeId', parseInt(e.currentTarget.value))}
								>
									{#each data.caseTypes as caseType}
										<option value={caseType.caseTypeId}>{caseType.caseTypeName}</option>
									{/each}
								</select>
							</label>
						</div>

						<!-- Case Number -->
						<div>
							<label class="block text-sm font-medium text-gray-700">
								Case No
								<input
									type="text"
									value={item.caseNo}
									disabled
									class="mt-1 block w-full cursor-not-allowed rounded-md border-gray-300 bg-gray-50"
								/>
								<input type="hidden" name={`caseNo_${i}`} value={item.caseNo} />
								<input type="hidden" name="orderId" value={record.orderId} />
							</label>
						</div>
						<!-- Description -->
						<div>
							<label class="block text-sm font-medium text-gray-700">
								Description
								<input
									type="text"
									value={item.orderDescription || ''}
									oninput={(e) => updateOrderItem(i, 'orderDescription', e.currentTarget.value)}
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
								/>
							</label>
						</div>
						<!-- Quantity -->
						<div>
							<label class="block text-sm font-medium text-gray-700">
								Units
								<input
									type="number"
									value={item.itemQuantity}
									min="1"
									oninput={(e) =>
										updateOrderItem(i, 'itemQuantity', parseInt(e.currentTarget.value))}
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
								/>
							</label>
						</div>

						<!-- Cost -->
						<div>
							<label class="block text-sm font-medium text-gray-700">
								Cost
								<input
									type="number"
									value={item.itemCost}
									oninput={(e) => updateOrderItem(i, 'itemCost', parseFloat(e.currentTarget.value))}
									class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
								/>
							</label>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<input type="hidden" name="orderItems" value={JSON.stringify(orderItems)} />

		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
			<!-- Total Amount Display -->
			<div>
				<label for="total_amount" class="mb-2 block text-[10px] font-bold tracking-wider text-gray-500 uppercase">
					Total Amount
				</label>
				<div class="block w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-2xl font-bold text-gray-900 shadow-sm relative overflow-hidden">
					<div class="absolute top-0 right-0 w-1.5 h-full bg-indigo-500"></div>
					<span class="text-gray-400 font-medium mr-1 text-lg">₱</span>{total_amount?.toFixed(2) || '0.00'}
				</div>
				<input type="hidden" id="total_amount" name="total_amount" value={total_amount} />
			</div>

			<!-- Paid Amount Input -->
			<div>
				<label for="paid_amount" class="mb-2 block text-[10px] font-bold tracking-wider text-gray-500 uppercase">
					Paid Amount
				</label>
				<div class="relative">
					<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
						<span class="text-gray-500 sm:text-sm font-medium">₱</span>
					</div>
					<input
						type="number"
						bind:value={paid_amount}
						id="paid_amount"
						name="paid_amount"
						placeholder="0.00"
						required
						class="block w-full appearance-none rounded-md border border-gray-300 py-3 pl-8 pr-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-lg font-medium"
					/>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
			<!-- Payment Method -->
			<div>
				<label for="payment_method" class="mb-2 block text-[10px] font-bold tracking-wider text-gray-500 uppercase">
					Payment Method
				</label>
				<select
					name="payment_method"
					bind:value={payment_method}
					class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm font-medium"
					required
				>
					<option value="cash">Cash</option>
					<option value="gcash">GCash</option>
					<option value="bank">Bank Transfer</option>
					<option value="others">Others</option>
				</select>
			</div>

			<!-- Specify Payment Method (if Others) -->
			{#if payment_method === 'others'}
				<div>
					<label for="other_payment_method" class="mb-2 block text-[10px] font-bold tracking-wider text-gray-500 uppercase">
						Specify Payment Method
					</label>
					<input
						type="text"
						bind:value={other_payment_method}
						name="other_payment_method"
						placeholder="Enter payment method"
						required
						class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
					/>
				</div>
			{/if}
		</div>

		<input
			hidden
			name="final_payment_method"
			value={payment_method === 'others' ? other_payment_method : payment_method}
		/>

		<div class="mb-8">
			<label class="mb-2 block text-[10px] font-bold tracking-wider text-gray-500 uppercase">
				Balance / Excess Amount
			</label>
			<div class="block w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-xl font-medium text-gray-700 shadow-sm relative overflow-hidden">
				<div class="absolute top-0 right-0 w-1.5 h-full {paid_amount && total_amount && (paid_amount - total_amount) < 0 ? 'bg-red-500' : 'bg-green-500'}"></div>
				<span class="text-gray-400 mr-1 text-base">₱</span>
				{#if paid_amount && total_amount}
					{(paid_amount - total_amount).toFixed(2)}
				{:else if total_amount !== undefined}
					{(-total_amount).toFixed(2)}
				{:else}
					0.00
				{/if}
			</div>
			
			<input
				type="hidden"
				value={paid_amount && total_amount
					? paid_amount - total_amount
					: total_amount !== undefined
						? -total_amount
						: ''}
				name="excess_payment"
			/>
		</div>
		<input type="hidden" name="recordId" value={data.recordId} />
		<div class="flex items-center justify-between">
			<button
				class="focus:shadow-outline rounded bg-blue-500 px-4 py-2 font-bold text-white hover:bg-blue-700 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				type="submit"
				disabled={isSubmitting}
			>
				{isSubmitting ? 'Submitting...' : 'Submit Payment'}
			</button>
		</div>
	</form>
</div>
