<script lang="ts">
	import { signIn } from '@auth/sveltekit/client';
	import { goto, invalidateAll } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let errorMsg = $state('');
	let isLoading = $state(false);

	async function handleSubmit(e: Event) {
		e.preventDefault();
		isLoading = true;
		errorMsg = '';

		const result = (await signIn('credentials', {
			email,
			password,
			redirect: false
		})) as { error?: string } | undefined;

		if (result?.error) {
			errorMsg = 'Invalid email or password';
			isLoading = false;
		} else {
			await invalidateAll();
			await goto('/');
		}
	}
</script>

<div class="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<div class="flex justify-center text-4xl">🦷</div>
		<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Sign in to Dental Lab</h2>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="border border-gray-100 bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
			<form class="space-y-6" onsubmit={handleSubmit}>
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700"> Email address </label>
					<div class="mt-1">
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							bind:value={email}
							required
							class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
						/>
					</div>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700"> Password </label>
					<div class="mt-1">
						<input
							id="password"
							name="password"
							type="password"
							autocomplete="current-password"
							bind:value={password}
							required
							class="block w-full appearance-none rounded-md border border-gray-300 px-3 py-2 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-blue-500 focus:outline-none sm:text-sm"
						/>
					</div>
				</div>

				{#if errorMsg}
					<div class="rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">
						{errorMsg}
					</div>
				{/if}

				<div>
					<!-- Using Svelte 5 class directives if possible, or simple template literal for loading state -->
					<button
						type="submit"
						disabled={isLoading}
						class="flex w-full justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
					>
						{isLoading ? 'Signing in...' : 'Sign in'}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
