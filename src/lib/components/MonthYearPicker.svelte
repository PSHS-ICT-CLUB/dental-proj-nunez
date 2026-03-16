<script lang="ts">
	let { selectedMonth = $bindable(), selectedYear = $bindable() }: { selectedMonth: number, selectedYear: number } = $props();

	const months = [
		{ value: 1, label: 'January' },
		{ value: 2, label: 'February' },
		{ value: 3, label: 'March' },
		{ value: 4, label: 'April' },
		{ value: 5, label: 'May' },
		{ value: 6, label: 'June' },
		{ value: 7, label: 'July' },
		{ value: 8, label: 'August' },
		{ value: 9, label: 'September' },
		{ value: 10, label: 'October' },
		{ value: 11, label: 'November' },
		{ value: 12, label: 'December' }
	];

	const currentYear = new Date().getFullYear();
	const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
</script>

<div class="flex items-center gap-2">
	<select
		name="month"
		class="rounded-md border-border py-2 pr-10 pl-3 text-sm focus:border-primary focus:ring-primary focus:outline-none"
		bind:value={selectedMonth}
	>
		{#each months as { value, label }}
			<option {value}>{label}</option>
		{/each}
	</select>

	<select
		name="year"
		class="rounded-md border-border py-2 pr-10 pl-3 text-sm focus:border-primary focus:ring-primary focus:outline-none"
		bind:value={selectedYear}
	>
		{#each years as year}
			<option value={year}>{year}</option>
		{/each}
	</select>
</div>
