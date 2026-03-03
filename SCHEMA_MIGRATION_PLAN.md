# Schema Improvements - Migration Action Plan

## Phase 1: CRITICAL FIXES (Do This Week)

### Step 1: Add Missing Indexes on `records` Table

**File**: `drizzle/0009_add_missing_indexes.sql`

```sql
-- Add missing indexes for common queries
CREATE INDEX idx_records_case_status ON records(case_status);
CREATE INDEX idx_records_date_in ON records(date_in);
CREATE INDEX idx_records_date_out ON records(date_out);
CREATE INDEX idx_records_order_id ON records(order_id);
CREATE INDEX idx_records_created_at ON records(created_at DESC);

-- Add indexes for other tables
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_history_record_id ON history(record_id);
CREATE INDEX idx_history_created_at ON history(created_at DESC);
CREATE INDEX idx_inventory_logs_date ON inventory_logs(date DESC);
CREATE INDEX idx_inventory_logs_item_id ON inventory_logs(item_id);

-- Verify indexes were created:
-- SELECT * FROM pg_indexes WHERE tablename = 'records';
```

**After running**: `bun run db:push`

---

### Step 2: Convert Boolean Fields from VARCHAR to BOOLEAN

**File**: `drizzle/0010_fix_boolean_fields.sql`

```sql
-- 1. Add new boolean columns to siteStatus
ALTER TABLE site_status
  ADD COLUMN is_locked_bool BOOLEAN DEFAULT false,
  ADD COLUMN fake_error_bool BOOLEAN DEFAULT false,
  ADD COLUMN phishing_mode_bool BOOLEAN DEFAULT false;

-- 2. Migrate data from string to boolean
UPDATE site_status
  SET is_locked_bool = (is_locked = 'true'),
      fake_error_bool = (fake_error = 'true'),
      phishing_mode_bool = (phishing_mode = 'true');

-- 3. Drop old columns and rename new ones
ALTER TABLE site_status
  DROP COLUMN is_locked,
  DROP COLUMN fake_error,
  DROP COLUMN phishing_mode;

ALTER TABLE site_status
  RENAME COLUMN is_locked_bool TO is_locked,
  RENAME COLUMN fake_error_bool TO fake_error,
  RENAME COLUMN phishing_mode_bool TO phishing_mode;

-- 4. Similarly for siteNotifications
ALTER TABLE site_notifications
  ADD COLUMN is_active_bool BOOLEAN DEFAULT true;

UPDATE site_notifications
  SET is_active_bool = (is_active = 'true');

ALTER TABLE site_notifications
  DROP COLUMN is_active;

ALTER TABLE site_notifications
  RENAME COLUMN is_active_bool TO is_active;
```

**After running**: Update `src/lib/server/db/schema.ts`:
```typescript
// Change from:
isLocked: varchar('is_locked', { length: 5 }).default('false'),

// To:
isLocked: boolean('is_locked').default(false),
```

---

### Step 3: Add Missing Timestamps

**File**: `drizzle/0011_add_missing_timestamps.sql`

```sql
-- Add to appSettings
ALTER TABLE app_settings
  ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add to caseTypes
ALTER TABLE case_types
  ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at to siteNotifications
ALTER TABLE site_notifications
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add standard updated_at to siteStatus (in addition to existing lockedAt)
ALTER TABLE site_status
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add updated_at to technicians
ALTER TABLE technicians
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add to history
ALTER TABLE history
  ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
```

**After running**: Update schema.ts with new timestamp fields.

---

### Step 4: Separate Remarks into Notes

**File**: `drizzle/0012_separate_remarks_from_status.sql`

```sql
-- Add new column for actual case notes
ALTER TABLE records
  ADD COLUMN case_notes TEXT;

-- Migrate non-status remarks to case_notes
-- (This requires manual review as we need to identify which remarks are status vs notes)
UPDATE records
  SET case_notes = remarks
  WHERE remarks IS NOT NULL 
    AND remarks NOT IN ('pending', 'finished', 'to be reviewed', 'to be deliver');

-- Clear the remarks field (or rename for backup)
ALTER TABLE records RENAME COLUMN remarks TO remarks_deprecated;

-- In future release, we can drop remarks_deprecated
-- For now, keep for backward compatibility with any legacy code
```

**After running**: 
- Update `src/routes/upload_record/+page.server.ts` to remove the line `remarks: 'pending'`
- Update any code that writes to remarks to use case_notes instead
- Update any code that reads from remarks to use caseStatus for status checks

---

## Phase 2: IMPORTANT FIXES (Do Next Week)

### Step 5: Clarify Date Field Names

**File**: `drizzle/0013_clarify_date_fields.sql`

