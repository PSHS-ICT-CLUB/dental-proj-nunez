// place files you want to import through the `$lib` alias in this folder.
export async function convertFileToBytea(file: File) {
	if (!file) {
		throw new Error('No file selected');
	}

	const arrayBuffer = await file.arrayBuffer();
	const uint8Array = new Uint8Array(arrayBuffer);

	return uint8Array;
}
export function getCurrentDateTime() {
	const now = new Date();

	// Get date components
	const year = now.getFullYear();
	const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed, so add 1
	const day = String(now.getDate()).padStart(2, '0');

	// Get time components
	const hours = String(now.getHours()).padStart(2, '0');
	const minutes = String(now.getMinutes()).padStart(2, '0');
	const seconds = String(now.getSeconds()).padStart(2, '0');

	// Format the date and time string
	const formattedDateTime = `${month}-${day}-${year} ${hours}:${minutes}:${seconds}`;
	// Example output: "2023-10-27 14:35:02"

	// You can also return them separately or as an object:
	return {
		date: `${year}-${month}-${day}`,
		time: `${hours}:${minutes}:${seconds}`,
		fullDateTime: formattedDateTime,
		dateObject: now // The original Date object if you need more operations
	};
}
// Define the interface for individual record items based on the provided schema
interface OrderItem {
	caseTypeId: number;
	caseTypeName: string;
	caseNo: string;
	orderDescription?: string;
}

interface RecordItem {
	recordId: number;
	clinicId: number;
	clinicName: string;
	patientName: string;
	datePickup: string;
	timePickup?: string;
	dateDropoff?: string;
	timeDropoff?: string;
	orderItems: OrderItem[];
	orderTotal: number;
	paidAmount: number;
	caseStatus: string;
	caseNotes?: string;
	remarksDeprecated?: string;
	paymentStatus: 'paid' | 'unpaid';
	createdAt: Date | string;
}

// Define the interface for the function's result
interface DateRangeResult {
	startingDate: Date | null;
	recentDate: Date | null;
}

/**
 * Calculates the earliest (starting) and most recent date from an array of records.
 * It considers datePickup (with timePickup), dateDropoff (with timeDropoff),
 * and createdAt fields from each record.
 *
 * @param records An array of RecordItem objects.
 * @returns An object containing the startingDate and recentDate as Date objects,
 * or null for either if no valid dates are found or the input array is empty.
 */
export function getRecordDateRange(records: RecordItem[]): DateRangeResult {
	if (!records || records.length === 0) {
		return { startingDate: null, recentDate: null };
	}

	let minDate: Date | null = null;
	let maxDate: Date | null = null;

	for (const record of records) {
		const candidateDatesFromRecord: Date[] = [];

		// Helper function to parse a direct date value (like createdAt)
		// It accepts a Date object or a string to be parsed.
		const processDirectDateValue = (dateValue: string | Date | undefined | null) => {
			if (dateValue) {
				const dateObj = dateValue instanceof Date ? dateValue : new Date(dateValue);
				// Check if the created Date object is valid
				if (dateObj && !isNaN(dateObj.getTime())) {
					candidateDatesFromRecord.push(dateObj);
				}
			}
		};

		// Helper function to combine a date string and a time string, then parse
		const processCombinedDateTime = (
			dateStr: string | undefined | null,
			timeStr: string | undefined | null
		) => {
			if (dateStr) {
				let dateTimeStringForParsing = dateStr; // Start with the date part

				if (timeStr) {
					// Basic validation for HH:MM:SS or HH:MM time format
					if (/^\d{2}:\d{2}(:\d{2})?$/.test(timeStr)) {
						dateTimeStringForParsing += `T${timeStr}`; // Append time if valid
					} else {
						// Log a warning if time format is unexpected and proceed with date only.
						// When only a date string "YYYY-MM-DD" is parsed by new Date(),
						// it's interpreted as UTC midnight.
						console.warn(
							`Invalid time format "${timeStr}" for date "${dateStr}". Using date part only.`
						);
					}
				}

				// new Date("YYYY-MM-DD") is parsed as UTC midnight.
				// new Date("YYYY-MM-DDTHH:MM:SS") is parsed as local time if no 'Z' (UTC) or timezone offset is specified in the string.
				// This is standard JavaScript Date behavior. All resulting Date objects
				// represent a specific moment in time (internally UTC milliseconds since epoch)
				// and are therefore directly comparable.
				const dateObj = new Date(dateTimeStringForParsing);
				if (dateObj && !isNaN(dateObj.getTime())) {
					candidateDatesFromRecord.push(dateObj);
				}
			}
		};

		// 1. Process the 'createdAt' field
		processDirectDateValue(record.createdAt);

		// 2. Process 'datePickup' and 'timePickup'
		processCombinedDateTime(record.datePickup, record.timePickup);

		// 3. Process 'dateDropoff' and 'timeDropoff'
		processCombinedDateTime(record.dateDropoff, record.timeDropoff);

		// Update the overall minDate and maxDate using valid dates found in the current record
		for (const currentDate of candidateDatesFromRecord) {
			if (minDate === null || currentDate < minDate) {
				minDate = currentDate;
			}
			if (maxDate === null || currentDate > maxDate) {
				maxDate = currentDate;
			}
		}
	}

	return { startingDate: minDate, recentDate: maxDate };
}

export function formatDate(dateInput: Date | string): string {
	const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
	if (isNaN(date.getTime())) return String(dateInput);

	const month = (date.getMonth() + 1).toString().padStart(2, '0');
	const day = date.getDate().toString().padStart(2, '0');
	const year = date.getFullYear();

	return `${month}-${day}-${year}`;
}
interface RecordsSummary {
	grandTotalAmount: number; // Sum of all totalAmounts
	totalPaidAmount: number; // Sum of all paidAmounts
	totalBalance: number; // grandTotalAmount - totalPaidAmount
	financialStatus: 'Paid' | 'Unpaid' | 'N/A'; // Overall financial status
	processStatus: 'Processed' | 'On going' | 'Partially Processed' | 'N/A'; // Overall process status
}

export function generateRecordsSummary(records: RecordItem[]): RecordsSummary {
	if (!records || records.length === 0) {
		return {
			grandTotalAmount: 0,
			totalPaidAmount: 0,
			totalBalance: 0,
			financialStatus: 'N/A',
			processStatus: 'N/A'
		};
	}

	const summary = records.reduce(
		(acc, record) => {
			acc.grandTotalAmount += record.orderTotal;
			acc.totalPaidAmount += record.paidAmount;

			if (record.paymentStatus === 'unpaid') {
				acc.allPaid = false;
			}

			if (record.caseStatus === 'pending') {
				acc.hasPending = true;
			} else if (record.caseStatus !== 'finished') {
				acc.allFinished = false;
			}

			return acc;
		},
		{
			grandTotalAmount: 0,
			totalPaidAmount: 0,
			allPaid: true,
			hasPending: false,
			allFinished: true
		}
	);

	return {
		grandTotalAmount: summary.grandTotalAmount,
		totalPaidAmount: summary.totalPaidAmount,
		totalBalance: summary.grandTotalAmount - summary.totalPaidAmount,
		financialStatus: summary.allPaid ? 'Paid' : 'Unpaid',
		processStatus: summary.hasPending
			? 'On going'
			: summary.allFinished
				? 'Processed'
				: 'Partially Processed'
	};
}
