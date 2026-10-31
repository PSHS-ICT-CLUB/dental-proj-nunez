-- Create app_settings key/value store for application settings (idempotent)
CREATE TABLE IF NOT EXISTS app_settings (
    "key" VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL
);

-- ============================================
-- Discord Bot & Site Management Tables
-- ============================================

-- Site notifications (banners)
CREATE TABLE IF NOT EXISTS site_notifications (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info',  -- info, warning, error, maintenance
  is_active VARCHAR(5) DEFAULT 'true',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Site lockdown status
CREATE TABLE IF NOT EXISTS site_status (
  id SERIAL PRIMARY KEY,
  is_locked VARCHAR(5) DEFAULT 'false',
  lock_title VARCHAR(255) DEFAULT 'Site Under Maintenance',
  lock_message TEXT,
  lock_html TEXT,
  locked_at TIMESTAMP WITH TIME ZONE,
  locked_by VARCHAR(255),
  fake_error VARCHAR(5) DEFAULT 'false',
  error_code VARCHAR(10) DEFAULT '500',
  error_message TEXT,
  phishing_mode VARCHAR(5) DEFAULT 'false'
);

-- Add phishing_mode column if it doesn't exist (for existing tables)
DO $$ 
BEGIN 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='site_status' AND column_name='phishing_mode') THEN
    ALTER TABLE site_status ADD COLUMN phishing_mode VARCHAR(5) DEFAULT 'false';
  END IF;
END $$;

-- Insert default row if not exists
INSERT INTO site_status (id, is_locked, fake_error, phishing_mode) VALUES (1, 'false', 'false', 'false') ON CONFLICT (id) DO NOTHING;

-- Environment/Config storage (for syncing to .env)
CREATE TABLE IF NOT EXISTS app_config (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

