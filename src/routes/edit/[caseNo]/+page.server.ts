import { db } from '$lib/server/db';
import { caseTypes, clinics, doctors, records, orders, orderItems } from '$lib/server/db/schema';
import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { desc, eq, sql } from 'drizzle-orm';
import { verifyAdminPassword, isPasswordSet } from '$lib/server/auth';

export const load: PageServerLoad = async ({ params }) => {
	try {
		const [
			recordData,
			caseTypesData,
			doctorsData,
			clinicsData,
			passwordIsSet
		] = await Promise.all([
			db
				.select({
					recordId: records.recordId,
					datePickup: records.datePickup,
					timePickup: records.timePickup,
					dateDropoff: records.dateDropoff,
					timeDropoff: records.timeDropoff,
					doctorId: records.doctorId,
					patientName: records.patientName,
					patientContact: records.patientContact,
					patientSex: records.patientSex,
					description: records.description,
					caseStatus: records.caseStatus,
					caseNotes: records.caseNotes,
					remarksDeprecated: records.remarksDeprecated,
					deliveryCourier: records.deliveryCourier,
					deliveryFee: records.deliveryFee,
					deliveryNotes: records.deliveryNotes,
					finishBy: records.finishBy,
					assignedTechnicians: records.assignedTechnicians,
					dentalChart: records.dentalChart,
					doctorName: doctors.doctorName,
					clinicId: doctors.clinicId,
					clinicName: clinics.clinicName,
					orderId: records.orderId,
					orderTotal: orders.orderTotal,
					paidAmount: orders.paidAmount,
					paymentMethod: orders.paymentMethod,
					excessPayment: orders.excessPayment,
					items: sql<any>`json_agg(json_build_object(
						'orderItemId', ${orderItems.orderItemId},
						'upOrDown', ${orderItems.upOrDown},
						'caseTypeId', ${orderItems.caseTypeId},
						'caseNo', ${orderItems.caseNo},
						'itemCost', ${orderItems.itemCost},
						'itemQuantity', ${orderItems.itemQuantity},
						'orderDescription', ${orderItems.orderDescription}
					))`
				})
				.from(records)
				.leftJoin(doctors, eq(records.doctorId, doctors.doctorId))
				.leftJoin(clinics, eq(doctors.clinicId, clinics.clinicId))
				.leftJoin(orders, eq(records.orderId, orders.orderId))
				.leftJoin(orderItems, eq(orders.orderId, orderItems.orderId))
				.groupBy(records.recordId, doctors.doctorId, clinics.clinicId, orders.orderId)
				.where(sql`${records.recordId} = ${params.caseNo}`)
				.limit(1),
			db.select({
				caseTypeId: caseTypes.caseTypeId,
				caseTypeName: caseTypes.caseTypeName,
				caseTypeAbbrv: caseTypes.caseTypeAbbrv,
				numberOfCases: caseTypes.numberOfCases
			}).from(caseTypes),
			db.select({
				doctorId: doctors.doctorId,
				doctorName: doctors.doctorName,
				clinicId: doctors.clinicId
			}).from(doctors),
			db.select({
				clinicId: clinics.clinicId,
				clinicName: clinics.clinicName
			}).from(clinics).orderBy(desc(clinics.clinicName)),
			isPasswordSet()
		]);

		if (!recordData || recordData.length === 0) {
			throw error(404, 'Record not found');
		}

		return {
			record: recordData[0],
			doctors: doctorsData,
			clinics: clinicsData,
			caseTypes: caseTypesData,
			passwordIsSet
		};
	} catch (e) {
		console.error('Error fetching record:', e);
		throw error(500, 'Failed to fetch record');
	}
};

