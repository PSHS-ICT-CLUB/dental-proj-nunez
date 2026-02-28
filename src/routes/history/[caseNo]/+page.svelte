<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();
	let historyItems: any[] = $state(data.data);
	let sortAscending = $state(false);

	function formatTimeToStandard(timeWithOffset: string): string {
		const [timePart, offsetPart] = timeWithOffset.split('+');
		const [hours, minutes, seconds] = timePart.split(':').map(Number);
		const offsetHours = parseInt(offsetPart.substring(0, 2), 10);

		let utcHours = hours - offsetHours;
		if (utcHours < 0) {
			utcHours += 24;
		}

		let localHours = utcHours + 8;
		if (localHours >= 24) {
			localHours -= 24;
		}

		const period = localHours >= 12 ? 'PM' : 'AM';
		const standardHours = localHours % 12 === 0 ? 12 : localHours % 12;

		const formattedTime = `${standardHours}:${String(minutes).padStart(2, '0')}:${String(
			seconds
		).padStart(2, '0')} ${period}`;
		return formattedTime;
	}

	function formatDate(dateString: string): string {
		const date = new Date(dateString);
		const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
		return date.toLocaleDateString('en-US', options);
	}

	function toggleSort() {
		sortAscending = !sortAscending;
		historyItems = [...historyItems].sort((a, b) => {
			const dateA = new Date(a.historyDate + 'T' + a.historyTime.split('+')[0]);
			const dateB = new Date(b.historyDate + 'T' + b.historyTime.split('+')[0]);
			return sortAscending ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
		});
	}

	onMount(() => {
		console.log(data.recordData);
	});
</script>

<div class="min-h-screen bg-gray-100 p-6">
	<div class="mb-6 flex flex-col items-center sm:flex-row sm:justify-between rounded-md bg-white p-6 shadow-md">
		<div class="flex flex-col">
			<div class="mb-2 flex flex-col sm:flex-row sm:items-center sm:gap-4">
				<h1 class="text-xl font-semibold text-gray-800">
					CASE NUMBER: <span class="font-bold text-indigo-600">{data.caseNo}</span>
				</h1>
				<h2 class="text-lg text-gray-700">
					CLINIC: <span class="font-medium text-green-600">{data.recordData[0]?.clinicName}</span>
				</h2>
			</div>
			{#if data.recordData[0]?.creatorName || data.recordData[0]?.createdAt}
				<div class="text-xs text-gray-500 mt-1">
					<span class="font-medium">Created by:</span> {data.recordData[0]?.creatorName || 'Unknown Admin'}
					{#if data.recordData[0]?.createdAt}
						<span class="mx-1">•</span>
						<span>{formatDate(data.recordData[0].createdAt.split(' ')[0])}</span>
					{/if}
				</div>
			{/if}
		</div>
		<button
			class="mt-4 sm:mt-0 rounded-md bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 focus:outline-none"
			onclick={toggleSort}
		>
			Sort by Date ({sortAscending ? 'Oldest First' : 'Newest First'})
		</button>
	</div>
	
	<!-- History Timeline Feed -->
	<div class="mx-auto flex w-full max-w-2xl flex-col space-y-6">
		{#each historyItems as item}
			<div
				class={`w-full rounded-xl border border-gray-200/50 p-5 shadow-sm transition-all hover:shadow-md ${
					item.historyType === 'in' ? 'bg-green-100/80' : 'bg-red-200/80'
				}`}
			>
				<div class="flex items-start space-x-4">
					<div class="flex-grow">
						<div class="mb-1 flex items-center justify-between">
							<span class="text-sm text-gray-500">
								{formatDate(item.historyDate)}
							</span>
							<span
								class={`rounded-full px-3 py-1 text-xs font-bold uppercase ${
									item.historyType === 'in'
										? 'bg-green-100 text-green-700'
										: 'bg-red-100 text-red-700'
								}`}>{item.historyType}</span
							>
						</div>
						<p class="text-gray-700">
							<span class="font-semibold">Time:</span>
							<span class="text-blue-500">{formatTimeToStandard(item.historyTime)}</span>
						</p>
						{#if item.imageData}
							<div class="mt-4 overflow-hidden rounded-lg border border-gray-200/60 bg-white/50 p-1">
								<img
									src={item.imageData}
									alt="{item.historyType} History"
									class="block max-h-96 w-full rounded object-contain"
								/>
							</div>
						{:else}
							<p class="mt-2 text-gray-500 italic">No Image Available</p>
						{/if}
						<div class="mt-3 border-t border-gray-300/30 pt-2 text-xs text-gray-600">
							<span class="font-medium">Uploaded by:</span> {item.creatorName || 'Unknown Admin'}
						</div>
					</div>
				</div>
			</div>
		{/each}
	</div>
</div>
