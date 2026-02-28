<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { PageProps } from './$types';
	import CameraModal from '$lib/components/CameraModal.svelte';
	import { enhance } from '$app/forms';

	let { data, form }: PageProps = $props();
	const { record } = data;

	let date: string | undefined = $state();
	let time: string | undefined = $state();

	let isSubmitting = $state(false);

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

	function removeInImage(index: number) {
		if (!in_file?.files) return;
		
		const dataTransfer = new DataTransfer();
		const files = Array.from(in_file.files);
		
		files.forEach((file, i) => {
			if (i !== index) {
				dataTransfer.items.add(file);
			}
		});
		
		in_file.files = dataTransfer.files;
		handleInImageChange();
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
		class="mb-4 flex w-full max-w-2xl flex-col gap-6 rounded-md border border-gray-200 bg-red-50 px-4 py-6 sm:px-8 shadow-sm"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ update }) => {
				await update();
				isSubmitting = false;
			};
		}}
	>
		<input type="hidden" name="recordId" value={record.recordId} />

		<div class="flex flex-col gap-4">
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<label for="date" class="block text-sm font-medium text-gray-700">
					OUT Date
					<input
						class="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
						type="date"
						name="date"
						placeholder="Date"
						required
						bind:value={date}
					/>
				</label>
				<label for="time" class="block text-sm font-medium text-gray-700">
					OUT Time
					<input
						class="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
						type="time"
						name="time"
						placeholder="Time"
						required
						bind:value={time}
					/>
				</label>
			</div>

			<div>
				<span class="block text-sm font-medium text-gray-700 mb-2">OUT Image</span>
				<div class="mb-4 flex flex-wrap gap-3">
					<button
						type="button"
						class="flex items-center justify-center rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
						onclick={() => {
							showCameraModal = true;
						}}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="mr-2 h-5 w-5 text-gray-400"
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
					<label
						class="flex flex-1 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-300 px-6 py-4 hover:border-indigo-500 hover:bg-indigo-50 text-sm text-gray-600 font-medium"
					>
						<span>Or click to upload files</span>
						<input
							type="file"
							name="out-img"
							accept="image/*"
							bind:this={in_file}
							onchange={handleInImageChange}
							multiple
							required
							style="display: none;"
						/>
					</label>
				</div>
			{#if in_img_urls.length > 0}
				<div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
					{#each in_img_urls as url, i}
						<div class="relative group">
							<img class="h-24 w-full rounded-md object-cover shadow-sm border border-gray-100" src={url} alt="OUT Preview" />
							<button
								type="button"
								class="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 focus:outline-none transition-colors"
								onclick={() => removeInImage(i)}
								title="Remove image"
								aria-label="Remove image"
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
								</svg>
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<div class="flex items-center gap-2 py-2">
				<input
					type="checkbox"
					name="finished"
					class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
				/>
				<label for="finished" class="text-sm font-medium text-gray-700"> Mark as Finished </label>
			</div>

			<div class="mt-6 flex flex-col items-center justify-center gap-2 border-t border-gray-200 pt-6">
				<button
					class="w-full sm:w-auto rounded-md bg-indigo-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
					type="submit"
					disabled={isSubmitting}
				>
					{isSubmitting ? 'Submitting...' : 'Add OUT'}
				</button>
				{#if form?.success}
					<p class="font-semibold text-green-600 mt-2">{form.success}</p>
				{:else if form?.error}
					<p class="text-red-500 mt-2">Error: {form.error}</p>
				{/if}
			</div>
		</div>
	</form>
</div>

<CameraModal bind:show={showCameraModal} bind:fileInput={in_file} onCapture={handleInImageChange} />
