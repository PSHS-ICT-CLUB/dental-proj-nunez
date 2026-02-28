<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { PageProps } from './$types';
	import CameraModal from '$lib/components/CameraModal.svelte';

	let { data, form }: PageProps = $props();
	const { record } = data;

	let date: string | undefined = $state();
	let time: string | undefined = $state();

	let in_file: HTMLInputElement | undefined = $state();
	let in_img_urls: string[] = $state([]);
	let showCameraModal = $state(false);

	function handleInImageChange() {
		const files = in_file?.files;
		
		// Revoke old object URLs to avoid memory leaks
		for (const url of in_img_urls) {
			URL.revokeObjectURL(url);
		}
		in_img_urls = [];

		if (files && files.length > 0) {
			for (let i = 0; i < files.length; i++) {
				in_img_urls.push(URL.createObjectURL(files[i]));
			}
		}
	}

	onMount(() => {
		date = new Date().toISOString().split('T')[0];
		time = new Date().toLocaleTimeString('en-GB', {
			hour: '2-digit',
			minute: '2-digit'
		});
	});

	onDestroy(() => {
		// Cleanup if needed
	});
</script>

<div class="bg-white-100 flex flex-col items-center justify-center rounded-md p-8">
	<h1 class="mb-4 text-2xl font-semibold">Record Details</h1>
	<div class="mb-4 text-gray-600">
		<p>Patient: {record.patientName}</p>
		<p>Doctor: {record.doctorName}</p>
		<p>Clinic: {record.clinicName}</p>
	</div>

	<form
		method="POST"
		enctype="multipart/form-data"
		class="flex w-full max-w-md flex-col items-start justify-center space-y-6 rounded border border-gray-300 bg-red-100 px-8 py-6"
	>
		<input type="hidden" name="recordId" value={record.recordId} />

		<label for="date" class="w-full">
			<span class="block text-sm font-medium text-gray-600">OUT Date</span>
			<input
				class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
				type="date"
				name="date"
				placeholder="Date"
				required
				bind:value={date}
			/>
		</label>
		<label for="time" class="w-full">
			<span class="block text-sm font-medium text-gray-600">OUT Time</span>
			<input
				class="mt-1 w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
				type="time"
				name="time"
				placeholder="Time"
				required
				bind:value={time}
			/>
		</label>

		<div class="w-full">
			<span class="block text-sm font-medium text-gray-600">OUT Image</span>
			<div class="mb-2 flex gap-2">
				<button
					type="button"
					class="flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
					onclick={() => {
						showCameraModal = true;
					}}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="mr-2 h-5 w-5"
						viewBox="0 0 20 20"
						fill="currentColor"
					>
						<path
							fill-rule="evenodd"
							d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z"
							clip-rule="evenodd"
						/>
					</svg>
					Use Camera
				</button>
				<input
					class="mt-1 w-full rounded-md border-2 border-dashed border-gray-400 px-2 py-3 focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
					type="file"
					name="out-img"
					accept="image/*"
					bind:this={in_file}
					onchange={handleInImageChange}
					multiple
					required
				/>
			</div>
			{#if in_img_urls.length > 0}
				<div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
					{#each in_img_urls as url}
						<img class="h-24 w-full rounded-md object-cover shadow-sm" src={url} alt="OUT Preview" />
					{/each}
				</div>
			{/if}
		</div>

		<div class="flex items-center gap-2">
			<input
				type="checkbox"
				name="finished"
				class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
			/>
			<label for="finished" class="text-sm font-medium text-gray-700"> Mark as Finished </label>
		</div>

		<div class="mt-4 flex w-full justify-center">
			<button
				class="rounded-md bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-none"
				type="submit">Add OUT</button
			>
		</div>
	</form>
</div>

<CameraModal bind:show={showCameraModal} bind:fileInput={in_file} onCapture={handleInImageChange} />
