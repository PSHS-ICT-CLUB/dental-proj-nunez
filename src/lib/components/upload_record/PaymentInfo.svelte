<script lang="ts">
	let {
		total_amount,
		paid_amount = $bindable(),
		excess_payment,
		payInFull,
		payment_method = $bindable()
	}: {
		total_amount: number | undefined;
		paid_amount: number | undefined;
		excess_payment: number;
		payInFull: () => void;
		payment_method: string;
	} = $props();
</script>

<div class="rounded-md border border-gray-200 p-4">
	<h3 class="mb-3 text-[10px] font-bold tracking-wider text-gray-500 uppercase">Payment Information</h3>

	<!-- Total Amount -->
	<div class="mb-5">
		<label for="total_amount" class="mb-2 block text-[10px] font-bold tracking-wider text-gray-500 uppercase">
			Total Amount
		</label>
		<div class="block w-full rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-2xl font-bold text-gray-900 shadow-sm relative overflow-hidden">
			<div class="absolute top-0 right-0 w-1.5 h-full bg-indigo-500"></div>
			<span class="text-gray-400 font-medium mr-1 text-lg">₱</span>{total_amount?.toFixed(2) || '0.00'}
		</div>
		<input type="hidden" id="total_amount" name="total_amount" value={total_amount} />
	</div>

	<!-- Paid Amount -->
	<div class="mb-4">
		<div class="flex items-center justify-between mb-2">
			<label class="block text-[10px] font-bold tracking-wider text-gray-500 uppercase" for="paid_amount">Paid Amount</label>
			<button
				type="button"
				onclick={payInFull}
				class="text-[10px] font-semibold text-indigo-600 hover:text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded transition-colors"
			>
				Pay in Full
			</button>
		</div>
		<div class="relative">
			<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
				<span class="text-gray-500 sm:text-sm font-medium">₱</span>
			</div>
			<input
				type="number"
				id="paid_amount"
				name="paid_amount"
				bind:value={paid_amount}
				class="block w-full appearance-none rounded-md border border-gray-300 py-2 pl-7 pr-3 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
				placeholder="0.00"
				min="0"
				step="0.01"
				required
			/>
		</div>

		<!-- Dynamic Balance / Excess Display -->
		{#if paid_amount !== undefined && total_amount !== undefined}
			<div class="mt-3 text-sm">
				{#if paid_amount < total_amount}
					<div class="flex justify-between items-center text-orange-600 font-medium bg-orange-50 px-3 py-2 rounded border border-orange-100">
						<span>Remaining Balance:</span>
						<span>₱{(total_amount - paid_amount).toFixed(2)}</span>
					</div>
				{:else if paid_amount > total_amount}
					<div class="flex justify-between items-center text-green-600 font-medium bg-green-50 px-3 py-2 rounded border border-green-100">
						<span>Change / Excess:</span>
						<span>₱{(paid_amount - total_amount).toFixed(2)}</span>
					</div>
				{:else}
					<div class="flex justify-between items-center text-gray-500 font-medium bg-gray-50 px-3 py-2 rounded border border-gray-100">
						<span>Status:</span>
						<span class="text-indigo-600">Fully Paid</span>
					</div>
				{/if}
			</div>
		{/if}
		<input type="hidden" name="excess_payment" value={excess_payment} />
	</div>

	<!-- Payment Method -->
	<div class="mb-4">
		<label for="payment_method" class="mb-2 block text-[10px] font-bold tracking-wider text-gray-500 uppercase">
			Payment Method
		</label>
		<select
			name="payment_method"
			bind:value={payment_method}
			class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
		>
			<option value="cash">Cash</option>
			<option value="gcash">GCash</option>
			<option value="bank">Bank Transfer</option>
			<option value="others">Others</option>
		</select>
	</div>
</div>
