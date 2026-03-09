import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import {
	caseTypes,
	clinics,
	doctors,
	history as historyTable,
	orderItems,
	orders,
	records,
	inventoryItems,
	inventoryLogs,
	recordInventoryUsages,
	technicians
} from '$lib/server/db/schema';
import { desc, eq, sql } from 'drizzle-orm';
import { supabase } from '$lib/server/supabase';
import { redirect } from '@sveltejs/kit';


export const load: PageServerLoad = async ({ params }) => {
	const [
		caseTypesData,
		doctorsData,
		clinicsData,
		inventoryTableItemsData,
		techniciansData
	] = await Promise.all([
		db.select({
			caseTypeId: caseTypes.caseTypeId,
			caseTypeName: caseTypes.caseTypeName,
			numberOfCases: caseTypes.numberOfCases
		}).from(caseTypes),
		db.select({
			doctorId: doctors.doctorId,
			doctorName: doctors.doctorName,
			clinicId: doctors.clinicId
		}).from(doctors).orderBy(desc(doctors.doctorName)),
		db.select({
			clinicId: clinics.clinicId,
			clinicName: clinics.clinicName
		}).from(clinics).orderBy(desc(clinics.clinicName)),
		db.select({
			id: inventoryItems.id,
			name: inventoryItems.name,
			unit: inventoryItems.unit,
			cost: inventoryItems.cost,
			currentStock: inventoryItems.currentStock
		}).from(inventoryItems).orderBy(inventoryItems.name),
		db.select({
			id: technicians.id,
			name: technicians.name
		}).from(technicians).orderBy(technicians.name)
	]);

	return {
		caseTypes: caseTypesData,
		doctors: doctorsData,
		clinics: clinicsData,
		inventoryTableItems: inventoryTableItemsData,
		technicians: techniciansData
	};
};

