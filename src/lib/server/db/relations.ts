import { relations } from 'drizzle-orm/relations';
import { orders, orderItems, caseTypes, clinics, doctors, records, history } from './schema';

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.orderId]
	}),
	caseType: one(caseTypes, {
		fields: [orderItems.caseTypeId],
		references: [caseTypes.caseTypeId]
	})
}));

export const ordersRelations = relations(orders, ({ many }) => ({
	orderItems: many(orderItems),
	records: many(records)
}));

export const caseTypesRelations = relations(caseTypes, ({ many }) => ({
	orderItems: many(orderItems)
}));

export const doctorsRelations = relations(doctors, ({ one, many }) => ({
	clinic: one(clinics, {
		fields: [doctors.clinicId],
		references: [clinics.clinicId]
	}),
	records: many(records)
}));

export const clinicsRelations = relations(clinics, ({ many }) => ({
	doctors: many(doctors)
}));

export const recordsRelations = relations(records, ({ one, many }) => ({
	order: one(orders, {
		fields: [records.orderId],
		references: [orders.orderId]
	}),
	doctor: one(doctors, {
		fields: [records.doctorId],
		references: [doctors.doctorId]
	}),
	histories: many(history)
}));

export const historyRelations = relations(history, ({ one }) => ({
	record: one(records, {
		fields: [history.recordId],
		references: [records.recordId]
	})
}));
