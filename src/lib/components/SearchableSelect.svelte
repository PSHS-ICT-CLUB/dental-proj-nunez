<script lang="ts">
	interface Option {
		value: string;
		label: string;
	}

	let {
		options,
		value = $bindable(''),
		placeholder = 'Select...',
		label = '',
		id = 'searchable-select',
		onchange
	}: {
		options: Option[];
		value?: string;
		placeholder?: string;
		label?: string;
		id?: string;
		onchange?: (value: string) => void;
	} = $props();

	let searchTerm = $state('');
	let isOpen = $state(false);
	let filteredOptions = $derived(
		searchTerm
			? options.filter((opt) => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
			: options
	);

	let selectedOption = $derived(options.find((opt) => opt.value === value) || null);

	function selectOption(option: Option) {
		value = option.value;
		searchTerm = '';
		isOpen = false;
		if (onchange) {
			onchange(option.value);
		}
	}

	function handleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		searchTerm = target.value;
		if (!isOpen) {
			isOpen = true;
		}
	}

	function handleFocus() {
		isOpen = true;
		searchTerm = '';
	}

	function handleBlur() {
		// Delay to allow click events to fire
		setTimeout(() => {
			isOpen = false;
			searchTerm = '';
		}, 200);
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Escape') {
			isOpen = false;
			searchTerm = '';
		}
	}
</script>

<div class="relative">
	{#if label}
		<label for={id} class="text-sm text-gray-600">{label}</label>
	{/if}
	<div class="relative">
		<input
			type="text"
			{id}
			class="w-full rounded-md border-gray-300 p-2"
			{placeholder}
			value={isOpen ? searchTerm : selectedOption?.label || ''}
			oninput={handleInput}
			onfocus={handleFocus}
			onblur={handleBlur}
			onkeydown={handleKeyDown}
		/>
		{#if isOpen && filteredOptions.length > 0}
			<div
				class="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-300 bg-white shadow-lg"
			>
				{#each filteredOptions as option}
					<button
						type="button"
						class="w-full px-4 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none {option.value ===
						value
							? 'bg-indigo-50 text-indigo-600'
							: 'text-gray-900'}"
						onclick={() => selectOption(option)}
					>
						{option.label}
					</button>
				{/each}
			</div>
		{/if}
		{#if isOpen && filteredOptions.length === 0 && searchTerm}
			<div
				class="absolute z-50 mt-1 w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-gray-500 shadow-lg"
			>
				No results found
			</div>
		{/if}
	</div>
</div>
