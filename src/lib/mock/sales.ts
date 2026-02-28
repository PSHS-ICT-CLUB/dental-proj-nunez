// Mock sales data for development

interface Order {
	orderId: string;
	orderTotal: number | string;
	paidAmount?: number | string | null;
	paymentMethod?: string | null;
	paymentStatus?: string | null;
}

interface Record {
	recordId: string;
	patientName: string;
	dateDropoff?: string | null;
	doctorId?: string | null;
	remarks?: string | null;
}

interface MockRow {
	record: Record;
	order: Order;
	clinicName: string;
}

interface Supply {
	supplyDate: string;
	supplyCost: number | string;
	supplyDescription?: string;
}

// A small set of mock rows across multiple dates and statuses
export const MOCK_RECORDS: MockRow[] = [
	{
		record: {
			recordId: 'r1',
			patientName: 'Alice Santos',
			dateDropoff: '2025-10-05',
			remarks: 'finished'
		},
		order: {
			orderId: 'o1',
			orderTotal: 1500,
			paidAmount: 1500,
			paymentMethod: 'cash',
			paymentStatus: 'paid'
		},
		clinicName: 'Main Clinic'
	},
	{
		record: {
			recordId: 'r2',
			patientName: 'Bernard Cruz',
			dateDropoff: '2025-10-06',
			remarks: 'pending'
		},
		order: {
			orderId: 'o2',
			orderTotal: 2500,
			paidAmount: 1000,
			paymentMethod: 'card',
			paymentStatus: 'unpaid'
		},
		clinicName: 'Main Clinic'
	},
	{
		record: {
			recordId: 'r3',
			patientName: 'Carla Reyes',
			dateDropoff: '2025-10-13',
			remarks: 'finished'
		},
		order: {
			orderId: 'o3',
			orderTotal: 3000,
			paidAmount: 3000,
			paymentMethod: 'transfer',
			paymentStatus: 'paid'
		},
		clinicName: 'Branch A'
	},
	{
		record: {
			recordId: 'r4',
			patientName: 'Dina Lopez',
			dateDropoff: '2025-10-20',
			remarks: 'pending'
		},
		order: {
			orderId: 'o4',
			orderTotal: 2000,
			paidAmount: 0,
			paymentMethod: 'cash',
			paymentStatus: 'unpaid'
		},
		clinicName: 'Branch B'
	}
];

export const MOCK_SUPPLIES: Supply[] = [
	{ supplyDate: '2025-10-05', supplyCost: 250, supplyDescription: 'Gloves' },
	{ supplyDate: '2025-10-06', supplyCost: 500, supplyDescription: 'Anesthetic' },
	{ supplyDate: '2025-10-12', supplyCost: 300, supplyDescription: 'Sutures' }
];

export function getMockRecords({
	status,
	exactDate,
	startDate,
	endDate,
	remarks
}: {
	status?: string | null;
	exactDate?: string | null;
	startDate?: string | null;
	endDate?: string | null;
	remarks?: string | null;
}) {
	let rows = MOCK_RECORDS.slice();
	if (status) {
		if (status === 'paid') rows = rows.filter((r) => r.order.paymentStatus === 'paid');
		else if (status === 'unpaid') rows = rows.filter((r) => r.order.paymentStatus !== 'paid');
	}
	if (remarks) {
		const wanted = remarks.toLowerCase();
		rows = rows.filter((r) => ((r.record.remarks || '') as string).toLowerCase() === wanted);
	}
	if (exactDate) {
		rows = rows.filter((r) => r.record.dateDropoff === exactDate);
	}
	if (startDate && endDate) {
		rows = rows.filter((r) => {
			return r.record.dateDropoff >= startDate && r.record.dateDropoff <= endDate;
		});
	}
	return rows;
}

export function getMockSupplies({
	exactDate,
	startDate,
	endDate
}: {
	exactDate?: string | null;
	startDate?: string | null;
	endDate?: string | null;
}) {
	let rows = MOCK_SUPPLIES.slice();
	if (exactDate) rows = rows.filter((s) => s.supplyDate === exactDate);
	if (startDate && endDate)
		rows = rows.filter((s) => s.supplyDate >= startDate && s.supplyDate <= endDate);
	return rows;
}
