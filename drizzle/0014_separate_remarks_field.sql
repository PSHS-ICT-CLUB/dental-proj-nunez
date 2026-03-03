-- Separate remarks field: add case_notes for actual notes, keep caseStatus for workflow status
ALTER TABLE records
  ADD COLUMN case_notes TEXT;

-- Migrate remarks that are not status values to case_notes
UPDATE records
  SET case_notes = remarks
  WHERE remarks IS NOT NULL 
    AND remarks NOT IN ('pending', 'finished', 'to be reviewed', 'to be deliver', 'to be reviewed by dentist');

-- Clean up remarks field - it was misused as a status field
-- Keeping it for backward compatibility but renaming to mark as deprecated
ALTER TABLE records RENAME COLUMN remarks TO remarks_deprecated;

-- Add comment for future removal
COMMENT ON COLUMN records.remarks_deprecated IS 'DEPRECATED: Use case_notes for notes and caseStatus for workflow status. Kept for backward compatibility only.';
