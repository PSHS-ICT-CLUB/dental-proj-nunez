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

<div class="min-h-screen bg-surface flex justify-center py-8 px-4">
	<div class="w-full max-w-4xl rounded-lg bg-white p-6 shadow-sm border border-border">
		<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 class="text-2xl font-bold text-text-primary">Global Change Log</h1>
				<p class="text-sm text-text-muted mt-1">
					Audit trail of all records and history items across the system. (Admin view)
				</p>
			</div>

			<div class="relative w-full sm:max-w-xs">
				<input
					type="text"
					bind:value={searchQuery}
					placeholder="Search by user or record ID..."
					class="w-full appearance-none rounded-md border border-border px-3 py-2 text-sm text-text-primary shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
				/>
			</div>
		</div>

		{#if filteredLogs.length > 0}
			<div class="overflow-hidden rounded-md border border-border">
				<table class="min-w-full divide-y divide-border-border text-left text-sm">
					<thead class="bg-surface/50">
						<tr>
							<th class="px-4 py-3 font-semibold text-text-secondary">Timestamp</th>
							<th class="px-4 py-3 font-semibold text-text-secondary">Action / Case Info</th>
							<th class="px-4 py-3 font-semibold text-text-secondary">Performed By</th>
							<th class="px-4 py-3 font-semibold text-text-secondary text-right">Link</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-bg-surface-alt bg-white">
						{#each filteredLogs as log (log.id)}
							<tr class="hover:bg-surface transition-colors">
								<td class="px-4 py-3 text-text-muted whitespace-nowrap">
									{formatDate(log.timestamp)}
								</td>
								<td class="px-4 py-3">
									<div class="font-medium text-text-primary">{log.actionName}</div>
									<div class="text-xs text-text-muted mt-0.5">Record ID: <span class="font-mono text-primary">{log.recordId}</span></div>
								</td>
								<td class="px-4 py-3">
									<span class="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
										{log.creatorName}
									</span>
								</td>
								<td class="px-4 py-3 text-right">
									<a
										href="/history/{log.recordId}"
										class="text-primary hover:text-indigo-900 text-xs font-medium"
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
			<div class="flex flex-col items-center justify-center py-12 text-center text-text-muted">
				<svg class="h-12 w-12 stroke-border-border mb-4" fill="none" viewBox="0 0 24 24" aria-hidden="true">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
				</svg>
				<p class="text-sm">No recent activity or logs matched your search.</p>
			</div>
		{/if}
	</div>
</div>
