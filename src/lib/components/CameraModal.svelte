<script lang="ts">
	import { onDestroy } from 'svelte';
	import { browser } from '$app/environment';

	let {
		show = $bindable(false),
		fileInput = $bindable(),
		onCapture
	}: {
		show: boolean;
		fileInput: HTMLInputElement | undefined;
		onCapture?: () => void;
	} = $props();

	let showSettingsModal = $state(false);
	let stream: MediaStream | null = $state(null);
	let videoElement: HTMLVideoElement | undefined = $state();
	let canvasElement: HTMLCanvasElement | undefined = $state();
	let availableCameras = $state<MediaDeviceInfo[]>([]);
	let selectedCameraId = $state<string>('');

	async function loadCameras() {
		try {
			const devices = await navigator.mediaDevices.enumerateDevices();
			availableCameras = devices.filter((device) => device.kind === 'videoinput');
			if (availableCameras.length > 0 && !selectedCameraId) {
				selectedCameraId = availableCameras[0].deviceId;
			}
		} catch (err) {
			console.error('Error loading cameras:', err);
		}
	}

	async function startCamera() {
		try {
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				throw new Error("Your browser doesn't support camera access");
			}

			const permissions = await navigator.permissions
				.query({ name: 'camera' as PermissionName })
				.catch(() => null);

			if (permissions?.state === 'denied') {
				showSettingsModal = true;
				throw new Error('Camera permission was denied');
			}

			await loadCameras();

			const constraints: MediaStreamConstraints = {
				video: selectedCameraId
					? {
							deviceId: { exact: selectedCameraId },
							width: { ideal: 1280 },
							height: { ideal: 720 }
						}
					: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
				audio: false
			};

			stream = await navigator.mediaDevices.getUserMedia(constraints);

			if (videoElement) {
				videoElement.srcObject = stream;
				window.addEventListener('keydown', handleKeyPress);
				await new Promise((resolve) => {
					if (videoElement) {
						videoElement.onloadedmetadata = () => resolve(true);
					}
				});
				videoElement.play();
			}
		} catch (err) {
			console.error('Error accessing camera:', err);
			if (err instanceof Error && err.message !== 'Camera permission was denied') {
				alert(err.message);
			} else if (!(err instanceof Error)) {
				alert('Could not initialize camera');
			}
			closeCameraModal();
		}
	}

	function stopCamera() {
		if (stream) {
			stream.getTracks().forEach((track) => track.stop());
			stream = null;
		}
		if (browser) {
			window.removeEventListener('keydown', handleKeyPress);
		}
	}

	function captureImage() {
		if (videoElement && canvasElement) {
			const context = canvasElement.getContext('2d');
			if (context) {
				canvasElement.width = videoElement.videoWidth;
				canvasElement.height = videoElement.videoHeight;
				context.drawImage(videoElement, 0, 0);

				canvasElement.toBlob((blob) => {
					if (blob && fileInput) {
						const timestamp = new Date().getTime();
						const file = new File([blob], `camera-capture-${timestamp}.jpg`, { type: 'image/jpeg' });
						const dataTransfer = new DataTransfer();
						
						// Add existing files if any
						if (fileInput.files) {
							for (let i = 0; i < fileInput.files.length; i++) {
								dataTransfer.items.add(fileInput.files[i]);
							}
						}
						
						// Add new file
						dataTransfer.items.add(file);
						fileInput.files = dataTransfer.files;
						
						// Trigger change event to update previews
						const event = new Event('change', { bubbles: true });
						fileInput.dispatchEvent(event);

						if (onCapture) onCapture();
					}
				}, 'image/jpeg');
			}
		}
		closeCameraModal();
	}

	function closeCameraModal() {
		show = false;
		stopCamera();
	}

	async function switchCamera() {
		stopCamera();
		await startCamera();
	}

	function handleKeyPress(e: KeyboardEvent) {
		if (e.code === 'Space' && show) {
			e.preventDefault();
			captureImage();
		}
		if (e.code === 'Escape' && show) {
			e.preventDefault();
			closeCameraModal();
		}
	}

	function closeSettingsModal() {
		showSettingsModal = false;
	}

	$effect(() => {
		if (show) {
			startCamera();
		} else {
			stopCamera();
		}
	});

	onDestroy(() => {
		stopCamera();
	});
