-- Add IN/OUT tracking columns for case workflow
ALTER TABLE "records" ADD COLUMN "date_in" date;
ALTER TABLE "records" ADD COLUMN "time_in" time with time zone;
ALTER TABLE "records" ADD COLUMN "date_out" date;
ALTER TABLE "records" ADD COLUMN "time_out" time with time zone;
