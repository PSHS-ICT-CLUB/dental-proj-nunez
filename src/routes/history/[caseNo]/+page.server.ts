import { db } from '$lib/server/db';
import { clinics, doctors, history, records, users } from '$lib/server/db/schema';
import { desc, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	console.log(params.caseNo.toString(), 'params.caseNo');
	const caseNo = String(params.caseNo.toString());
	let data = [];
	let recordData = [];
	try {
		recordData = await db
			.select({
				recordId: records.recordId,
				clinicName: clinics.clinicName,
				doctorId: records.doctorId,
				createdBy: records.createdBy,
				creatorName: sql`creator.name`.as('creator_name'),
				createdAt: records.createdAt
			})
			.from(records)
			.leftJoin(doctors, sql`${records.doctorId} = ${doctors.doctorId}`)
			.leftJoin(clinics, sql`${doctors.clinicId} = ${clinics.clinicId}`)
			.leftJoin(users, sql`${records.createdBy} = ${users.id}`)
			.leftJoin(sql`${users} creator`, sql`${records.createdBy} = creator.id`)
			.where(sql`${records.recordId} = ${caseNo}`)
			.orderBy(desc(records.recordId))
			.limit(1);

		const rawData = await db
			.select({
				historyId: history.historyId,
				historyType: history.historyType,
				historyDate: history.historyDate,
				historyTime: history.historyTime,
				recordId: history.recordId,
				imageUrl: history.imageUrl,
				createdBy: history.createdBy,
				creatorName: users.name
			})
			.from(history)
			.leftJoin(users, sql`${history.createdBy} = ${users.id}`)
			.where(sql`${history.recordId} = ${caseNo}`)
			.orderBy(desc(history.historyId));

		data = rawData.map(item => {
			return {
				...item,
				imageData: item.imageUrl || null
			};
		});

		console.log(recordData);
	} catch (error) {
		console.error('Error:', error);
	}
	return {
		data,
		recordData: recordData,
		caseNo
	};
};
