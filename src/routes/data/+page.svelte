<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Chart from 'chart.js/auto';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let dailyChartCanvas: HTMLCanvasElement;
	let clinicChartCanvas: HTMLCanvasElement;
	let caseTypeChartCanvas: HTMLCanvasElement;
	let paymentChartCanvas: HTMLCanvasElement;
	let dailyChart: Chart<'bar', number[], string>;
	let clinicChart: Chart<'bar', number[], string>;
	let caseTypeChart: Chart<'bar', number[], string>;
	let paymentChart: Chart<'doughnut', number[], string>;

	// Handle period change
	function handlePeriodChange(event: Event) {
		const select = event.target as HTMLSelectElement;
		updateFilters({ period: select.value });
	}

	// Handle date changes
	function handleDateChange(event: Event, field: 'startDate' | 'endDate') {
		const input = event.target as HTMLInputElement;
		const value =
			data.selectedPeriod === 'month'
				? input.value + '-01' // Add day for month view
				: data.selectedPeriod === 'year'
				? input.value + '-01-01' // Add month and day for year view
				: input.value; // Use full date for daily view
		updateFilters({ [field]: value });
	}

	// Handle clinic filtering
	function filterByClinic(event: Event) {
		const select = event.target as HTMLSelectElement;
		updateFilters({ clinic: select.value });
	}

	// Format currency
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: 'PHP'
		}).format(amount);
	};

	function getMonthStart(date: Date): string {
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
	}

	function getMonthEnd(date: Date): string {
		// Get last day of current month
		const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
		return `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
	}

	// Handle date format for input
	const formatDateForInput = (dateString: string) => {
		const date = new Date(dateString);
		if (data.selectedPeriod === 'month') {
			return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
		}
		if (data.selectedPeriod === 'year') {
			return `${date.getFullYear()}`;
		}
		return dateString || getMonthStart(new Date()); // Provide default if empty
	};

	// Add reactive statement to update charts when data changes
	$effect(() => {
		if (dailyChart) {
			dailyChart.data.labels = Object.keys(data.chartData);
			dailyChart.data.datasets[0].label = `${data.selectedPeriod === 'month' ? 'Monthly' : data.selectedPeriod === 'year' ? 'Yearly' : 'Daily'} Total Amount`;
			dailyChart.data.datasets[0].data = Object.values(data.chartData) as number[];
			dailyChart.options.plugins.title!.text = `${data.selectedPeriod === 'month' ? 'Monthly' : data.selectedPeriod === 'year' ? 'Yearly' : 'Daily'} Revenue`;
			dailyChart.update();
		}
	});

	$effect(() => {
		if (caseTypeChart) {
			caseTypeChart.data.labels = Object.keys(data.summary.caseTypeTotals);
			caseTypeChart.data.datasets[0].data = Object.values(data.summary.caseTypeTotals) as number[];
			caseTypeChart.update();
		}
	});

	$effect(() => {
		if (paymentChart) {
			paymentChart.data.datasets[0].data = [data.summary.paymentStatusData.paid, data.summary.paymentStatusData.unpaid];
			paymentChart.update();
		}
	});

	onMount(() => {
		// Main chart
		dailyChart = new Chart(dailyChartCanvas, {
			type: 'bar',
			data: {
				labels: Object.keys(data.chartData),
				datasets: [
					{
						label: `${data.selectedPeriod === 'month' ? 'Monthly' : data.selectedPeriod === 'year' ? 'Yearly' : 'Daily'} Total Amount`,
						data: Object.values(data.chartData) as number[],
						backgroundColor: 'rgba(75, 192, 192, 0.5)',
						borderColor: 'rgb(75, 192, 192)',
						borderWidth: 1
					}
				]
			},
			options: {
				responsive: true,
				plugins: {
					tooltip: {
						callbacks: {
							label: (context) => formatCurrency(context.parsed.y)
						}
					},
					title: {
						display: true,
						text: `${data.selectedPeriod === 'month' ? 'Monthly' : data.selectedPeriod === 'year' ? 'Yearly' : 'Daily'} Revenue`
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						ticks: {
							callback: (value) => formatCurrency(value as number)
						}
					},
					x: {
						type: data.selectedPeriod === 'day' ? 'time' : 'category',
						time: {
							unit: data.selectedPeriod === 'year' ? 'year' : data.selectedPeriod === 'day' ? 'day' : 'month',
							displayFormats: {
								day: 'MMM d, yyyy',
								month: 'MMM yyyy',
								year: 'yyyy'
							}
						},
						ticks: {
							maxRotation: 45,
							minRotation: 45
						}
					}
				}
			}
		});

		// Clinic chart
		clinicChart = new Chart(clinicChartCanvas, {
			type: 'bar',
			data: {
				labels: Object.keys(data.clinicChartData),
				datasets: [
					{
						label: 'Total Amount per Clinic',
						data: Object.values(data.clinicChartData) as number[],
						backgroundColor: [
							'rgba(255, 99, 132, 0.5)',
							'rgba(54, 162, 235, 0.5)',
							'rgba(255, 206, 86, 0.5)',
							'rgba(75, 192, 192, 0.5)'
						]
					}
				]
			},
			options: {
				responsive: true,
				plugins: {
					tooltip: {
						callbacks: {
							label: (context) => formatCurrency(context.parsed.y)
						}
					}
				}
			}
		});

		// Case Type Units chart
		caseTypeChart = new Chart(caseTypeChartCanvas, {
			type: 'bar',
			data: {
				labels: Object.keys(data.summary.caseTypeTotals),
				datasets: [
					{
						label: 'Units per Case Type',
						data: Object.values(data.summary.caseTypeTotals) as number[],
						backgroundColor: [
							'rgba(54, 162, 235, 0.5)',
							'rgba(255, 206, 86, 0.5)',
							'rgba(75, 192, 192, 0.5)',
							'rgba(153, 102, 255, 0.5)',
							'rgba(255, 159, 64, 0.5)'
						],
						borderColor: [
							'rgb(54, 162, 235)',
							'rgb(255, 206, 86)',
							'rgb(75, 192, 192)',
							'rgb(153, 102, 255)',
							'rgb(255, 159, 64)'
						],
						borderWidth: 1
					}
				]
			},
			options: {
				responsive: true,
				plugins: {
					title: {
						display: true,
						text: 'Case Type Distribution'
					},
					tooltip: {
						callbacks: {
							label: (context) => `${context.parsed.y} units`
						}
					}
				},
				scales: {
					y: {
						beginAtZero: true,
						title: {
							display: true,
							text: 'Number of Units'
						}
					}
				}
			}
		});

		// Payment chart
		paymentChart = new Chart(paymentChartCanvas, {
			type: 'doughnut',
			data: {
				labels: ['Paid', 'Unpaid'],
				datasets: [
					{
						data: [data.summary.paymentStatusData.paid, data.summary.paymentStatusData.unpaid],
						backgroundColor: [
							'rgba(75, 192, 192, 0.5)',
							'rgba(255, 99, 132, 0.5)'
						],
						borderColor: [
							'rgb(75, 192, 192)',
							'rgb(255, 99, 132)'
						],
						borderWidth: 1
					}
				]
			},
			options: {
				responsive: true,
				plugins: {
					title: {
						display: true,
						text: 'Payment Status Distribution'
					},
					tooltip: {
						callbacks: {
							label: (context) => formatCurrency(context.parsed)
						}
					}
				}
			}
		});

		return () => {
			dailyChart.destroy();
			clinicChart.destroy();
			caseTypeChart.destroy();
			paymentChart.destroy();
		};
	});

	// Update filters and URL
	function updateFilters(updates: Record<string, string>) {
		const url = new URL(window.location.href);
		Object.entries(updates).forEach(([key, value]) => {
			url.searchParams.set(key, value);
		});
		goto(url.toString(), { replaceState: true });
	}
</script>

<div class="mx-auto max-w-6xl px-4 py-8">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-2xl font-bold">Data Summary</h1>
		<div class="text-sm text-text-muted">
			Showing data for: <span class="font-semibold text-text-secondary">{data.selectedPeriod === 'month' ? 'Monthly View' : 'Daily View'}</span>
		</div>
	</div>

	<!-- Filters Card -->
	<div class="mb-8 rounded-lg border border-border bg-surface p-6 shadow-sm">
		<h2 class="mb-4 text-sm font-semibold tracking-wider text-text-muted uppercase">
			Filter & Navigate
		</h2>
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 items-end">
			<!-- Period selector -->
			<div class="flex flex-col">
				<label for="period" class="mb-1 block text-[10px] font-medium tracking-wider text-text-muted uppercase">View by</label>
				<select
					id="period"
					class="w-full rounded border border-border p-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
					value={data.selectedPeriod}
					on:change={handlePeriodChange}
				>
					<option value="year">Yearly</option>
					<option value="month">Monthly</option>
					<option value="day">Daily</option>
				</select>
			</div>

			<!-- Date filters -->
			<div class="flex flex-col">
				<label for="startDate" class="mb-1 block text-[10px] font-medium tracking-wider text-text-muted uppercase">Start Date</label>
				<input
					type={data.selectedPeriod === 'month' ? 'month' : data.selectedPeriod === 'year' ? 'number' : 'date'}
					id="startDate"
					min={data.selectedPeriod === 'year' ? '2000' : undefined}
					max={data.selectedPeriod === 'year' ? '2100' : undefined}
					class="w-full rounded border border-border p-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
					value={formatDateForInput(data.dateRange.start || getMonthStart(new Date()))}
					on:change={(e) => handleDateChange(e, 'startDate')}
				/>
			</div>
			
			<div class="flex flex-col">
				<label for="endDate" class="mb-1 block text-[10px] font-medium tracking-wider text-text-muted uppercase">End Date</label>
				<input
					type={data.selectedPeriod === 'month' ? 'month' : data.selectedPeriod === 'year' ? 'number' : 'date'}
					id="endDate"
					min={data.selectedPeriod === 'year' ? '2000' : undefined}
					max={data.selectedPeriod === 'year' ? '2100' : undefined}
					class="w-full rounded border border-border p-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
					value={formatDateForInput(data.dateRange.end || getMonthEnd(new Date()))}
					on:change={(e) => handleDateChange(e, 'endDate')}
				/>
			</div>

			<!-- Clinic filter -->
			<div class="flex flex-col">
				<label for="clinic" class="mb-1 block text-[10px] font-medium tracking-wider text-text-muted uppercase">Filter by Clinic</label>
				<select
					id="clinic"
					class="w-full rounded border border-border p-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary"
					value={data.selectedClinic}
					on:change={filterByClinic}
				>
					<option value="all">All Clinics</option>
					{#each data.clinics as clinic}
						<option value={clinic.id}>{clinic.name}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>

	<!-- Summary cards -->
	<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
		<div class="rounded-lg border border-border bg-white p-6 shadow-sm">
			<p class="mb-1 text-[10px] font-semibold tracking-wider text-text-muted uppercase">Total Cases</p>
			<p class="text-2xl font-bold text-text-primary">{data.summary.totalCases}</p>
		</div>
		<div class="rounded-lg border border-border bg-white p-6 shadow-sm">
			<p class="mb-1 text-[10px] font-semibold tracking-wider text-text-muted uppercase">Total Amount</p>
			<p class="text-2xl font-bold text-text-primary">{formatCurrency(data.summary.totalAmount)}</p>
		</div>
		<div class="rounded-lg border border-border bg-white p-6 shadow-sm relative overflow-hidden">
			<div class="absolute top-0 right-0 w-2 h-full bg-green-500"></div>
			<p class="mb-1 text-[10px] font-semibold tracking-wider text-text-muted uppercase">Paid Amount</p>
			<p class="text-2xl font-bold text-green-600">{formatCurrency(data.summary.paidAmount)}</p>
		</div>
	</div>

	<!-- Case Types Summary -->
	<div class="mb-8 rounded-lg border border-border bg-white p-6 shadow-sm">
		<h2 class="mb-4 text-sm font-semibold tracking-wider text-text-muted uppercase">Case Types Distribution Overview</h2>
		<div class="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-5">
			{#each Object.entries(data.summary.caseTypeTotals) as [type, count]}
				<div class="rounded bg-surface p-4 border border-surface-alt">
					<h3 class="mb-1 text-[10px] font-medium tracking-wider text-text-muted uppercase">{type}</h3>
					<p class="text-lg font-semibold text-text-primary">{count} units</p>
				</div>
			{/each}
		</div>
	</div>

	<!-- Charts -->
	<div class="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
		<div class="rounded-lg border border-border bg-white p-6 shadow-sm lg:col-span-2">
			<h2 class="mb-4 text-sm font-semibold tracking-wider text-text-muted uppercase">
				{data.selectedPeriod === 'month' ? 'Monthly' : data.selectedPeriod === 'year' ? 'Yearly' : 'Daily'} Revenue Flow
			</h2>
			<canvas bind:this={dailyChartCanvas}></canvas>
		</div>

		<div class="rounded-lg border border-border bg-white p-6 shadow-sm">
			<h2 class="mb-4 text-sm font-semibold tracking-wider text-text-muted uppercase">Payment Status Spread</h2>
			<canvas bind:this={paymentChartCanvas}></canvas>
		</div>

		<div class="rounded-lg border border-border bg-white p-6 shadow-sm">
			<h2 class="mb-4 text-sm font-semibold tracking-wider text-text-muted uppercase">Revenue per Clinic</h2>
			<canvas bind:this={clinicChartCanvas}></canvas>
		</div>

		<div class="rounded-lg border border-border bg-white p-6 shadow-sm">
			<h2 class="mb-4 text-sm font-semibold tracking-wider text-text-muted uppercase">Case Type Volume Distribution</h2>
			<canvas bind:this={caseTypeChartCanvas}></canvas>
		</div>
	</div>
</div>
