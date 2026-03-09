<script lang="ts">
	import type { PageData, PageProps } from './$types';
	import { getStatusWorkflow, getAvailableStatusesForRole, getStatusConfig, type CaseStatus } from '$lib/utils/caseStatusUtils';
	import { invalidateAll } from '$app/navigation';
    import { enhance } from '$app/forms';
    import CameraModal from '$lib/components/CameraModal.svelte';
    import { onMount } from 'svelte';

	let { data, form }: PageProps = $props();
	
	let record = $state(data.record);
	let isLoading = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	const workflowConfig = getStatusWorkflow();

    // Workflow actions state
    let date = $state('');
    let time = $state('');
    let isSubmittingAction = $state(false);
    
    // IN Action state
    let in_file: HTMLInputElement | undefined = $state();
    let in_img_urls: string[] = $state([]);
    let showInCameraModal = $state(false);

    // OUT Action state
    let out_file: HTMLInputElement | undefined = $state();
    let out_img_urls: string[] = $state([]);
    let showOutCameraModal = $state(false);

    onMount(() => {
        date = new Date().toISOString().split('T')[0];
        time = new Date().toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
        });
    });

    function handleInImageChange() {
        const files = in_file?.files;
        for (const url of in_img_urls) URL.revokeObjectURL(url);
        in_img_urls = [];
        if (files) {
            for (let i = 0; i < files.length; i++) {
                in_img_urls.push(URL.createObjectURL(files[i]));
            }
        }
    }

    function removeInImage(index: number) {
        if (!in_file?.files) return;
        const dataTransfer = new DataTransfer();
        const files = Array.from(in_file.files);
        files.forEach((file, i) => { if (i !== index) dataTransfer.items.add(file); });
        in_file.files = dataTransfer.files;
        handleInImageChange();
    }

    function handleOutImageChange() {
        const files = out_file?.files;
        for (const url of out_img_urls) URL.revokeObjectURL(url);
        out_img_urls = [];
        if (files) {
            for (let i = 0; i < files.length; i++) {
                out_img_urls.push(URL.createObjectURL(files[i]));
            }
        }
    }

    function removeOutImage(index: number) {
        if (!out_file?.files) return;
        const dataTransfer = new DataTransfer();
        const files = Array.from(out_file.files);
        files.forEach((file, i) => { if (i !== index) dataTransfer.items.add(file); });
        out_file.files = dataTransfer.files;
        handleOutImageChange();
    }

	async function updateStatus(newStatus: CaseStatus) {
		isLoading = true;
		errorMessage = '';
		successMessage = '';

		try {
			const res = await fetch('/api/case-status', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					recordId: record.recordId,
					newStatus
				})
			});

			const responseData = await res.json();
			if (!res.ok) {
				throw new Error(responseData.message || 'Failed to update status');
			}

			successMessage = `Successfully moved case to ${getStatusConfig(newStatus).label}!`;
			await invalidateAll(); // Refresh page data to reflect new state
            record.caseStatus = newStatus; // Optimistic UI update

			setTimeout(() => {
				successMessage = '';
			}, 3000);
		} catch (err: any) {
			errorMessage = err.message || 'Operation failed.';
		} finally {
			isLoading = false;
		}
	}

	function canAdvanceTo(newStatus: CaseStatus) {
		const currentState = record.caseStatus || 'pending';
		const availableForRole = getAvailableStatusesForRole(data.userRole);

		// Must be allowed for the user's role
		if (!availableForRole.includes(newStatus)) return false;

		// Admins can jump anywhere
		if (data.userRole === 'admin') return true;

		// Otherwise, must be a strictly forward linear stage according to the workflow
		const currentStage = workflowConfig.find((stage) => stage.status === currentState);
		return currentStage?.nextStages.includes(newStatus) ?? false;
	}
</script>

