import { db } from '$lib/server/db';
import { clinics, doctors, records } from '$lib/server/db/schema';
import { desc, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	console.log(params.clinic.toString(), 'params.clinic');
	const clinicName = String(params.clinic.toString());
	let data = [];
	try {
		data = await db
			.select()
			.from(records)
			.where(sql`clinic_name = ${clinicName}`)
			.orderBy(desc(records.recordId));
		console.log(data);
	} catch (error) {
		console.error('Error:', error);
	}
	return {
		data: data,
		clinicName: clinicName
	};
};
