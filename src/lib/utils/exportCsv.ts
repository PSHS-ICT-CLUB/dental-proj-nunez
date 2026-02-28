import { formatDate } from '$lib';

export function exportToCSV(records: any[], filename: string = 'records_export.csv') {
	const headers = [
		'Date Pickup',
		'Date Dropoff',
		'Clinic Name',
		'Patient Name',
		'Case No(s)',
		'Description(s)',
		'Total Amount',
		'Paid Amount',
		'Balance',
		'Status',
		'Payment Status'
	];

	const rows = records.map((record) => {
		const caseNos = record.orderItems.map((item: any) => item.caseNo).join('; ');
		const descriptions = record.orderItems
			.map((item: any) => item.orderDescription || '')
			.join('; ');
		const balance = (Number(record.paidAmount) - Number(record.orderTotal)).toFixed(2);

		return [
			record.datePickup,
			record.dateDropoff || '-',
			record.clinicName,
			record.patientName,
			`"${caseNos}"`,
			`"${descriptions}"`,
			record.orderTotal,
			record.paidAmount,
			balance,
			record.remarks || '-',
			record.paymentStatus
		];
	});

	const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	if (link.download !== undefined) {
		const url = URL.createObjectURL(blob);
		link.setAttribute('href', url);
		link.setAttribute('download', filename);
		link.style.visibility = 'hidden';
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
}
