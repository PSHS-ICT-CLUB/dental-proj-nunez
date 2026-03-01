<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let { logs } = data;

	function formatDate(dateStr: string | null) {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="mx-auto max-w-6xl px-4 py-8">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold">Inventory Logs</h1>
		<div class="flex gap-2">
			<a href="/inventory" class="rounded border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50">Back to Dashboard</a>
		</div>
	</div>

	<!-- Logs Table -->
	<div class="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
		<table class="min-w-full border-collapse">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
						Date & Time
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
						Item
					</th>
					<th class="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">
						Action
					</th>
					<th class="px-6 py-3 text-center text-xs font-medium tracking-wider text-gray-500 uppercase">
						Quantity Change
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
						Remarks
					</th>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">
						User
					</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white">
				{#if logs && logs.length > 0}
					{#each logs as log}
						<tr class="transition-colors hover:bg-gray-50">
							<td class="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
								{formatDate(log.date)}
							</td>
							<td class="px-6 py-4 text-sm text-gray-900 font-medium">
								{log.itemName || 'Unknown Item'}
							</td>
							<td class="px-6 py-4 text-center whitespace-nowrap">
								{#if log.actionType === 'IN'}
									<span class="inline-flex items-center justify-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 uppercase w-20">
										RESTOCK
									</span>
								{:else if log.actionType === 'OUT'}
									<span class="inline-flex items-center justify-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800 uppercase w-20">
										USAGE
									</span>
								{:else}
									<span class="inline-flex items-center justify-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 uppercase w-20">
										{log.actionType}
									</span>
								{/if}
							</td>
							<td class="px-6 py-4 text-center text-sm whitespace-nowrap font-bold text-gray-700">
								{#if log.actionType === 'IN'}
									<span class="text-emerald-600">+{log.quantity}</span>
								{:else if log.actionType === 'OUT'}
									<span class="text-red-600">-{log.quantity}</span>
								{:else}
									<span>{log.quantity}</span>
								{/if}
								<span class="text-xs text-gray-400 font-normal ml-1">{log.unit || ''}</span>
							</td>
							<td class="px-6 py-4 text-sm text-gray-500">
								{log.remarks || '—'}
							</td>
							<td class="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
								{log.userName || 'System/Unknown'}
							</td>
						</tr>
					{/each}
				{:else}
					<tr>
						<td colspan="6" class="px-6 py-12 text-center text-sm text-gray-500">
							<div class="flex flex-col items-center justify-center space-y-3">
								<svg class="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
								</svg>
								<p>No inventory log records found yet.</p>
							</div>
						</td>
					</tr>
				{/if}
			</tbody>
		</table>
	</div>
</div>
