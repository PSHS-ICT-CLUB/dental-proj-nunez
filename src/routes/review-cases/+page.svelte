<script lang="ts">
	import type { PageProps } from './$types';
	import { getStatusConfig } from '$lib/utils/caseStatusUtils';

	const { data }: PageProps = $props();

	let cases = $state(data.cases || []);
	let loadingCaseId = $state<number | null>(null);
	let toastMessage = $state('');
	let toastType = $state<'success' | 'error'>('success');
	let showToast = $state(false);

	// Image lightbox
	let lightboxOpen = $state(false);
	let lightboxSrc = $state('');
	let lightboxAlt = $state('');

	function openLightbox(src: string, alt: string) {
		lightboxSrc = src;
		lightboxAlt = alt;
		lightboxOpen = true;
	}

	function closeLightbox() {
		lightboxOpen = false;
		lightboxSrc = '';
		lightboxAlt = '';
	}

	function showToastMessage(message: string, type: 'success' | 'error') {
		toastMessage = message;
		toastType = type;
		showToast = true;
		setTimeout(() => {
			showToast = false;
		}, 4000);
	}

	// Per-card proof images: Map of recordId -> File[]
	let proofImages = $state<Record<number, File[]>>({});
	let proofPreviews = $state<Record<number, string[]>>({});

	function handleProofFiles(recordId: number, files: FileList | null) {
		if (!files || files.length === 0) return;
		const existing = proofImages[recordId] || [];
		const existingPreviews = proofPreviews[recordId] || [];
		const newFiles = Array.from(files);

		for (const file of newFiles) {
			existing.push(file);
			existingPreviews.push(URL.createObjectURL(file));
		}

		proofImages[recordId] = [...existing];
		proofPreviews[recordId] = [...existingPreviews];
	}

	function removeProofImage(recordId: number, index: number) {
		const files = proofImages[recordId] || [];
		const previews = proofPreviews[recordId] || [];

		// Revoke the object URL to free memory
		if (previews[index]) URL.revokeObjectURL(previews[index]);

		files.splice(index, 1);
		previews.splice(index, 1);

		proofImages[recordId] = [...files];
		proofPreviews[recordId] = [...previews];
	}

	function handleDrop(e: DragEvent, recordId: number) {
		e.preventDefault();
		handleProofFiles(recordId, e.dataTransfer?.files || null);
	}

	async function approveCase(recordId: number) {
		if (loadingCaseId) return;
		loadingCaseId = recordId;

		try {
			const formData = new FormData();
			formData.append('recordId', recordId.toString());

			// Attach proof images
			const files = proofImages[recordId] || [];
			for (const file of files) {
				formData.append('proof-images', file);
			}

			const response = await fetch('/api/review-approve', {
				method: 'POST',
				body: formData
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Failed to approve case');
			}

			// Revoke preview URLs
			(proofPreviews[recordId] || []).forEach((url) => URL.revokeObjectURL(url));
			delete proofImages[recordId];
			delete proofPreviews[recordId];

			// Remove the case from the list
			cases = cases.filter((c) => c.recordId !== recordId);
			showToastMessage(
				`Case #${recordId} approved for delivery${result.imagesUploaded ? ` — ${result.imagesUploaded} proof image(s) uploaded` : ''}`,
				'success'
			);
		} catch (err) {
			showToastMessage(
				err instanceof Error ? err.message : 'Failed to approve case',
				'error'
			);
		} finally {
			loadingCaseId = null;
		}
	}

	async function rejectCase(recordId: number) {
		if (loadingCaseId) return;
		
		if (!confirm('Are you sure you want to mark this case as failed and send it back to Pending for technicians to redo?')) {
			return;
		}

		loadingCaseId = recordId;

		try {
			const response = await fetch('/api/case-status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					recordId: recordId,
					newStatus: 'pending' // Send back to pending
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Failed to reject case');
			}

			// Remove the case from the list
			cases = cases.filter((c) => c.recordId !== recordId);
			showToastMessage(`Case #${recordId} marked as failed and sent back to Pending`, 'success');
		} catch (err) {
			showToastMessage(
				err instanceof Error ? err.message : 'Failed to reject case',
				'error'
			);
		} finally {
			loadingCaseId = null;
		}
	}

	function formatDate(dateStr: string | null): string {
		if (!dateStr) return '—';
		return new Date(dateStr).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function formatCurrency(amount: string | number | null): string {
		if (!amount) return '₱0.00';
		return new Intl.NumberFormat('en-PH', {
			style: 'currency',
			currency: 'PHP'
		}).format(Number(amount));
	}
</script>

<!-- Toast Notification -->
{#if showToast}
	<div
		class="fixed top-4 right-4 z-50 max-w-sm animate-slide-in rounded-lg border px-4 py-3 shadow-lg {toastType === 'success'
			? 'border-green-200 bg-green-50 text-green-800'
			: 'border-red-200 bg-red-50 text-red-800'}"
	>
		<div class="flex items-center gap-2">
			{#if toastType === 'success'}
				<svg class="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
			{:else}
				<svg class="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			{/if}
			<p class="text-sm font-medium">{toastMessage}</p>
			<button onclick={() => (showToast = false)} class="ml-auto text-gray-400 hover:text-gray-600">
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	</div>
{/if}

<!-- Lightbox Modal -->
{#if lightboxOpen}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
		role="dialog"
		aria-modal="true"
	>
		<button
			onclick={closeLightbox}
			class="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white transition hover:bg-white/20"
			aria-label="Close"
		>
			<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
		<button
			onclick={closeLightbox}
			class="absolute inset-0 -z-10"
			aria-label="Close overlay"
		></button>
		<img
			src={lightboxSrc}
			alt={lightboxAlt}
			class="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
		/>
	</div>
{/if}

<div class="mx-auto max-w-7xl px-4 py-6">
	<!-- Page Header -->
	<div class="mb-6 flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
				<svg class="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
				</svg>
			</div>
			<div>
				<h1 class="text-2xl font-bold text-gray-900">Cases For Review</h1>
				<p class="text-sm text-gray-500">
					Review cases and approve for delivery
				</p>
			</div>
		</div>
		<div class="flex items-center gap-2">
			<span class="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-700">
				{cases.length} case{cases.length !== 1 ? 's' : ''}
			</span>
			<span class="rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-500 capitalize">
				{data.userRole}
			</span>
		</div>
	</div>

	<!-- Cases Grid -->
	{#if cases.length === 0}
		<div class="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-16">
			<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
				<svg class="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
				</svg>
			</div>
			<h3 class="text-lg font-semibold text-gray-700">All Caught Up!</h3>
			<p class="mt-1 text-sm text-gray-500">No cases are awaiting review at the moment.</p>
			<a href="/" class="mt-4 rounded-lg bg-[#164154] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1f3a4d]">
				Back to Dashboard
			</a>
		</div>
	{:else}
		<div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{#each cases as caseItem (caseItem.recordId)}
				{@const statusConfig = getStatusConfig(caseItem.caseStatus)}
				<div class="relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md">
					<!-- Card Header -->
					<div class="border-b border-gray-100 bg-gray-50/50 px-4 py-3">
						<div class="flex items-center justify-between">
							<div class="flex items-center gap-2">
								<span class="text-base font-bold text-gray-900">#{caseItem.recordId}</span>
								<span class="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase {statusConfig.bgColor} {statusConfig.color}">
									{statusConfig.icon} {statusConfig.label}
								</span>
							</div>
							<a
								href="/details/{caseItem.recordId}"
								class="text-xs text-blue-600 hover:underline"
							>
								View Full →
							</a>
						</div>
					</div>

					<!-- Case Info -->
					<div class="flex-1 p-4">
						<div class="mb-3">
							<h3 class="text-lg font-semibold text-gray-900">{caseItem.patientName}</h3>
							<div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
								<span class="flex items-center gap-1">
									<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
									</svg>
									{caseItem.doctorName}
								</span>
								<span class="flex items-center gap-1">
									<svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
									</svg>
									{caseItem.clinicName}
								</span>
							</div>
						</div>

						<!-- Order Items Summary -->
						{#if caseItem.orderItems && caseItem.orderItems.length > 0}
							<div class="mb-3">
								<div class="flex flex-wrap gap-1">
									{#each caseItem.orderItems as item}
										<span class="inline-flex items-center gap-1 rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
											<span class="font-bold uppercase">{item.upOrDown}</span>
											{item.caseTypeName}
											<span class="text-indigo-400">({item.caseNo})</span>
										</span>
									{/each}
								</div>
							</div>
						{/if}

						<!-- Case Notes / Description -->
						{#if caseItem.caseNotes || caseItem.description}
							<div class="mb-3 rounded-lg bg-gray-50 p-2.5 text-xs text-gray-600">
								<p class="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
									Notes
								</p>
								{caseItem.caseNotes || caseItem.description}
							</div>
						{/if}

						<!-- Dates Row -->
						<div class="mb-3 grid grid-cols-2 gap-2 text-xs">
							<div>
								<span class="text-[10px] font-medium uppercase text-gray-400">Received</span>
								<p class="font-medium text-gray-700">{formatDate(caseItem.dateIn || caseItem.datePickup)}</p>
							</div>
							{#if caseItem.finishBy}
								<div>
									<span class="text-[10px] font-medium uppercase text-gray-400">Finish By</span>
									<p class="font-medium text-gray-700">{formatDate(caseItem.finishBy)}</p>
								</div>
							{/if}
						</div>

						<!-- Images Gallery -->
						{#if caseItem.images && caseItem.images.length > 0}
							<div class="mb-3">
								<p class="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
									📷 Attached Images ({caseItem.images.length})
								</p>
								<div class="grid grid-cols-3 gap-1.5">
									{#each caseItem.images as img}
										<button
											onclick={() => openLightbox(img.imageUrl, `Case #${caseItem.recordId} - ${img.historyType}`)}
											class="group relative aspect-square overflow-hidden rounded-lg border border-gray-200 bg-gray-100 transition hover:border-blue-400 hover:shadow-md"
										>
											<img
												src={img.imageUrl}
												alt="{img.historyType} - {formatDate(img.historyDate)}"
												class="h-full w-full object-cover transition-transform group-hover:scale-105"
												loading="lazy"
											/>
											<div class="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
												<svg class="h-6 w-6 text-white opacity-0 transition group-hover:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
												</svg>
											</div>
											<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-1.5 py-1">
												<span class="text-[9px] font-medium text-white uppercase">{img.historyType}</span>
											</div>
										</button>
									{/each}
								</div>
							</div>
						{:else}
							<div class="mb-3 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 px-3 py-2 text-center text-xs text-gray-400">
								No images attached
							</div>
						{/if}

						<!-- Payment Info -->
						<div class="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-xs">
							<span class="text-gray-500">Total</span>
							<span class="font-bold text-gray-900">{formatCurrency(caseItem.orderTotal)}</span>
						</div>
					</div>

					<!-- Card Footer: Proof Image Upload & Approve -->
					<div class="border-t border-gray-100 bg-gray-50/30 px-4 py-3">
						<!-- Proof Image Upload Area -->
						<div class="mb-3">
							<p class="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-gray-500">
								📎 Attach Review Proof Image(s)
							</p>

							<!-- Upload Drop Zone -->
							<label
								class="flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed border-gray-300 bg-white px-3 py-3 transition-colors hover:border-emerald-400 hover:bg-emerald-50/30"
								ondragover={(e) => e.preventDefault()}
								ondrop={(e) => handleDrop(e, caseItem.recordId)}
							>
								<svg class="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
								</svg>
								<span class="text-xs text-gray-500">Click or drop image(s) here</span>
								<input
									type="file"
									accept="image/*"
									multiple
									class="hidden"
									onchange={(e) => handleProofFiles(caseItem.recordId, e.currentTarget.files)}
								/>
							</label>

							<!-- Proof Image Previews -->
							{#if proofPreviews[caseItem.recordId]?.length > 0}
								<div class="mt-2 grid grid-cols-4 gap-1.5">
									{#each proofPreviews[caseItem.recordId] as preview, idx}
										<div class="group relative aspect-square overflow-hidden rounded-lg border border-gray-200">
											<img
												src={preview}
												alt="Proof {idx + 1}"
												class="h-full w-full object-cover"
											/>
											<button
												onclick={() => removeProofImage(caseItem.recordId, idx)}
												class="absolute top-0.5 right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 shadow transition-opacity group-hover:opacity-100"
												aria-label="Remove image"
											>
												<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
													<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
												</svg>
											</button>
											<div class="absolute bottom-0 left-0 right-0 bg-black/40 px-1 py-0.5 text-center text-[8px] text-white">
												Proof {idx + 1}
											</div>
										</div>
									{/each}
								</div>
							{/if}
						</div>

						<!-- Approve & Reject Buttons -->
						<div class="flex flex-col gap-2">
							<button
								onclick={() => approveCase(caseItem.recordId)}
								disabled={loadingCaseId === caseItem.recordId}
								class="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
							>
								{#if loadingCaseId === caseItem.recordId}
									<span class="inline-flex items-center gap-2">
										<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
											<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
											<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
										</svg>
										Processing...
									</span>
								{:else}
									✓ Approve for Delivery
									{#if proofPreviews[caseItem.recordId]?.length > 0}
										<span class="ml-1 rounded bg-emerald-500 px-1.5 py-0.5 text-[10px]">
											{proofPreviews[caseItem.recordId].length} image{proofPreviews[caseItem.recordId].length !== 1 ? 's' : ''}
										</span>
									{/if}
								{/if}
							</button>

							<button
								onclick={() => rejectCase(caseItem.recordId)}
								disabled={loadingCaseId === caseItem.recordId}
								class="w-full flex justify-center items-center gap-2 rounded-lg bg-white border border-red-200 px-4 py-2 text-sm font-bold text-red-600 shadow-sm transition-all hover:bg-red-50 hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
							>
								<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
								</svg>
								Mark as Failed (Backjob)
							</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<style>
	@keyframes slide-in {
		from {
			opacity: 0;
			transform: translateY(-12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	.animate-slide-in {
		animation: slide-in 0.3s ease-out;
	}
</style>
