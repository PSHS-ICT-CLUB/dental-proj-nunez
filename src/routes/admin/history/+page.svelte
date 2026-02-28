<script lang="ts">
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	function formatDate(date: Date): string {
		const options: Intl.DateTimeFormatOptions = {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		};
		return date.toLocaleDateString('en-US', options);
	}

	let searchQuery = $state('');

	let filteredLogs = $derived(
		data.logs.filter(
			(log) =>
				log.creatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
				String(log.recordId).includes(searchQuery) ||
				log.actionName.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);
</script>

<div class="min-h-screen bg-gray-50 flex justify-center py-8 px-4">
	<div class="w-full max-w-4xl rounded-lg bg-white p-6 shadow-sm border border-gray-200">
		<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 class="text-2xl font-bold text-gray-900">Global Change Log</h1>
				<p class="text-sm text-gray-500 mt-1">
					Audit trail of all records and history items across the system. (Admin view)
				</p>
			</div>

			<div class="relative w-full sm:max-w-xs">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search by user or record ID..."
					class="w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
				/>
			</div>
		</div>

		{#if filteredLogs.length > 0}
			<div class="overflow-hidden rounded-md border border-gray-200">
				<table class="min-w-full divide-y divide-gray-200 text-left text-sm">
					<thead class="bg-gray-50/50">
						<tr>
							<th class="px-4 py-3 font-semibold text-gray-600">Timestamp</th>
							<th class="px-4 py-3 font-semibold text-gray-600">Action / Case Info</th>
							<th class="px-4 py-3 font-semibold text-gray-600">Performed By</th>
							<th class="px-4 py-3 font-semibold text-gray-600 text-right">Link</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100 bg-white">
						{#each filteredLogs as log (log.id)}
							<tr class="hover:bg-gray-50 transition-colors">
								<td class="px-4 py-3 text-gray-500 whitespace-nowrap">
									{formatDate(log.timestamp)}
								</td>
								<td class="px-4 py-3">
									<div class="font-medium text-gray-900">{log.actionName}</div>
									<div class="text-xs text-gray-500 mt-0.5">Record ID: <span class="font-mono text-indigo-600">{log.recordId}</span></div>
								</td>
								<td class="px-4 py-3">
									<span class="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
										{log.creatorName}
									</span>
								</td>
								<td class="px-4 py-3 text-right">
									<a
										href="/history/{log.recordId}"
										class="text-indigo-600 hover:text-indigo-900 text-xs font-medium"
									>
										View History
									</a>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{:else}
			<div class="flex flex-col items-center justify-center py-12 text-center text-gray-500">
				<svg class="h-12 w-12 stroke-gray-300 mb-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<p class="text-sm">No recent activity or logs matched your search.</p>
			</div>
		{/if}
	</div>
</div>