export const actions = {
	update: async ({ request }) => {
		const formData = await request.formData();
		const recordId = formData.get('recordId');
		const doctorId = parseInt(formData.get('doctorId')?.toString() || '0');
		const confirmPassword = formData.get('confirm_password')?.toString() ?? '';

		const patientName = formData.get('patientName')?.toString() ?? '';
		const patientContact = formData.get('patientContact')?.toString().trim() ?? '';
		const patientSex = formData.get('patientSex')?.toString().trim() ?? '';
		const caseNotes = formData.get('caseNotes')?.toString() ?? '';

		const deliveryCourier = formData.get('deliveryCourier')?.toString() ?? '';
		const deliveryFeeRaw = formData.get('deliveryFee')?.toString() ?? '';
		const deliveryNotes = formData.get('deliveryNotes')?.toString() ?? '';
		const finishBy = formData.get('finishBy')?.toString() ?? '';
		const assignedTechnicians = formData.get('assignedTechnicians')?.toString() ?? '';

		// Check if password is set
		const passwordIsSet = await isPasswordSet();
		if (!passwordIsSet) {
			return fail(400, {
				error: 'No password is set. Please set a password first in the Change Password page.'
			});
		}

		// Verify password
		if (!confirmPassword) {
			return fail(400, { error: 'Password is required' });
		}

		const ok = await verifyAdminPassword(confirmPassword);
		if (!ok) {
			return fail(400, { error: 'Wrong password' });
		}

		console.log(formData);
		try {
			// Parse the recordId to ensure it's a number
			const recordIdNum = parseInt(recordId?.toString() || '0');
			const orderIdNum = parseInt(formData.get('orderId')?.toString() || '0');
			if (!recordIdNum) throw new Error('Invalid record ID');

			const deliveryFee = deliveryFeeRaw ? parseFloat(deliveryFeeRaw) : NaN;
			const orderItemsData = JSON.parse(formData.get('orderItems')?.toString() || '[]');
			const totalAmount = formData.get('total_amount')?.toString();

			const currentItems = await db
				.select({
					orderItemId: orderItems.orderItemId,
					caseTypeId: orderItems.caseTypeId
				})
				.from(orderItems)
				.where(eq(orderItems.orderId, orderIdNum));

			await db.transaction(async (tx) => {
				await tx
					.update(records)
					.set({
						doctorId,
						patientName,
						patientContact: patientContact || null,
						patientSex: patientSex || null,
						caseNotes,
						deliveryCourier: deliveryCourier || null,
						deliveryFee: isNaN(deliveryFee) ? null : deliveryFee.toString(),
						deliveryNotes: deliveryNotes || null,
						finishBy: finishBy || null,
						assignedTechnicians: assignedTechnicians || null,
						dentalChart: formData.get('dental_chart')?.toString() || null
					} as any)
					.where(eq(records.recordId, recordIdNum));

				if (totalAmount) {
					await tx.update(orders).set({
						orderTotal: totalAmount
					} as any).where(eq(orders.orderId, orderIdNum));
				}

				// Update order items and case numbers
				for (const [index, item] of orderItemsData.entries()) {
					// Find the current item to compare case type
					const currentItem = currentItems.find((ci) => ci.orderItemId === item.orderItemId);
					if (currentItem && currentItem.caseTypeId !== item.caseTypeId) {
						await tx
							.update(caseTypes)
							.set({
								numberOfCases: parseInt(formData.get(`caseNo_${index}`)?.toString() || '0')
							})
							.where(eq(caseTypes.caseTypeId, item.caseTypeId));
						console.log(
							`Updated case type ${item.caseTypeId} with new case number: ${formData.get(`caseNo_${index}`)}`
						);
					}

					// Always update order item regardless of case type changes
					await tx
						.update(orderItems)
						.set({
							caseTypeId: item.caseTypeId,
							caseNo: formData.get(`caseNo_${index}`)?.toString() || '0',
							itemQuantity: item.itemQuantity,
							itemCost: item.itemCost,
							orderDescription: item.orderDescription
						} as any)
						.where(eq(orderItems.orderItemId, item.orderItemId));
				}
			});

			return {
				success: true,
				message: 'Record updated successfully'
			};
		} catch (e) {
			console.error('Error updating record:', e);
			return {
				success: false,
				message: 'Failed to update record'
			};
		}
	}
};
