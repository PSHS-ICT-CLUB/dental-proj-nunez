<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { data, form }: { data: any; form: any } = $props();
	let loading = $state(false);
	let selectedUserId = $state(form?.userId ?? '');

	let name = $state(form?.name ?? '');
	let email = $state(form?.email ?? '');
	let role = $state(form?.role ?? '');
	let password = $state('');
	let confirmPassword = $state('');

	$effect(() => {
		if (form && !form.success) {
			if (form.userId) selectedUserId = form.userId;
			if (form.name) name = form.name;
			if (form.email) email = form.email;
			if (form.role) role = form.role;
		}
	});

	function handleUserSelect(event: Event) {
		const target = event.target as HTMLSelectElement;
		const userId = target.value;
		const user = data.users.find((u: any) => u.id.toString() === userId);
		if (user) {
			name = user.name;
			email = user.email;
			role = user.role;
		} else {
			name = '';
			email = '';
			role = '';
		}
		password = '';
		confirmPassword = '';
	}
</script>

<svelte:head>
	<title>Change Account | Nunez Dental Records System</title>
</svelte:head>

<div class="mx-auto mt-10 max-w-lg rounded-xl bg-white p-8 shadow-lg print:hidden">
	<h1 class="mb-6 text-center text-3xl font-bold text-[#164154]">Change User Account</h1>

	<p class="mb-6 text-center text-sm text-text-secondary">
		Modify user details and passwords. Only users with the <span class="font-bold">admin</span> role
		have access to this page.
	</p>

	{#if form?.message}
		<div
			class={`mb-6 rounded-md p-4 text-sm font-medium ${form.success ? 'bg-success-light text-success-dark' : 'bg-error-light text-error-dark'}`}
		>
			{form.message}
		</div>
	{/if}

	<form
		method="POST"
		action="?/update"
		use:enhance={() => {
			loading = true;
			return async ({ result, update }) => {
				await update();
				loading = false;
				if (result.type === 'success') {
					selectedUserId = '';
					name = '';
					email = '';
					role = '';
					password = '';
					confirmPassword = '';
				}
			};
		}}
		class="space-y-6"
	>
		<div>
			<label for="userId" class="block text-sm font-medium text-text-secondary">Select User</label>
			<select
				id="userId"
				name="userId"
				bind:value={selectedUserId}
				onchange={handleUserSelect}
				required
				class="mt-1 block w-full rounded-md border border-border px-3 py-2 shadow-sm focus:border-[#164154] focus:ring-[#164154] sm:text-sm"
			>
				<option value="">-- Choose a user --</option>
				{#each data.users as user (user.id)}
					<option value={user.id}>
						{user.name} ({user.email}) - {user.role}
					</option>
				{/each}
			</select>
		</div>

		{#if selectedUserId}
			<div>
				<label for="name" class="block text-sm font-medium text-text-secondary">Full Name</label>
				<input
					id="name"
					name="name"
					type="text"
					required
					bind:value={name}
					class="mt-1 block w-full rounded-md border border-border px-3 py-2 shadow-sm focus:border-[#164154] focus:ring-[#164154] sm:text-sm"
					placeholder="John Doe"
				/>
			</div>

			<div>
				<label for="email" class="block text-sm font-medium text-text-secondary">Email Address</label>
				<input
					id="email"
					name="email"
					type="email"
					required
					bind:value={email}
					class="mt-1 block w-full rounded-md border border-border px-3 py-2 shadow-sm focus:border-[#164154] focus:ring-[#164154] sm:text-sm"
					placeholder="john@example.com"
				/>
			</div>

			<div>
				<label for="role" class="block text-sm font-medium text-text-secondary">User Role</label>
				<select
					id="role"
					name="role"
					required
					bind:value={role}
					class="mt-1 block w-full rounded-md border border-border px-3 py-2 shadow-sm focus:border-[#164154] focus:ring-[#164154] sm:text-sm"
				>
					<option value="staff">Staff</option>
					<option value="dentist">Dentist</option>
					<option value="admin">Admin</option>
				</select>
				<p class="mt-1 text-xs text-text-muted">
					Select the role for this user.
				</p>
			</div>

			<div class="rounded-md bg-surface p-4">
				<h3 class="mb-4 text-sm font-medium text-text-secondary">
					Change Password <span class="text-xs text-text-muted"
						>(optional - leave blank to keep current password)</span
					>
				</h3>

				<div>
					<label for="password" class="block text-sm font-medium text-text-secondary">New Password</label>
					<input
						id="password"
						name="password"
						type="password"
						bind:value={password}
						class="mt-1 block w-full rounded-md border border-border px-3 py-2 shadow-sm focus:border-[#164154] focus:ring-[#164154] sm:text-sm"
						placeholder="Enter a new password (or leave blank)"
					/>
				</div>

				<div class="mt-3">
					<label for="confirmPassword" class="block text-sm font-medium text-text-secondary"
						>Confirm Password</label
					>
					<input
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						bind:value={confirmPassword}
						class="mt-1 block w-full rounded-md border border-border px-3 py-2 shadow-sm focus:border-[#164154] focus:ring-[#164154] sm:text-sm"
						placeholder="Confirm new password"
					/>
				</div>
			</div>

			<div class="flex gap-4 pt-4">
				<button
					type="submit"
					disabled={loading}
					class="flex w-full justify-center rounded-md border border-transparent bg-[#164154] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1f3a4d] focus:ring-2 focus:ring-[#164154] focus:ring-offset-2 focus:outline-none disabled:opacity-50"
				>
					{loading ? 'Updating...' : 'Update Account'}
				</button>
				<button
					type="submit"
					formaction="?/delete"
					disabled={loading}
					onclick={(e) => {
						if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
							e.preventDefault();
						}
					}}
					class="flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
				>
					{loading ? 'Processing...' : 'Delete Account'}
				</button>
			</div>
		{:else}
			<div class="rounded-md bg-surface-alt p-4 text-center text-sm text-text-secondary">
				Select a user to view and edit their account details
			</div>
		{/if}
	</form>
</div>
