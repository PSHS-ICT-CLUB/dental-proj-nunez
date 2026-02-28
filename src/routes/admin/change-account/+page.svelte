<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { data, form }: { data: any; form: ActionData } = $props();
	let loading = $state(false);
	let selectedUserId = $state('');
	let selectedUser = $derived.by(() => {
		if (!selectedUserId) return null;
		return data.users.find((u) => u.id.toString() === selectedUserId);
	});
	let name = $derived.by(() => selectedUser?.name ?? '');
	let email = $derived.by(() => selectedUser?.email ?? '');
	let password = $state('');
	let confirmPassword = $state('');
</script>

<svelte:head>
	<title>Change Account | Nunez Dental Records System</title>
</svelte:head>

<div class="mx-auto mt-10 max-w-lg rounded-xl bg-white p-8 shadow-lg print:hidden">
	<h1 class="mb-6 text-center text-3xl font-bold text-[#164154]">Change User Account</h1>

	<p class="mb-6 text-center text-sm text-gray-600">
		Modify user details and passwords. Only users with the <span class="font-bold">admin</span> role
		have access to this page.
	</p>

	{#if form?.message}
		<div
			class={`mb-6 rounded-md p-4 text-sm font-medium ${form.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
		>
			{form.message}
		</div>
	{/if}

	<form
		method="POST"
		action="?/update"
		use:enhance={() => {
			loading = true;
			return async ({ update }) => {
				await update();
				loading = false;
			};
		}}
		class="space-y-6"
	>
		<div>
			<label for="userId" class="block text-sm font-medium text-gray-700">Select User</label>
			<select
				id="userId"
				name="userId"
				bind:value={selectedUserId}
				required
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#164154] focus:ring-[#164154] sm:text-sm"
			>
				<option value="">-- Choose a user --</option>
				{#each data.users as user (user.id)}
					<option value={user.id}>
						{user.name} ({user.email}) - {user.role}
					</option>
				{/each}
			</select>
		</div>

		{#if selectedUser}
			<div>
				<label for="name" class="block text-sm font-medium text-gray-700">Full Name</label>
				<input
					id="name"
					name="name"
					type="text"
					required
					value={name}
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#164154] focus:ring-[#164154] sm:text-sm"
					placeholder="John Doe"
				/>
			</div>

			<div>
				<label for="email" class="block text-sm font-medium text-gray-700">Email Address</label>
				<input
					id="email"
					name="email"
					type="email"
					required
					value={email}
					class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#164154] focus:ring-[#164154] sm:text-sm"
					placeholder="john@example.com"
				/>
			</div>

			<div class="rounded-md bg-gray-50 p-4">
				<h3 class="mb-4 text-sm font-medium text-gray-700">
					Change Password <span class="text-xs text-gray-500"
						>(optional - leave blank to keep current password)</span
					>
				</h3>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700">New Password</label>
					<input
						id="password"
						name="password"
						type="password"
						bind:value={password}
						class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#164154] focus:ring-[#164154] sm:text-sm"
						placeholder="Enter a new password (or leave blank)"
					/>
				</div>

				<div class="mt-3">
					<label for="confirmPassword" class="block text-sm font-medium text-gray-700"
						>Confirm Password</label
					>
					<input
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						bind:value={confirmPassword}
						class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#164154] focus:ring-[#164154] sm:text-sm"
						placeholder="Confirm new password"
					/>
				</div>
			</div>

			<div class="pt-4">
				<button
					type="submit"
					disabled={loading}
					class="flex w-full justify-center rounded-md border border-transparent bg-[#164154] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1f3a4d] focus:ring-2 focus:ring-[#164154] focus:ring-offset-2 focus:outline-none disabled:opacity-50"
				>
					{loading ? 'Updating...' : 'Update Account'}
				</button>
			</div>
		{:else}
			<div class="rounded-md bg-gray-100 p-4 text-center text-sm text-gray-600">
				Select a user to view and edit their account details
			</div>
		{/if}
	</form>
</div>
