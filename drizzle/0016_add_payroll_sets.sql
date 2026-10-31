-- Payroll: saved payout sets and generated payroll batches (idempotent)

CREATE TABLE IF NOT EXISTS payroll_sets (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payroll_set_items (
  id SERIAL PRIMARY KEY,
  set_id INTEGER NOT NULL REFERENCES payroll_sets(id) ON DELETE CASCADE,
  technician_id INTEGER REFERENCES technicians(id) ON DELETE SET NULL,
  employee_name VARCHAR(255) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS payroll_set_items_set_id_idx ON payroll_set_items (set_id);

CREATE TABLE IF NOT EXISTS payroll_batches (
  id SERIAL PRIMARY KEY,
  set_id INTEGER REFERENCES payroll_sets(id) ON DELETE SET NULL,
  set_name VARCHAR(255),
  pay_date DATE NOT NULL,
  period_start DATE,
  period_end DATE,
  notes TEXT,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS payroll_batches_pay_date_idx ON payroll_batches (pay_date);

CREATE TABLE IF NOT EXISTS payroll_entries (
  id SERIAL PRIMARY KEY,
  batch_id INTEGER NOT NULL REFERENCES payroll_batches(id) ON DELETE CASCADE,
  technician_id INTEGER REFERENCES technicians(id) ON DELETE SET NULL,
  employee_name VARCHAR(255) NOT NULL,
  amount NUMERIC(12, 2) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS payroll_entries_batch_id_idx ON payroll_entries (batch_id);
