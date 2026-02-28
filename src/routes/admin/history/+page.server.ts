import { db } from '$lib/server/db';
import { history, records, users } from '$lib/server/db/schema';
import { desc, sql, eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth();
  if (session?.user?.role !== 'admin') {
    throw redirect(303, '/');
  }

  let logs = [];
  try {
    const recordCreations = await db
      .select({
        id: records.recordId,
        recordId: records.recordId,
        actionType: sql`'created_record'`,
        createdAt: records.createdAt,
        creatorName: users.name,
        patientName: records.patientName
      })
      .from(records)
      .leftJoin(users, eq(records.createdBy, users.id))
      .orderBy(desc(records.recordId));

    const historyUploads = await db
      .select({
        historyId: history.historyId,
        recordId: history.recordId,
        actionType: history.historyType,
        historyDate: history.historyDate,
        historyTime: history.historyTime,
        creatorName: users.name
      })
      .from(history)
      .leftJoin(users, eq(history.createdBy, users.id))
      .orderBy(desc(history.historyId));

    // Format dates into unified objects
    const formattedRecords = recordCreations.map(r => ({
      id: 'r-' + r.id,
      recordId: r.recordId,
      actionName: 'Created Record (Patient: ' + r.patientName + ')',
      timestamp: new Date(r.createdAt || Date.now()),
      creatorName: r.creatorName || 'Unknown Admin',
      isHistory: false
    }));

    const formattedHistory = historyUploads.map(h => {
      // combine date and time string
      const timeStr = h.historyTime ? String(h.historyTime).split('+')[0] : '00:00:00';
      return {
        id: 'h-' + h.historyId,
        recordId: h.recordId,
        actionName: 'Uploaded ' + String(h.actionType).toUpperCase() + ' Image',
        timestamp: new Date(`${h.historyDate}T${timeStr}`),
        creatorName: h.creatorName || 'Unknown Admin',
        isHistory: true
      };
    });

    logs = [...formattedRecords, ...formattedHistory].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  } catch (error) {
    console.error('Error fetching admin history:', error);
  }

  return {
    logs
  };
};