```sql
-- Rename fields to clarify their purpose
ALTER TABLE records
  RENAME COLUMN date_pickup TO order_pickup_date,
  RENAME COLUMN time_pickup TO order_pickup_time,
  RENAME COLUMN date_dropoff TO scheduled_return_date,
  RENAME COLUMN time_dropoff TO scheduled_return_time,
  RENAME COLUMN date_in TO case_receipt_date,
  RENAME COLUMN time_in TO case_receipt_time,
  RENAME COLUMN date_out TO case_approval_date,
  RENAME COLUMN time_out TO case_approval_time,
  RENAME COLUMN finish_by TO completion_deadline;

-- Update indexes to match new names
DROP INDEX idx_records_date_pickup;
CREATE INDEX idx_records_case_receipt_date ON records(case_receipt_date);
```

**After running**: 
- Update ALL code references throughout the codebase
- Search for: `datePickup`, `timePickup`, `dateDropoff`, etc.
- Replace with new names
- Update components, routes, and utilities

---

### Step 6: Create Record-Technician Junction Table

**File**: `drizzle/0014_create_technician_assignments.sql`

```sql
-- Create junction table for many-to-many relationship
CREATE TABLE record_technician_assignments (
  id SERIAL PRIMARY KEY,
  record_id INTEGER NOT NULL REFERENCES records(record_id) ON DELETE CASCADE,
  technician_id INTEGER NOT NULL REFERENCES technicians(id) ON DELETE RESTRICT,
  assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INTEGER REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_record_technician_record ON record_technician_assignments(record_id);
CREATE INDEX idx_record_technician_tech ON record_technician_assignments(technician_id);
CREATE INDEX idx_record_technician_assigned ON record_technician_assignments(assigned_date DESC);

-- Create migration helper view for existing data (if any)
-- This allows querying old text field as rows:
CREATE VIEW record_technician_assignments_legacy AS
-- (Implementation depends on format of assignedTechnicians field)

-- Then, migrate data and drop old column:
-- INSERT INTO record_technician_assignments (record_id, technician_id, assigned_date)
-- SELECT ... FROM records WHERE assigned_technicians IS NOT NULL

-- Finally, drop the old text column:
-- ALTER TABLE records DROP COLUMN assigned_technicians;
```

**After running**:
- Create new TypeScript type for junction table
- Update queries to use junction table
- Create utility functions to add/remove technician assignments
- Update UI components for technician selection

---

### Step 7: Add Soft Delete Support

**File**: `drizzle/0015_add_soft_deletes.sql`

```sql
-- Add soft delete columns to critical tables
ALTER TABLE records
  ADD COLUMN deleted_at TIMESTAMP,
  ADD COLUMN deleted_by INTEGER REFERENCES users(id),
  ADD COLUMN deletion_reason TEXT;

ALTER TABLE orders
  ADD COLUMN deleted_at TIMESTAMP,
  ADD COLUMN deleted_by INTEGER REFERENCES users(id),
  ADD COLUMN deletion_reason TEXT;

-- Add index for filtering active records
CREATE INDEX idx_records_deleted ON records(deleted_at);
CREATE INDEX idx_orders_deleted ON orders(deleted_at);

-- Create helper views for querying active records only
CREATE VIEW active_records AS
  SELECT * FROM records WHERE deleted_at IS NULL;

CREATE VIEW active_orders AS
  SELECT * FROM orders WHERE deleted_at IS NULL;
```

**After running**:
- Update all SELECT queries to filter `WHERE deleted_at IS NULL`
- Create DELETE helper functions instead of direct DELETE
- Create recovery functions to restore soft-deleted records
- Add admin UI for viewing/managing deletions

---

## Phase 3: NICE TO HAVE (Do Later)

### Step 8: Case Status Change History

**File**: `drizzle/0016_add_case_status_history.sql`

```sql
CREATE TABLE case_status_history (
  id SERIAL PRIMARY KEY,
  record_id INTEGER NOT NULL REFERENCES records(record_id),
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changed_by INTEGER REFERENCES users(id),
  reason TEXT,
  notes TEXT
);

CREATE INDEX idx_case_history_record ON case_status_history(record_id);
CREATE INDEX idx_case_history_date ON case_status_history(changed_at DESC);

-- Create trigger to auto-record status changes
CREATE OR REPLACE FUNCTION log_case_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.case_status != NEW.case_status THEN
    INSERT INTO case_status_history
      (record_id, old_status, new_status, changed_by)
    VALUES
      (NEW.record_id, OLD.case_status, NEW.case_status, NEW.updated_by);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER case_status_change_trigger
  BEFORE UPDATE ON records
  FOR EACH ROW
  EXECUTE FUNCTION log_case_status_change();
```

---

### Step 9: Payment Audit Trail

**File**: `drizzle/0017_add_payment_audits.sql`

```sql
CREATE TABLE order_payment_audits (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(order_id),
  old_paid_amount NUMERIC(10, 2),
  new_paid_amount NUMERIC(10, 2),
  amount_change NUMERIC(10, 2),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changed_by INTEGER REFERENCES users(id),
  change_reason TEXT
);

CREATE INDEX idx_payment_audit_order ON order_payment_audits(order_id);
CREATE INDEX idx_payment_audit_date ON order_payment_audits(changed_at DESC);
```

