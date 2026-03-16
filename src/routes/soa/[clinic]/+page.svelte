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
						<td class="px-6 py-4">{row[Object.keys(table[0])[key]]}</td>
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
