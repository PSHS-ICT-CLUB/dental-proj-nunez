<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import type { PageProps } from './$types';
	import CameraModal from '$lib/components/CameraModal.svelte';
	import { enhance } from '$app/forms';
	import { canActionCase } from '$lib/utils/caseStatusUtils';

	let { data, form }: PageProps = $props();
	const record: any = data.record;

	let date: string | undefined = $state();
	let time: string | undefined = $state();

	let isSubmitting = $state(false);

	let in_file: HTMLInputElement | undefined = $state();
	let in_img_urls: string[] = $state([]);
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

	let showCameraModal = $state(false);
	let canAction = $state(false);

	onMount(() => {
		date = new Date().toISOString().split('T')[0];
		time = new Date().toLocaleTimeString('en-GB', {
			hour: '2-digit',
			minute: '2-digit'
		});

		// Check if case can be actioned based on status
		canAction = canActionCase(record.caseStatus);
	});

	onDestroy(() => {
		// Cleanup if needed
	});
</script>

<div class="flex flex-col items-center justify-center rounded-md bg-white p-8">
	<h1 class="mb-4 text-2xl font-semibold">Record Details</h1>
	<div class="mb-4 text-gray-600">
		<p>Patient: {record.patientName}</p>
		<p>Doctor: {record.doctorName}</p>
		<p>Clinic: {record.clinicName}</p>
	</div>

	<!-- Case Status Display -->
	<div class="mb-6 w-full max-w-2xl rounded-md border border-gray-200 bg-gray-50 p-4">
		<div class="mb-2 flex items-center justify-between">
			<p class="font-semibold text-gray-700">Case Status:</p>
			<span
				class={`rounded-full px-3 py-1 text-sm font-semibold ${
					canAction ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
				}`}
			>
				{record.caseStatus}
			</span>
		</div>

		{#if !canAction}
			<div
				class="mt-3 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800"
			>
				<p class="mb-1 font-semibold">⚠️ Action Not Available</p>
				<p>
					This case cannot be taken out for action yet. The status must be changed to "to be
					deliver" before you can proceed.
				</p>
			</div>
		{:else}
			<div class="mt-3 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
				<p class="mb-1 font-semibold">✓ Ready for Action</p>
				<p>This case is ready to be taken out for action.</p>
			</div>
		{/if}
	</div>

	<form
		method="POST"
		enctype="multipart/form-data"
		class="mb-4 flex w-full max-w-2xl flex-col gap-6 rounded-md border border-gray-200 bg-green-50 px-4 py-6 shadow-sm sm:px-8"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ update }) => {
				await update();
				isSubmitting = false;
			};
		}}
	>
		<input type="hidden" name="recordId" value={record.recordId} />

		{#if !canAction}
			<div class="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
				<p class="mb-2 font-semibold">⛔ Cannot Process Action</p>
				<p class="text-sm">
					This case is not ready for action. Current status: <strong>{record.caseStatus}</strong>
				</p>
				<p class="mt-2 text-sm">
					The case status must be "to be deliver" to proceed. Please contact a manager to update the
					status.
				</p>
			</div>
		{/if}

		<div
			class="flex flex-col gap-4"
			class:opacity-50={!canAction}
			class:pointer-events-none={!canAction}
		>
			<!-- Date/Time inputs -->
			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<label for="date" class="block text-sm font-medium text-gray-700">
					IN Date
					<input
						class="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
						type="date"
						name="date"
						required
						disabled={!canAction}
						bind:value={date}
					/>
				</label>
				<label for="time" class="block text-sm font-medium text-gray-700">
					IN Time
					<input
						class="mt-1 block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 focus:outline-none sm:text-sm"
						type="time"
						name="time"
						placeholder="Time"
						required
						disabled={!canAction}
						bind:value={time}
					/>
				</label>
			</div>

			<!-- Image upload section -->
			<div>
				<span class="mb-2 block text-sm font-medium text-gray-700">IN Image</span>
				<div class="mb-4 flex flex-wrap gap-3">
					<button
						type="button"
						disabled={!canAction}
						class="flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
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
						class="flex flex-1 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-gray-300 px-6 py-4 text-sm font-medium text-gray-600 hover:border-indigo-500 hover:bg-indigo-50 disabled:opacity-50"
						class:opacity-50={!canAction}
						class:cursor-not-allowed={!canAction}
					>
						<span>Or click to upload files</span>
						<input
							type="file"
							name="in-img"
							accept="image/*"
							bind:this={in_file}
							onchange={handleInImageChange}
							multiple
							required
							disabled={!canAction}
							style="display: none;"
						/>
					</label>
				</div>
				{#if in_img_urls.length > 0}
					<div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
						{#each in_img_urls as url, i}
							<div class="group relative">
								<img
									class="h-24 w-full rounded-md border border-gray-100 object-cover shadow-sm"
									src={url}
									alt="IN Preview"
								/>
								<button
									type="button"
									class="absolute -top-2 -right-2 rounded-full bg-red-500 p-1 text-white shadow-lg transition-colors hover:bg-red-600 focus:outline-none"
									onclick={() => removeInImage(i)}
									title="Remove image"
									aria-label="Remove image"
								>
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-3 w-3"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>
						{/each}
					</div>
				{/if}
				<div
					class="mt-6 flex flex-col items-center justify-center gap-2 border-t border-gray-200 pt-6"
				>
					<button
						class="w-full rounded-md bg-indigo-600 px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
						type="submit"
						disabled={isSubmitting || !canAction}
					>
						{isSubmitting ? 'Submitting...' : 'Add IN'}
					</button>
					{#if form?.success}
						<p class="mt-2 font-semibold text-green-600">{form.success}</p>
					{:else if form?.error}
						<p class="mt-2 text-red-500">Error: {form.error}</p>
					{/if}
				</div>
			</div>
		</div>
	</form>
</div>

<CameraModal bind:show={showCameraModal} bind:fileInput={in_file} onCapture={handleInImageChange} />
