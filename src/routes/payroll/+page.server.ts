import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db';
import {
	payrollBatches,
	payrollEntries,
	payrollSetItems,
	payrollSets,
	technicians
} from '$lib/server/db/schema';
import { and, asc, between, desc, eq, ne, sql } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { requireDeletePermission } from '$lib/server/roles';
import { toLocalDateString } from '$lib/utils/date';

type PayoutLineInput = {
	employeeName?: unknown;
	amount?: unknown;
	notes?: unknown;
};

type CleanLine = {
	employeeName: string;
	amount: string;
	notes: string | null;
	technicianId: number | null;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseId(value: FormDataEntryValue | null): number | null {
	if (value === null) return null;
	const n = parseInt(value.toString(), 10);
	return Number.isFinite(n) && n > 0 ? n : null;
}

function parseDate(value: FormDataEntryValue | null): string | null {
	const s = value?.toString().trim() ?? '';
	return DATE_RE.test(s) ? s : null;
}

/**
 * Parse and validate the JSON-encoded payout lines sent by the client.
 * Resolves technician ids by case-insensitive name match.
 */
async function parseLines(
	raw: FormDataEntryValue | null,
	{ allowZero }: { allowZero: boolean }
): Promise<{ lines: CleanLine[] } | { error: string }> {
	let parsed: unknown;
	try {
		parsed = JSON.parse(raw?.toString() ?? '[]');
	} catch {
		return { error: 'Invalid payout lines' };
	}
	if (!Array.isArray(parsed)) return { error: 'Invalid payout lines' };

	const techRows = await db
		.select({ id: technicians.id, name: technicians.name })
		.from(technicians);
	const techByName = new Map(techRows.map((t) => [t.name.trim().toLowerCase(), t.id]));

	const lines: CleanLine[] = [];
	for (const [i, line] of (parsed as PayoutLineInput[]).entries()) {
		const employeeName = String(line?.employeeName ?? '').trim();
		const amountNum = Number(line?.amount);
		const notes = String(line?.notes ?? '').trim();

		// Skip rows left completely blank
		if (!employeeName && (line?.amount === '' || line?.amount == null)) continue;

		if (!employeeName) return { error: `Line ${i + 1}: employee name is required` };
		if (employeeName.length > 255) return { error: `Line ${i + 1}: employee name is too long` };
		if (!Number.isFinite(amountNum) || amountNum < 0 || (!allowZero && amountNum === 0)) {
			return {
				error: `Line ${i + 1} (${employeeName}): amount must be ${allowZero ? 'zero or more' : 'greater than zero'}`
			};
		}
		if (amountNum > 9_999_999_999) return { error: `Line ${i + 1}: amount is too large` };

		lines.push({
			employeeName,
			amount: amountNum.toFixed(2),
			notes: notes || null,
			technicianId: techByName.get(employeeName.toLowerCase()) ?? null
		});
	}
	return { lines };
}

async function currentUserId(locals: App.Locals): Promise<number | null> {
	const session = await locals.auth();
	const id = parseInt(session?.user?.id ?? '', 10);
	return Number.isFinite(id) ? id : null;
}

function isUniqueViolation(error: unknown): boolean {
	return (error as { code?: string })?.code === '23505';
}

export const load: PageServerLoad = async ({ url, locals }) => {
	const session = await locals.auth();
	const now = new Date();

	let selectedYear = parseInt(url.searchParams.get('year') ?? '', 10);
	if (!Number.isFinite(selectedYear)) selectedYear = now.getFullYear();
	let selectedMonth = parseInt(url.searchParams.get('month') ?? '', 10);
	if (!Number.isFinite(selectedMonth) || selectedMonth < 1 || selectedMonth > 12) {
		selectedMonth = now.getMonth() + 1;
	}

	const startDate = toLocalDateString(new Date(selectedYear, selectedMonth - 1, 1));
	const endDate = toLocalDateString(new Date(selectedYear, selectedMonth, 0));

	const [setRows, itemRows, technicianRows, batchRows, entryRows] = await Promise.all([
		db.select().from(payrollSets).orderBy(asc(payrollSets.name)),
		db
			.select()
			.from(payrollSetItems)
			.orderBy(asc(payrollSetItems.setId), asc(payrollSetItems.sortOrder), asc(payrollSetItems.id)),
		db
			.select({ id: technicians.id, name: technicians.name, role: technicians.role })
			.from(technicians)
			.orderBy(asc(technicians.name)),
		db
			.select()
			.from(payrollBatches)
			.where(between(payrollBatches.payDate, startDate, endDate))
			.orderBy(desc(payrollBatches.payDate), desc(payrollBatches.id)),
		db
			.select({
				id: payrollEntries.id,
				batchId: payrollEntries.batchId,
				employeeName: payrollEntries.employeeName,
				amount: payrollEntries.amount,
				notes: payrollEntries.notes
			})
			.from(payrollEntries)
			.innerJoin(payrollBatches, eq(payrollEntries.batchId, payrollBatches.id))
			.where(between(payrollBatches.payDate, startDate, endDate))
			.orderBy(asc(payrollEntries.id))
	]);

	const sets = setRows.map((s) => {
		const items = itemRows
			.filter((i) => i.setId === s.id)
			.map((i) => ({
				id: i.id,
				employeeName: i.employeeName,
				amount: Number(i.amount),
				notes: i.notes ?? ''
			}));
		return {
			id: s.id,
			name: s.name,
			description: s.description ?? '',
			updatedAt: s.updatedAt,
			items,
			total: items.reduce((sum, i) => sum + i.amount, 0)
		};
	});

	const batches = batchRows.map((b) => {
		const entries = entryRows
			.filter((e) => e.batchId === b.id)
			.map((e) => ({ ...e, amount: Number(e.amount), notes: e.notes ?? '' }));
		return {
			id: b.id,
			setId: b.setId,
			setName: b.setName,
			payDate: b.payDate,
			periodStart: b.periodStart,
			periodEnd: b.periodEnd,
			notes: b.notes ?? '',
			entries,
			total: entries.reduce((sum, e) => sum + e.amount, 0)
		};
	});

	return {
		currentMonth: selectedMonth,
		currentYear: selectedYear,
		sets,
		technicians: technicianRows,
		batches,
		monthTotal: batches.reduce((sum, b) => sum + b.total, 0),
		user: session?.user
	};
};

export const actions = {
	changeMonth: async ({ request }) => {
		const data = await request.formData();
		const month = parseInt(data.get('month')?.toString() ?? '', 10);
		const year = parseInt(data.get('year')?.toString() ?? '', 10);
		if (!Number.isFinite(month) || !Number.isFinite(year)) redirect(303, '/payroll');
		redirect(303, `?month=${month}&year=${year}`);
	},

	/** Create or update a saved payout set (replaces all of its lines). */
	saveSet: async ({ request, locals }) => {
		const data = await request.formData();
		const setId = parseId(data.get('set_id'));
		const name = data.get('name')?.toString().trim() ?? '';
		const description = data.get('description')?.toString().trim() ?? '';

		if (!name) return fail(400, { action: 'saveSet', error: 'Set name is required' });
		if (name.length > 255) return fail(400, { action: 'saveSet', error: 'Set name is too long' });

		const result = await parseLines(data.get('items'), { allowZero: true });
		if ('error' in result) return fail(400, { action: 'saveSet', error: result.error });
		if (result.lines.length === 0) {
			return fail(400, { action: 'saveSet', error: 'Add at least one employee to the set' });
		}

		const duplicate = await db
			.select({ id: payrollSets.id })
			.from(payrollSets)
			.where(
				setId
					? and(sql`lower(${payrollSets.name}) = lower(${name})`, ne(payrollSets.id, setId))
					: sql`lower(${payrollSets.name}) = lower(${name})`
			)
			.limit(1);
		if (duplicate.length > 0) {
			return fail(400, { action: 'saveSet', error: `A set named "${name}" already exists` });
		}

		const userId = await currentUserId(locals);

		try {
			const savedId = await db.transaction(async (tx) => {
				let id = setId;
				if (id) {
					const updated = await tx
						.update(payrollSets)
						.set({
							name,
							description: description || null,
							updatedAt: sql`CURRENT_TIMESTAMP`
						} as Partial<typeof payrollSets.$inferInsert>)
						.where(eq(payrollSets.id, id))
						.returning({ id: payrollSets.id });
					if (updated.length === 0) throw new Error('SET_NOT_FOUND');
					await tx.delete(payrollSetItems).where(eq(payrollSetItems.setId, id));
				} else {
					const [created] = await tx
						.insert(payrollSets)
						.values({
							name,
							description: description || null,
							createdBy: userId
						} as typeof payrollSets.$inferInsert)
						.returning({ id: payrollSets.id });
					id = created.id;
				}

				await tx.insert(payrollSetItems).values(
					result.lines.map((line, index) => ({
						setId: id!,
						technicianId: line.technicianId,
						employeeName: line.employeeName,
						amount: line.amount,
						notes: line.notes,
						sortOrder: index
					})) as (typeof payrollSetItems.$inferInsert)[]
				);
				return id!;
			});

			return {
				action: 'saveSet',
				success: true,
				savedSetId: savedId,
				message: `Saved set "${name}" (${result.lines.length} employees)`
			};
		} catch (error) {
			if (error instanceof Error && error.message === 'SET_NOT_FOUND') {
				return fail(404, { action: 'saveSet', error: 'That set no longer exists' });
			}
			if (isUniqueViolation(error)) {
				return fail(400, { action: 'saveSet', error: `A set named "${name}" already exists` });
			}
			console.error('Error saving payroll set:', error);
			return fail(500, { action: 'saveSet', error: 'Failed to save payroll set' });
		}
	},

	deleteSet: async ({ request, locals }) => {
		const denied = await requireDeletePermission(locals);
		if (denied) return denied;

		const data = await request.formData();
		const setId = parseId(data.get('set_id'));
		if (!setId) return fail(400, { action: 'deleteSet', error: 'Set ID is required' });

		try {
			// Items cascade; past batches keep their set_name snapshot (set_id -> NULL)
			await db.delete(payrollSets).where(eq(payrollSets.id, setId));
			return { action: 'deleteSet', success: true, message: 'Payroll set deleted' };
		} catch (error) {
			console.error('Error deleting payroll set:', error);
			return fail(500, { action: 'deleteSet', error: 'Failed to delete payroll set' });
		}
	},

	/** Post a batch of payouts, typically loaded from a saved set and adjusted. */
	generate: async ({ request, locals }) => {
		const data = await request.formData();
		const setId = parseId(data.get('set_id'));
		const payDate = parseDate(data.get('pay_date'));
		const periodStart = parseDate(data.get('period_start'));
		const periodEnd = parseDate(data.get('period_end'));
		const notes = data.get('notes')?.toString().trim() ?? '';
		const confirmDuplicate = data.get('confirm_duplicate') === '1';

		if (!payDate) return fail(400, { action: 'generate', error: 'Pay date is required' });
		if (periodStart && periodEnd && periodStart > periodEnd) {
			return fail(400, { action: 'generate', error: 'Period start must be before period end' });
		}

		const result = await parseLines(data.get('entries'), { allowZero: false });
		if ('error' in result) return fail(400, { action: 'generate', error: result.error });
		if (result.lines.length === 0) {
			return fail(400, { action: 'generate', error: 'Include at least one payout' });
		}

		let setName: string | null = null;
		if (setId) {
			const [set] = await db
				.select({ name: payrollSets.name })
				.from(payrollSets)
				.where(eq(payrollSets.id, setId))
				.limit(1);
			if (!set) return fail(404, { action: 'generate', error: 'Selected set no longer exists' });
			setName = set.name;

			// Guard against posting the same set twice for one pay date
			if (!confirmDuplicate) {
				const existing = await db
					.select({ id: payrollBatches.id })
					.from(payrollBatches)
					.where(and(eq(payrollBatches.setId, setId), eq(payrollBatches.payDate, payDate)))
					.limit(1);
				if (existing.length > 0) {
					return fail(409, {
						action: 'generate',
						duplicate: true,
						error: `"${setName}" was already posted for ${payDate}. Post again to record a second batch.`
					});
				}
			}
		}

		const userId = await currentUserId(locals);

		try {
			await db.transaction(async (tx) => {
				const [batch] = await tx
					.insert(payrollBatches)
					.values({
						setId,
						setName,
						payDate,
						periodStart,
						periodEnd,
						notes: notes || null,
						createdBy: userId
					} as typeof payrollBatches.$inferInsert)
					.returning({ id: payrollBatches.id });

				await tx.insert(payrollEntries).values(
					result.lines.map((line) => ({
						batchId: batch.id,
						technicianId: line.technicianId,
						employeeName: line.employeeName,
						amount: line.amount,
						notes: line.notes
					})) as (typeof payrollEntries.$inferInsert)[]
				);
			});

			const total = result.lines.reduce((sum, l) => sum + Number(l.amount), 0);
			const [y, m] = payDate.split('-').map(Number);
			return {
				action: 'generate',
				success: true,
				postedMonth: m,
				postedYear: y,
				message: `Posted payroll for ${result.lines.length} employees on ${payDate} (total ${total.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })})`
			};
		} catch (error) {
			console.error('Error generating payroll:', error);
			return fail(500, { action: 'generate', error: 'Failed to post payroll' });
		}
	},

	deleteBatch: async ({ request, locals }) => {
		const denied = await requireDeletePermission(locals);
		if (denied) return denied;

		const data = await request.formData();
		const batchId = parseId(data.get('batch_id'));
		if (!batchId) return fail(400, { action: 'deleteBatch', error: 'Batch ID is required' });

		try {
			await db.delete(payrollBatches).where(eq(payrollBatches.id, batchId));
			return { action: 'deleteBatch', success: true, message: 'Payroll batch deleted' };
		} catch (error) {
			console.error('Error deleting payroll batch:', error);
			return fail(500, { action: 'deleteBatch', error: 'Failed to delete payroll batch' });
		}
	},

	deleteEntry: async ({ request, locals }) => {
		const denied = await requireDeletePermission(locals);
		if (denied) return denied;

		const data = await request.formData();
		const entryId = parseId(data.get('entry_id'));
		if (!entryId) return fail(400, { action: 'deleteEntry', error: 'Entry ID is required' });

		try {
			await db.transaction(async (tx) => {
				const [deleted] = await tx
					.delete(payrollEntries)
					.where(eq(payrollEntries.id, entryId))
					.returning({ batchId: payrollEntries.batchId });
				if (!deleted) return;
				// Drop the batch if this was its last payout
				const remaining = await tx
					.select({ count: sql<number>`count(*)::int` })
					.from(payrollEntries)
					.where(eq(payrollEntries.batchId, deleted.batchId));
				if ((remaining[0]?.count ?? 0) === 0) {
					await tx.delete(payrollBatches).where(eq(payrollBatches.id, deleted.batchId));
				}
			});
			return { action: 'deleteEntry', success: true, message: 'Payout removed' };
		} catch (error) {
			console.error('Error deleting payroll entry:', error);
			return fail(500, { action: 'deleteEntry', error: 'Failed to remove payout' });
		}
	}
} satisfies Actions;
