<script lang="ts">
	import { beforeNavigate, afterNavigate, goto } from '$app/navigation';
	import { page } from '$app/state';
	import { signOut } from '@auth/sveltekit/client';
	import '../app.css';
	import NotificationBanner from '$lib/components/NotificationBanner.svelte';
	let { children, data } = $props();

	let isMenuOpen = $state(false);
<<<<<<< HEAD
	let isUserMenuOpen = $state(false);
=======
>>>>>>> 8d591fa882600f30c65275e07c432786ab6b9366
	let isNavigating = $state(false);

	beforeNavigate(() => {
		isNavigating = true;
	});

	afterNavigate(() => {
		isNavigating = false;
	});

<<<<<<< HEAD
	// Primary navigation - most used items
	const primaryNavLinks = [
		{ label: 'Home', href: '/' },
		{ label: 'Data', href: '/data' },
		{ label: 'Sales', href: '/sales' },
		{ label: 'Calendar', href: '/calendar' },
		{ label: 'Balances', href: '/balance' },
		{ label: 'Expenses', href: '/expenses', color: 'text-red-400' },
		{ label: 'Inventory', href: '/inventory', color: 'text-emerald-400' }
	];

	// Settings dropdown items
	const settingsLinks = [
		{ label: 'Edit Info', href: '/edit-info' },
		{ label: 'Change Password', href: '/change-password' }
=======
	const navLinks = [
		{ label: 'HOME', href: '/' },
		{ label: 'DATA', href: '/data' },
		{ label: 'SALES', href: '/sales' },
		{ label: 'CALENDAR', href: '/calendar' },
		{ label: 'BALANCES', href: '/balance' },
		{ label: 'EXPENSES', href: '/expenses', textColor: 'text-red-400' },
		{ label: 'INVENTORY', href: '/inventory', textColor: 'text-emerald-400' },
		{ label: 'EDIT INFO', href: '/edit-info' },
		{ label: 'CHANGE PASSWORD', href: '/change-password' }
>>>>>>> 8d591fa882600f30c65275e07c432786ab6b9366
	];

	// Create a function to get the current page title
	function getPageTitle(pathname: string): string {
		switch (pathname) {
			case '/':
				return 'Home';
			case '/sales':
				return 'Sales';
			case '/expenses':
				return 'Expenses';
			case '/edit-info':
			case '/status':
				return 'Edit Info';
			case '/change-password':
				return 'Change Password';
			case '/upload-record':
				return 'Add Record';
			case '/data':
				return 'Data';
			case '/admin':
				return 'Admin Panel';
		case '/calendar':
			return 'Calendar';
		case '/inventory':
			return 'Inventory Dashboard';
			case '/inventory/suppliers':
				return 'Inventory Suppliers';
			case '/inventory/logs':
				return 'Inventory Logs';

		case '/review-cases':
			return 'Review Cases';
			default:
				return 'Dental Records';
		}
	}

	function isActive(href: string) {
		return page.url.pathname === href;
	}
</script>

<svelte:head>
	<title>{getPageTitle(page.url.pathname)} | Nunez Dental Records System</title>
</svelte:head>

<NotificationBanner />

{#if isNavigating}
	<div class="fixed top-0 left-0 z-[60] h-1 w-full overflow-hidden bg-transparent">
		<div class="absolute top-0 left-0 h-full w-full bg-emerald-400 opacity-20"></div>
		<div
			class="absolute top-0 left-0 h-full w-1/3 animate-[loading_1s_ease-in-out_infinite] rounded-full bg-emerald-400"
		></div>
	</div>
{/if}

<<<<<<< HEAD
{#if isAuthenticated}
	<nav class="sticky top-0 left-0 z-50 w-full bg-[#164154] text-white shadow-md print:hidden">
		<div class="mx-auto flex items-center justify-between px-4 py-3">
			<div class="flex items-center gap-6">
				<!-- Logo -->
				{#if page.url.pathname !== '/'}
=======
<nav class="sticky top-0 left-0 z-50 w-full bg-[#164154] text-white shadow-md print:hidden">
	<div class="mx-auto flex items-center justify-between px-4 py-3">
		<div class="flex items-center gap-8">
			{#if page.url.pathname !== '/'}
				<a
					href="/"
					class="text-xl font-bold tracking-tight transition-colors duration-200 hover:cursor-pointer hover:text-[#A1AEB3]"
				>
					NUNEZ DENTAL
				</a>
			{:else}
				<button
					onclick={() => window.location.reload()}
					class="text-xl font-bold tracking-tight transition-colors duration-200 hover:cursor-pointer hover:text-[#A1AEB3]"
				>
					NUNEZ DENTAL
				</button>
			{/if}

			<!-- Desktop Main Links -->
			<div class="hidden items-center gap-2 xl:gap-4 lg:flex">
				{#each navLinks as link}
>>>>>>> 8d591fa882600f30c65275e07c432786ab6b9366
					<a
						href={link.href}
						class={`relative px-1 py-1 text-xs font-semibold tracking-wide transition-all duration-200 hover:text-white ${
							isActive(link.href) ? 'text-white' : link.textColor || 'text-[#A1AEB3]'
						}`}
					>
						{link.label}
						{#if isActive(link.href)}
							<div class="absolute -bottom-1 left-0 h-0.5 w-full bg-white transition-all"></div>
						{/if}
					</a>
				{/each}
			</div>
		</div>

<<<<<<< HEAD
		<!-- Mobile Navigation -->
		{#if isMenuOpen}
			<div
				class="max-h-[calc(100vh-80px)] overflow-y-auto border-t border-white/10 bg-[#164154] px-4 py-4 text-white shadow-xl lg:hidden"
=======
		<!-- Action Buttons & Hamburger -->
		<div class="flex items-center gap-2">
			<!-- Desktop Action Buttons -->
			<div class="hidden items-center gap-2 lg:flex">
				{#if data?.session?.user?.role === 'admin' || data?.session?.user?.role === 'dentist'}
					<a
						class="rounded border border-purple-600/50 bg-purple-900/40 px-3 py-1.5 text-xs font-bold text-purple-200 transition-all hover:bg-purple-800/60"
						href="/review-cases">REVIEW CASES</a
					>
				{/if}
				{#if data?.session?.user?.role === 'admin'}
					<a
						class="rounded border border-amber-600/50 bg-amber-900/40 px-3 py-1.5 text-xs font-bold text-amber-200 transition-all hover:bg-amber-800/60"
						href="/admin">ADMIN</a
					>
					<a
						class="rounded border border-blue-600/50 bg-blue-900/40 px-3 py-1.5 text-xs font-bold text-blue-200 transition-all hover:bg-blue-800/60"
						href="/admin/history">CHANGE LOG</a
					>
				{/if}
				<button
					onclick={() => window.print()}
					class="rounded border border-[#A1AEB3]/30 bg-[#233B48] px-3 py-1.5 text-xs font-bold transition-all hover:bg-[#1f3a4d]"
					>PRINT</button
				>
				<a
					class="rounded border border-emerald-600/50 bg-emerald-600 px-3 py-1.5 text-xs font-bold transition-all hover:bg-emerald-700"
					href="/upload-record">ADD RECORD</a
				>
				<button
					onclick={() => signOut()}
					class="rounded border border-red-600/50 bg-red-600 px-3 py-1.5 text-xs font-bold transition-all hover:bg-red-700"
					>SIGN OUT</button
				>
			</div>

			<!-- Hamburger menu button for mobile/tablet/smaller desktop -->
			<button
				class="block rounded border border-[#A1AEB3]/30 bg-[#1F3A4D] p-2 text-white shadow-sm hover:bg-[#233B48] lg:hidden"
				aria-label="Toggle menu"
				onclick={() => (isMenuOpen = !isMenuOpen)}
>>>>>>> 8d591fa882600f30c65275e07c432786ab6b9366
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16m-7 6h7'}
					/>
				</svg>
			</button>
		</div>
	</div>

<<<<<<< HEAD
					<!-- Settings Section -->
					<div class="mt-2 border-t border-white/10 pt-2">
						<p class="px-3 py-1 text-xs font-medium tracking-wider text-[#A1AEB3]/70 uppercase">
							Settings
						</p>
						{#each settingsLinks as link}
							<a
								class={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
									isActive(link.href)
										? 'bg-white/10 text-white'
										: 'text-[#A1AEB3] hover:bg-white/5 hover:text-white'
								}`}
								href={link.href}
								onclick={() => (isMenuOpen = false)}
							>
								{link.label}
							</a>
						{/each}
					</div>
=======
	<!-- Mobile & Tablet navigation -->
	{#if isMenuOpen}
		<div
			class="max-h-[calc(100vh-80px)] overflow-y-auto border-t border-white/10 bg-[#164154] px-4 py-4 text-white shadow-xl lg:hidden"
		>
			<div class="flex flex-col gap-2">
				{#each navLinks as link}
					<a
						class={`block rounded px-3 py-2 text-sm font-medium transition-all ${
							isActive(link.href)
								? 'bg-white/10 text-white'
								: 'text-[#A1AEB3] hover:bg-white/5 hover:text-white'
						}`}
						href={link.href}
						onclick={() => (isMenuOpen = false)}
					>
						{link.label}
					</a>
				{/each}
>>>>>>> 8d591fa882600f30c65275e07c432786ab6b9366

				<div class="my-2 border-t border-white/10"></div>

				{#if data?.session?.user?.role === 'admin' || data?.session?.user?.role === 'dentist'}
					<a
						class="block rounded bg-purple-900/40 px-3 py-2 text-sm font-bold text-purple-200"
						href="/review-cases"
						onclick={() => (isMenuOpen = false)}>REVIEW CASES</a
					>
				{/if}
				{#if data?.session?.user?.role === 'admin'}
					<a
						class="block rounded bg-amber-900/40 px-3 py-2 text-sm font-bold text-amber-200"
						href="/admin"
						onclick={() => (isMenuOpen = false)}>ADMIN PANEL</a
					>
					<a
						class="block rounded bg-blue-900/40 px-3 py-2 text-sm font-bold text-blue-200"
						href="/admin/history"
						onclick={() => (isMenuOpen = false)}>CHANGE LOG</a
					>
				{/if}
				<button
					onclick={() => {
						window.print();
						isMenuOpen = false;
					}}
					class="block w-full rounded bg-[#233B48] px-3 py-2 text-left text-sm font-bold transition-all"
					>PRINT RECORD</button
				>
				<a
					class="block rounded bg-emerald-600 px-3 py-2 text-sm font-bold transition-all"
					href="/upload-record"
					onclick={() => (isMenuOpen = false)}>ADD NEW RECORD</a
				>
				<button
					onclick={() => {
						signOut();
						isMenuOpen = false;
					}}
					class="block w-full rounded bg-red-600 px-3 py-2 text-left text-sm font-bold transition-all"
					>SIGN OUT</button
				>
			</div>
		</div>
	{/if}
</nav>

<div
	class="pt-2 transition-opacity duration-200 {isNavigating
		? 'pointer-events-none opacity-50'
		: 'opacity-100'}"
>
	{@render children()}
</div>

<style>
	@keyframes loading {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(300%);
		}
	}
</style>
<<<<<<< HEAD
=======

<!-- <style>
	--charcoal: #164154ff;
	--cadet-gray: #a1aeb3ff;
	--charcoal-2: #1f3a4dff;
	--charcoal-3: #233b48ff;
	--slate-gray: #778b92ff;
</style> -->
>>>>>>> 8d591fa882600f30c65275e07c432786ab6b9366
