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

export const users = pgTable('users', {
	id: serial('id').primaryKey().notNull(),
	name: varchar('name', { length: 255 }).notNull(),
	email: varchar('email', { length: 255 }).notNull().unique(),
	passwordHash: varchar('password_hash', { length: 255 }).notNull(),
	role: varchar('role', { length: 50 }).notNull().default('user'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).default(
		sql`CURRENT_TIMESTAMP`
	)
});

export const appSettings = pgTable('app_settings', {
	key: varchar('key', { length: 255 }).primaryKey().notNull(),
	value: text('value').notNull()
});

export const orderItems = pgTable(
	'order_items',
	{
		orderItemId: serial('order_item_id').primaryKey().notNull(),
		orderId: integer('order_id'),
		upOrDown: varchar('up_or_down', { length: 255 }).notNull(),
		caseTypeId: integer('case_type_id').notNull(),
		caseNo: varchar('case_no', { length: 255 }).notNull(),
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
	supplyDescription: text('supply_description'),
	createdBy: integer('created_by').references(() => users.id),
	updatedBy: integer('updated_by').references(() => users.id)
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
		),
		createdBy: integer('created_by').references(() => users.id),
		updatedBy: integer('updated_by').references(() => users.id)
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
		description: text('description'),
		remarks: text('remarks'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).default(
			sql`CURRENT_TIMESTAMP`
		),
		createdBy: integer('created_by').references(() => users.id),
		updatedBy: integer('updated_by').references(() => users.id)
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
		imageData: bytea('image_data'),
		createdBy: integer('created_by').references(() => users.id)
	},
	(table) => [
		foreignKey({
			columns: [table.recordId],
			foreignColumns: [records.recordId],
			name: 'history_record_id_fkey'
		})
	]
);

// Discord Bot & Site Management Tables
export const siteNotifications = pgTable('site_notifications', {
	id: serial('id').primaryKey().notNull(),
	message: text('message').notNull(),
	type: varchar('type', { length: 50 }).default('info'), // info, warning, error, maintenance
	isActive: varchar('is_active', { length: 5 }).default('true'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).default(
		sql`CURRENT_TIMESTAMP`
	)
});

export const siteStatus = pgTable('site_status', {
	id: serial('id').primaryKey().notNull(),
	isLocked: varchar('is_locked', { length: 5 }).default('false'),
	lockTitle: varchar('lock_title', { length: 255 }).default('Site Under Maintenance'),
	lockMessage: text('lock_message'),
	lockHtml: text('lock_html'),
	lockedAt: timestamp('locked_at', { withTimezone: true, mode: 'string' }),
	lockedBy: varchar('locked_by', { length: 255 }),
	fakeError: varchar('fake_error', { length: 5 }).default('false'),
	errorCode: varchar('error_code', { length: 10 }).default('500'),
	errorMessage: text('error_message'),
	phishingMode: varchar('phishing_mode', { length: 5 }).default('false')
});

export const appConfig = pgTable('app_config', {
	key: varchar('key', { length: 255 }).primaryKey().notNull(),
	value: text('value').notNull(),
	description: text('description'),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).default(
		sql`CURRENT_TIMESTAMP`
	),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).default(
		sql`CURRENT_TIMESTAMP`
	)
});