<div class="mx-auto max-w-3xl px-4 py-8">
	<!-- Header -->
	<div class="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-gray-900">Case Timeline #{record.recordId}</h1>
			<p class="text-sm text-gray-500 mt-1">
				Patient: <span class="font-medium text-gray-700">{record.patientName}</span> • 
				Clinic: <span class="font-medium text-gray-700">{record.clinicName}</span>
			</p>
		</div>
		<div class="flex items-center gap-3">
            <a
				href="/edit/{record.recordId}"
				class="rounded-md bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
			>
				Edit Info
			</a>
			<a
				href="/"
				class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 shadow-sm"
			>
				Dashboard
			</a>
		</div>
	</div>

	<!-- Status Feedback -->
	{#if errorMessage}
		<div class="mb-6 rounded-md bg-red-50 p-4 border border-red-100">
			<div class="flex">
				<div class="ml-3">
					<h3 class="text-sm font-medium text-red-800">Error</h3>
					<div class="mt-2 text-sm text-red-700">
						<p>{errorMessage}</p>
					</div>
				</div>
			</div>
		</div>
	{/if}

	{#if successMessage}
		<div class="mb-6 rounded-md bg-green-50 p-4 border border-green-100 transition-opacity">
			<div class="flex">
				<div class="ml-3">
					<p class="text-sm font-medium text-green-800">{successMessage}</p>
				</div>
			</div>
		</div>
	{/if}

	<!-- Interactive Timeline Card -->
	<div class="rounded-xl bg-white p-8 shadow-sm border border-gray-100 relative overflow-hidden">
		<div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
		
		<h2 class="text-lg font-semibold text-gray-900 mb-8 border-b border-gray-100 pb-4">Workflow Progress</h2>

		<div class="relative">
			<!-- Visual Pipeline Line -->
			<div class="absolute left-[28px] sm:left-1/2 top-4 bottom-4 w-0.5 bg-gray-200 sm:-translate-x-1/2"></div>

			<!-- Pipeline Stages -->
			<div class="space-y-12">
				{#each workflowConfig as stage, index}
					{@const isCurrent = record.caseStatus === stage.status || (!record.caseStatus && stage.status === 'pending')}
					{@const isPast = workflowConfig.findIndex(s => s.status === record.caseStatus) > index}
					{@const canAdvance = canAdvanceTo(stage.status)}
					{@const configInfo = getStatusConfig(stage.status)}

					<div class="relative flex flex-col sm:flex-row items-start sm:items-center justify-between group">
						
						<!-- Left Side (Past Status or empty space on sm) -->
						<div class="hidden sm:block sm:w-1/2 sm:pr-12 sm:text-right">
							{#if isPast}
								<span class="text-sm font-medium text-gray-400">Completed Stage</span>
							{/if}
						</div>

						<!-- Center Node -->
						<div class="absolute left-0 sm:left-1/2 flex items-center justify-center w-14 h-14 bg-white border-4 {isCurrent ? 'border-indigo-600 shadow-md ring-4 ring-indigo-50' : isPast ? 'border-gray-300' : 'border-gray-200'} rounded-full sm:-translate-x-1/2 z-10 transition-all duration-300">
							{#if isCurrent}
								<span class="text-2xl animate-pulse">{configInfo.icon}</span>
							{:else if isPast}
								<svg class="w-6 h-6 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
									<path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
								</svg>
							{:else}
								<span class="text-xl opacity-30 grayscale saturate-0">{configInfo.icon}</span>
							{/if}
						</div>

						<!-- Right Side Details & Actions -->
						<div class="pl-20 sm:pl-12 sm:w-1/2 pt-2 sm:pt-0 pb-6 sm:pb-0">
							<h3 class="text-lg font-bold {isCurrent ? 'text-indigo-900' : isPast ? 'text-gray-400' : 'text-gray-600'}">
								{configInfo.label}
							</h3>
							<p class="text-sm mt-1 {isCurrent ? 'text-indigo-600 font-medium' : 'text-gray-500'}">
								{configInfo.description}
							</p>

							{#if isCurrent}
								<div class="mt-2 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold text-indigo-700 bg-indigo-100 ring-1 ring-inset ring-indigo-700/10">
									Current Status
								</div>
                                
								{#if stage.status === 'pending'}
									{#if !record.dateOut}
										<form method="POST" action="?/processIn" enctype="multipart/form-data" class="mt-6 border border-indigo-200 bg-white rounded-md shadow-sm p-4 animate-in fade-in slide-in-from-top-2"
                                            use:enhance={() => { 
                                                isSubmittingAction = true; errorMessage = ''; successMessage = '';
                                                return async ({ update, result }: any) => { 
                                                    isSubmittingAction = false; 
                                                    if (result.type === 'success' && result.data?.success) { 
                                                        successMessage = result.data.message; 
                                                        record.dateOut = date;
                                                        date = new Date().toISOString().split('T')[0]; 
                                                        time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); 
                                                        in_file = undefined; handleInImageChange(); 
                                                    } else if (result.type === 'success' && !result.data?.success) { 
                                                        errorMessage = result.data?.error || 'Unknown error'; 
                                                    }
                                                    await update({ reset: false, invalidateAll: false }); 
                                                }; 
                                            }}>
											<input type="hidden" name="recordId" value={record.recordId} />
											<h4 class="font-bold text-gray-900 mb-4 text-sm border-b border-gray-100 pb-2">Record IN (Dispatch from Lab)</h4>
											
											<div class="grid grid-cols-2 gap-3 mb-4">
												<div>
													<label class="block text-xs font-semibold text-gray-700 mb-1">IN Date</label>
													<input type="date" name="date" class="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" required bind:value={date} disabled={isSubmittingAction} />
												</div>
												<div>
													<label class="block text-xs font-semibold text-gray-700 mb-1">IN Time</label>
													<input type="time" name="time" class="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" required bind:value={time} disabled={isSubmittingAction} />
												</div>
											</div>
											
											<div class="mb-4">
												<label class="block text-xs font-semibold text-gray-700 mb-1">IN Image</label>
												<div class="flex items-center gap-2 mb-2">
													<button type="button" disabled={isSubmittingAction} class="flex-1 flex items-center justify-center gap-1 rounded bg-gray-50 border border-gray-200 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50" onclick={() => showInCameraModal = true}>
														📷 Use Camera
													</button>
													<label class="flex-1 flex items-center justify-center gap-1 rounded bg-indigo-50 border border-indigo-200 px-2 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 cursor-pointer" class:opacity-50={isSubmittingAction}>
														📁 Upload
														<input type="file" name="in-img" accept="image/*" bind:this={in_file} onchange={handleInImageChange} multiple required disabled={isSubmittingAction} style="display: none;" />
													</label>
												</div>
												{#if in_img_urls.length > 0}
													<div class="grid grid-cols-3 gap-2 mt-2">
														{#each in_img_urls as url, i}
															<div class="relative rounded overflow-hidden border border-gray-200 h-16">
																<img src={url} alt="Preview" class="w-full h-full object-cover" />
																<button type="button" class="absolute top-0 right-0 bg-red-500 text-white rounded-bl-md w-5 h-5 flex items-center justify-center text-[10px]" onclick={() => removeInImage(i)} disabled={isSubmittingAction}>×</button>
															</div>
														{/each}
													</div>
												{/if}
											</div>
											
											<button type="submit" disabled={isSubmittingAction} class="w-full rounded bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50 transition-colors">
												{isSubmittingAction ? 'Processing...' : 'Submit IN'}
											</button>
										</form>
									{:else}
										<div class="mt-4 rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800 flex items-center gap-2 animate-in fade-in">
											<svg class="h-4 w-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/></svg>
											Dispatch IN completed. Case is ready for OUT delivery.
										</div>
									{/if}
								{:else if stage.status === 'to be reviewed by dentist' && (data.userRole === 'dentist' || data.userRole === 'admin')}
									<button
										disabled={isLoading}
										onclick={() => { if(confirm('Are you sure you want to mark this case as failed and send it back to Pending for technicians to redo?')) updateStatus('pending') }}
										class="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-white border border-red-200 px-3 py-2.5 text-sm font-semibold text-red-600 shadow-sm hover:bg-red-50 disabled:opacity-50 transition-colors"
									>
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
										Mark as Failed (Backjob to Pending)
									</button>
								{/if}

                            {:else if canAdvance}
                                {#if stage.status === 'to be deliver'}
                                    {#if !record.dateOut && data.userRole !== 'admin'}
                                        <div class="mt-3 text-sm text-amber-600 font-medium italic flex items-center gap-1 bg-amber-50 px-2 py-1 rounded inline-flex border border-amber-100">
                                            <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                                            Complete IN dispatch first
                                        </div>
                                    {:else}
                                        <form method="POST" action="?/processOut" enctype="multipart/form-data" class="mt-6 border border-green-200 bg-white rounded-md shadow-sm p-4 animate-in fade-in slide-in-from-top-2"
                                            use:enhance={() => { 
                                                isSubmittingAction = true; errorMessage = ''; successMessage = '';
                                                return async ({ update, result }: any) => { 
                                                    isSubmittingAction = false; 
                                                    if (result.type === 'success' && result.data?.success) { 
                                                        successMessage = result.data.message; 
                                                        record.caseStatus = 'delivered'; 
                                                        date = new Date().toISOString().split('T')[0]; 
                                                        time = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }); 
                                                        out_file = undefined; handleOutImageChange(); 
                                                    } else if (result.type === 'redirect') { 
                                                        // Handled by sveltekit automatically 
                                                    } else if (result.type === 'success' && !result.data?.success) { 
                                                        errorMessage = result.data?.error || 'Unknown error'; 
                                                    }
                                                    await update({ reset: false, invalidateAll: false }); 
                                                }; 
                                            }}>
                                            <input type="hidden" name="recordId" value={record.recordId} />
                                            <h4 class="font-bold text-gray-900 mb-4 text-sm border-b border-gray-100 pb-2">Record OUT (Drop-off at Clinic)</h4>
                                            
                                            <div class="grid grid-cols-2 gap-3 mb-4">
                                                <div>
                                                    <label class="block text-xs font-semibold text-gray-700 mb-1">OUT Date</label>
                                                    <input type="date" name="date" class="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" required bind:value={date} disabled={isSubmittingAction} />
                                                </div>
                                                <div>
                                                    <label class="block text-xs font-semibold text-gray-700 mb-1">OUT Time</label>
                                                    <input type="time" name="time" class="block w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm" required bind:value={time} disabled={isSubmittingAction} />
                                                </div>
                                            </div>
                                            
                                            <div class="mb-4">
                                                <label class="block text-xs font-semibold text-gray-700 mb-1">OUT Image</label>
                                                <div class="flex items-center gap-2 mb-2">
                                                    <button type="button" disabled={isSubmittingAction} class="flex-1 flex items-center justify-center gap-1 rounded bg-gray-50 border border-gray-200 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50" onclick={() => showOutCameraModal = true}>
                                                        📷 Use Camera
                                                    </button>
                                                    <label class="flex-1 flex items-center justify-center gap-1 rounded bg-indigo-50 border border-indigo-200 px-2 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-100 cursor-pointer" class:opacity-50={isSubmittingAction}>
                                                        📁 Upload
                                                        <input type="file" name="out-img" accept="image/*" bind:this={out_file} onchange={handleOutImageChange} multiple required disabled={isSubmittingAction} style="display: none;" />
                                                    </label>
                                                </div>
                                                {#if out_img_urls.length > 0}
                                                    <div class="grid grid-cols-3 gap-2 mt-2">
                                                        {#each out_img_urls as url, i}
                                                            <div class="relative rounded overflow-hidden border border-gray-200 h-16">
                                                                <img src={url} alt="Preview" class="w-full h-full object-cover" />
                                                                <button type="button" class="absolute top-0 right-0 bg-red-500 text-white rounded-bl-md w-5 h-5 flex items-center justify-center text-[10px]" onclick={() => removeOutImage(i)} disabled={isSubmittingAction}>×</button>
                                                            </div>
                                                        {/each}
                                                    </div>
                                                {/if}
                                            </div>

                                            <div class="flex items-center gap-2 mb-4 bg-gray-50 p-2 rounded border border-gray-200">
                                                <input type="checkbox" name="finished" id="finished" class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" disabled={isSubmittingAction} />
                                                <label for="finished" class="text-xs font-semibold text-gray-800 tracking-wide"> Mark as Finished (Generate SOA) </label>
                                            </div>
                                            
                                            <button type="submit" disabled={isSubmittingAction} class="w-full rounded bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 disabled:opacity-50 transition-colors">
                                                {isSubmittingAction ? 'Processing...' : 'Submit OUT & Deliver'}
                                            </button>
                                        </form>
                                    {/if}
                                {:else}
                                    <button
                                        disabled={isLoading}
                                        onclick={() => updateStatus(stage.status)}
                                        class="mt-3 inline-flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-indigo-600 shadow-sm ring-1 ring-inset ring-indigo-300 hover:bg-indigo-50 disabled:opacity-50 transition-colors"
                                    >
                                        Move to {configInfo.label}
                                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                                        </svg>
                                    </button>
                                {/if}
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<!-- Info Alert -->
	<div class="mt-6 rounded-md bg-blue-50 p-4 border border-blue-100 flex items-start">
		<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-blue-400 mt-0.5 mr-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
			<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
		</svg>
		<p class="text-sm text-blue-800 leading-relaxed">
			For data integrity, standard staff can only advance cases forward progressively. If you need to revert a case backwards (e.g. from "Delivered" back to "In Progress"), you must have <strong>Admin</strong> privileges.
		</p>
	</div>
</div>

<CameraModal bind:show={showInCameraModal} bind:fileInput={in_file} onCapture={handleInImageChange} />
<CameraModal bind:show={showOutCameraModal} bind:fileInput={out_file} onCapture={handleOutImageChange} />
