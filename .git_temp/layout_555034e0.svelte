<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import '../app.css';
	let { children } = $props();

	let isMenuOpen = $state(false);

	// Create a function to get the current page title
	function getPageTitle(pathname: string): string {
		switch (pathname) {
			case '/':
				return 'Home';
			case '/sales':
				return 'Sales';
			case '/expenses':
				return 'Expenses';
			case '/edit_info':
				return 'Edit Info';
			case '/change_password':
				return 'Change Password';
			case '/upload_record':
				return 'Add Record';
			case '/data':
				return 'Data';

			default:
				return 'Dental Records';
		}
	}
</script>

<svelte:head>
	<title>{getPageTitle(page.url.pathname)} | Cassey Dental Records System</title>
</svelte:head>

<nav class="top-0 left-0 z-50 w-full bg-[#164154] text-white shadow-md print:hidden">
	<div class="mx-auto flex items-center justify-between px-4 py-2">
		{#if page.url.pathname !== '/'}
			<a
				href="/"
				class="text-lg font-bold transition-colors duration-200 hover:cursor-pointer hover:text-[#A1AEB3]"
			>
				Home
			</a>
		{:else}
			<button
				onclick={() => {
					window.location.reload();
					window.location.href = '/';
				}}
				class="text-lg font-bold transition-colors duration-200 hover:cursor-pointer hover:text-[#A1AEB3]"
			>
				Home
			</button>
		{/if}

		<!-- Hamburger menu button for mobile -->
		<button
			class="block rounded border border-[#A1AEB3] bg-[#1F3A4D] p-2 text-white shadow-sm hover:bg-[#233B48] focus:ring-2 focus:ring-[#778B92] focus:ring-offset-1 focus:outline-none md:hidden"
			aria-label="Toggle menu"
			onclick={() => (isMenuOpen = !isMenuOpen)}
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
					d="M4 6h16M4 12h16m-7 6h7"
				/>
			</svg>
		</button>

		<!-- Desktop navigation -->
		<div class="top-7 right-5 hidden justify-between gap-2 md:flex">
			<a
				class="rounded border border-[#A1AEB3] bg-[#4B5563] p-2 text-white shadow-sm hover:bg-[#374151] focus:ring-2 focus:ring-[#778B92] focus:ring-offset-1 focus:outline-none sm:text-sm"
				href="/balance">BALANCES</a
			>
			<a
				class="rounded border border-[#A1AEB3] bg-[#4B5563] p-2 text-white shadow-sm hover:bg-[#374151] focus:ring-2 focus:ring-[#778B92] focus:ring-offset-1 focus:outline-none sm:text-sm"
				href="/data">DATA</a
			>
			<a
				class="rounded border border-[#A1AEB3] bg-[#4B5563] p-2 text-white shadow-sm hover:bg-[#374151] focus:ring-2 focus:ring-[#778B92] focus:ring-offset-1 focus:outline-none sm:text-sm"
				href="/sales">SALES</a
			>
			<a
				class="rounded border border-[#A1AEB3] bg-[#DC2626] p-2 text-white shadow-sm hover:bg-[#B91C1C] focus:ring-2 focus:ring-[#778B92] focus:ring-offset-1 focus:outline-none sm:text-sm"
				href="/expenses">EXPENSES</a
			>
			<a
				class="rounded border border-[#A1AEB3] bg-[#2563EB] p-2 text-white shadow-sm hover:bg-[#1D4ED8] focus:ring-2 focus:ring-[#778B92] focus:ring-offset-1 focus:outline-none sm:text-sm"
				href="/edit_info">EDIT INFOS</a
			>
			<a
				class="rounded border border-[#A1AEB3] bg-[#4B5563] p-2 text-white shadow-sm hover:bg-[#374151] focus:ring-2 focus:ring-[#778B92] focus:ring-offset-1 focus:outline-none sm:text-sm"
				href="/change_password">CHANGE PASSWORD</a
			>
			<button
				onclick={() => window.print()}
				class="rounded border border-[#A1AEB3] bg-[#233B48] p-2 text-white shadow-sm hover:bg-[#164154] focus:ring-2 focus:ring-[#778B92] focus:ring-offset-1 focus:outline-none sm:text-sm"
				>PRINT</button
			>
			<a
				class="rounded border border-[#A1AEB3] bg-[#059669] p-2 text-white shadow-sm hover:bg-[#047857] focus:ring-2 focus:ring-[#778B92] focus:ring-offset-1 focus:outline-none sm:text-sm"
				href="/upload_record">ADD RECORD</a
			>
		</div>
	</div>

	<!-- Mobile navigation -->
	<div
		class={`${isMenuOpen ? 'block' : 'hidden'} bg-[#164154] px-4 py-2 text-white shadow-md md:hidden`}
	>
		<a
			class="mb-2 block rounded border border-[#A1AEB3] bg-[#4B5563] p-2 text-white shadow-sm hover:bg-[#374151] focus:ring-2 focus:ring-[#778B92] focus:ring-offset-1 focus:outline-none sm:text-sm"
			href="/data">DATA</a
		>
		<a
			class="mb-2 block rounded border border-[#A1AEB3] bg-[#4B5563] p-2 text-white shadow-sm hover:bg-[#374151] focus:ring-2 focus:ring-[#778B92] focus:ring-offset-1 focus:outline-none sm:text-sm"
			href="/sales">SALES</a
		>
		<a
			class="mb-2 block rounded border border-[#A1AEB3] bg-[#4B5563] p-2 text-white shadow-sm hover:bg-[#374151] focus:ring-2 focus:ring-[#778B92] focus:ring-offset-1 focus:outline-none sm:text-sm"
			href="/balance">BALANCES</a
		>
		<a
			class="mb-2 block rounded border border-[#A1AEB3] bg-[#DC2626] p-2 text-white shadow-sm hover:bg-[#B91C1C] focus:ring-2 focus:ring-[#778B92] focus:ring-offset-1 focus:outline-none sm:text-sm"
			href="/expenses">EXPENSES</a
		>
		<a
			class="mb-2 block rounded border border-[#A1AEB3] bg-[#2563EB] p-2 text-white shadow-sm hover:bg-[#1D4ED8] focus:ring-2 focus:ring-[#778B92] focus:ring-offset-1 focus:outline-none sm:text-sm"
			href="/edit_info">EDIT INFOS</a
		>
		<a
			class="mb-2 block rounded border border-[#A1AEB3] bg-[#4B5563] p-2 text-white shadow-sm hover:bg-[#374151] focus:ring-2 focus:ring-[#778B92] focus:ring-offset-1 focus:outline-none sm:text-sm"
			href="/change_password">CHANGE PASSWORD</a
		>
		<button
			onclick={() => window.print()}
			class="mb-2 block w-full rounded border border-[#A1AEB3] bg-[#233B48] p-2 text-white shadow-sm hover:bg-[#164154] focus:ring-2 focus:ring-[#778B92] focus:ring-offset-1 focus:outline-none sm:text-sm"
			>PRINT</button
		>
		<a
			class="block rounded border border-[#A1AEB3] bg-[#059669] p-2 text-white shadow-sm hover:bg-[#047857] focus:ring-2 focus:ring-[#778B92] focus:ring-offset-1 focus:outline-none sm:text-sm"
			href="/upload_record">ADD RECORD</a
		>
	</div>
</nav>

<div class="pt-2">
	{@render children()}
</div>

<!-- <style>
	--charcoal: #164154ff;
	--cadet-gray: #a1aeb3ff;
	--charcoal-2: #1f3a4dff;
	--charcoal-3: #233b48ff;
	--slate-gray: #778b92ff;
</style> -->
