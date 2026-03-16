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

<div class="bg-surface flex min-h-screen flex-col justify-center py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<h2 class="text-text-primary mt-6 text-center text-3xl font-extrabold">
			Sign in to Dental Lab
		</h2>
	</div>

	<div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
		<div class="border-border border bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
			<form class="space-y-6" onsubmit={handleSubmit}>
				<div>
					<label for="email" class="text-text-secondary block text-sm font-medium">
						Email address
					</label>
					<div class="mt-1">
						<input
							id="email"
							name="email"
							type="email"
							autocomplete="email"
							bind:value={email}
							required
							class="border-border placeholder:text-text-muted focus:border-primary focus:ring-primary block w-full appearance-none rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm"
						/>
					</div>
				</div>

				<div>
					<label for="password" class="text-text-secondary block text-sm font-medium">
						Password
					</label>
					<div class="mt-1">
						<input
							id="password"
							name="password"
							type="password"
							autocomplete="current-password"
							bind:value={password}
							required
							class="border-border placeholder:text-text-muted focus:border-primary focus:ring-primary block w-full appearance-none rounded-md border px-3 py-2 shadow-sm focus:outline-none sm:text-sm"
						/>
					</div>
				</div>

				{#if errorMsg}
					<div class="border-error-light bg-error-light text-error-dark rounded border p-2 text-sm">
						{errorMsg}
					</div>
				{/if}

				<div>
					<!-- Using Svelte 5 class directives if possible, or simple template literal for loading state -->
					<button
						type="submit"
						disabled={isLoading}
						class="focus:ring-primary bg-primary hover:bg-primary-dark flex w-full justify-center rounded-md border border-transparent px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none disabled:opacity-50"
					>
						{isLoading ? 'Signing in...' : 'Sign in'}
					</button>
				</div>
			</form>
		</div>
	</div>
</div>
