<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import Chart from 'chart.js/auto';
	import type { PageProps } from './$types';

	const { data }: PageProps = $props();

	let dailyChartCanvas: HTMLCanvasElement;
	let clinicChartCanvas: HTMLCanvasElement;
	let caseTypeChartCanvas: HTMLCanvasElement;
	let dailyChart: Chart<'bar', number[], string>;
	let clinicChart: Chart<'bar', number[], string>;
	let caseTypeChart: Chart<'bar', number[], string>;

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
		return dateString || getMonthStart(new Date()); // Provide default if empty
	};

	// Add reactive statement to update charts when data changes
	$effect(() => {
		if (dailyChart || trendChart) {
			if (chartType === 'line' && trendChart) {
				trendChart.data.labels = Object.keys(data.chartData);
				trendChart.data.datasets[0].label = `${data.selectedPeriod === 'month' ? 'Monthly' : 'Daily'} Total Amount`;
				trendChart.data.datasets[0].data = Object.values(data.chartData) as number[];
				trendChart.options.plugins.title.text = `${data.selectedPeriod === 'month' ? 'Monthly' : 'Daily'} Revenue Trend`;
				trendChart.update();
			} else if (dailyChart) {
				dailyChart.data.labels = Object.keys(data.chartData);
				dailyChart.data.datasets[0].label = `${data.selectedPeriod === 'month' ? 'Monthly' : 'Daily'} Total Amount`;
				dailyChart.data.datasets[0].data = Object.values(data.chartData) as number[];
				dailyChart.options.plugins.title.text = `${data.selectedPeriod === 'month' ? 'Monthly' : 'Daily'} Revenue`;
				dailyChart.update();
			}
		}
	});

	$effect(() => {
		if (caseTypeChart) {
			caseTypeChart.data.labels = Object.keys(data.summary.caseTypeTotals);
			caseTypeChart.data.datasets[0].data = Object.values(data.summary.caseTypeTotals) as number[];
			caseTypeChart.update();
		}
	});

	onMount(() => {
		createChart();

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

		return () => {
			if (dailyChart) dailyChart.destroy();
			if (trendChart) trendChart.destroy();
			clinicChart.destroy();
			caseTypeChart.destroy();
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

	// Date preset handlers
	function applyDatePreset(preset: string) {
		const today = new Date();
		let start: string;
		let end: string = today.toISOString().split('T')[0];

		switch (preset) {
			case 'last7days':
				const last7 = new Date(today);
				last7.setDate(today.getDate() - 7);
				start = last7.toISOString().split('T')[0];
				break;
			case 'last30days':
				const last30 = new Date(today);
				last30.setDate(today.getDate() - 30);
				start = last30.toISOString().split('T')[0];
				break;
			case 'thisMonth':
				start = getMonthStart(today);
				end = getMonthEnd(today);
				break;
			case 'lastMonth':
				const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
				start = getMonthStart(lastMonth);
				end = getMonthEnd(lastMonth);
				break;
			case 'thisYear':
				start = `${today.getFullYear()}-01-01`;
				end = `${today.getFullYear()}-12-31`;
				break;
			default:
				return;
		}

		updateFilters({ startDate: start, endDate: end });
	}

	// Chart type toggle
	let chartType = $state<'bar' | 'line'>('bar');
	let trendChartCanvas: HTMLCanvasElement;
	let trendChart: Chart<'line', number[], string> | null = null;

	function toggleChartType() {
		chartType = chartType === 'bar' ? 'line' : 'bar';
		if (dailyChart) {
			dailyChart.destroy();
		}
		if (trendChart) {
			trendChart.destroy();
			trendChart = null;
		}
		createChart();
	}

	function createChart() {
		if (!trendChartCanvas && !dailyChartCanvas) return;

		if (chartType === 'line' && trendChartCanvas) {
			trendChart = new Chart(trendChartCanvas, {
				type: 'line',
				data: {
					labels: Object.keys(data.chartData),
					datasets: [
						{
							label: `${data.selectedPeriod === 'month' ? 'Monthly' : 'Daily'} Total Amount`,
							data: Object.values(data.chartData) as number[],
							backgroundColor: 'rgba(99, 102, 241, 0.1)',
							borderColor: 'rgb(99, 102, 241)',
							borderWidth: 2,
							fill: true,
							tension: 0.4
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
							text: `${data.selectedPeriod === 'month' ? 'Monthly' : 'Daily'} Revenue Trend`
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
							ticks: {
								maxRotation: 45,
								minRotation: 45
							}
						}
					}
				}
			});
		} else if (dailyChartCanvas) {
			dailyChart = new Chart(dailyChartCanvas, {
				type: 'bar',
				data: {
					labels: Object.keys(data.chartData),
					datasets: [
						{
							label: `${data.selectedPeriod === 'month' ? 'Monthly' : 'Daily'} Total Amount`,
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
							text: `${data.selectedPeriod === 'month' ? 'Monthly' : 'Daily'} Revenue`
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
								unit: data.selectedPeriod === 'day' ? 'day' : 'month',
								displayFormats: {
									day: 'MMM d, yyyy',
									month: 'MMM yyyy'
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
		}
	}
</script>

<div class="container mx-auto p-4">
	<div class="mb-6 flex items-center justify-between">
		<h1 class="text-3xl font-bold text-gray-900">Data Summary</h1>
	</div>

	<!-- Filters Section -->
	<div class="mb-6 rounded-lg bg-white p-6 shadow-md">
		<h2 class="mb-4 text-lg font-semibold text-gray-700">Filters</h2>

		<!-- Date Presets -->
		<div class="mb-4">
			<label class="mb-2 block text-sm font-medium text-gray-700">Quick Date Presets:</label>
			<div class="flex flex-wrap gap-2">
				<button
					type="button"
					onclick={() => applyDatePreset('last7days')}
					class="rounded-md bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
				>
					Last 7 Days
				</button>
				<button
					type="button"
					onclick={() => applyDatePreset('last30days')}
					class="rounded-md bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
				>
					Last 30 Days
				</button>
				<button
					type="button"
					onclick={() => applyDatePreset('thisMonth')}
					class="rounded-md bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
				>
					This Month
				</button>
				<button
					type="button"
					onclick={() => applyDatePreset('lastMonth')}
					class="rounded-md bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
				>
					Last Month
				</button>
				<button
					type="button"
					onclick={() => applyDatePreset('thisYear')}
					class="rounded-md bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
				>
					This Year
				</button>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-4">
			<!-- Period selector -->
			<div>
				<label for="period" class="mb-1 block text-sm font-medium text-gray-700">View by:</label>
				<select
					id="period"
					class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
					value={data.selectedPeriod}
					onchange={handlePeriodChange}
				>
					<option value="month">Monthly</option>
					<option value="day">Daily</option>
				</select>
			</div>

			<!-- Date filters -->
			<div>
				<label for="startDate" class="mb-1 block text-sm font-medium text-gray-700"
					>Start Date:</label
				>
				<input
					type={data.selectedPeriod === 'month' ? 'month' : 'date'}
					id="startDate"
					class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
					value={data.selectedPeriod === 'month'
						? formatDateForInput(data.dateRange.start || getMonthStart(new Date()))
						: data.dateRange.start || getMonthStart(new Date())}
					onchange={(e) => handleDateChange(e, 'startDate')}
				/>
			</div>
			<div>
				<label for="endDate" class="mb-1 block text-sm font-medium text-gray-700">End Date:</label>
				<input
					type={data.selectedPeriod === 'month' ? 'month' : 'date'}
					id="endDate"
					class="w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
					value={data.selectedPeriod === 'month'
						? formatDateForInput(data.dateRange.end || getMonthEnd(new Date()))
						: data.dateRange.end || getMonthEnd(new Date())}
					onchange={(e) => handleDateChange(e, 'endDate')}
				/>
			</div>

			<!-- Clinic filter -->
			<div>
				<label for="clinic" class="mb-1 block text-sm font-medium text-gray-700"
					>Filter by Clinic:</label
				>
				<select
					id="clinic"
					class="w-full rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
					value={data.selectedClinic}
					onchange={filterByClinic}
				>
					<option value="all">All Clinics</option>
					{#each data.clinics as clinic}
						<option value={clinic.id}>{clinic.name}</option>
					{/each}
				</select>
			</div>
		</div>
	</div>

	<!-- Main Summary Cards -->
	<div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg">
			<div class="mb-2 flex items-center justify-between">
				<h3 class="text-sm font-medium opacity-90">Total Cases</h3>
				<svg class="h-6 w-6 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
					/>
				</svg>
			</div>
			<p class="text-3xl font-bold">{data.summary.totalCases}</p>
		</div>

		<div class="rounded-lg bg-gradient-to-br from-green-500 to-green-600 p-6 text-white shadow-lg">
			<div class="mb-2 flex items-center justify-between">
				<h3 class="text-sm font-medium opacity-90">Total Amount</h3>
				<svg class="h-6 w-6 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</div>
			<p class="text-3xl font-bold">{formatCurrency(data.summary.totalAmount)}</p>
		</div>

		<div
			class="rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 text-white shadow-lg"
		>
			<div class="mb-2 flex items-center justify-between">
				<h3 class="text-sm font-medium opacity-90">Paid Amount</h3>
				<svg class="h-6 w-6 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</div>
			<p class="text-3xl font-bold">{formatCurrency(data.summary.paidAmount)}</p>
		</div>

		<div class="rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 p-6 text-white shadow-lg">
			<div class="mb-2 flex items-center justify-between">
				<h3 class="text-sm font-medium opacity-90">Average Order Value</h3>
				<svg class="h-6 w-6 opacity-75" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
					/>
				</svg>
			</div>
			<p class="text-3xl font-bold">{formatCurrency(data.summary.averageOrderValue)}</p>
		</div>
	</div>

	<!-- Secondary Metrics -->
	<div class="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
		<div class="rounded-lg bg-white p-6 shadow-md">
			<div class="mb-2 flex items-center justify-between">
				<h3 class="text-sm font-medium text-gray-600">Unpaid Amount</h3>
				<svg class="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
			</div>
			<p class="text-2xl font-bold text-red-600">{formatCurrency(data.summary.unpaidAmount)}</p>
		</div>

		<div class="rounded-lg bg-white p-6 shadow-md">
			<div class="mb-2 flex items-center justify-between">
				<h3 class="text-sm font-medium text-gray-600">Balance</h3>
				<svg
					class="h-5 w-5 {data.summary.balance >= 0 ? 'text-green-500' : 'text-red-500'}"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
					/>
				</svg>
			</div>
			<p class="text-2xl font-bold {data.summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}">
				{data.summary.balance >= 0 ? '+' : ''}{formatCurrency(data.summary.balance)}
			</p>
		</div>

		<!-- Payment Status Breakdown -->
		<div class="rounded-lg bg-white p-6 shadow-md">
			<h3 class="mb-4 text-sm font-medium text-gray-600">Payment Status</h3>
			<div class="space-y-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div class="h-3 w-3 rounded-full bg-green-500"></div>
						<span class="text-sm text-gray-700">Paid</span>
					</div>
					<span class="font-semibold text-gray-900">{data.summary.paymentStatusBreakdown.paid}</span
					>
				</div>
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<div class="h-3 w-3 rounded-full bg-red-500"></div>
						<span class="text-sm text-gray-700">Unpaid</span>
					</div>
					<span class="font-semibold text-gray-900"
						>{data.summary.paymentStatusBreakdown.unpaid}</span
					>
				</div>
			</div>
		</div>
	</div>

	<!-- Case Types Summary -->
	<div class="mb-8">
		<h2 class="mb-4 text-xl font-semibold text-gray-800">Case Type Distribution</h2>
		<div class="grid grid-cols-2 gap-4 md:grid-cols-4">
			{#each Object.entries(data.summary.caseTypeTotals) as [type, count]}
				<div class="rounded-lg bg-white p-4 shadow-md transition-shadow hover:shadow-lg">
					<h3 class="mb-1 text-sm font-medium text-gray-600">{type}</h3>
					<p class="text-2xl font-bold text-gray-900">
						{count} <span class="text-sm font-normal text-gray-500">units</span>
					</p>
				</div>
			{/each}
		</div>
	</div>

	<!-- Charts -->
	<div class="mt-8 grid grid-cols-1 gap-8">
		<div class="rounded-lg bg-white p-6 shadow-lg">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-semibold text-gray-800">
					{data.selectedPeriod === 'month' ? 'Monthly' : 'Daily'} Revenue
				</h2>
				<button
					type="button"
					onclick={toggleChartType}
					class="rounded-md bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-200"
				>
					Switch to {chartType === 'bar' ? 'Line' : 'Bar'} Chart
				</button>
			</div>
			{#if chartType === 'line'}
				<canvas bind:this={trendChartCanvas}></canvas>
			{:else}
				<canvas bind:this={dailyChartCanvas}></canvas>
			{/if}
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<h2 class="mb-4 text-xl font-semibold">Total Amount per Clinic</h2>
			<canvas bind:this={clinicChartCanvas}></canvas>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<h2 class="mb-4 text-xl font-semibold">Case Type Distribution</h2>
			<canvas bind:this={caseTypeChartCanvas}></canvas>
		</div>
	</div>
</div>
