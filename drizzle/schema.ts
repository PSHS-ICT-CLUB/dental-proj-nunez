import {
	pgTable,
	foreignKey,
	serial,
	integer,
	varchar,
	numeric,
	text,
	date,
	unique,
	index,
	timestamp,
	time,
	customType
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const orderItems = pgTable(
	'order_items',
	{
		orderItemId: serial('order_item_id').primaryKey().notNull(),
		orderId: integer('order_id'),
		upOrDown: varchar('up_or_down', { length: 255 }).notNull(),
		caseTypeId: integer('case_type_id').notNull(),
		caseNo: serial('case_no').notNull(),
		itemCost: numeric('item_cost').notNull(),
		itemQuantity: integer('item_quantity').notNull(),
		orderDescription: text('order_description')
	},
	(table) => [
		foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.orderId],
			name: 'order_items_order_id_fkey'
		}),
		foreignKey({
			columns: [table.caseTypeId],
			foreignColumns: [caseTypes.caseTypeId],
			name: 'order_items_case_type_id_fkey'
		})
	]
);

export const supply = pgTable('supply', {
	supplyId: serial('supply_id').primaryKey().notNull(),
	supplyDate: date('supply_date').notNull(),
	supplyCost: numeric('supply_cost').notNull(),
	supplyDescription: text('supply_description')
});

export const clinics = pgTable(
	'clinics',
	{
		clinicId: serial('clinic_id').primaryKey().notNull(),
		clinicName: varchar('clinic_name', { length: 255 }).notNull()
	},
	(table) => [unique('clinics_clinic_name_key').on(table.clinicName)]
);

export const doctors = pgTable(
	'doctors',
	{
		doctorId: serial('doctor_id').primaryKey().notNull(),
		doctorName: varchar('doctor_name', { length: 255 }).notNull(),
		clinicId: integer('clinic_id')
	},
	(table) => [
		foreignKey({
			columns: [table.clinicId],
			foreignColumns: [clinics.clinicId],
			name: 'doctors_clinic_id_fkey'
		})
	]
);

export const orders = pgTable(
	'orders',
	{
		orderId: serial('order_id').primaryKey().notNull(),
		orderDate: date('order_date').notNull(),
		orderTotal: numeric('order_total', { precision: 10, scale: 2 }).notNull(),
		paidAmount: numeric('paid_amount', { precision: 10, scale: 2 }),
		excessPayment: numeric('excess_payment', { precision: 10, scale: 2 }),
		paymentMethod: varchar('payment_method', { length: 255 }).notNull(),
		paymentStatus: varchar('payment_status', { length: 255 }).generatedAlwaysAs(sql`
CASE
    WHEN (paid_amount >= order_total) THEN 'paid'::text
    ELSE 'unpaid'::text
END`),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).default(
			sql`CURRENT_TIMESTAMP`
		)
	},
	(table) => [
		index('idx_orders_payment_status').using(
			'btree',
			table.paymentStatus.asc().nullsLast().op('text_ops')
		)
	]
);

export const caseTypes = pgTable(
	'case_types',
	{
		caseTypeId: serial('case_type_id').primaryKey().notNull(),
		caseTypeName: varchar('case_type_name', { length: 255 }).notNull(),
		numberOfCases: integer('number_of_cases').notNull()
	},
	(table) => [unique('case_types_case_type_name_key').on(table.caseTypeName)]
);

export const records = pgTable(
	'records',
	{
		recordId: serial('record_id').primaryKey().notNull(),
		orderId: integer('order_id'),
		datePickup: date('date_pickup'),
		timePickup: time('time_pickup', { withTimezone: true }),
		dateDropoff: date('date_dropoff'),
		timeDropoff: time('time_dropoff', { withTimezone: true }),
		doctorId: integer('doctor_id').notNull(),
		patientName: varchar('patient_name', { length: 255 }).notNull(),
		description: text(),
		remarks: text(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).default(
			sql`CURRENT_TIMESTAMP`
		)
	},
	(table) => [
		index('idx_records_date_pickup').using(
			'btree',
			table.datePickup.asc().nullsLast().op('date_ops')
		),
		index('idx_records_doctor_id').using('btree', table.doctorId.asc().nullsLast().op('int4_ops')),
		index('idx_records_patient_name').using(
			'btree',
			table.patientName.asc().nullsLast().op('text_ops')
		),
		foreignKey({
			columns: [table.orderId],
			foreignColumns: [orders.orderId],
			name: 'records_order_id_fkey'
		}),
		foreignKey({
			columns: [table.doctorId],
			foreignColumns: [doctors.doctorId],
			name: 'records_doctor_id_fkey'
		})
	]
);
export const bytea = customType<{ data: Buffer; notNull: false; default: false }>({
	dataType() {
		return 'bytea';
	}
});
export const history = pgTable(
	'history',
	{
		historyId: serial('history_id').primaryKey().notNull(),
		historyType: varchar('history_type', { length: 255 }).notNull(),
		historyDate: date('history_date'),
		historyTime: time('history_time', { withTimezone: true }).default(sql`CURRENT_TIME`),
		recordId: integer('record_id').notNull(),
		// TODO: failed to parse database type 'bytea'
		imageData: bytea('image_data')
	},
	(table) => [
		foreignKey({
			columns: [table.recordId],
			foreignColumns: [records.recordId],
			name: 'history_record_id_fkey'
		})
	]
);