export const actions = {
	default: async ({ locals, request }) => {
		const session = await locals.auth();
		const userId = session?.user?.id ? parseInt(session.user.id) : null;
		const data = await request.formData();
		console.log('Form data:', data);

		const doctorIdStr = data.get('doctor_name')?.toString();
		if (!doctorIdStr) {
			return { success: false, error: 'Doctor selection is required.' };
		}
		const doctorId = parseInt(doctorIdStr, 10);

		const patientName = data.get('patient_name')?.toString();
		if (!patientName) {
			return { success: false, error: 'Patient name is required.' };
		}

		let selectedJaw = data.get('selected_jaw')?.toString();
		if (!selectedJaw) {
			return { success: false, error: 'Jaw selection is required.' };
		}

		let recordId;
		try {
			recordId = await db.transaction(async (tx) => {
				// Server-Side Value Calculations to prevent client-side bypassing
				let upperCost = Number(data.get('upper_cost')) || 0;
				let upperUnit = Number(data.get('upper_unit')) || 1;
				let lowerCost = Number(data.get('lower_cost')) || 0;
				let lowerUnit = Number(data.get('lower_unit')) || 1;

				let calculatedTotal = 0;
				if (selectedJaw === 'upper' || selectedJaw === 'U/L') {
					calculatedTotal += upperCost * upperUnit;
				}
				if (selectedJaw === 'lower' || selectedJaw === 'U/L') {
					calculatedTotal += lowerCost * lowerUnit;
				}

				let paidAmount = Number(data.get('paid_amount')) || 0;
				let computedExcessPayment = paidAmount > calculatedTotal ? paidAmount - calculatedTotal : 0;

				// Trust the server's computed total instead of the hidden client form input
				const orderID = await tx
					.insert(orders)
					.values({
						orderDate: data.get('date') as string,
						orderTotal: calculatedTotal.toString(),
						paidAmount: paidAmount.toString(),
						excessPayment: computedExcessPayment.toString(),
						paymentMethod: data.get('payment_method') as string,
						createdBy: userId
					} as typeof orders.$inferInsert)
					.returning({ id: orders.orderId });

				console.log('order_id', orderID);

				if (selectedJaw === 'upper' || selectedJaw === 'U/L') {
					let caseTypeId = Number(data.get('case_type_upper')?.toString());
					if (!caseTypeId || isNaN(caseTypeId)) {
						throw new Error('Invalid or missing upper case type.');
					}
					console.log(caseTypeId);

					// Atomically increment and get the new case number
					const [updatedCaseType] = await tx
						.update(caseTypes)
						.set({
							numberOfCases: sql`${caseTypes.numberOfCases} + 1`
						})
						.where(eq(caseTypes.caseTypeId, caseTypeId))
						.returning({
							newCases: caseTypes.numberOfCases,
							typeName: caseTypes.caseTypeName
						});

					if (!updatedCaseType) {
						throw new Error(`Case type ${caseTypeId} not found.`);
					}

					const nextCaseNum = updatedCaseType.newCases;
					const formattedCaseNo = `${updatedCaseType.typeName}-${String(nextCaseNum).padStart(5, '0')}`;

					await tx.insert(orderItems).values({
						orderId: orderID[0].id,
						upOrDown: 'up',
						caseTypeId: caseTypeId,
						caseNo: formattedCaseNo,
						itemCost: data.get('upper_cost')?.toString() || '0',
						itemQuantity: Number(data.get('upper_unit')) || 1,
						orderDescription: data.get('upper_description')?.toString() || ''
					} as typeof orderItems.$inferInsert);
				}
				if (selectedJaw === 'lower' || selectedJaw === 'U/L') {
					let caseTypeId = Number(data.get('case_type_lower')?.toString());
					if (!caseTypeId || isNaN(caseTypeId)) {
						throw new Error('Invalid or missing lower case type.');
					}
					console.log('lower');

					// Atomically increment and get the new case number
					const [updatedCaseType] = await tx
						.update(caseTypes)
						.set({
							numberOfCases: sql`${caseTypes.numberOfCases} + 1`
						})
						.where(eq(caseTypes.caseTypeId, caseTypeId))
						.returning({
							newCases: caseTypes.numberOfCases,
							typeName: caseTypes.caseTypeName
						});

					if (!updatedCaseType) {
						throw new Error(`Case type ${caseTypeId} not found.`);
					}

					const nextCaseNum = updatedCaseType.newCases;
					const formattedCaseNo = `${updatedCaseType.typeName}-${String(nextCaseNum).padStart(5, '0')}`;

					await tx.insert(orderItems).values({
						orderId: orderID[0].id,
						upOrDown: 'down',
						caseTypeId: caseTypeId,
						caseNo: formattedCaseNo,
						itemCost: data.get('lower_cost')?.toString() || '0',
						itemQuantity: Number(data.get('lower_unit')) || 1,
						orderDescription: data.get('lower_description')?.toString() || ''
					} as typeof orderItems.$inferInsert);
				}

				const deliveryFeeRaw = data.get('delivery_fee')?.toString() || '';
				const deliveryFee = deliveryFeeRaw ? parseFloat(deliveryFeeRaw) : NaN;

				const record = await tx
					.insert(records)
					.values({
						orderId: orderID[0].id,
						datePickup: data.get('date') as string,
						timePickup: data.get('time') as string,
						doctorId: doctorId,
						patientName: patientName,
						caseStatus: 'pending',
						deliveryCourier: data.get('delivery_courier')?.toString() || null,
						deliveryFee: isNaN(deliveryFee) ? null : deliveryFee,
						deliveryNotes: data.get('delivery_notes')?.toString() || null,
						dateDropoff: data.get('date_dropoff')?.toString().split('T')[0] || null,
						actualDropoff: data.get('actual_dropoff')?.toString() || null,
						finishBy: data.get('finish_by')?.toString() || null,
						assignedTechnicians: data.get('assigned_technicians')?.toString() || null,
						dateIn: data.get('date') as string,
						timeIn: data.get('time') as string,
						createdBy: userId
					} as typeof records.$inferInsert)
					.returning({ id: records.recordId });

				const inImageFiles = data.getAll('in-img') as File[];
				let uploadedImagesCount = 0;
				for (const file of inImageFiles) {
					if (file && file.size > 0 && file.name !== 'undefined') {
						const fileExt = file.name.split('.').pop() || 'jpg';
						const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

						const { error: uploadError } = await supabase.storage
							.from('history_images')
							.upload(fileName, file);

						if (!uploadError) {
							const { data: publicUrlData } = supabase.storage
								.from('history_images')
								.getPublicUrl(fileName);

							await tx.insert(historyTable).values({
								historyType: 'in',
								imageUrl: publicUrlData.publicUrl,
								historyDate: (data.get('date')?.toString() || null) as any,
								recordId: record[0].id,
								historyTime: (data.get('time')?.toString() || null) as any,
								createdBy: userId
							} as any);
							uploadedImagesCount++;
						} else {
							console.error('Supabase upload error:', uploadError);
							throw new Error(`Failed to upload image ${file.name}: ${uploadError.message}`);
						}
					}
				}

				// Inventory Integration: Save used items
				const inventoryDataStr = data.get('inventory_usage')?.toString();
				if (inventoryDataStr) {
					try {
						const inventoryUsage = JSON.parse(inventoryDataStr) as {
							itemId: number;
							quantity: number;
						}[];
						for (const usage of inventoryUsage) {
							if (usage.itemId && usage.quantity > 0) {
								// Deduct current stock using an atomic SQL expression
								await tx
									.update(inventoryItems)
									.set({
										currentStock: sql`${inventoryItems.currentStock} - ${usage.quantity}`
									} as any)
									.where(eq(inventoryItems.id, usage.itemId));

								// Log the usage into the audit table
								await tx.insert(inventoryLogs).values({
									itemId: usage.itemId,
									actionType: 'OUT',
									quantity: usage.quantity,
									remarks: `Used for record ID ${record[0].id} (Patient: ${patientName})`,
									createdBy: userId
								} as typeof inventoryLogs.$inferInsert);

								// Link the usage to the dental case record
								await tx.insert(recordInventoryUsages).values({
									recordId: record[0].id,
									itemId: usage.itemId,
									quantityUsed: usage.quantity
								});
							}
						}
					} catch (e: any) {
						console.error('Error parsing inventory usage:', e);
						throw new Error(`Inventory deduction failed: ${e.message}`);
					}
				}

				return record[0].id;
			});
		} catch (error: any) {
			console.error('Error inserting record:', error);
			// Check if it's a known database error (e.g. Postgres duplicates/constraints)
			let errorMessage = error.message || 'An unknown error occurred';
			if (error.code) {
				errorMessage += ` (DB Error Code: ${error.code})`;
			}
			if (error.detail) {
				errorMessage += ` - ${error.detail}`;
			}
			return { success: false, error: `Failed to insert record: ${errorMessage}` };
		}
		throw redirect(303, '/?record_id=' + recordId);
	}
} satisfies Actions;
