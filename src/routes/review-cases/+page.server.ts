import { db } from '$lib/server/db';
import {
  records,
  doctors,
  clinics,
  orders,
  orderItems,
  caseTypes,
  history
} from '$lib/server/db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
  const session = await event.locals.auth();

  if (!session?.user) {
    redirect(303, '/login');
  }

  // Only admin and dentist can access this page
  const userRole = (session.user as { role?: string }).role || 'staff';
  if (userRole !== 'admin' && userRole !== 'dentist') {
    redirect(303, '/');
  }

  try {
    // Fetch records that are "to be reviewed by dentist"
    const reviewCases = await db
      .select({
        recordId: records.recordId,
        patientName: records.patientName,
        caseStatus: records.caseStatus,
        caseNotes: records.caseNotes,
        description: records.description,
        datePickup: records.datePickup,
        dateDropoff: records.dateDropoff,
        dateIn: records.dateIn,
        timeIn: records.timeIn,
        finishBy: records.finishBy,
        assignedTechnicians: records.assignedTechnicians,
        createdAt: records.createdAt,
        doctorName: doctors.doctorName,
        clinicName: clinics.clinicName,
        orderTotal: orders.orderTotal,
        paidAmount: orders.paidAmount,
        paymentStatus: orders.paymentStatus,
        orderItems: sql<
          Array<{
            caseTypeName: string;
            caseNo: string;
            orderDescription: string | null;
            upOrDown: string;
          }>
        >`array_agg(
					json_build_object(
						'caseTypeName', ${caseTypes.caseTypeName},
						'caseNo', ${orderItems.caseNo},
						'orderDescription', ${orderItems.orderDescription},
						'upOrDown', ${orderItems.upOrDown}
					)
				) FILTER (WHERE ${orderItems.orderItemId} IS NOT NULL)`
      })
      .from(records)
      .innerJoin(orders, eq(records.orderId, orders.orderId))
      .leftJoin(orderItems, eq(orders.orderId, orderItems.orderId))
      .innerJoin(doctors, eq(records.doctorId, doctors.doctorId))
      .innerJoin(clinics, eq(doctors.clinicId, clinics.clinicId))
      .leftJoin(caseTypes, eq(orderItems.caseTypeId, caseTypes.caseTypeId))
      .where(eq(records.caseStatus, 'to be reviewed by dentist'))
      .groupBy(
        records.recordId,
        doctors.doctorName,
        clinics.clinicName,
        orders.orderTotal,
        orders.paidAmount,
        orders.paymentStatus
      )
      .orderBy(desc(records.createdAt));

    // For each case, fetch associated images from history
    const casesWithImages = await Promise.all(
      reviewCases.map(async (caseItem) => {
        const images = await db
          .select({
            historyId: history.historyId,
            historyType: history.historyType,
            historyDate: history.historyDate,
            imageUrl: history.imageUrl
          })
          .from(history)
          .where(eq(history.recordId, caseItem.recordId))
          .orderBy(desc(history.historyId));

        return {
          ...caseItem,
          images: images.filter((img) => img.imageUrl)
        };
      })
    );

    return {
      cases: casesWithImages,
      userRole
    };
  } catch (error) {
    console.error('Error fetching review cases:', error);
    return {
      cases: [],
      userRole,
      error: 'Failed to fetch review cases'
    };
  }
};