</script>

{#if show && !showSettingsModal}
	<div
		class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black"
		role="dialog"
		aria-modal="true"
		aria-labelledby="camera-modal-title"
	>
		<div class="rounded-lg bg-white p-6 shadow-xl">
			<div class="mb-4 flex justify-between">
				<h3 id="camera-modal-title" class="text-lg font-medium">Take Photo</h3>
				<button
					type="button"
					aria-label="Close"
					class="text-text-muted hover:text-text-muted"
					onclick={closeCameraModal}
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
			{#if availableCameras.length > 1}
				<div class="mb-4">
					<label for="camera-select" class="mb-2 block text-sm font-medium text-text-secondary">
						Select Camera
					</label>
					<select
						id="camera-select"
						bind:value={selectedCameraId}
						onchange={switchCamera}
						class="w-full rounded-md border border-border px-3 py-2 text-sm focus:border-primary focus:ring-primary focus:outline-none"
					>
						{#each availableCameras as camera}
							<option value={camera.deviceId}>
								{camera.label || `Camera ${availableCameras.indexOf(camera) + 1}`}
							</option>
						{/each}
					</select>
				</div>
			{/if}
			<div class="relative">
				<!-- svelte-ignore a11y_media_has_caption -->
				<video bind:this={videoElement} autoplay playsinline class="max-w-78 rounded-lg"></video>
				<canvas bind:this={canvasElement} class="hidden"></canvas>
			</div>
			<div class="mt-4 flex justify-end gap-2">
				<button
					type="button"
					class="rounded-md bg-white px-4 py-2 text-sm font-medium text-text-secondary shadow-sm hover:bg-surface focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
					onclick={closeCameraModal}
				>
					Cancel
				</button>
				<button
					type="button"
					class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:outline-none"
					onclick={captureImage}
				>
					Capture (Space)
				</button>
			</div>
		</div>
	</div>
{/if}

{#if showSettingsModal}
	<div
		class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black"
		role="dialog"
		aria-modal="true"
		aria-labelledby="settings-modal-title"
	>
		<div class="w-96 rounded-lg bg-white p-6 shadow-xl">
			<div class="mb-4 flex justify-between">
				<h3 id="settings-modal-title" class="text-lg font-medium text-text-primary">
					Camera Access Required
				</h3>
				<button
					type="button"
					aria-label="Close"
					class="text-text-muted hover:text-text-muted"
					onclick={closeSettingsModal}
				>
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>
			<div class="mb-4">
				<p class="text-sm text-text-muted">
					To use the camera feature, you need to allow camera permission or configure Chrome if on
					HTTP with Mobile:
				</p>
				<ol class="mt-2 list-decimal pl-4 text-sm text-text-secondary">
					<li class="mb-2">
						Open Chrome settings by copying this URL:
						<code class="ml-2 rounded bg-surface-alt px-2 py-1 text-sm break-all">
							chrome://flags/#unsafely-treat-insecure-origin-as-secure
						</code>
					</li>
					<li class="mb-2">Enable the flag and add this site to the list.</li>
					<li>Restart your browser.</li>
				</ol>
			</div>
			<div class="mt-6 flex justify-end gap-3">
				<button
					type="button"
					class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-text-primary shadow-sm ring-1 ring-border-border ring-inset hover:bg-surface"
					onclick={closeSettingsModal}
				>
					Close
				</button>
				<button
					type="button"
					class="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary"
					onclick={() => {
						navigator.clipboard.writeText(
							'chrome://flags/#unsafely-treat-insecure-origin-as-secure'
						);
						alert('URL copied to clipboard!');
					}}
				>
					Copy URL
				</button>
			</div>
		</div>
	</div>
{/if}
