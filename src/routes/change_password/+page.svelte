<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	let { data } = $props();
	let current = $state('');
	let next = $state('');
	let confirmNext = $state('');
	let message = $state('');
	let error = $state('');
	let showResetModal = $state(false);
	let resetPassword = $state('');
	let resetError = $state('');
	$effect(() => {
		message = '';
		error = '';
	});
</script>

<div class="mx-auto max-w-md p-4">
	<h1 class="mb-4 text-xl font-semibold">{data.isSet ? 'Change Password' : 'Set Password'}</h1>
	{#if !data.isSet}
		<div class="mb-3 rounded bg-yellow-50 p-3 text-sm text-yellow-800">
			<p class="font-semibold">No password is currently set.</p>
			<p class="mt-1">
				Please set a password to secure your account. This password will be required for edit and
				delete operations.
			</p>
		</div>
	{/if}
	{#if message}
		<div class="mb-3 rounded bg-green-50 p-2 text-sm text-green-700">{message}</div>
	{/if}
	{#if error}
		<div class="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{error}</div>
	{/if}
	<form
		method="POST"
		action="?/setPassword"
		use:enhance={() => {
			return async ({ result, update }) => {
				if (result.type === 'failure') {
					const d = result.data as any;
					error = d?.error || 'Failed to update password';
					message = '';
					return;
				}
				if (result.type === 'success') {
					const d = result.data as any;
					message =
						d?.message ||
						(data.isSet ? 'Password updated successfully' : 'Password set successfully');
					error = '';
					current = '';
					next = '';
					confirmNext = '';
					// Refresh the page data to update isSet status
					await invalidateAll();
					await update();
					return;
				}
			};
		}}
	>
		{#if data.isSet}
			<label for="current" class="block text-sm font-medium text-gray-700">Current password</label>
			<input
				id="current"
				name="current"
				type="password"
				class="mt-1 mb-3 w-full rounded-md border border-gray-200 p-2 text-sm shadow-sm"
				required
			/>
		{/if}
		<label for="next" class="block text-sm font-medium text-gray-700">New password</label>
		<input
			id="next"
			name="next"
			bind:value={next}
			type="password"
			class="mt-1 mb-3 w-full rounded-md border border-gray-200 p-2 text-sm shadow-sm"
			required
		/>
		<label for="confirm" class="block text-sm font-medium text-gray-700">Confirm new password</label
		>
		<input
			id="confirm"
			name="confirm"
			bind:value={confirmNext}
			type="password"
			class="mt-1 mb-4 w-full rounded-md border border-gray-200 p-2 text-sm shadow-sm"
			required
		/>
		<div class="flex gap-2">
			<a href="/" class="rounded bg-white px-3 py-1 text-sm ring-1 ring-gray-300">Cancel</a>
			<button type="submit" class="rounded bg-indigo-600 px-3 py-1 text-sm text-white">Save</button>
		</div>
	</form>
	{#if data.isSet}
		<div class="mt-6 border-t border-gray-200 pt-6">
			<h2 class="mb-3 text-lg font-semibold text-gray-800">Danger Zone</h2>
			<p class="mb-3 text-sm text-gray-600">
				Removing the password will disable password protection for edit and delete operations.
			</p>
			<button
				type="button"
				onclick={() => {
					showResetModal = true;
					resetPassword = '';
					resetError = '';
				}}
				class="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
			>
				Reset Password
			</button>
		</div>
	{/if}
</div>

{#if showResetModal}
	<div
		class="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black"
		role="button"
		tabindex="0"
		onkeydown={(e) => {
			if (e.key === 'Escape') {
				showResetModal = false;
				resetPassword = '';
				resetError = '';
			}
		}}
		onclick={(e) => {
			if (e.target === e.currentTarget) {
				showResetModal = false;
				resetPassword = '';
				resetError = '';
			}
		}}
	>
		<div class="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
			<h2 class="mb-4 text-xl font-semibold text-gray-800">Reset Password</h2>
			<p class="mb-4 text-sm text-gray-600">
				Are you sure you want to remove the password? This will disable password protection for edit
				and delete operations.
			</p>
			{#if resetError}
				<div class="mb-3 rounded bg-red-50 p-2 text-sm text-red-700">{resetError}</div>
			{/if}
			<form
				method="POST"
				action="?/resetPassword"
				use:enhance={() => {
					return async ({ result, update }) => {
						if (result.type === 'failure') {
							const d = result.data as any;
							resetError = d?.error || 'Failed to reset password';
							return;
						}
						if (result.type === 'success') {
							const d = result.data as any;
							message = d?.message || 'Password has been removed successfully';
							error = '';
							resetError = '';
							showResetModal = false;
							resetPassword = '';
							// Refresh the page data to update isSet status
							await invalidateAll();
							await update();
							return;
						}
					};
				}}
			>
				<label for="confirm_password" class="block text-sm font-medium text-gray-700">
					Enter your current password to confirm
				</label>
				<input
					id="confirm_password"
					name="confirm_password"
					type="password"
					bind:value={resetPassword}
					class="mt-1 mb-4 w-full rounded-md border border-gray-200 p-2 text-sm shadow-sm"
					required
				/>
				<div class="flex gap-2">
					<button
						type="button"
						onclick={() => {
							showResetModal = false;
							resetPassword = '';
							resetError = '';
						}}
						class="rounded bg-white px-4 py-2 text-sm ring-1 ring-gray-300 hover:bg-gray-50"
					>
						Cancel
					</button>
					<button
						type="submit"
						disabled={!resetPassword}
						class="rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
					>
						Reset Password
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}
