<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: any } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Create Account | Nunez Dental Records System</title>
</svelte:head>

<div class="mx-auto mt-10 max-w-lg rounded-xl bg-white p-8 shadow-lg print:hidden">
	<h1 class="mb-6 text-center text-3xl font-bold text-[#164154]">Create New Account</h1>

	<p class="mb-6 text-center text-sm text-gray-600">
		Create a new user. Only users with the <span class="font-bold">admin</span> role have access to this
		page.
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
		action="?/create"
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
			<label for="name" class="block text-sm font-medium text-gray-700">Full Name</label>
			<input
				id="name"
				name="name"
				type="text"
				required
				value={form?.name ?? ''}
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
				value={form?.email ?? ''}
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#164154] focus:ring-[#164154] sm:text-sm"
				placeholder="john@example.com"
			/>
		</div>

		<div>
			<label for="password" class="block text-sm font-medium text-gray-700">Password</label>
			<input
				id="password"
				name="password"
				type="password"
				required
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#164154] focus:ring-[#164154] sm:text-sm"
				placeholder="Enter a secure password"
			/>
		</div>

		<div>
			<label for="role" class="block text-sm font-medium text-gray-700">User Role</label>
			<input
				id="role"
				name="role"
				type="text"
				list="roles-list"
				required
				value={form?.role ?? 'staff'}
				class="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#164154] focus:ring-[#164154] sm:text-sm"
				placeholder="e.g. staff, admin, doctor"
			/>
			<datalist id="roles-list">
				<option value="staff"></option>
				<option value="admin"></option>
			</datalist>
			<p class="mt-1 text-xs text-gray-500">
				Select a standard role or type a custom one.
			</p>
		</div>

		<div class="pt-4">
			<button
				type="submit"
				disabled={loading}
				class="flex w-full justify-center rounded-md border border-transparent bg-[#164154] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1f3a4d] focus:ring-2 focus:ring-[#164154] focus:ring-offset-2 focus:outline-none disabled:opacity-50"
			>
				{loading ? 'Creating...' : 'Create Account'}
			</button>
		</div>
	</form>
</div>
