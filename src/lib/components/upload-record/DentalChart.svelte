<script lang="ts">
	const upperRow = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
	const lowerRow = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

	type ToothCondition = 'healthy' | 'affected' | 'missing';
	interface ToothState { condition: ToothCondition; surfaces: boolean[]; }

	let {
		initialState = null,
		readonly = false
	}: { initialState?: string | null; readonly?: boolean } = $props();

	function createDefaultState(): Record<number, ToothState> {
		const state: Record<number, ToothState> = {};
		for (const n of [...upperRow, ...lowerRow]) {
			state[n] = { condition: 'healthy', surfaces: Array(9).fill(false) };
		}
		return state;
	}

	function loadState(): Record<number, ToothState> {
		if (!initialState) return createDefaultState();
		try {
			const parsed = JSON.parse(initialState);
			const defaults = createDefaultState();
			for (const key of Object.keys(parsed)) {
				const n = parseInt(key);
				if (defaults[n]) {
					defaults[n] = {
						condition: parsed[key].condition ?? 'healthy',
						surfaces: Array.isArray(parsed[key].surfaces) ? parsed[key].surfaces : Array(9).fill(false)
					};
				}
			}
			return defaults;
		} catch { return createDefaultState(); }
	}

	let toothStates = $state<Record<number, ToothState>>(loadState());
	let selectedUpperTooth = $state<number | null>(null);
	let selectedLowerTooth = $state<number | null>(null);

	const activeSurfaces = [1, 3, 4, 5, 7];
	const surfaceLabels: Record<number, string> = { 1: 'B', 3: 'M', 4: 'O', 5: 'D', 7: 'L' };

	function cycleCondition(toothNum: number, row: 'upper' | 'lower') {
		if (readonly) return;
		const c = toothStates[toothNum].condition;
		const next: ToothCondition = c === 'healthy' ? 'affected' : c === 'affected' ? 'missing' : 'healthy';
		toothStates[toothNum].condition = next;
		if (row === 'upper') selectedUpperTooth = toothNum;
		else selectedLowerTooth = toothNum;
	}

	function selectTooth(toothNum: number, row: 'upper' | 'lower') {
		if (readonly) return;
		if (row === 'upper') selectedUpperTooth = selectedUpperTooth === toothNum ? null : toothNum;
		else selectedLowerTooth = selectedLowerTooth === toothNum ? null : toothNum;
	}

	function toggleSurface(toothNum: number, cellIdx: number) {
		if (readonly || !activeSurfaces.includes(cellIdx)) return;
		toothStates[toothNum].surfaces[cellIdx] = !toothStates[toothNum].surfaces[cellIdx];
	}

	let serializedChart = $derived(JSON.stringify(toothStates));

	function getToothClass(n: number) {
		const c = toothStates[n].condition;
		return c === 'affected' ? 'tooth-affected' : c === 'missing' ? 'tooth-missing' : 'tooth-healthy';
	}
	function isSelected(n: number, row: 'upper' | 'lower') {
		return row === 'upper' ? selectedUpperTooth === n : selectedLowerTooth === n;
	}

	let affectedCount = $derived([...upperRow, ...lowerRow].filter(n => toothStates[n].condition === 'affected').length);
	let missingCount  = $derived([...upperRow, ...lowerRow].filter(n => toothStates[n].condition === 'missing').length);
</script>

