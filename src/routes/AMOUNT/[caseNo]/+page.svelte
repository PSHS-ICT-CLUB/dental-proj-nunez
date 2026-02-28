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
					<div class="grid grid-cols-5 gap-4 rounded-lg border border-gray-200 p-4">
						<h1 class="col-span-5 text-sm font-bold text-gray-900">
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

		<div class="mb-4">
			<label for="total_amount" class="mb-2 block text-sm font-bold text-gray-700">
				Total Amount
			</label>
			<input
				type="number"
				bind:value={total_amount}
				name="total_amount"
				placeholder="Enter total amount"
				required
				class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
			/>
		</div>
		<div class="mb-4">
			<label for="paid_amount" class="mb-2 block text-sm font-bold text-gray-700">
				Paid Amount
			</label>
			<input
				type="number"
				bind:value={paid_amount}
				name="paid_amount"
				placeholder="Enter paid amount"
				required
				class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
			/>
		</div>
		<div class="mb-4">
			<label for="payment_method" class="mb-2 block text-sm font-bold text-gray-700">
				Payment Method
			</label>
			<select
				name="payment_method"
				bind:value={payment_method}
				class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
				required
			>
				<option value="cash">Cash</option>
				<option value="gcash">GCash</option>
				<option value="bank">Bank Transfer</option>
				<option value="others">Others</option>
			</select>
		</div>

		{#if payment_method === 'others'}
			<div class="mb-4">
				<label for="other_payment_method" class="mb-2 block text-sm font-bold text-gray-700">
					Specify Payment Method
				</label>
				<input
					type="text"
					bind:value={other_payment_method}
					name="other_payment_method"
					placeholder="Enter payment method"
					required
					class="focus:shadow-outline w-full appearance-none rounded border px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
				/>
			</div>
		{/if}

		<input
			hidden
			name="final_payment_method"
			value={payment_method === 'others' ? other_payment_method : payment_method}
		/>

		<div class="mb-6">
			<label for="excess_payment" class="mb-2 block text-sm font-bold text-gray-700">
				Excess Amount
			</label>
			<input
				type="text"
				value={paid_amount && total_amount
					? paid_amount - total_amount
					: total_amount !== undefined
						? -total_amount
						: ''}
				name="excess_payment"
				placeholder="Excess amount"
				disabled
				class="focus:shadow-outline w-full cursor-not-allowed appearance-none rounded border bg-gray-200 px-3 py-2 leading-tight text-gray-700 shadow focus:outline-none"
			/>
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
