-- Fix boolean fields that are incorrectly stored as varchar
-- Use explicit CAST for safe type conversion
-- Must drop defaults first, then change type, then set new defaults

-- Fix site_notifications table
ALTER TABLE site_notifications
  ALTER COLUMN is_active DROP DEFAULT;

ALTER TABLE site_notifications
  ALTER COLUMN is_active TYPE boolean USING (is_active = 'true');

ALTER TABLE site_notifications
  ALTER COLUMN is_active SET DEFAULT true;

-- Fix site_status table
ALTER TABLE site_status
  ALTER COLUMN is_locked DROP DEFAULT;

ALTER TABLE site_status
  ALTER COLUMN is_locked TYPE boolean USING (is_locked = 'true');

ALTER TABLE site_status
  ALTER COLUMN is_locked SET DEFAULT false;

-- Fix fake_error column
ALTER TABLE site_status
  ALTER COLUMN fake_error DROP DEFAULT;

ALTER TABLE site_status
  ALTER COLUMN fake_error TYPE boolean USING (fake_error = 'true');

ALTER TABLE site_status
  ALTER COLUMN fake_error SET DEFAULT false;

-- Fix phishing_mode column
ALTER TABLE site_status
  ALTER COLUMN phishing_mode DROP DEFAULT;

ALTER TABLE site_status
  ALTER COLUMN phishing_mode TYPE boolean USING (phishing_mode = 'true');

ALTER TABLE site_status
  ALTER COLUMN phishing_mode SET DEFAULT false;
