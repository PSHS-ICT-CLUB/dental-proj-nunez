const fs = require('fs');
const filepath = 'c:/Users/Adrian/projects/dental-proj-nunez/src/routes/+page.svelte';
let content = fs.readFileSync(filepath, 'utf8');

const regexTableStart = /<!-- Table -->[\s\S]*?<table class="min-w-full table-fixed divide-y divide-gray-300">\s*<thead>\s*<tr class="border-b border-gray-300 bg-gray-100">[\s\S]*?<\/tr>\s*<\/thead>/;

const newTableStart = `<!-- Color Legend -->
		<div class="mb-3 flex flex-wrap items-center gap-4 px-1 text-[10px] font-medium text-gray-500 uppercase tracking-wider print:hidden">
			<span class="flex items-center gap-1.5">
				<span class="h-3 w-3 rounded-full bg-emerald-50 border border-emerald-200"></span>
				Paid & Finished
			</span>
			<span class="flex items-center gap-1.5">
				<span class="h-3 w-3 rounded-full bg-rose-50 border border-rose-200"></span>
				Unpaid & Finished
			</span>
			<span class="flex items-center gap-1.5">
				<span class="h-3 w-3 rounded-full bg-violet-50 border border-violet-200"></span>
				Other / Partial
			</span>
			<span class="flex items-center gap-1.5">
				<span class="h-3 w-3 rounded-full bg-white border border-gray-200"></span>
				Pending / Normal
			</span>
		</div>

		<!-- Table -->
		<div class="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm pt-1">
			<table class="min-w-full table-fixed divide-y divide-gray-200">
				<thead class="bg-gray-50/50">
					<tr>
						<th scope="col" class="sticky top-0 bg-gray-50/50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
							Date Pickup
						</th>
						<th scope="col" class="bg-gray-50/50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
							Date Dropoff
						</th>
						{#if Object.keys(data.filters).length === 0 || customerNames.length > 1}
							<th scope="col" class="bg-gray-50/50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
								Clinic
							</th>
						{/if}
						<th scope="col" class="bg-gray-50/50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
							Patient Name
						</th>
						<th scope="col" class="bg-gray-50/50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
							Case Info
						</th>
						<th scope="col" class="bg-gray-50/50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
							Description
						</th>
						<th scope="col" class="bg-gray-50/50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
							Total Amount
						</th>
						<th scope="col" class="bg-gray-50/50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
							Paid Amount
						</th>
						<th scope="col" class="bg-gray-50/50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
							Balance
						</th>
						<th scope="col" class="bg-gray-50/50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider">
							Status
						</th>
						<th scope="col" class="bg-gray-50/50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider print:hidden">
							Actions
						</th>
						<th scope="col" class="bg-gray-50/50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider print:hidden">
							History
						</th>
						{#if showDelete}
							<th scope="col" class="bg-gray-50/50 px-3 py-2.5 text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider print:hidden">
								Delete
							</th>
						{/if}
					</tr>
				</thead>`;

if (content.match(regexTableStart)) {
    content = content.replace(regexTableStart, newTableStart);
    console.log("Replaced start");
} else {
    console.log("Failed to match start");
}

const regexTbody = /<tbody class="divide-y divide-gray-200 bg-white">[\s\S]*?{#each paginatedRecords as record}[\s\S]*?<tr[\s\S]*?class={`[\s\S]*?border-b border-gray-200 transition-colors[\s\S]*?\${[\s\S]*?record\.paymentStatus === 'paid' && record\.remarks === 'finished'[\s\S]*?\? 'bg-green-200'[\s\S]*?: record\.paymentStatus === 'unpaid' && record\.remarks === 'finished'[\s\S]*?\? 'bg-red-300'[\s\S]*?: record\.paymentStatus === 'unpaid' && record\.remarks === 'pending'[\s\S]*?\? 'bg-white'[\s\S]*?: 'bg-violet-300'[\s\S]*?}[\s\S]*?`}[\s\S]*?>/;

const newTbody = `<tbody class="divide-y divide-gray-100 bg-white">
					{#each paginatedRecords as record}
						<tr
							class={\`
							border-b border-gray-100 transition-colors hover:bg-black/5
							\${
								record.paymentStatus === 'paid' && record.remarks === 'finished'
									? 'bg-emerald-50'
									: record.paymentStatus === 'unpaid' && record.remarks === 'finished'
										? 'bg-rose-50'
										: record.paymentStatus === 'unpaid' && record.remarks === 'pending'
											? 'bg-white'
											: 'bg-violet-50'
							}
						\`}
						>`;

if (content.match(regexTbody)) {
    content = content.replace(regexTbody, newTbody);
    console.log("Replaced tbody");
} else {
    console.log("Failed to match tbody");
}

fs.writeFileSync(filepath, content, 'utf8');
console.log('File updated successfully.');
