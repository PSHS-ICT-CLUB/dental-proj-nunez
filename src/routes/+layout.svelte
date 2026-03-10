<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { signOut } from '@auth/sveltekit/client';
	import '../app.css';
	import NotificationBanner from '$lib/components/NotificationBanner.svelte';
	let { children, data } = $props();

	let isMenuOpen = $state(false);
	let isUserMenuOpen = $state(false);

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

	function isSettingsActive() {
		return settingsLinks.some((link) => isActive(link.href));
	}

	// Check if user is authenticated
	const isAuthenticated = $derived(!!data?.session?.user);
</script>

<svelte:head>
	<title>{getPageTitle(page.url.pathname)} | Nunez Dental Records System</title>
</svelte:head>

<NotificationBanner />

{#if isAuthenticated}
	<nav class="sticky top-0 left-0 z-50 w-full bg-[#164154] text-white shadow-md print:hidden">
		<div class="mx-auto flex items-center justify-between px-4 py-3">
			<div class="flex items-center gap-6">
				<!-- Logo -->
				{#if page.url.pathname !== '/'}
					<a
						href="/"
						class="text-lg font-bold tracking-tight transition-colors duration-200 hover:text-[#A1AEB3]"
					>
						Nunez Dental
					</a>
				{:else}
					<button
						onclick={() => window.location.reload()}
						class="text-lg font-bold tracking-tight transition-colors duration-200 hover:text-[#A1AEB3]"
					>
						Nunez Dental
					</button>
				{/if}

				<!-- Desktop Primary Navigation -->
				<div class="hidden items-center gap-1 lg:flex">
					{#each primaryNavLinks as link}
						<a
							href={link.href}
							class={`relative rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
								isActive(link.href)
									? 'bg-white/10 text-white'
									: `${link.color || 'text-[#A1AEB3]'} hover:bg-white/5 hover:text-white`
							}`}
						>
							{link.label}
						</a>
					{/each}

					<!-- Settings Dropdown -->
					<div class="relative">
						<button
							onclick={() => (isUserMenuOpen = !isUserMenuOpen)}
							class={`flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 ${
								isSettingsActive() || isUserMenuOpen
									? 'bg-white/10 text-white'
									: 'text-[#A1AEB3] hover:bg-white/5 hover:text-white'
							}`}
						>
							Settings
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</button>

						{#if isUserMenuOpen}
							<div
								class="absolute top-full right-0 mt-1 w-48 rounded-lg border border-white/10 bg-[#1F3A4D] py-1 shadow-xl"
							>
								{#each settingsLinks as link}
									<a
										href={link.href}
										class={`block px-4 py-2 text-sm transition-colors ${
											isActive(link.href)
												? 'bg-white/10 text-white'
												: 'text-[#A1AEB3] hover:bg-white/5 hover:text-white'
										}`}
										onclick={() => (isUserMenuOpen = false)}
									>
										{link.label}
									</a>
								{/each}
							</div>
						{/if}
					</div>
				</div>
			</div>

			<!-- Right Side Actions -->
			<div class="flex items-center gap-2">
				<!-- Desktop Actions -->
				<div class="hidden items-center gap-2 lg:flex">
					<!-- User Menu Dropdown -->
					<div class="relative">
						<button
							onclick={() => (isUserMenuOpen = !isUserMenuOpen)}
							class="flex items-center gap-2 rounded-full bg-[#1F3A4D] px-3 py-1.5 text-sm font-medium text-[#A1AEB3] transition-all hover:bg-[#233B48] hover:text-white"
						>
							<span
								class="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-bold text-emerald-400"
							>
								{data?.session?.user?.name?.charAt(0)?.toUpperCase() ||
									data?.session?.user?.email?.charAt(0)?.toUpperCase() ||
									'U'}
							</span>
							<span class="max-w-[100px] truncate"
								>{data?.session?.user?.name || data?.session?.user?.email || 'User'}</span
							>
							<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19 9l-7 7-7-7"
								/>
							</svg>
						</button>

						{#if isUserMenuOpen}
							<div
								class="absolute top-full right-0 mt-1 w-56 rounded-lg border border-white/10 bg-[#1F3A4D] py-1 shadow-xl"
							>
								<div class="border-b border-white/10 px-4 py-2">
									<p class="text-xs text-[#A1AEB3]">Signed in as</p>
									<p class="truncate text-sm font-medium text-white">
										{data?.session?.user?.email}
									</p>
									{#if data?.session?.user?.role}
										<span
											class="mt-1 inline-flex items-center rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-400"
										>
											{data.session.user.role}
										</span>
									{/if}
								</div>

								{#if data?.session?.user?.role === 'admin' || data?.session?.user?.role === 'dentist'}
									<a
										href="/review-cases"
										class="flex items-center gap-2 px-4 py-2 text-sm text-purple-300 transition-colors hover:bg-white/5 hover:text-purple-200"
										onclick={() => (isUserMenuOpen = false)}
									>
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
											/>
										</svg>
										Review Cases
									</a>
								{/if}

								{#if data?.session?.user?.role === 'admin'}
									<a
										href="/admin"
										class="flex items-center gap-2 px-4 py-2 text-sm text-amber-300 transition-colors hover:bg-white/5 hover:text-amber-200"
										onclick={() => (isUserMenuOpen = false)}
									>
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
											/>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
											/>
										</svg>
										Admin Panel
									</a>
									<a
										href="/admin/history"
										class="flex items-center gap-2 px-4 py-2 text-sm text-blue-300 transition-colors hover:bg-white/5 hover:text-blue-200"
										onclick={() => (isUserMenuOpen = false)}
									>
										<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
											/>
										</svg>
										Change Log
									</a>
								{/if}

								<div class="my-1 border-t border-white/10"></div>

								<button
									onclick={() => window.print()}
									class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-[#A1AEB3] transition-colors hover:bg-white/5 hover:text-white"
								>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
										/>
									</svg>
									Print
								</button>

								<a
									href="/upload-record"
									class="flex items-center gap-2 px-4 py-2 text-sm text-emerald-400 transition-colors hover:bg-white/5"
									onclick={() => (isUserMenuOpen = false)}
								>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M12 4v16m8-8H4"
										/>
									</svg>
									Add Record
								</a>

								<div class="my-1 border-t border-white/10"></div>

								<button
									onclick={() => signOut()}
									class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-400 transition-colors hover:bg-white/5"
								>
									<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
										/>
									</svg>
									Sign Out
								</button>
							</div>
						{/if}
					</div>
				</div>

				<!-- Mobile Menu Button -->
				<button
					class="flex items-center justify-center rounded-lg bg-[#1F3A4D] p-2 text-white transition-colors hover:bg-[#233B48] lg:hidden"
					aria-label="Toggle menu"
					onclick={() => (isMenuOpen = !isMenuOpen)}
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d={isMenuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'}
						/>
					</svg>
				</button>
			</div>
		</div>

		<!-- Mobile Navigation -->
		{#if isMenuOpen}
			<div
				class="max-h-[calc(100vh-80px)] overflow-y-auto border-t border-white/10 bg-[#164154] px-4 py-4 text-white shadow-xl lg:hidden"
			>
				<div class="flex flex-col gap-1">
					<!-- Primary Links -->
					{#each primaryNavLinks as link}
						<a
							class={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
								isActive(link.href)
									? 'bg-white/10 text-white'
									: `${link.color || 'text-[#A1AEB3]'} hover:bg-white/5 hover:text-white`
							}`}
							href={link.href}
							onclick={() => (isMenuOpen = false)}
						>
							{link.label}
						</a>
					{/each}

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
								onclick={() => (isMenuMenuOpen = false)}
							>
								{link.label}
							</a>
						{/each}
					</div>

					<!-- Admin Section -->
					{#if data?.session?.user?.role === 'admin' || data?.session?.user?.role === 'dentist'}
						<div class="mt-2 border-t border-white/10 pt-2">
							<p class="px-3 py-1 text-xs font-medium tracking-wider text-[#A1AEB3]/70 uppercase">
								Admin
							</p>
							{#if data?.session?.user?.role === 'admin' || data?.session?.user?.role === 'dentist'}
								<a
									class="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-purple-300 transition-all hover:bg-white/5"
									href="/review-cases"
									onclick={() => (isMenuOpen = false)}
								>
									Review Cases
								</a>
							{/if}
							{#if data?.session?.user?.role === 'admin'}
								<a
									class="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-amber-300 transition-all hover:bg-white/5"
									href="/admin"
									onclick={() => (isMenuOpen = false)}
								>
									Admin Panel
								</a>
								<a
									class="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-blue-300 transition-all hover:bg-white/5"
									href="/admin/history"
									onclick={() => (isMenuOpen = false)}
								>
									Change Log
								</a>
							{/if}
						</div>
					{/if}

					<!-- Actions Section -->
					<div class="mt-2 border-t border-white/10 pt-2">
						<p class="px-3 py-1 text-xs font-medium tracking-wider text-[#A1AEB3]/70 uppercase">
							Actions
						</p>
						<button
							onclick={() => {
								window.print();
								isMenuOpen = false;
							}}
							class="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-[#A1AEB3] transition-all hover:bg-white/5 hover:text-white"
						>
							Print
						</button>
						<a
							class="flex items-center gap-2 rounded-lg bg-emerald-600/20 px-3 py-2.5 text-sm font-medium text-emerald-400 transition-all hover:bg-emerald-600/30"
							href="/upload-record"
							onclick={() => (isMenuOpen = false)}
						>
							Add Record
						</a>
						<button
							onclick={() => {
								signOut();
								isMenuOpen = false;
							}}
							class="flex w-full items-center gap-2 rounded-lg bg-red-600/20 px-3 py-2.5 text-left text-sm font-medium text-red-400 transition-all hover:bg-red-600/30"
						>
							Sign Out
						</button>
					</div>
				</div>
			</div>
		{/if}
	</nav>
{/if}

<div class="pt-2">
	{@render children()}
</div>
