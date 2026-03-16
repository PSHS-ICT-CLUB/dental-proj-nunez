<script lang="ts">
	import { onMount } from 'svelte';

	type Notification = {
		id: number;
		message: string;
		type: string;
		isActive: string;
	};

	let notifications: Notification[] = $state([]);
	let dismissed: Set<number> = $state(new Set());

	onMount(async () => {
		try {
			const response = await fetch('/api/notification');
			const data = await response.json();
			notifications = data.notifications || [];
		} catch (error) {
			console.error('Failed to fetch notifications:', error);
		}
	});

	function dismiss(id: number) {
		dismissed.add(id);
		dismissed = new Set(dismissed);
	}

	function getTypeStyles(type: string) {
		switch (type) {
			case 'warning':
				return 'bg-yellow-500 text-black';
			case 'error':
				return 'bg-red-600 text-white';
			case 'maintenance':
				return 'bg-purple-600 text-white';
			default:
				return 'bg-blue-600 text-white';
		}
	}

	function getTypeIcon(type: string) {
		switch (type) {
			case 'warning':
				return 'Warning';
			case 'error':
				return 'Error';
			case 'maintenance':
				return 'Maintenance';
			default:
				return 'Info';
		}
	}

	const visibleNotifications = $derived(notifications.filter((n) => !dismissed.has(n.id)));
</script>

{#each visibleNotifications as notification (notification.id)}
	<div class={`notification-banner ${getTypeStyles(notification.type)}`}>
		<div class="notification-content">
			<span class="notification-icon">{getTypeIcon(notification.type)}</span>
			<span class="notification-message">{notification.message}</span>
		</div>
		<button
			class="notification-dismiss"
			onclick={() => dismiss(notification.id)}
			aria-label="Dismiss notification"
		>
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
			</svg>
		</button>
	</div>
{/each}

<style>
	.notification-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.75rem 1rem;
		font-size: 0.9rem;
		font-weight: 500;
		z-index: 1000;
	}

	.notification-content {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.notification-icon {
		font-size: 1rem;
	}

	.notification-message {
		flex: 1;
	}

	.notification-dismiss {
		background: transparent;
		border: none;
		color: inherit;
		cursor: pointer;
		padding: 0.25rem;
		font-size: 1rem;
		opacity: 0.7;
		transition: opacity 0.2s;
	}

	.notification-dismiss:hover {
		opacity: 1;
	}
</style>
