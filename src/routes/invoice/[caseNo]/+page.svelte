<script lang="ts">
	import { format } from 'date-fns';
	import type { PageProps } from './$types';
	import { onMount } from 'svelte';

	let { data, form }: PageProps = $props();
	let { invoice } = data;

	// Add this function to format the case number
	const formatCaseNumber = (num: string) => {
		return num.padStart(5, '0');
	};
	const currentDate = new Date(invoice.date);

	let subtotal = +invoice.total_amount || 0;
	let withholdingTax = invoice.withholding_tax || 0;
	let totalDue = subtotal - withholdingTax;

	onMount(() => {
		window.print();
	});
</script>

<!-- Customer Copy -->
<div class="invoice-container">
	<div class="copy-label">CUSTOMER COPY</div>
	<div class="invoice-header">
		<div class="logo-section">
			<img src="/logo.jpg" alt="Cassey Dental Laboratory Logo" />
			<div class="company-details">
				<h2 class="font-bold">CASSEY DENTAL LABORATORY</h2>
				<p>Camia St., Panghulo, 3021 Obando, Bulacan, Philippines</p>
				<p>Cell no. 0916-753-5300</p>
				<p>Non-VAT Reg TIN: 341-948-594-00000</p>
			</div>
		</div>
		<div class="invoice-number">
			<h1>SERVICE INVOICE</h1>
			<p>№ {formatCaseNumber(invoice.record_id.toString())}</p>
		</div>
	</div>

	<div class="invoice-info">
		<div class="left-info">
			<div class="info-row">
				<label for="clinic_name_input">Name of Clinic:</label>
				<input id="clinic_name_input" type="text" value={invoice.clinic_name} readonly />
			</div>
			<div class="info-row">
				<label for="case_no_input">Case No.:</label>
				<input
					id="case_no_input"
					type="text"
					value={`${invoice.items.map((item) => `${item.case_no}`).join(' & ')}`}
					readonly
				/>
			</div>
			<div class="info-row">
				<label for="patient_name_input">Name of Patient:</label>
				<input id="patient_name_input" type="text" value={invoice.patient_name} readonly />
			</div>
			<div class="info-row">
				<label for="doctor_name_input">Doctor:</label>
				<input id="doctor_name_input" type="text" value={invoice.doctor_name} readonly />
			</div>
		</div>
		<div class="right-info">
			<div class="info-row">
				<label for="date_input">DATE:</label>
				<input id="date_input" type="text" value={format(currentDate, 'MM/dd/yyyy')} readonly />
			</div>
			<div class="info-row">
				<label for="status_input">Status:</label>
				<input
					id="status_input"
					type="text"
					value={invoice.payment_status}
					class={invoice.payment_status === 'paid'
						? 'font-bold text-green-600 uppercase'
						: 'font-bold text-red-600 uppercase'}
					readonly
				/>
			</div>
		</div>
	</div>

	<table class="invoice-items">
		<thead>
			<tr>
				<th>QTY</th>
				<th>UNIT</th>
				<th>CASE TYPE / DESCRIPTION</th>
				<th>UNIT COST/ PRICE</th>
				<th>AMOUNT</th>
			</tr>
		</thead>
		<tbody>
			{#each invoice.items || [] as item}
				<tr>
					<td>{item.quantity}</td>
					<td>{item.unit}</td>
					<td>{item.description}</td>
					<td>₱{item.unit_cost}</td>
					<td>₱{item.amount}</td>
				</tr>
			{/each}
		</tbody>
	</table>

	<div class="invoice-footer">
		<div class="totals-section">
			<div class="total-row">
				<label for="total_amount_span">TOTAL AMOUNT:</label>
				<span id="total_amount_span" class="total-amount">₱{subtotal}</span>
			</div>
		</div>
	</div>
</div>

<style>
	.invoice-container {
		max-width: 8.5in;
		margin: 0 auto 0.5cm auto;
		padding: 10px;
		font-family: Arial, sans-serif;
		border: 1px solid #ccc;
		font-size: 0.8em;
	}

	.invoice-header {
		display: flex;
		justify-content: space-between;
		margin-bottom: 10px;
	}

	.logo-section {
		display: flex;
		gap: 10px;
	}

	.logo-section img {
		height: 100px; /* Reduce logo size */
		width: auto;
	}

	.company-details {
		font-size: 1em;
	}

	.company-details h2 {
		font-size: 1.1em;
		margin: 0;
	}

	.company-details p {
		margin: 0;
		line-height: 1.2;
	}

	.invoice-number h1 {
		font-size: 1.2em;
		margin: 0;
	}

	.invoice-info {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 10px;
		margin-bottom: 10px;
	}

	.info-row {
		display: flex;
		margin-bottom: 5px;
	}

	.info-row label {
		min-width: 120px;
		font-weight: bold;
	}

	.info-row input {
		padding: 2px;
		font-size: 0.9em;
	}

	.invoice-items {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 10px;
		font-size: 0.9em;
	}

	.invoice-items th,
	.invoice-items td {
		border: 1px solid #000;
		padding: 4px;
		text-align: left;
	}

	.invoice-footer {
		display: flex;
		justify-content: flex-end;
		margin-top: 10px;
		padding: 5px 0;
		border-top: 1px solid #333;
	}

	.total-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-weight: bold;
		font-size: 1em;
	}

	.copy-label {
		text-align: right;
		font-weight: bold;
		font-size: 0.8em;
		margin-bottom: 5px;
	}

	@media print {
		.invoice-container {
			margin: 0 auto;
			page-break-inside: avoid;
		}

		@page {
			margin: 0.3cm;
			size: A4 portrait;
		}
	}
</style>
