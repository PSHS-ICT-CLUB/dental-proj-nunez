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
	let dailyChart: Chart<'line', number[], string>;
	let clinicChart: Chart<'bar', number[], string>;
	let caseTypeChart: Chart<'bar', number[], string>;
	let paymentChart: Chart<'doughnut', number[], string>;

    const colors = [
        { border: '#6366f1', bg: 'rgba(99, 102, 241, 0.2)' }, // Indigo
        { border: '#0ea5e9', bg: 'rgba(14, 165, 233, 0.2)' }, // Sky
        { border: '#f59e0b', bg: 'rgba(245, 158, 11, 0.2)' }, // Amber
        { border: '#10b981', bg: 'rgba(16, 185, 129, 0.2)' }, // Emerald
        { border: '#ec4899', bg: 'rgba(236, 72, 153, 0.2)' }, // Pink
        { border: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.2)' }, // Violet
    ];

	let showClinicDropdown = $state(false);

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
				? input.value + '-01'
				: data.selectedPeriod === 'year'
				? input.value + '-01-01'
				: input.value;
		updateFilters({ [field]: value });
	}

	// Handle clinic filtering
	function toggleClinic(clinicId: string | number) {
		let newClinics = [...data.selectedClinics];
		const idStr = clinicId.toString();
		if (newClinics.includes(idStr)) {
			newClinics = newClinics.filter(id => id !== idStr);
		} else {
			newClinics.push(idStr);
		}
		updateFilters({ clinics: newClinics.join(',') });
	}

	function toggleAllClinics() {
		if (data.selectedClinics.length > 0) {
			updateFilters({ clinics: '' }); // Reset to all
		}
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
		return dateString || getMonthStart(new Date());
	};

	$effect(() => {
		if (dailyChart) {
			dailyChart.data.labels = data.chartData.labels;
			dailyChart.data.datasets = data.chartData.datasets.map((dataset, i) => {
                const color = colors[i % colors.length];
                return {
                    label: dataset.label,
                    data: dataset.data,
                    backgroundColor: color.bg,
                    borderColor: color.border,
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: color.border,
                    pointRadius: 4,
                    pointHoverRadius: 6
                };
            });
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
        Chart.defaults.font.family = "'Inter', system-ui, -apple-system, sans-serif";
        Chart.defaults.color = '#64748b';

		dailyChart = new Chart(dailyChartCanvas, {
			type: 'line',
			data: {
				labels: data.chartData.labels,
				datasets: data.chartData.datasets.map((dataset, i) => {
                    const color = colors[i % colors.length];
                    return {
                        label: dataset.label,
                        data: dataset.data,
                        backgroundColor: color.bg,
                        borderColor: color.border,
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: color.border,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    };
                })
			},
			options: {
				responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
				plugins: {
					tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#0f172a',
                        bodyColor: '#334155',
                        borderColor: '#e2e8f0',
                        borderWidth: 1,
                        padding: 12,
                        boxPadding: 4,
                        usePointStyle: true,
						callbacks: {
							label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`
						}
					},
					title: {
						display: false
					},
                    legend: {
                        position: 'top',
                        align: 'end',
                        labels: {
                            usePointStyle: true,
                            boxWidth: 8,
                            padding: 20
                        }
                    }
				},
				scales: {
					y: {
						beginAtZero: true,
                        grid: {
                            color: '#f1f5f9',
                        },
                        border: { display: false },
						ticks: {
							callback: (value) => formatCurrency(value as number),
                            padding: 8
						}
					},
					x: {
						type: 'category',
                        grid: {
                            display: false
                        },
                        border: { display: false },
						ticks: {
							maxRotation: 45,
							minRotation: 45,
                            padding: 8
						}
					}
				}
			}
		});

		clinicChart = new Chart(clinicChartCanvas, {
			type: 'bar',
			data: {
				labels: Object.keys(data.clinicChartData),
				datasets: [
					{
						label: 'Total Revenue',
						data: Object.values(data.clinicChartData) as number[],
						backgroundColor: colors.map(c => c.bg),
						borderColor: colors.map(c => c.border),
                        borderWidth: 1,
                        borderRadius: 6,
                        barPercentage: 0.6
					}
				]
			},
			options: {
				responsive: true,
                maintainAspectRatio: false,
				plugins: {
					tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#0f172a',
                        bodyColor: '#334155',
                        borderColor: '#e2e8f0',
                        borderWidth: 1,
                        padding: 12,
						callbacks: {
							label: (context) => formatCurrency(context.parsed.y)
						}
					},
                    legend: {
                        display: false
                    }
				},
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f1f5f9' },
                        border: { display: false },
                        ticks: {
                            callback: (value) => formatCurrency(value as number)
                        }
                    },
                    x: {
                        grid: { display: false },
                        border: { display: false }
                    }
                }
			}
		});

		caseTypeChart = new Chart(caseTypeChartCanvas, {
			type: 'bar',
			data: {
				labels: Object.keys(data.summary.caseTypeTotals),
				datasets: [
					{
						label: 'Units',
						data: Object.values(data.summary.caseTypeTotals) as number[],
						backgroundColor: colors.map(c => c.bg),
						borderColor: colors.map(c => c.border),
						borderWidth: 1,
                        borderRadius: 6,
                        barPercentage: 0.7
					}
				]
			},
			options: {
				responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // Makes it a horizontal bar chart for better readability
				plugins: {
					title: { display: false },
					tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#0f172a',
                        bodyColor: '#334155',
                        borderColor: '#e2e8f0',
                        borderWidth: 1,
                        padding: 12,
						callbacks: {
							label: (context) => `${context.parsed.x} units`
						}
					},
                    legend: { display: false }
				},
				scales: {
					y: {
                        grid: { display: false },
                        border: { display: false }
					},
                    x: {
                        beginAtZero: true,
                        grid: { color: '#f1f5f9' },
                        border: { display: false }
                    }
				}
			}
		});

		paymentChart = new Chart(paymentChartCanvas, {
			type: 'doughnut',
			data: {
				labels: ['Paid', 'Unpaid'],
				datasets: [
					{
						data: [data.summary.paymentStatusData.paid, data.summary.paymentStatusData.unpaid],
						backgroundColor: [
							'rgba(16, 185, 129, 0.8)', // Emerald
							'rgba(244, 63, 94, 0.8)'   // Rose
						],
						borderColor: [
							'#ffffff',
							'#ffffff'
						],
						borderWidth: 2,
                        hoverOffset: 4
					}
				]
			},
			options: {
				responsive: true,
                maintainAspectRatio: false,
                cutout: '70%',
				plugins: {
					title: { display: false },
					tooltip: {
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        titleColor: '#0f172a',
                        bodyColor: '#334155',
                        borderColor: '#e2e8f0',
                        borderWidth: 1,
                        padding: 12,
						callbacks: {
							label: (context) => ` ${formatCurrency(context.parsed)}`
						}
					},
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20
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

	function updateFilters(updates: Record<string, string>) {
		const url = new URL(window.location.href);
		Object.entries(updates).forEach(([key, value]) => {
			url.searchParams.set(key, value);
		});
		goto(url.toString(), { replaceState: true });
	}
</script>

<div class="mx-auto max-w-7xl px-4 py-8 bg-[#fafafa] min-h-screen">
	<!-- Header -->
	<div class="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-3xl font-bold text-slate-900 tracking-tight">Analytics Dashboard</h1>
			<p class="mt-1 text-sm text-slate-500">
				Comprehensive view of revenue, cases, and performance.
			</p>
		</div>
		<div class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm ring-1 ring-slate-200">
			<span class="relative flex h-2 w-2">
				<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
				<span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
			</span>
			{data.selectedPeriod === 'month' ? 'Monthly' : data.selectedPeriod === 'year' ? 'Yearly' : 'Daily'} Data Active
		</div>
	</div>

	<!-- Controls Section -->
	<div class="mb-8 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
		<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 items-end">
			<div class="flex flex-col gap-1.5">
				<label for="period" class="text-xs font-semibold tracking-wider text-slate-500 uppercase">View By</label>
				<select
					id="period"
					class="w-full rounded-xl border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
					value={data.selectedPeriod}
					onchange={handlePeriodChange}
				>
					<option value="year">Yearly Overview</option>
					<option value="month">Monthly Breakdown</option>
					<option value="day">Daily Details</option>
				</select>
			</div>

			<div class="flex flex-col gap-1.5">
				<label for="startDate" class="text-xs font-semibold tracking-wider text-slate-500 uppercase">Start Date</label>
				<input
					type={data.selectedPeriod === 'month' ? 'month' : data.selectedPeriod === 'year' ? 'number' : 'date'}
					id="startDate"
					min={data.selectedPeriod === 'year' ? '2000' : undefined}
					max={data.selectedPeriod === 'year' ? '2100' : undefined}
					class="w-full rounded-xl border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
					value={formatDateForInput(data.dateRange.start || getMonthStart(new Date()))}
					onchange={(e) => handleDateChange(e, 'startDate')}
				/>
			</div>
			
			<div class="flex flex-col gap-1.5">
				<label for="endDate" class="text-xs font-semibold tracking-wider text-slate-500 uppercase">End Date</label>
				<input
					type={data.selectedPeriod === 'month' ? 'month' : data.selectedPeriod === 'year' ? 'number' : 'date'}
					id="endDate"
					min={data.selectedPeriod === 'year' ? '2000' : undefined}
					max={data.selectedPeriod === 'year' ? '2100' : undefined}
					class="w-full rounded-xl border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
					value={formatDateForInput(data.dateRange.end || getMonthEnd(new Date()))}
					onchange={(e) => handleDateChange(e, 'endDate')}
				/>
			</div>

			<div class="flex flex-col gap-1.5 relative">
				<label class="text-xs font-semibold tracking-wider text-slate-500 uppercase">Filter Clinic</label>
				<button 
					type="button"
					class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 text-left flex justify-between items-center"
					onclick={() => showClinicDropdown = !showClinicDropdown}
				>
					<span class="truncate">
						{data.selectedClinics.length === 0 ? 'All Clinics' : `${data.selectedClinics.length} Selected`}
					</span>
					<svg class="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
					</svg>
				</button>

				{#if showClinicDropdown}
					<div class="absolute top-full left-0 z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
						<label class="flex cursor-pointer items-center px-4 py-2 hover:bg-slate-50">
							<input 
								type="checkbox" 
								class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
								checked={data.selectedClinics.length === 0}
								onchange={toggleAllClinics}
							/>
							<span class="ml-2 text-sm text-slate-700 font-medium">All Clinics (Combined)</span>
						</label>
						{#each data.clinics as clinic}
							<label class="flex cursor-pointer items-center px-4 py-2 hover:bg-slate-50">
								<input 
									type="checkbox" 
									class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
									checked={data.selectedClinics.includes(clinic.id.toString())}
									onchange={() => toggleClinic(clinic.id)}
								/>
								<span class="ml-2 text-sm text-slate-700">{clinic.name}</span>
							</label>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Key Metrics -->
	<div class="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
		<div class="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
			<div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-blue-50 opacity-50"></div>
			<div class="relative z-10">
				<p class="text-xs font-semibold tracking-wider text-slate-500 uppercase">Total Cases</p>
				<p class="mt-2 text-3xl font-bold text-slate-900">{data.summary.totalCases}</p>
			</div>
		</div>

		<div class="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
			<div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-50 opacity-50"></div>
			<div class="relative z-10">
				<p class="text-xs font-semibold tracking-wider text-slate-500 uppercase">Total Revenue</p>
				<p class="mt-2 text-3xl font-bold text-indigo-600">{formatCurrency(data.summary.totalAmount)}</p>
			</div>
		</div>

		<div class="relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
			<div class="absolute left-0 top-0 h-full w-1.5 bg-emerald-500"></div>
			<div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-50 opacity-50"></div>
			<div class="relative z-10 pl-2">
				<p class="text-xs font-semibold tracking-wider text-slate-500 uppercase">Collected (Paid)</p>
				<p class="mt-2 text-3xl font-bold text-emerald-600">{formatCurrency(data.summary.paidAmount)}</p>
			</div>
		</div>
	</div>

	<!-- Main Charts Grid -->
	<div class="grid grid-cols-1 gap-8 lg:grid-cols-3">
		
		<!-- Revenue Flow (Main Chart) -->
		<div class="col-span-1 lg:col-span-3 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
			<div class="mb-6 flex items-center justify-between">
				<div>
					<h2 class="text-lg font-bold text-slate-900">Revenue Flow</h2>
					<p class="text-sm text-slate-500">Earnings tracked over the selected period per clinic</p>
				</div>
			</div>
			<div class="h-[400px] w-full">
				<canvas bind:this={dailyChartCanvas}></canvas>
			</div>
		</div>

		<!-- Top Clinics -->
		<div class="col-span-1 lg:col-span-2 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
			<div class="mb-6">
				<h2 class="text-lg font-bold text-slate-900">Clinic Performance</h2>
				<p class="text-sm text-slate-500">Total revenue generated per location</p>
			</div>
			<div class="h-[300px] w-full">
				<canvas bind:this={clinicChartCanvas}></canvas>
			</div>
		</div>

		<!-- Payment Ratio -->
		<div class="col-span-1 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
			<div class="mb-6">
				<h2 class="text-lg font-bold text-slate-900">Collection Status</h2>
				<p class="text-sm text-slate-500">Paid vs Unpaid ratio</p>
			</div>
			<div class="h-[250px] w-full relative">
				<canvas bind:this={paymentChartCanvas}></canvas>
				<div class="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-20px]">
					<div class="text-sm text-slate-500 font-medium">Total Volume</div>
					<div class="text-lg font-bold text-slate-900">{formatCurrency(data.summary.totalAmount)}</div>
				</div>
			</div>
		</div>

		<!-- Case Types Distribution -->
		<div class="col-span-1 lg:col-span-3 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-sm">
			<div class="mb-6">
				<h2 class="text-lg font-bold text-slate-900">Case Volume Distribution</h2>
				<p class="text-sm text-slate-500">Breakdown of performed case types</p>
			</div>
			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				<div class="col-span-1 lg:col-span-2 h-[350px] w-full">
					<canvas bind:this={caseTypeChartCanvas}></canvas>
				</div>
				<div class="col-span-1 flex flex-col justify-center gap-3">
					{#each Object.entries(data.summary.caseTypeTotals).sort(([,a], [,b]) => b - a).slice(0, 5) as [type, count], i}
						<div class="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors">
							<div class="flex items-center gap-3">
								<div class="h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs" style="background-color: {colors[i % colors.length].bg}; color: {colors[i % colors.length].border}">
									#{i + 1}
								</div>
								<span class="font-medium text-sm text-slate-700">{type}</span>
							</div>
							<span class="font-bold text-slate-900">{count} <span class="text-xs font-normal text-slate-500">units</span></span>
						</div>
					{/each}
				</div>
			</div>
		</div>

	</div>
</div>
