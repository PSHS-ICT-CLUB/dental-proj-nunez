<script lang="ts">
	import { onMount } from 'svelte';
	import { getStatusConfig, getAvailableStatusesForRole } from '$lib/utils/caseStatusUtils';

	interface Props {
		recordId: number;
		currentStatus?: string;
		userRole?: string;
		onStatusChange?: (status: string) => void;
	}

	let { recordId, currentStatus = 'pending', userRole = 'staff', onStatusChange }: Props = $props();

	let isLoading = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');
	let isChangingStatus = $state(false);
	let availableStatuses = $state<string[]>([]);
	let showStatusMenu = $state(false);

	onMount(async () => {
		// Get available statuses for the current user role
		availableStatuses = getAvailableStatusesForRole(userRole).filter(
			(status) => status !== currentStatus
		);
	});

	async function changeStatus(newStatus: string) {
		if (!newStatus || isChangingStatus) return;

		isChangingStatus = true;
		isLoading = true;
		errorMessage = '';
		successMessage = '';

		try {
			const response = await fetch('/api/case-status', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					recordId,
					newStatus
				})
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || 'Failed to update case status');
			}

			// Update current status
			currentStatus = newStatus;
			const newConfig = getStatusConfig(newStatus);
			successMessage = `Status updated to "${newConfig.label}"`;

			// Reset available statuses
			availableStatuses = getAvailableStatusesForRole(userRole).filter(
				(status) => status !== currentStatus
			);

			// Show success message for 3 seconds
			setTimeout(() => {
				successMessage = '';
			}, 3000);

			// Call callback if provided
			if (onStatusChange) {
				onStatusChange(newStatus);
			}

			// Close menu after change
			showStatusMenu = false;
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'An error occurred';
			console.error('Error changing status:', err);
		} finally {
			isChangingStatus = false;
			isLoading = false;
		}
	}

	function toggleStatusMenu() {
		if (availableStatuses.length > 0) {
			showStatusMenu = !showStatusMenu;
		}
	}

	let statusConfig = $derived(getStatusConfig(currentStatus));
</script>

<div class="case-status-container">
	<div class="status-display">
		<span class="status-label">Case Status:</span>
		<div
			class="status-badge {statusConfig.bgColor} {statusConfig.color} rounded border px-3 py-2 font-semibold transition-all"
		>
			{statusConfig.label}
		</div>
	</div>

	{#if availableStatuses.length > 0}
		<div class="status-actions relative mt-3">
			<button
				on:click={toggleStatusMenu}
				disabled={isLoading || isChangingStatus}
				class="change-status-btn rounded bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600 disabled:bg-gray-400"
			>
				{isChangingStatus ? 'Updating...' : 'Change Status'}
			</button>

			{#if showStatusMenu}
				<div
					class="status-menu absolute top-full left-0 z-10 mt-2 rounded border border-gray-300 bg-white shadow-lg"
				>
					{#each availableStatuses as status}
						<button
							on:click={() => changeStatus(status)}
							disabled={isChangingStatus}
							class="status-option w-full border-b px-4 py-2 text-left transition-colors last:border-b-0 hover:bg-gray-100 disabled:opacity-50"
						>
							<span class="text-sm">{getStatusConfig(status).label}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<p class="mt-3 text-sm text-gray-500">
			Your role does not have permission to change this case status.
		</p>
	{/if}

	{#if errorMessage}
		<div class="error-message mt-3 rounded border border-red-400 bg-red-100 px-3 py-2 text-red-700">
			{errorMessage}
		</div>
	{/if}

	{#if successMessage}
		<div
			class="success-message mt-3 rounded border border-green-400 bg-green-100 px-3 py-2 text-green-700"
		>
			{successMessage}
		</div>
	{/if}
</div>

<style>
	.case-status-container {
		padding: 1rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
		background-color: #f9fafb;
	}

	.status-display {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.status-label {
		font-weight: 600;
		color: #374151;
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
	}

	.status-actions {
		margin-top: 1rem;
	}

	.change-status-btn {
		cursor: pointer;
		font-weight: 500;
	}

	.status-menu {
		min-width: 200px;
	}

	.status-option {
		cursor: pointer;
	}

	.error-message {
		animation: slideIn 0.3s ease-in-out;
	}

	.success-message {
		animation: slideIn 0.3s ease-in-out;
	}

	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
</style>
