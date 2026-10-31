<script lang="ts">
	import type { PageProps } from './$types';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { applyAction, enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { toLocalDateString } from '$lib/utils/date';

	let { data, form }: PageProps = $props();

	type Line = { employeeName: string; amount: string; notes: string };
	type GenLine = Line & { include: boolean };
	type PayrollSet = (typeof data.sets)[number];
	type Batch = (typeof data.batches)[number];

	const canDelete = $derived(data.user?.role === 'admin' || data.user?.role === 'dentist');

	// Period filter
	let selectedMonth = $state(data.currentMonth);
	let selectedYear = $state(data.currentYear);
	const monthLabel = $derived(
		new Date(data.currentYear, data.currentMonth - 1).toLocaleString('default', {
			month: 'long',
			year: 'numeric'
		})
	);

	let isSubmitting = $state(false);

	// ---------- Formatting ----------
	function fmt(v: unknown) {
		const n = Number(v ?? 0) || 0;
		return n.toLocaleString('en-PH', {
			style: 'currency',
			currency: 'PHP',
			minimumFractionDigits: 2
		});
	}

	function fmtDate(d: string | null) {
		if (!d) return '—';
		const [y, m, day] = d.split('-').map(Number);
		return new Date(y, m - 1, day).toLocaleDateString('en-PH', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function sumLines(lines: Line[]) {
		return lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
	}

	const blankLine = (): Line => ({ employeeName: '', amount: '', notes: '' });

	// ---------- Set editor ----------
	let editorOpen = $state(false);
	let editorId = $state<number | null>(null);
	let editorName = $state('');
	let editorDescription = $state('');
	let editorItems = $state<Line[]>([blankLine()]);
	const editorTotal = $derived(sumLines(editorItems));

	function openNewSet() {
		editorId = null;
		editorName = '';
		editorDescription = '';
		editorItems = [blankLine()];
		editorOpen = true;
	}

	function openEditSet(set: PayrollSet) {
		editorId = set.id;
		editorName = set.name;
		editorDescription = set.description;
		editorItems = set.items.map((i) => ({
			employeeName: i.employeeName,
			amount: String(i.amount),
			notes: i.notes
		}));
		editorOpen = true;
	}

	function saveGeneratorAsSet() {
		editorId = null;
		editorName = '';
		editorDescription = '';
		editorItems = genLines
			.filter((l) => l.include && l.employeeName.trim())
			.map(({ employeeName, amount, notes }) => ({ employeeName, amount, notes }));
		if (editorItems.length === 0) editorItems = [blankLine()];
		editorOpen = true;
	}

	function addAllTechnicians() {
		const existing = new Set(editorItems.map((i) => i.employeeName.trim().toLowerCase()));
		const toAdd = data.technicians
			.filter((t) => !existing.has(t.name.trim().toLowerCase()))
			.map((t) => ({ employeeName: t.name, amount: '', notes: '' }));
		editorItems = [...editorItems.filter((i) => i.employeeName.trim() || i.amount), ...toAdd];
		if (editorItems.length === 0) editorItems = [blankLine()];
	}

	function moveItem(index: number, delta: number) {
		const target = index + delta;
		if (target < 0 || target >= editorItems.length) return;
		const next = [...editorItems];
		[next[index], next[target]] = [next[target], next[index]];
		editorItems = next;
	}

	// ---------- Payroll generator ----------
	let genSetId = $state('');
	let genPayDate = $state(toLocalDateString());
	let genPeriodStart = $state('');
	let genPeriodEnd = $state('');
	let genNotes = $state('');
	let genLines = $state<GenLine[]>([]);
	let confirmDuplicate = $state(false);

	const includedLines = $derived(genLines.filter((l) => l.include));
	const genTotal = $derived(sumLines(includedLines));

	function loadSet(set: PayrollSet | undefined) {
		genSetId = set ? String(set.id) : '';
		genLines = set
			? set.items.map((i) => ({
					employeeName: i.employeeName,
					amount: String(i.amount),
					notes: i.notes,
					// Zero-amount lines (variable pay) start unchecked until an amount is entered
					include: i.amount > 0
				}))
			: [{ ...blankLine(), include: true }];
		confirmDuplicate = false;
	}

	function useSet(set: PayrollSet) {
		loadSet(set);
		document
			.getElementById('generate-panel')
			?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	function reuseBatch(batch: Batch) {
		const set = batch.setId ? data.sets.find((s) => s.id === batch.setId) : undefined;
		genSetId = set ? String(set.id) : '';
		genLines = batch.entries.map((e) => ({
			employeeName: e.employeeName,
			amount: String(e.amount),
			notes: e.notes,
			include: true
		}));
		genNotes = batch.notes;
		confirmDuplicate = false;
		document
			.getElementById('generate-panel')
			?.scrollIntoView({ behavior: 'smooth', block: 'start' });
	}

	function onSetSelect(value: string) {
		loadSet(data.sets.find((s) => String(s.id) === value));
	}

	function setAllIncluded(include: boolean) {
		genLines = genLines.map((l) => ({ ...l, include }));
	}

	/** Quick period presets relative to the pay date. */
	function applyPeriod(preset: 'week' | 'first-half' | 'second-half' | 'month') {
		const [y, m, d] = (genPayDate || toLocalDateString()).split('-').map(Number);
		const base = new Date(y, m - 1, d);
		let start: Date;
		let end: Date;
		switch (preset) {
			case 'week':
				start = new Date(y, m - 1, d - base.getDay());
				end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6);
				break;
			case 'first-half':
				start = new Date(y, m - 1, 1);
				end = new Date(y, m - 1, 15);
				break;
			case 'second-half':
				start = new Date(y, m - 1, 16);
				end = new Date(y, m, 0);
				break;
			case 'month':
				start = new Date(y, m - 1, 1);
				end = new Date(y, m, 0);
				break;
		}
		genPeriodStart = toLocalDateString(start);
		genPeriodEnd = toLocalDateString(end);
	}

	// Reset the duplicate confirmation whenever the target changes
	$effect(() => {
		void genSetId;
		void genPayDate;
		confirmDuplicate = false;
	});

	// ---------- Batch history ----------
	let expanded = $state<Set<number>>(new Set());
	function toggleBatch(id: number) {
		const next = new Set(expanded);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		expanded = next;
	}

	// ---------- Form handling ----------
	const submitting: SubmitFunction = () => {
		isSubmitting = true;
		return async ({ update }) => {
			await update({ reset: false });
			isSubmitting = false;
		};
	};

	const confirmSubmit =
		(message: string): SubmitFunction =>
		({ cancel }) => {
			if (!confirm(message)) {
				cancel();
				return;
			}
			isSubmitting = true;
			return async ({ update }) => {
				await update({ reset: false });
				isSubmitting = false;
			};
		};

	const submitSet: SubmitFunction = () => {
		isSubmitting = true;
		return async ({ result, update }) => {
			await update({ reset: false });
			isSubmitting = false;
			if (result.type === 'success') editorOpen = false;
		};
	};

	const submitGenerate: SubmitFunction = () => {
		isSubmitting = true;
		return async ({ result, update }) => {
			isSubmitting = false;
			if (result.type === 'failure' && result.data?.duplicate) {
				confirmDuplicate = true;
			}
			if (result.type === 'success') {
				genLines = [];
				genSetId = '';
				genNotes = '';
				genPeriodStart = '';
				genPeriodEnd = '';
				const { postedMonth, postedYear } = (result.data ?? {}) as {
					postedMonth?: number;
					postedYear?: number;
				};
				if (
					postedMonth &&
					postedYear &&
					(postedMonth !== data.currentMonth || postedYear !== data.currentYear)
				) {
					// Jump to the month the batch was posted in so it shows in the history
					selectedMonth = postedMonth;
					selectedYear = postedYear;
					await goto(`?month=${postedMonth}&year=${postedYear}`, { invalidateAll: true });
					await applyAction(result);
					return;
				}
			}
			await update({ reset: false });
		};
	};

	const inputClass =
		'w-full rounded border border-border p-2 text-sm shadow-sm focus:border-primary focus:ring-1 focus:ring-primary';
	const labelClass = 'mb-1 block text-[10px] font-medium tracking-wider text-text-muted uppercase';
	const thClass =
		'px-4 py-3 text-left text-xs font-medium tracking-wider text-text-muted uppercase';
</script>

<datalist id="payroll-employees">
	{#each data.technicians as tech (tech.id)}
		<option value={tech.name}>{tech.role ?? ''}</option>
	{/each}
</datalist>

<div class="mx-auto max-w-6xl px-4 py-8">
	<div class="mb-6 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
		<div>
			<h1 class="text-2xl font-bold">Payroll</h1>
			<p class="text-text-muted text-sm">
				Save recurring payout sets, then post a whole payroll run in one step.
			</p>
		</div>
		<form
			method="POST"
			action="?/changeMonth"
			class="flex items-end gap-2"
			use:enhance={submitting}
		>
			<div>
				<label for="month" class={labelClass}>Month</label>
				<select id="month" name="month" bind:value={selectedMonth} class={inputClass}>
					{#each Array.from({ length: 12 }, (_, i) => i + 1) as month (month)}
						<option value={month}>
							{new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
						</option>
					{/each}
				</select>
			</div>
			<div>
				<label for="year" class={labelClass}>Year</label>
				<select id="year" name="year" bind:value={selectedYear} class={inputClass}>
					{#each Array.from({ length: 11 }, (_, i) => new Date().getFullYear() - 5 + i) as year (year)}
						<option value={year}>{year}</option>
					{/each}
				</select>
			</div>
			<button
				type="submit"
				class="bg-primary rounded px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50"
				disabled={isSubmitting}
			>
				View
			</button>
		</form>
	</div>

	{#if form?.error}
		<div
			class="bg-error-light mb-4 rounded-md border border-red-200 p-3 text-sm text-red-700"
			role="alert"
		>
			{form.error}
		</div>
	{:else if form && 'message' in form && form.message}
		<div
			class="mb-4 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700"
			role="status"
		>
			{form.message}
		</div>
	{/if}

	<!-- Summary -->
	<div class="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
		<div class="border-border rounded-lg border bg-white p-5 shadow-sm">
			<p class="text-text-muted mb-1 text-[10px] font-semibold tracking-wider uppercase">
				Payroll — {monthLabel}
			</p>
			<p class="text-text-primary text-2xl font-bold">{fmt(data.monthTotal)}</p>
		</div>
		<div class="border-border rounded-lg border bg-white p-5 shadow-sm">
			<p class="text-text-muted mb-1 text-[10px] font-semibold tracking-wider uppercase">
				Batches Posted
			</p>
			<p class="text-text-primary text-2xl font-bold">{data.batches.length}</p>
		</div>
		<div class="border-border rounded-lg border bg-white p-5 shadow-sm">
			<p class="text-text-muted mb-1 text-[10px] font-semibold tracking-wider uppercase">
				Saved Sets
			</p>
			<p class="text-text-primary text-2xl font-bold">{data.sets.length}</p>
		</div>
	</div>

	<div class="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
		<!-- Saved sets -->
		<section
			class="border-border bg-surface self-start rounded-lg border p-5 shadow-sm lg:col-span-1"
		>
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-text-muted text-sm font-semibold tracking-wider uppercase">Saved Sets</h2>
				<button
					type="button"
					class="border-primary text-primary hover:bg-primary rounded border px-3 py-1 text-xs font-medium hover:text-white"
					onclick={openNewSet}
				>
					+ New Set
				</button>
			</div>

			{#if data.sets.length === 0}
				<p class="text-text-muted py-6 text-center text-sm">
					No saved sets yet. Create one with your regular employees and their usual payouts.
				</p>
			{:else}
				<ul class="space-y-3">
					{#each data.sets as set (set.id)}
						<li
							class="rounded border bg-white p-3 {String(set.id) === genSetId
								? 'border-primary ring-primary ring-1'
								: 'border-border'}"
						>
							<div class="flex items-start justify-between gap-2">
								<div class="min-w-0">
									<p class="text-text-primary truncate text-sm font-semibold">{set.name}</p>
									<p class="text-text-muted text-xs">
										{set.items.length} employee{set.items.length === 1 ? '' : 's'} · {fmt(
											set.total
										)}
									</p>
									{#if set.description}
										<p class="text-text-secondary mt-1 truncate text-xs">{set.description}</p>
									{/if}
								</div>
							</div>
							<div class="mt-3 flex flex-wrap items-center gap-2">
								<button
									type="button"
									class="bg-primary rounded px-3 py-1 text-xs font-medium text-white"
									onclick={() => useSet(set)}
								>
									Use for payroll
								</button>
								<button
									type="button"
									class="border-border text-text-secondary hover:bg-surface rounded border px-3 py-1 text-xs font-medium"
									onclick={() => openEditSet(set)}
								>
									Edit
								</button>
								{#if canDelete}
									<form
										method="POST"
										action="?/deleteSet"
										class="ml-auto"
										use:enhance={confirmSubmit(
											`Delete the set "${set.name}"? Posted payroll history is kept.`
										)}
									>
										<input type="hidden" name="set_id" value={set.id} />
										<button
											type="submit"
											class="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
											disabled={isSubmitting}
										>
											Delete
										</button>
									</form>
								{/if}
							</div>
						</li>
					{/each}
				</ul>
			{/if}
		</section>

		<!-- Editor / generator -->
		<div class="lg:col-span-2">
			{#if editorOpen}
				<section class="border-border rounded-lg border bg-white p-5 shadow-sm">
					<h2 class="text-text-muted mb-4 text-sm font-semibold tracking-wider uppercase">
						{editorId ? 'Edit Payout Set' : 'New Payout Set'}
					</h2>
					<form method="POST" action="?/saveSet" use:enhance={submitSet} class="space-y-4">
						{#if editorId}<input type="hidden" name="set_id" value={editorId} />{/if}
						<input type="hidden" name="items" value={JSON.stringify(editorItems)} />
						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<div>
								<label for="set-name" class={labelClass}>Set Name</label>
								<input
									id="set-name"
									name="name"
									required
									maxlength="255"
									placeholder="e.g. Weekly Lab Staff"
									bind:value={editorName}
									class={inputClass}
								/>
							</div>
							<div>
								<label for="set-description" class={labelClass}>Description (optional)</label>
								<input
									id="set-description"
									name="description"
									placeholder="e.g. Paid every Saturday"
									bind:value={editorDescription}
									class={inputClass}
								/>
							</div>
						</div>

						<div class="border-border overflow-x-auto rounded border">
							<table class="min-w-full">
								<thead class="bg-surface">
									<tr>
										<th class={thClass}>Employee</th>
										<th class="{thClass} w-40 text-right">Amount (PHP)</th>
										<th class={thClass}>Notes</th>
										<th class="{thClass} w-28"><span class="sr-only">Actions</span></th>
									</tr>
								</thead>
								<tbody class="divide-border divide-y bg-white">
									{#each editorItems as item, i (i)}
										<tr>
											<td class="px-3 py-2">
												<input
													aria-label="Employee name, line {i + 1}"
													list="payroll-employees"
													placeholder="Employee name"
													bind:value={item.employeeName}
													class={inputClass}
												/>
											</td>
											<td class="px-3 py-2">
												<input
													aria-label="Amount, line {i + 1}"
													type="number"
													min="0"
													step="0.01"
													placeholder="0.00"
													bind:value={item.amount}
													class="{inputClass} text-right"
												/>
											</td>
											<td class="px-3 py-2">
												<input
													aria-label="Notes, line {i + 1}"
													placeholder="Optional"
													bind:value={item.notes}
													class={inputClass}
												/>
											</td>
											<td class="px-3 py-2 text-right whitespace-nowrap">
												<button
													type="button"
													class="text-text-muted hover:text-text-primary px-1 disabled:opacity-30"
													aria-label="Move line {i + 1} up"
													disabled={i === 0}
													onclick={() => moveItem(i, -1)}>↑</button
												>
												<button
													type="button"
													class="text-text-muted hover:text-text-primary px-1 disabled:opacity-30"
													aria-label="Move line {i + 1} down"
													disabled={i === editorItems.length - 1}
													onclick={() => moveItem(i, 1)}>↓</button
												>
												<button
													type="button"
													class="ml-1 px-1 text-red-500 hover:text-red-700"
													aria-label="Remove line {i + 1}"
													onclick={() => {
														editorItems = editorItems.filter((_, idx) => idx !== i);
														if (editorItems.length === 0) editorItems = [blankLine()];
													}}>✕</button
												>
											</td>
										</tr>
									{/each}
								</tbody>
								<tfoot>
									<tr class="border-border bg-surface border-t-2 font-semibold">
										<td class="px-4 py-3 text-sm">
											{editorItems.filter((i) => i.employeeName.trim()).length} employees
										</td>
										<td class="px-4 py-3 text-right text-sm">{fmt(editorTotal)}</td>
										<td colspan="2"></td>
									</tr>
								</tfoot>
							</table>
						</div>

						<div class="flex flex-wrap items-center gap-2">
							<button
								type="button"
								class="border-border text-text-secondary hover:bg-surface rounded border px-3 py-1.5 text-xs font-medium"
								onclick={() => (editorItems = [...editorItems, blankLine()])}
							>
								+ Add line
							</button>
							{#if data.technicians.length > 0}
								<button
									type="button"
									class="border-border text-text-secondary hover:bg-surface rounded border px-3 py-1.5 text-xs font-medium"
									onclick={addAllTechnicians}
								>
									+ Add all technicians
								</button>
							{/if}
							<div class="ml-auto flex gap-2">
								<button
									type="button"
									class="border-border text-text-secondary hover:bg-surface rounded border px-4 py-2 text-sm font-medium"
									onclick={() => (editorOpen = false)}
								>
									Cancel
								</button>
								<button
									type="submit"
									disabled={isSubmitting}
									class="bg-primary rounded px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50"
								>
									{isSubmitting ? 'Saving…' : 'Save Set'}
								</button>
							</div>
						</div>
					</form>
				</section>
			{:else}
				<section
					id="generate-panel"
					class="border-border scroll-mt-20 rounded-lg border bg-white p-5 shadow-sm"
				>
					<h2 class="text-text-muted mb-4 text-sm font-semibold tracking-wider uppercase">
						Generate Payroll
					</h2>
					<form method="POST" action="?/generate" use:enhance={submitGenerate} class="space-y-4">
						<input type="hidden" name="set_id" value={genSetId} />
						<input
							type="hidden"
							name="entries"
							value={JSON.stringify(
								includedLines.map(({ employeeName, amount, notes }) => ({
									employeeName,
									amount,
									notes
								}))
							)}
						/>
						{#if confirmDuplicate}<input type="hidden" name="confirm_duplicate" value="1" />{/if}

						<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
							<div class="sm:col-span-2">
								<label for="gen-set" class={labelClass}>Saved Set</label>
								<select
									id="gen-set"
									class={inputClass}
									value={genSetId}
									onchange={(e) => onSetSelect((e.target as HTMLSelectElement).value)}
								>
									<option value="">— Blank / one-off —</option>
									{#each data.sets as set (set.id)}
										<option value={String(set.id)}>{set.name} ({fmt(set.total)})</option>
									{/each}
								</select>
							</div>
							<div class="sm:col-span-2">
								<label for="gen-pay-date" class={labelClass}>Pay Date</label>
								<input
									id="gen-pay-date"
									type="date"
									name="pay_date"
									required
									bind:value={genPayDate}
									class={inputClass}
								/>
							</div>
							<div>
								<label for="gen-period-start" class={labelClass}>Period Start</label>
								<input
									id="gen-period-start"
									type="date"
									name="period_start"
									bind:value={genPeriodStart}
									class={inputClass}
								/>
							</div>
							<div>
								<label for="gen-period-end" class={labelClass}>Period End</label>
								<input
									id="gen-period-end"
									type="date"
									name="period_end"
									bind:value={genPeriodEnd}
									class={inputClass}
								/>
							</div>
							<div class="flex flex-wrap items-end gap-1 sm:col-span-2">
								<span class="sr-only">Period presets</span>
								{#each [['week', 'Pay week'], ['first-half', '1st–15th'], ['second-half', '16th–end'], ['month', 'Whole month']] as [key, label] (key)}
									<button
										type="button"
										class="border-border text-text-secondary hover:bg-surface rounded border px-2 py-2 text-xs font-medium"
										onclick={() =>
											applyPeriod(key as 'week' | 'first-half' | 'second-half' | 'month')}
									>
										{label}
									</button>
								{/each}
							</div>
						</div>

						{#if genLines.length === 0}
							<div
								class="border-border text-text-muted rounded border border-dashed p-8 text-center text-sm"
							>
								Pick a saved set above (or click <span class="font-medium">Use for payroll</span>)
								to load its payouts, or
								<button
									type="button"
									class="text-primary font-medium underline"
									onclick={() => loadSet(undefined)}
								>
									start a one-off payroll
								</button>.
							</div>
						{:else}
							<div class="border-border overflow-x-auto rounded border">
								<table class="min-w-full">
									<thead class="bg-surface">
										<tr>
											<th class="{thClass} w-10">
												<input
													type="checkbox"
													aria-label="Include all"
													checked={genLines.every((l) => l.include)}
													onchange={(e) => setAllIncluded((e.target as HTMLInputElement).checked)}
												/>
											</th>
											<th class={thClass}>Employee</th>
											<th class="{thClass} w-40 text-right">Amount (PHP)</th>
											<th class={thClass}>Notes</th>
											<th class="{thClass} w-10"><span class="sr-only">Remove</span></th>
										</tr>
									</thead>
									<tbody class="divide-border divide-y bg-white">
										{#each genLines as line, i (i)}
											<tr class={line.include ? '' : 'bg-surface opacity-60'}>
												<td class="px-4 py-2">
													<input
														type="checkbox"
														aria-label="Include line {i + 1}"
														bind:checked={line.include}
													/>
												</td>
												<td class="px-3 py-2">
													<input
														aria-label="Employee name, line {i + 1}"
														list="payroll-employees"
														placeholder="Employee name"
														bind:value={line.employeeName}
														class={inputClass}
													/>
												</td>
												<td class="px-3 py-2">
													<input
														aria-label="Amount, line {i + 1}"
														type="number"
														min="0"
														step="0.01"
														placeholder="0.00"
														bind:value={line.amount}
														oninput={() => {
															if (Number(line.amount) > 0) line.include = true;
														}}
														class="{inputClass} text-right"
													/>
												</td>
												<td class="px-3 py-2">
													<input
														aria-label="Notes, line {i + 1}"
														placeholder="e.g. +OT, cash advance"
														bind:value={line.notes}
														class={inputClass}
													/>
												</td>
												<td class="px-3 py-2 text-right">
													<button
														type="button"
														class="px-1 text-red-500 hover:text-red-700"
														aria-label="Remove line {i + 1}"
														onclick={() => (genLines = genLines.filter((_, idx) => idx !== i))}
														>✕</button
													>
												</td>
											</tr>
										{/each}
									</tbody>
									<tfoot>
										<tr class="border-border bg-surface border-t-2 font-semibold">
											<td></td>
											<td class="px-4 py-3 text-sm">
												{includedLines.length} of {genLines.length} included
											</td>
											<td class="px-4 py-3 text-right text-sm">{fmt(genTotal)}</td>
											<td colspan="2"></td>
										</tr>
									</tfoot>
								</table>
							</div>

							<div>
								<label for="gen-notes" class={labelClass}>Batch Notes (optional)</label>
								<input
									id="gen-notes"
									name="notes"
									placeholder="e.g. Includes holiday pay"
									bind:value={genNotes}
									class={inputClass}
								/>
							</div>

							<div class="flex flex-wrap items-center gap-2">
								<button
									type="button"
									class="border-border text-text-secondary hover:bg-surface rounded border px-3 py-1.5 text-xs font-medium"
									onclick={() => (genLines = [...genLines, { ...blankLine(), include: true }])}
								>
									+ Add line
								</button>
								<button
									type="button"
									class="border-border text-text-secondary hover:bg-surface rounded border px-3 py-1.5 text-xs font-medium"
									onclick={saveGeneratorAsSet}
								>
									Save lines as new set
								</button>
								<div class="ml-auto flex items-center gap-3">
									<span class="text-text-secondary text-sm">
										Total <span class="text-text-primary font-bold">{fmt(genTotal)}</span>
									</span>
									<button
										type="submit"
										disabled={isSubmitting || includedLines.length === 0 || !genPayDate}
										class="rounded px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-50 {confirmDuplicate
											? 'bg-amber-600'
											: 'bg-primary'}"
									>
										{isSubmitting
											? 'Posting…'
											: confirmDuplicate
												? 'Post Again Anyway'
												: `Post Payroll (${includedLines.length})`}
									</button>
								</div>
							</div>
						{/if}
					</form>
				</section>
			{/if}
		</div>
	</div>

	<!-- History -->
	<section>
		<h2 class="text-text-muted mb-3 text-sm font-semibold tracking-wider uppercase">
			Payroll History — {monthLabel}
		</h2>
		<div class="border-border overflow-x-auto rounded-lg border">
			<table class="min-w-full">
				<thead class="bg-surface">
					<tr>
						<th class={thClass}>Pay Date</th>
						<th class={thClass}>Set</th>
						<th class={thClass}>Period</th>
						<th class="{thClass} text-right">Employees</th>
						<th class="{thClass} text-right">Total</th>
						<th class="{thClass} text-right">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-border divide-y bg-white">
					{#if data.batches.length === 0}
						<tr>
							<td colspan="6" class="text-text-muted px-4 py-10 text-center text-sm">
								No payroll posted for {monthLabel}.
							</td>
						</tr>
					{/if}
					{#each data.batches as batch (batch.id)}
						<tr class="hover:bg-surface">
							<td class="text-text-primary px-4 py-3 text-sm whitespace-nowrap">
								{fmtDate(batch.payDate)}
							</td>
							<td class="text-text-primary px-4 py-3 text-sm">
								{batch.setName ?? 'One-off'}
								{#if batch.notes}
									<span class="text-text-muted block text-xs">{batch.notes}</span>
								{/if}
							</td>
							<td class="text-text-secondary px-4 py-3 text-sm whitespace-nowrap">
								{#if batch.periodStart || batch.periodEnd}
									{fmtDate(batch.periodStart)} – {fmtDate(batch.periodEnd)}
								{:else}
									—
								{/if}
							</td>
							<td class="text-text-primary px-4 py-3 text-right text-sm">{batch.entries.length}</td>
							<td
								class="text-error-dark px-4 py-3 text-right text-sm font-semibold whitespace-nowrap"
							>
								{fmt(batch.total)}
							</td>
							<td class="px-4 py-3 text-right text-sm whitespace-nowrap">
								<button
									type="button"
									class="text-primary font-medium hover:underline"
									aria-expanded={expanded.has(batch.id)}
									onclick={() => toggleBatch(batch.id)}
								>
									{expanded.has(batch.id) ? 'Hide' : 'View'}
								</button>
								<button
									type="button"
									class="text-text-secondary ml-3 font-medium hover:underline"
									onclick={() => reuseBatch(batch)}
								>
									Reuse
								</button>
								{#if canDelete}
									<form
										method="POST"
										action="?/deleteBatch"
										class="ml-3 inline"
										use:enhance={confirmSubmit(
											`Delete this payroll batch (${batch.entries.length} payouts, ${fmt(batch.total)})?`
										)}
									>
										<input type="hidden" name="batch_id" value={batch.id} />
										<button
											type="submit"
											class="font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
											disabled={isSubmitting}
										>
											Delete
										</button>
									</form>
								{/if}
							</td>
						</tr>
						{#if expanded.has(batch.id)}
							<tr class="bg-surface">
								<td colspan="6" class="px-4 py-3">
									<table class="border-border min-w-full rounded border bg-white">
										<thead>
											<tr>
												<th
													class="text-text-muted px-3 py-2 text-left text-[10px] font-medium tracking-wider uppercase"
												>
													Employee
												</th>
												<th
													class="text-text-muted px-3 py-2 text-left text-[10px] font-medium tracking-wider uppercase"
												>
													Notes
												</th>
												<th
													class="text-text-muted px-3 py-2 text-right text-[10px] font-medium tracking-wider uppercase"
												>
													Amount
												</th>
												{#if canDelete}<th class="w-16"><span class="sr-only">Actions</span></th
													>{/if}
											</tr>
										</thead>
										<tbody class="divide-border divide-y">
											{#each batch.entries as entry (entry.id)}
												<tr>
													<td class="text-text-primary px-3 py-2 text-sm">{entry.employeeName}</td>
													<td class="text-text-secondary px-3 py-2 text-sm">{entry.notes || '—'}</td
													>
													<td class="px-3 py-2 text-right text-sm whitespace-nowrap"
														>{fmt(entry.amount)}</td
													>
													{#if canDelete}
														<td class="px-3 py-2 text-right">
															<form
																method="POST"
																action="?/deleteEntry"
																use:enhance={confirmSubmit(
																	`Remove ${entry.employeeName}'s payout (${fmt(entry.amount)}) from this batch?`
																)}
															>
																<input type="hidden" name="entry_id" value={entry.id} />
																<button
																	type="submit"
																	class="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
																	disabled={isSubmitting}
																	aria-label="Remove payout for {entry.employeeName}"
																>
																	Remove
																</button>
															</form>
														</td>
													{/if}
												</tr>
											{/each}
										</tbody>
									</table>
								</td>
							</tr>
						{/if}
					{/each}
				</tbody>
				{#if data.batches.length > 0}
					<tfoot>
						<tr class="border-border bg-surface border-t-2 font-semibold">
							<td colspan="4" class="text-text-primary px-4 py-3 text-sm">TOTAL PAYROLL</td>
							<td class="px-4 py-3 text-right text-sm whitespace-nowrap text-red-700">
								{fmt(data.monthTotal)}
							</td>
							<td></td>
						</tr>
					</tfoot>
				{/if}
			</table>
		</div>
	</section>
</div>
