<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let table = $state(data.data);

	console.log(data.data);
	let keys = [3, 5, 7, 2, 9, 10];
</script>

<div id="printarea" class="flex flex-col">
	<div class="grid-row-3 grid px-2">
		<div>
			<h1>SOA CLINIC</h1>
		</div>
		<div class="text-center">
			<h1 class="text-4xl">{data.clinicName}</h1>
		</div>
	</div>
	{#if table && table.length > 0}
		<table
			class=" dark:text-text-muted mx-5 mt-2 w-[97%] text-left text-sm text-text-muted rtl:text-right"
		>
			<thead class="bg-surface text-xs text-text-secondary uppercase dark:bg-secondary-dark dark:text-text-muted">
				<tr>
					{#each keys as key}
						<th class="px-6 py-3"
							>{Object.keys(table[0])
								[key].replace(/([A-Z])/g, ' $1')
								.trim()}</th
						>
					{/each}
					<th class="px-6 py-3 print:hidden"> HISTORY </th>
				</tr>
			</thead>
			<tbody>
				{#each table as row, index}
					<tr class="border-b border-border bg-white dark:border-secondary-dark dark:bg-primary-dark">
						{#each keys as key}
							<td class="max-w-[150px] truncate px-6 py-4">{row[Object.keys(table[0])[key]]}</td>
						{/each}
						<td class="px-6 py-4 print:hidden">
							<a aria-label="history" href={`/history/${row[Object.keys(table[0])[2]]}`}>
								LINK
							</a></td
						>
					</tr>
				{/each}
			</tbody>
		</table>
	{:else}
		<div class="mx-5 mt-10 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 py-12 text-center">
			<svg class="mb-4 h-12 w-12 text-text-muted opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
			</svg>
			<h3 class="text-lg font-semibold text-text-secondary">No Records Found</h3>
			<p class="mt-1 text-sm text-text-muted">There are no statements of account available for this clinic.</p>
		</div>
	{/if}
</div>

<style>
	@media print {
		#printarea {
			display: block;
		}
		.print\:hidden {
			display: none !important;
		}
	}
</style>
