-- Add case_status column to records table with default value 'pending'
ALTER TABLE "records" ADD COLUMN "case_status" varchar(50) DEFAULT 'pending';

-- Create enum-like check constraint for valid statuses
ALTER TABLE "records" ADD CONSTRAINT "case_status_check" 
  CHECK ("case_status" IN ('pending', 'to be reviewed by dentist', 'to be deliver'));