{#if !readonly}
	<input type="hidden" name="dental_chart" value={serializedChart} />
{/if}

<div class="dcw">
	<!-- Legend -->
	<div class="legend">
		<span class="li"><span class="ld hd"></span> Healthy</span>
		<span class="li"><span class="ld ad"></span> Affected</span>
		<span class="li"><span class="lx"></span> Missing</span>
		<span class="lsep">|</span>
		<span class="lsum">{affectedCount} affected · {missingCount} missing</span>
		{#if !readonly}<span class="ltip">Click to mark · Right-click for surfaces</span>{/if}
	</div>

	<!-- Upper jaw -->
	<div class="jlabel">Upper Jaw (Maxillary)</div>
	<div class="jrow">
		<div class="tgroup">
			{#each upperRow as n}
				<div class="tslot">
					<button type="button"
						class="tb {getToothClass(n)} {isSelected(n,'upper') ? 'tsel' : ''} {readonly ? 'tro' : ''}"
						onclick={() => cycleCondition(n, 'upper')}
						oncontextmenu={e => { e.preventDefault(); selectTooth(n, 'upper'); }}
						title="Tooth {n}"
					>
						{#if toothStates[n].condition === 'missing'}
							<span class="xm">✕</span>
						{:else}
							<span class="tni">{n}</span>
						{/if}
					</button>
					<span class="msp"></span>
				</div>
			{/each}
		</div>
		<!-- Surface panel upper -->
		<div class="spanel">
			<div class="stitle">
				{#if selectedUpperTooth}Tooth {selectedUpperTooth} Surfaces
				{:else if !readonly}<span class="shint">Right-click a<br/>tooth to edit<br/>surfaces</span>{/if}
			</div>
			{#if selectedUpperTooth}
				<div class="sgrid">
					{#each Array(9) as _, i}
						{@const active = activeSurfaces.includes(i)}
						{@const shaded = toothStates[selectedUpperTooth].surfaces[i]}
						<button type="button"
							class="sc {active ? 'sa' : 'si'} {active && shaded ? 'ss' : ''}"
							onclick={() => selectedUpperTooth && toggleSurface(selectedUpperTooth, i)}
							disabled={!active || readonly}
							title={surfaceLabels[i] ?? ''}
						>{#if active}<span class="sl">{surfaceLabels[i]}</span>{/if}</button>
					{/each}
				</div>
				<div class="smini">B=Buccal O=Occlusal<br/>M=Mesial D=Distal L=Lingual</div>
			{/if}
		</div>
	</div>

	<!-- Divider -->
	<div class="jdiv"><span class="jdlbl">↑ Upper &nbsp;&nbsp; Lower ↓</span></div>

	<!-- Lower jaw -->
	<div class="jlabel">Lower Jaw (Mandibular)</div>
	<div class="jrow">
		<div class="tgroup">
			{#each lowerRow as n}
				<div class="tslot">
					<button type="button"
						class="tb {getToothClass(n)} {isSelected(n,'lower') ? 'tsel' : ''} {readonly ? 'tro' : ''}"
						onclick={() => cycleCondition(n, 'lower')}
						oncontextmenu={e => { e.preventDefault(); selectTooth(n, 'lower'); }}
						title="Tooth {n}"
					>
						{#if toothStates[n].condition === 'missing'}
							<span class="xm">✕</span>
						{:else}
							<span class="tni">{n}</span>
						{/if}
					</button>
					<span class="tnl">{n}</span>
				</div>
			{/each}
		</div>
		<!-- Surface panel lower -->
		<div class="spanel">
			<div class="stitle">
				{#if selectedLowerTooth}Tooth {selectedLowerTooth} Surfaces
				{:else if !readonly}<span class="shint">Right-click a<br/>tooth to edit<br/>surfaces</span>{/if}
			</div>
			{#if selectedLowerTooth}
				<div class="sgrid">
					{#each Array(9) as _, i}
						{@const active = activeSurfaces.includes(i)}
						{@const shaded = toothStates[selectedLowerTooth].surfaces[i]}
						<button type="button"
							class="sc {active ? 'sa' : 'si'} {active && shaded ? 'ss' : ''}"
							onclick={() => selectedLowerTooth && toggleSurface(selectedLowerTooth, i)}
							disabled={!active || readonly}
							title={surfaceLabels[i] ?? ''}
						>{#if active}<span class="sl">{surfaceLabels[i]}</span>{/if}</button>
					{/each}
				</div>
				<div class="smini">B=Buccal O=Occlusal<br/>M=Mesial D=Distal L=Lingual</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.dcw { width: 100%; overflow-x: auto; }

	/* Legend */
	.legend { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; margin-bottom: 12px; font-size: 0.75rem; color: #6b7280; }
	.li { display: flex; align-items: center; gap: 5px; font-weight: 500; }
	.ld { display: inline-block; width: 12px; height: 12px; border-radius: 2px; border: 1.5px solid #d1d5db; }
	.hd { background: #f9fafb; }
	.ad { background: #3b82f6; border-color: #2563eb; }
	.lx { display: inline-flex; align-items: center; justify-content: center; width: 14px; height: 14px; color: #ef4444; font-size: 0.7rem; font-weight: 700; }
	.lx::before { content: '✕'; }
	.lsep { color: #d1d5db; }
	.lsum { font-weight: 600; color: #374151; }
	.ltip { margin-left: auto; font-style: italic; color: #9ca3af; }

	/* Jaw labels */
	.jlabel { font-size: 0.7rem; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }

	/* Row — original sizes */
	.jrow { display: flex; align-items: flex-start; gap: 10px; min-width: 600px; }
	.tgroup { display: flex; gap: 4px; flex: 1; }
	.tslot { display: flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; min-width: 28px; }

	/* Tooth button — original sizes */
	.tb { width: 100%; aspect-ratio: 1; min-width: 26px; min-height: 26px; border-radius: 4px; border: 1.5px solid #d1d5db; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.15s ease; position: relative; padding: 0; }
	.tro { cursor: default; }
	.tooth-healthy { background: #f9fafb; border-color: #d1d5db; }
	.tooth-healthy:not(.tro):hover { background: #eff6ff; border-color: #93c5fd; }
	.tooth-affected { background: #3b82f6; border-color: #2563eb; }
	.tooth-affected:not(.tro):hover { background: #2563eb; }
	.tooth-missing { background: #fef2f2; border-color: #fca5a5; }
	.tooth-missing:not(.tro):hover { background: #fee2e2; }
	.tsel { outline: 2px solid #f59e0b; outline-offset: 2px; }

	/* Text */
	.tni { font-size: 0.6rem; font-weight: 600; color: #374151; line-height: 1; }
	.tooth-affected .tni { color: #fff; }
	.xm { font-size: 0.75rem; font-weight: 700; color: #ef4444; line-height: 1; }
	.tnl { font-size: 0.6rem; color: #6b7280; font-weight: 500; text-align: center; line-height: 1; }
	.msp { height: 0.75rem; display: block; }

	/* Divider */
	.jdiv { display: flex; align-items: center; justify-content: center; margin: 10px 0 8px; gap: 8px; }
	.jdiv::before, .jdiv::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }
	.jdlbl { font-size: 0.65rem; color: #9ca3af; font-weight: 600; white-space: nowrap; letter-spacing: 0.03em; }

	/* Surface panel — original sizes */
	.spanel { display: flex; flex-direction: column; align-items: center; gap: 4px; flex-shrink: 0; width: 90px; }
	.stitle { font-size: 0.65rem; font-weight: 600; color: #374151; text-align: center; line-height: 1.3; min-height: 2.5rem; display: flex; align-items: center; justify-content: center; }
	.shint { font-size: 0.6rem; color: #9ca3af; text-align: center; font-style: italic; font-weight: 400; }
	.sgrid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2px; width: 80px; }
	.sc { aspect-ratio: 1; border-radius: 3px; border: 1.5px solid transparent; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.12s ease; padding: 0; }
	.sa { background: #f3f4f6; border-color: #d1d5db; }
	.sa:not(:disabled):hover { background: #dbeafe; border-color: #93c5fd; }
	.ss { background: #3b82f6 !important; border-color: #2563eb !important; }
	.si { background: transparent; border-color: transparent; cursor: default; }
	.sl { font-size: 0.6rem; font-weight: 700; color: #374151; line-height: 1; }
	.ss .sl { color: #fff; }
	.smini { font-size: 0.55rem; color: #9ca3af; text-align: center; line-height: 1.4; }
</style>
