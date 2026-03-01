<script lang="ts">
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>Admin Dashboard | Nunez Dental Records System</title>
</svelte:head>

<div class="mx-auto mt-10 max-w-4xl rounded-xl bg-white p-8 shadow-lg print:hidden px-4 md:px-8">
	<div class="mb-8 text-center pb-6 border-b border-gray-100">
		<h1 class="text-3xl font-bold text-[#164154] flex items-center justify-center gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 text-amber-600" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1.323l3.954 1.582 1.599-.8a1 1 0 01.894 1.79l-1.233.616 1.738 5.42a1 1 0 01-.285 1.05A3.989 3.989 0 0115 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.715-5.349L11 6.477V16h2a1 1 0 110 2H7a1 1 0 110-2h2V6.477L6.237 7.582l1.715 5.349a1 1 0 01-.285 1.05A3.989 3.989 0 015 15a3.989 3.989 0 01-2.667-1.019 1 1 0 01-.285-1.05l1.738-5.42-1.233-.617a1 1 0 01.894-1.788l1.599.799L9 4.323V3a1 1 0 011-1zm-5 8.274l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L5 10.274zm10 0l-.818 2.552c.25.112.526.174.818.174.292 0 .569-.062.818-.174L15 10.274z" clip-rule="evenodd" />
            </svg>
            Admin Dashboard
        </h1>
		<p class="mt-2 text-sm text-gray-600">
			Welcome, <span class="font-bold text-[#164154]">{data.user?.name || 'Admin'}</span>. Select an action below to manage the system.
		</p>
	</div>

	<div class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 leading-normal">
		<!-- Create Account Card -->
		<a
			href="/admin/create-account"
			class="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-[#164154] hover:shadow-md"
		>
			<div class="absolute inset-0 bg-[#164154] opacity-0 transition-opacity group-hover:opacity-[0.03]"></div>
			<div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#164154]/10 text-[#164154] transition-colors group-hover:bg-[#164154] group-hover:text-white">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
				</svg>
			</div>
			<h3 class="mb-2 text-lg font-bold text-[#164154]">Create Account</h3>
			<p class="text-sm text-gray-600">
				Add new users or administrators to the system with specific roles and access levels.
			</p>
		</a>

		<!-- Manage Accounts Card -->
		<a
			href="/admin/change-account"
			class="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-[#164154] hover:shadow-md"
		>
			<div class="absolute inset-0 bg-[#164154] opacity-0 transition-opacity group-hover:opacity-[0.03]"></div>
			<div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#164154]/10 text-[#164154] transition-colors group-hover:bg-[#164154] group-hover:text-white">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
				</svg>
			</div>
			<h3 class="mb-2 text-lg font-bold text-[#164154]">Manage Accounts</h3>
			<p class="text-sm text-gray-600">
				Modify existing user details, update roles, or reset account passwords.
			</p>
		</a>

		<!-- System History Card -->
		<a
			href="/admin/history"
			class="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-[#164154] hover:shadow-md"
		>
			<div class="absolute inset-0 bg-[#164154] opacity-0 transition-opacity group-hover:opacity-[0.03]"></div>
			<div class="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#164154]/10 text-[#164154] transition-colors group-hover:bg-[#164154] group-hover:text-white">
				<svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
			</div>
			<h3 class="mb-2 text-lg font-bold text-[#164154]">Audit Log</h3>
			<p class="text-sm text-gray-600">
				Review actions taken across the system, including record modifications and additions.
			</p>
		</a>
	</div>
</div>
