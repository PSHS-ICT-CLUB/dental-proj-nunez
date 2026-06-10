<script lang="ts">
	import { goto } from '$app/navigation';
	import Chart from 'chart.js/auto';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let revenueChartCanvas: HTMLCanvasElement | undefined = $state();
	let clinicChartCanvas: HTMLCanvasElement | undefined = $state();
	let caseTypeChartCanvas: HTMLCanvasElement | undefined = $state();
	let paymentChartCanvas: HTMLCanvasElement | undefined = $state();

	let showClinicDropdown = $state(false);

	// ── Palette ──────────────────────────────────────────────
	const palette = [
		{ solid: '#6366f1', soft: 'rgba(99,102,241,0.15)',  mid: 'rgba(99,102,241,0.6)'  },
		{ solid: '#0ea5e9', soft: 'rgba(14,165,233,0.15)',  mid: 'rgba(14,165,233,0.6)'  },
		{ solid: '#10b981', soft: 'rgba(16,185,129,0.15)',  mid: 'rgba(16,185,129,0.6)'  },
		{ solid: '#f59e0b', soft: 'rgba(245,158,11,0.15)',  mid: 'rgba(245,158,11,0.6)'  },
		{ solid: '#ec4899', soft: 'rgba(236,72,153,0.15)',  mid: 'rgba(236,72,153,0.6)'  },
		{ solid: '#8b5cf6', soft: 'rgba(139,92,246,0.15)',  mid: 'rgba(139,92,246,0.6)'  },
	];

	// Shared tooltip style
	const tooltipBase = {
		backgroundColor: 'rgba(255,255,255,0.97)',
		titleColor: '#0f172a',
		bodyColor: '#475569',
		borderColor: '#e2e8f0',
		borderWidth: 1,
		padding: 14,
		boxPadding: 5,
		usePointStyle: true,
		cornerRadius: 10,
	};

	// ── Formatters ───────────────────────────────────────────
	const formatCurrency = (n: number) =>
		new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', maximumFractionDigits: 0 }).format(n);

	const formatCompact = (n: number) =>
		n >= 1_000_000 ? `₱${(n / 1_000_000).toFixed(1)}M`
		: n >= 1_000 ? `₱${(n / 1_000).toFixed(0)}K`
		: `₱${n.toFixed(0)}`;

	const formatPct = (n: number | null) =>
		n === null ? '—' : `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

	// ── Filters ──────────────────────────────────────────────
	function handlePeriodChange(e: Event) {
		updateFilters({ period: (e.target as HTMLSelectElement).value });
	}

	function handleDateChange(e: Event, field: 'startDate' | 'endDate') {
		const input = e.target as HTMLInputElement;
		const value =
			data.selectedPeriod === 'month' ? input.value + '-01'
			: data.selectedPeriod === 'year'  ? input.value + '-01-01'
			: input.value;
		updateFilters({ [field]: value });
	}

	function toggleClinic(id: string | number) {
		const idStr = id.toString();
		const next = data.selectedClinics.includes(idStr)
			? data.selectedClinics.filter(x => x !== idStr)
			: [...data.selectedClinics, idStr];
		updateFilters({ clinics: next.join(',') });
	}

	function toggleAllClinics() {
		if (data.selectedClinics.length > 0) updateFilters({ clinics: '' });
	}

	function getMonthStart(d = new Date()) {
		return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
	}
	function getMonthEnd(d = new Date()) {
		const last = new Date(d.getFullYear(), d.getMonth() + 1, 0);
		return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, '0')}-${String(last.getDate()).padStart(2, '0')}`;
	}

	const formatDateForInput = (s: string) => {
		const d = new Date(s);
		if (data.selectedPeriod === 'month') return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
		if (data.selectedPeriod === 'year')  return `${d.getFullYear()}`;
		return s || getMonthStart();
	};

	function updateFilters(updates: Record<string, string>) {
		const url = new URL(window.location.href);
		for (const [k, v] of Object.entries(updates)) {
			if (v) url.searchParams.set(k, v);
			else   url.searchParams.delete(k);
		}
		goto(url.toString(), { replaceState: true, invalidateAll: true });
	}

	// ── Derived KPI extras ───────────────────────────────────
	const topCaseType = $derived(() => {
		const entries = Object.entries(data.summary.caseTypeTotals);
		if (!entries.length) return null;
		return entries.reduce((best, cur) => cur[1] > best[1] ? cur : best);
	});

	// ── Charts ────────────────────────────────────────────────
	// Revenue Flow — stacked area
	$effect(() => {
		if (!revenueChartCanvas) return;

		Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
		Chart.defaults.color = '#64748b';

		const labels  = data.chartData.labels;
		const totals  = data.chartData.totals;
		const datasets = data.chartData.datasets.map((ds, i) => {
			const c = palette[i % palette.length];
			return {
				label: ds.label,
				data: ds.data,
				backgroundColor: c.soft,
				borderColor: c.solid,
				borderWidth: 2.5,
				tension: 0.4,
				fill: true,
				pointBackgroundColor: '#fff',
				pointBorderColor: c.solid,
				pointBorderWidth: 2,
				pointRadius: labels.length > 20 ? 2 : 4,
				pointHoverRadius: 6,
				pointHoverBackgroundColor: c.solid,
			};
		});

		const chart = new Chart(revenueChartCanvas, {
			type: 'line',
			data: { labels, datasets },
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: { mode: 'index', intersect: false },
				animation: { duration: 600, easing: 'easeInOutQuart' },
				plugins: {
					tooltip: {
						...tooltipBase,
						callbacks: {
							title: ([ctx]) => ctx.label,
							label: ctx => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`,
							afterBody: (items) => {
								const total = totals[items[0].dataIndex];
								return total != null ? [`\nTotal: ${formatCurrency(total)}`] : [];
							}
						}
					},
					legend: {
						position: 'top',
						align: 'end',
						labels: { usePointStyle: true, pointStyleWidth: 10, boxWidth: 8, padding: 18, font: { size: 12 } }
					}
				},
				scales: {
					y: {
						stacked: false,
						beginAtZero: true,
						grid: { color: '#f1f5f9' },
						border: { display: false },
						ticks: {
							callback: v => formatCompact(v as number),
							padding: 10,
							maxTicksLimit: 6
						}
					},
					x: {
						grid: { display: false },
						border: { display: false },
						ticks: {
							maxRotation: labels.length > 12 ? 45 : 0,
							minRotation: labels.length > 12 ? 45 : 0,
							padding: 8,
							maxTicksLimit: 16,
							font: { size: 11 }
						}
					}
				}
			}
		});
		return () => chart.destroy();
	});

	// Clinic Performance — stacked layered horizontal bar (Collected + Outstanding = Total)
	$effect(() => {
		if (!clinicChartCanvas) return;

		// Sort clinics by total revenue descending so best performer is at top
		const clinics    = [...data.clinicBreakdown].sort((a, b) => b.total - a.total);
		const labels     = clinics.map(c => c.name);
		const collected  = clinics.map(c => c.paid);
		const outstanding = clinics.map(c => Math.max(0, c.total - c.paid));
		const totals     = clinics.map(c => c.total);

		const chart = new Chart(clinicChartCanvas, {
			type: 'bar',
			data: {
				labels,
				datasets: [
					{
						label: 'Collected',
						data: collected,
						backgroundColor: 'rgba(16,185,129,0.75)',
						borderColor: '#059669',
						borderWidth: 0,
						borderRadius: { topLeft: 0, bottomLeft: 6, topRight: 0, bottomRight: 0 },
						borderSkipped: false,
						stack: 'clinic',
					},
					{
						label: 'Outstanding',
						data: outstanding,
						backgroundColor: 'rgba(251,113,133,0.65)',
						borderColor: '#e11d48',
						borderWidth: 0,
						borderRadius: { topLeft: 0, bottomLeft: 0, topRight: 6, bottomRight: 6 },
						borderSkipped: false,
						stack: 'clinic',
					}
				]
			},
			options: {
				indexAxis: 'y',
				responsive: true,
				maintainAspectRatio: false,
				animation: { duration: 700, easing: 'easeInOutQuart' },
				plugins: {
					tooltip: {
						...tooltipBase,
						mode: 'index',
						callbacks: {
							title: ([ctx]) => ctx.label,
							label: ctx => {
								const val  = ctx.parsed.x;
								const icon = ctx.dataset.label === 'Collected' ? '✓' : '!';
								return ` ${icon}  ${ctx.dataset.label}: ${formatCurrency(val)}`;
							},
							afterBody: (items) => {
								const idx   = items[0]?.dataIndex ?? 0;
								const total = totals[idx] ?? 0;
								const col   = collected[idx] ?? 0;
								const rate  = total > 0 ? ((col / total) * 100).toFixed(1) : '0';
								return [``, `   Total Billed: ${formatCurrency(total)}`, `   Collection Rate: ${rate}%`];
							}
						}
					},
					legend: {
						position: 'top',
						align: 'end',
						labels: {
							usePointStyle: true,
							pointStyle: 'rectRounded',
							pointStyleWidth: 14,
							boxWidth: 10,
							padding: 18,
							font: { size: 12 }
						}
					}
				},
				scales: {
					x: {
						stacked: true,
						beginAtZero: true,
						grid: { color: '#f1f5f9', lineWidth: 1 },
						border: { display: false },
						ticks: {
							callback: v => formatCompact(v as number),
							maxTicksLimit: 5,
							font: { size: 11 }
						}
					},
					y: {
						stacked: true,
						grid: { display: false },
						border: { display: false },
						ticks: { font: { size: 12 }, padding: 4 }
					}
				}
			}
		});
		return () => chart.destroy();
	});

	// Case Type Distribution — horizontal bar (sorted desc)
	$effect(() => {
		if (!caseTypeChartCanvas) return;

		const sorted = Object.entries(data.summary.caseTypeTotals)
			.sort(([, a], [, b]) => a - b); // ascending so top shows at top in horizontal bar
		const labels = sorted.map(([k]) => k);
		const values = sorted.map(([, v]) => v);

		const chart = new Chart(caseTypeChartCanvas, {
			type: 'bar',
			data: {
				labels,
				datasets: [{
					label: 'Units',
					data: values,
					backgroundColor: labels.map((_, i) => palette[i % palette.length].mid),
					borderColor: labels.map((_, i) => palette[i % palette.length].solid),
					borderWidth: 0,
					borderRadius: 5,
					borderSkipped: false,
				}]
			},
			options: {
				indexAxis: 'y',
				responsive: true,
				maintainAspectRatio: false,
				animation: { duration: 600 },
				plugins: {
					tooltip: {
						...tooltipBase,
						callbacks: {
							label: ctx => ` ${ctx.parsed.x} units`
						}
					},
					legend: { display: false }
				},
				scales: {
					x: {
						beginAtZero: true,
						grid: { color: '#f1f5f9' },
						border: { display: false },
						ticks: { stepSize: 1, font: { size: 11 } }
					},
					y: {
						grid: { display: false },
						border: { display: false },
						ticks: { font: { size: 12 } }
					}
				}
			}
		});
		return () => chart.destroy();
	});

	// Collection Doughnut
	$effect(() => {
		if (!paymentChartCanvas) return;

		const paid   = data.summary.paymentStatusData.paid;
		const unpaid = data.summary.paymentStatusData.unpaid;

		const chart = new Chart(paymentChartCanvas, {
			type: 'doughnut',
			data: {
				labels: ['Collected', 'Outstanding'],
				datasets: [{
					data: [paid, unpaid],
					backgroundColor: ['rgba(16,185,129,0.85)', 'rgba(248,113,113,0.85)'],
					borderColor: ['#10b981', '#f87171'],
					borderWidth: 2,
					hoverOffset: 6
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				cutout: '72%',
				animation: { duration: 600 },
				plugins: {
					tooltip: {
						...tooltipBase,
						callbacks: {
							label: ctx => ` ${ctx.label}: ${formatCurrency(ctx.parsed)}`
						}
					},
					legend: {
						position: 'bottom',
						labels: { usePointStyle: true, pointStyleWidth: 10, padding: 20, font: { size: 12 } }
					}
				}
			}
		});
		return () => chart.destroy();
	});
</script>

<div class="min-h-screen bg-slate-50/60 px-4 py-8">
	<div class="mx-auto max-w-7xl space-y-8">

		<!-- ── Header ───────────────────────────────────────────────────── -->
		<div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
			<div>
				<h1 class="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">Analytics Dashboard</h1>
				<p class="mt-1 text-sm text-slate-500">Revenue, cases, and clinic performance for the selected period.</p>
			</div>
			<span class="inline-flex items-center gap-2 self-start rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm sm:self-auto">
				<span class="relative flex h-2 w-2">
					<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
					<span class="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
				</span>
				{data.selectedPeriod === 'month' ? 'Monthly' : data.selectedPeriod === 'year' ? 'Yearly' : 'Daily'} View
			</span>
		</div>

		<!-- ── Filters ──────────────────────────────────────────────────── -->
		<div class="rounded-2xl border border-slate-200/70 bg-white px-6 py-5 shadow-sm">
			<div class="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:items-end">

				<div class="flex flex-col gap-1.5">
					<label for="period" class="text-[11px] font-semibold uppercase tracking-widest text-slate-400">View By</label>
					<select
						id="period"
						class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
						value={data.selectedPeriod}
						onchange={handlePeriodChange}
					>
						<option value="year">Yearly Overview</option>
						<option value="month">Monthly Breakdown</option>
						<option value="day">Daily Details</option>
					</select>
				</div>

				<div class="flex flex-col gap-1.5">
					<label for="startDate" class="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Start</label>
					<input
						id="startDate"
						type={data.selectedPeriod === 'month' ? 'month' : data.selectedPeriod === 'year' ? 'number' : 'date'}
						min={data.selectedPeriod === 'year' ? '2000' : undefined}
						max={data.selectedPeriod === 'year' ? '2100' : undefined}
						class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
						value={formatDateForInput(data.dateRange.start || getMonthStart())}
						onchange={(e) => handleDateChange(e, 'startDate')}
					/>
				</div>

				<div class="flex flex-col gap-1.5">
					<label for="endDate" class="text-[11px] font-semibold uppercase tracking-widest text-slate-400">End</label>
					<input
						id="endDate"
						type={data.selectedPeriod === 'month' ? 'month' : data.selectedPeriod === 'year' ? 'number' : 'date'}
						min={data.selectedPeriod === 'year' ? '2000' : undefined}
						max={data.selectedPeriod === 'year' ? '2100' : undefined}
						class="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
						value={formatDateForInput(data.dateRange.end || getMonthEnd())}
						onchange={(e) => handleDateChange(e, 'endDate')}
					/>
				</div>

				<div class="relative flex flex-col gap-1.5">
					<label class="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Clinic Filter</label>
					<button
						type="button"
						class="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
						onclick={() => showClinicDropdown = !showClinicDropdown}
					>
						<span class="truncate">
							{data.selectedClinics.length === 0 ? 'All Clinics' : `${data.selectedClinics.length} selected`}
						</span>
						<svg class="h-4 w-4 shrink-0 text-slate-400 transition-transform {showClinicDropdown ? 'rotate-180' : ''}" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</button>

					{#if showClinicDropdown}
						<div class="absolute top-full left-0 z-50 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
							<label class="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50">
								<input type="checkbox" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={data.selectedClinics.length === 0} onchange={toggleAllClinics} />
								<span class="font-medium text-slate-700">All Clinics</span>
							</label>
							<div class="border-t border-slate-100"></div>
							{#each data.clinics as clinic}
								<label class="flex cursor-pointer items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-slate-50">
									<input type="checkbox" class="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" checked={data.selectedClinics.includes(clinic.id.toString())} onchange={() => toggleClinic(clinic.id)} />
									<span class="text-slate-600">{clinic.name}</span>
								</label>
							{/each}
						</div>
					{/if}
				</div>
			</div>
		</div>

		<!-- ── KPI Cards ─────────────────────────────────────────────────── -->
		<div class="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">

			<!-- Total Cases -->
			<div class="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-5 shadow-sm transition hover:shadow-md">
				<div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-sky-50"></div>
				<div class="relative">
					<div class="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100">
						<svg class="h-4.5 w-4.5 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
						</svg>
					</div>
					<p class="text-[11px] font-semibold uppercase tracking-widest text-slate-400">Total Cases</p>
					<p class="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">{data.summary.totalCases.toLocaleString()}</p>
					{#if topCaseType() !== null}
						<p class="mt-1.5 truncate text-xs text-slate-500">Top: <span class="font-medium text-slate-700">{topCaseType()![0]}</span></p>
					{/if}
				</div>
			</div>

			<!-- Total Revenue -->
			<div class="relative overflow-hidden rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 to-white p-5 shadow-sm transition hover:shadow-md">
				<div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-indigo-100/50"></div>
				<div class="relative">
					<div class="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100">
						<svg class="h-4.5 w-4.5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<p class="text-[11px] font-semibold uppercase tracking-widest text-indigo-400">Total Revenue</p>
					<p class="mt-1 text-2xl font-bold text-indigo-700 sm:text-3xl">{formatCompact(data.summary.totalAmount)}</p>
					{#if data.summary.revenueTrendPct !== null}
						<p class="mt-1.5 text-xs font-medium {data.summary.revenueTrendPct >= 0 ? 'text-emerald-600' : 'text-red-500'}">
							{formatPct(data.summary.revenueTrendPct)} vs earlier period
						</p>
					{:else}
						<p class="mt-1.5 text-xs text-slate-400">No trend data</p>
					{/if}
				</div>
			</div>

			<!-- Collected -->
			<div class="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm transition hover:shadow-md">
				<div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-emerald-100/50"></div>
				<div class="relative">
					<div class="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100">
						<svg class="h-4.5 w-4.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<p class="text-[11px] font-semibold uppercase tracking-widest text-emerald-500">Collected</p>
					<p class="mt-1 text-2xl font-bold text-emerald-700 sm:text-3xl">{formatCompact(data.summary.paidAmount)}</p>
					<p class="mt-1.5 text-xs text-slate-500">
						<span class="font-semibold text-emerald-600">{data.summary.collectionRate.toFixed(1)}%</span> collection rate
					</p>
				</div>
			</div>

			<!-- Outstanding + Avg Order Value -->
			<div class="relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm transition hover:shadow-md">
				<div class="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-amber-100/50"></div>
				<div class="relative">
					<div class="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100">
						<svg class="h-4.5 w-4.5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<p class="text-[11px] font-semibold uppercase tracking-widest text-amber-500">Outstanding</p>
					<p class="mt-1 text-2xl font-bold text-amber-700 sm:text-3xl">{formatCompact(data.summary.unpaidAmount)}</p>
					<p class="mt-1.5 text-xs text-slate-500">
						Avg order: <span class="font-semibold text-slate-700">{formatCompact(data.summary.avgOrderValue)}</span>
					</p>
				</div>
			</div>
		</div>

		<!-- ── Revenue Flow Chart ──────────────────────────────────────────── -->
		<div class="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
			<div class="mb-5 flex flex-wrap items-start justify-between gap-3">
				<div>
					<h2 class="text-base font-bold text-slate-900 sm:text-lg">Revenue Flow</h2>
					<p class="text-sm text-slate-500">Revenue tracked over the selected period, per clinic</p>
				</div>
				{#if data.chartData.labels.length === 0}
					<span class="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">No data</span>
				{/if}
			</div>
			{#if data.chartData.labels.length > 0}
				<div class="h-[380px] w-full">
					<canvas bind:this={revenueChartCanvas}></canvas>
				</div>
			{:else}
				<div class="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">
					No revenue data for this period.
				</div>
			{/if}
		</div>

		<!-- ── Bottom Row: Clinics + Payment ─────────────────────────────── -->
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-3">

			<!-- Clinic Performance (spans 2 cols) -->
			<div class="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm lg:col-span-2">
				<div class="mb-5">
					<h2 class="text-base font-bold text-slate-900 sm:text-lg">Clinic Performance</h2>
					<p class="text-sm text-slate-500">Revenue collected vs billed per location</p>
				</div>

				{#if data.clinicBreakdown.length > 0}
					<div class="h-[260px] w-full">
						<canvas bind:this={clinicChartCanvas}></canvas>
					</div>

					<!-- Clinic Summary Table -->
					<div class="mt-5 overflow-x-auto rounded-xl border border-slate-100">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-slate-100 bg-slate-50 text-left">
									<th class="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Clinic</th>
									<th class="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Revenue</th>
									<th class="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Collected</th>
									<th class="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400">Rate</th>
									<th class="hidden px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-wider text-slate-400 sm:table-cell">Cases</th>
								</tr>
							</thead>
							<tbody>
								{#each data.clinicBreakdown as clinic, i}
									<tr class="border-b border-slate-50 transition hover:bg-slate-50 last:border-0">
										<td class="px-4 py-3 font-medium text-slate-800">
											<div class="flex items-center gap-2">
												<span class="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style="background:{palette[i % palette.length].solid}"></span>
												{clinic.name}
											</div>
										</td>
										<td class="px-4 py-3 text-right font-semibold text-slate-700">{formatCompact(clinic.total)}</td>
										<td class="px-4 py-3 text-right text-emerald-600">{formatCompact(clinic.paid)}</td>
										<td class="px-4 py-3 text-right">
											<span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold {clinic.collectionRate >= 80 ? 'bg-emerald-50 text-emerald-700' : clinic.collectionRate >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}">
												{clinic.collectionRate.toFixed(0)}%
											</span>
										</td>
										<td class="hidden px-4 py-3 text-right text-slate-500 sm:table-cell">{clinic.cases}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<div class="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">
						No clinic data available.
					</div>
				{/if}
			</div>

			<!-- Collection Status Doughnut -->
			<div class="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
				<div class="mb-5">
					<h2 class="text-base font-bold text-slate-900 sm:text-lg">Collection Status</h2>
					<p class="text-sm text-slate-500">Paid vs outstanding balance</p>
				</div>
				<div class="relative h-[200px] w-full">
					<canvas bind:this={paymentChartCanvas}></canvas>
					<div class="pointer-events-none absolute inset-0 flex flex-col items-center justify-center" style="padding-bottom: 30px">
						<p class="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Total</p>
						<p class="text-xl font-bold text-slate-900">{formatCompact(data.summary.totalAmount)}</p>
					</div>
				</div>

				<!-- Mini stats below donut -->
				<div class="mt-4 grid grid-cols-2 gap-3">
					<div class="rounded-xl bg-emerald-50 p-3 text-center">
						<p class="text-[10px] font-semibold uppercase tracking-wider text-emerald-500">Collected</p>
						<p class="mt-0.5 text-sm font-bold text-emerald-700">{formatCompact(data.summary.paidAmount)}</p>
						<p class="text-xs text-emerald-600">{data.summary.collectionRate.toFixed(1)}%</p>
					</div>
					<div class="rounded-xl bg-red-50 p-3 text-center">
						<p class="text-[10px] font-semibold uppercase tracking-wider text-red-400">Outstanding</p>
						<p class="mt-0.5 text-sm font-bold text-red-600">{formatCompact(data.summary.unpaidAmount)}</p>
						<p class="text-xs text-red-500">{(100 - data.summary.collectionRate).toFixed(1)}%</p>
					</div>
				</div>
			</div>
		</div>

		<!-- ── Case Type Distribution ──────────────────────────────────────── -->
		<div class="rounded-2xl border border-slate-200/70 bg-white p-6 shadow-sm">
			<div class="mb-5">
				<h2 class="text-base font-bold text-slate-900 sm:text-lg">Case Volume by Type</h2>
				<p class="text-sm text-slate-500">Units produced per dental case category</p>
			</div>

			{#if Object.keys(data.summary.caseTypeTotals).length > 0}
				<div class="grid grid-cols-1 gap-8 lg:grid-cols-5">
					<!-- Chart takes 3 of 5 cols -->
					<div class="lg:col-span-3">
						<div class="h-[320px] w-full">
							<canvas bind:this={caseTypeChartCanvas}></canvas>
						</div>
					</div>

					<!-- Ranked list takes 2 of 5 cols -->
					<div class="flex flex-col gap-2.5 lg:col-span-2 lg:justify-center">
						{#each Object.entries(data.summary.caseTypeTotals).sort(([,a],[,b]) => b - a) as [type, count], i}
							{@const total = Object.values(data.summary.caseTypeTotals).reduce((s, v) => s + v, 0)}
							{@const pct = total > 0 ? (count / total) * 100 : 0}
							{@const c = palette[i % palette.length]}
							<div class="group flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 transition hover:bg-slate-100/70">
								<div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold" style="background:{c.soft}; color:{c.solid}">
									{i + 1}
								</div>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium text-slate-700">{type}</p>
									<div class="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
										<div class="h-full rounded-full transition-all duration-500" style="width:{pct}%; background:{c.solid}"></div>
									</div>
								</div>
								<div class="text-right shrink-0">
									<p class="text-sm font-bold text-slate-900">{count}</p>
									<p class="text-[10px] text-slate-400">{pct.toFixed(0)}%</p>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{:else}
				<div class="flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm text-slate-400">
					No case type data available.
				</div>
			{/if}
		</div>

	</div>
</div>