---

## How to Apply These Migrations

### Using Drizzle ORM

1. **Create each migration file**:
   ```bash
   # For each step above, create a file in drizzle/ folder
   # Format: drizzle/0009_add_missing_indexes.sql
   ```

2. **Push migrations to database**:
   ```bash
   bun run db:push
   ```

3. **Verify migrations applied**:
   ```bash
   # Connect to your database:
   psql $DATABASE_URL
   
   # Check indexes:
   SELECT * FROM pg_indexes WHERE tablename = 'records';
   
   # Check columns:
   SELECT column_name, data_type FROM information_schema.columns 
   WHERE table_name = 'site_status';
   
   # Check for deleted_at column:
   SELECT * FROM information_schema.columns 
   WHERE table_name = 'records' AND column_name = 'deleted_at';
   ```

### Update TypeScript Schema

After each migration, run:
```bash
bun run db:introspect
```

This automatically updates `src/lib/server/db/schema.ts` to reflect new columns.

---

## Code Updates Checklist

### After Step 1 (Indexes)
- ✓ No code changes needed
- ✓ Run `bun run db:push`

### After Step 2 (Boolean Fix)
- [ ] Update `schema.ts` to use `boolean()` type
- [ ] Run `bun run build` to verify types
- [ ] Test siteStatus and siteNotifications queries

### After Step 3 (Missing Timestamps)
- [ ] Update `schema.ts` to add timestamp fields
- [ ] Add timestamps to forms that create these records
- [ ] Update audit logging code

### After Step 4 (Remarks Separation)
- [ ] Remove `remarks: 'pending'` from upload_record
- [ ] Search codebase for "remarks" usage
- [ ] Update invoice page to use `case_notes` instead
- [ ] Update any display components

### After Step 5 (Date Field Clarification)
- [ ] Global find-and-replace for all date field names:
  - `datePickup` → `orderPickupDate`
  - `timePickup` → `orderPickupTime`
  - `dateDropoff` → `scheduledReturnDate`
  - `timeDropoff` → `scheduledReturnTime`
  - `dateIn` → `caseReceiptDate`
  - `timeIn` → `caseReceiptTime`
  - `dateOut` → `caseApprovalDate`
  - `timeOut` → `caseApprovalTime`
  - `finishBy` → `completionDeadline`
- [ ] Update all TypeScript code
- [ ] Update all database queries
- [ ] Test date filtering functionality

### After Step 6 (Technician Assignments)
- [ ] Create `recordTechnicianAssignments` table type in schema
- [ ] Create utility functions for add/remove assignments
- [ ] Update components for technician selection
- [ ] Migrate existing data from text field
- [ ] Drop old `assignedTechnicians` column

### After Step 7 (Soft Deletes)
- [ ] Add soft delete wrapper functions
- [ ] Update all DELETE operations to use soft delete
- [ ] Update all SELECT operations to filter active records
- [ ] Create admin recovery interface
- [ ] Update API endpoints for soft delete support

### After Step 8-9 (History & Audits)
- [ ] Integrate status history into detail pages
- [ ] Create audit view in admin panel
- [ ] Add triggers for automatic logging

---

## Testing Strategy

### Before Running Migrations

```bash
# 1. Backup database
pg_dump $DATABASE_URL > backup_before_migration.sql

# 2. Test on development database
# Apply migrations to dev first
bun run db:push

# 3. Run your test suite
bun run test

# 4. Check performance
psql $DATABASE_URL
```

### After Running Migrations

```bash
# 1. Verify all data is intact
SELECT COUNT(*) FROM records WHERE deleted_at IS NULL;
SELECT COUNT(*) FROM orders WHERE deleted_at IS NULL;

# 2. Check index efficiency
EXPLAIN ANALYZE
SELECT * FROM records 
WHERE case_status = 'pending' 
AND case_receipt_date >= '2024-01-01';

# 3. Verify boolean fields
SELECT * FROM site_status LIMIT 1;
-- Should show: is_locked: boolean

# 4. Check new timestamp fields
SELECT created_at, updated_at FROM app_settings LIMIT 1;
```

---

## Roll Back Plan

If something goes wrong:

```bash
# 1. Restore from backup
psql $DATABASE_URL < backup_before_migration.sql

# 2. Or, if using Drizzle migrations
# Revert the last migration:
bun run db:push --schema-path old_schema_backup.ts

# 3. Or manually run reverse migration
psql $DATABASE_URL < reverse_migration.sql
```

---

## Next Steps

1. **This Week**: Run Phase 1 migrations (Steps 1-4)
2. **Next Week**: Run Phase 2 migrations (Steps 5-7)
3. **Later**: Consider Phase 3 (Steps 8-9)

For questions on any migration, refer to:
- `SCHEMA_AUDIT_REPORT.md` - Detailed analysis
- `SCHEMA_FINDINGS_VISUAL.md` - Visual evidence
