<script lang="ts">
	import type { PageData, PageProps } from './$types';
	import { getStatusWorkflow, getAvailableStatusesForRole, getStatusConfig } from '$lib/utils/caseStatusUtils';
	import { invalidateAll } from '$app/navigation';

	let { data }: PageProps = $props();
	
	let record = $state(data.record);
	let isLoading = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	const workflowConfig = getStatusWorkflow();

	async function updateStatus(newStatus: string) {
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

	function canAdvanceTo(newStatus: string) {
		const currentState = record.caseStatus || 'pending';
		const availableForRole = getAvailableStatusesForRole(data.userRole);

		// Must be allowed for the user's role
		if (!availableForRole.includes(newStatus as any)) return false;

		// Admins can jump anywhere
		if (data.userRole === 'admin') return true;

		// Otherwise, must be a strictly forward linear stage according to the workflow
		const currentStage = workflowConfig.find((stage) => stage.status === currentState);
		return currentStage?.nextStages.includes(newStatus as any) ?? false;
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
				href="/EDIT/{record.recordId}"
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
							{:else if canAdvance}
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
