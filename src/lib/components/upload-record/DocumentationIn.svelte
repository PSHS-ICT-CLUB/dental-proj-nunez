<script lang="ts">
	let {
		in_img_urls,
		in_file = $bindable(),
		showCameraModal = $bindable(),
		handleInImageChange,
		removeInImage,
		date = $bindable(),
		time = $bindable()
	}: {
		in_img_urls: string[];
		in_file: HTMLInputElement | undefined;
		showCameraModal: boolean;
		handleInImageChange: () => void;
		removeInImage: (index: number) => void;
		date: string | undefined;
		time: string | undefined;
	} = $props();
</script>

<div class="rounded-md border border-border p-4">
	<div class="mb-2 flex flex-col gap-2">
		<span class="block text-[10px] font-bold tracking-wider text-text-muted uppercase"> IN Image </span>
		{#if in_img_urls.length === 0}
			<p class="mb-2 text-sm text-text-muted">No images uploaded yet</p>
		{/if}
		<div class="flex gap-2">
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
			<label
				class="flex cursor-pointer items-center justify-center rounded-md bg-text-text-secondary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-text-text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-text-text-secondary"
			>
				<input
					type="file"
					name="in-img"
					class="w-24"
					accept="image/*"
					bind:this={in_file}
					onchange={handleInImageChange}
					multiple
					required
				/>
			</label>
		</div>
	</div>
	{#if in_img_urls.length > 0}
		<div class="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
			{#each in_img_urls as url, i}
				<div class="relative group">
					<img
						class="h-24 w-full rounded-md object-cover shadow-sm border border-surface-alt"
						src={url}
						alt="IN Preview"
					/>
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
	<div class="mt-4 flex flex-col gap-2">
		<label for="date" class="mb-2 block text-[10px] font-bold tracking-wider text-text-muted uppercase">
			IN Date
			<input
				type="date"
				name="date"
				placeholder="Date"
				required
				bind:value={date}
				class="block w-full appearance-none rounded-md border border-border px-3 py-2 text-text-primary shadow-sm focus:border-primary focus:ring-primary focus:outline-none sm:text-sm"
			/>
		</label>
		<label for="time" class="mb-2 block text-[10px] font-bold tracking-wider text-text-muted uppercase">
			IN Time
			<input
				type="time"
				name="time"
				placeholder="Time"
				required
				bind:value={time}
				class="block w-full appearance-none rounded-md border border-border px-3 py-2 text-text-primary shadow-sm focus:border-primary focus:ring-primary focus:outline-none sm:text-sm"
			/>
		</label>
	</div>
</div>
