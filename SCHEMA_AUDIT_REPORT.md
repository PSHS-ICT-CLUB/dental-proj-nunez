# Schema Audit & Improvement Report

## Executive Summary
The current schema has several issues including field misuse, missing indexes, inconsistent data types, and lacks proper audit trails. This report identifies all issues and recommends improvements.

---

## 1. REMARKS FIELD ANALYSIS

### Current Purpose
The `remarks` field in the `records` table is **misused as a status flag** with values like:
- `"pending"` - case is pending
- `"finished"` - case is completed

### Why This is a Problem
1. **Redundancy**: Now conflicts with the new `caseStatus` field which is the proper status column
2. **Type Mismatch**: It's a `TEXT` field being used as an enum
3. **Data Quality**: Mixed purpose - actual remarks are mixed with status tracking
4. **Query Performance**: No constraints or indexes on status values
5. **Business Logic**: Comments like inventory logs use `remarks` for actual notes, while records use it for status

### Recommended Fix
**Rename and Repurpose**:
```sql
-- Add new column for actual remarks/notes
ALTER TABLE records ADD COLUMN case_notes TEXT;

-- Migrate existing non-status remarks
-- (Can be done in migration with logic to separate status from notes)

-- Deprecate remarks column (keep for backward compatibility temporarily)
ALTER TABLE records RENAME COLUMN remarks TO remarks_deprecated;

-- Document that remarks_deprecated is for transitions only
-- Actual notes should use case_notes
-- Status should use caseStatus
```

### New Field Purpose
| Field | Purpose | Type | Valid Values |
|-------|---------|------|--------------|
| `caseStatus` | **Workflow status** | varchar(50) | pending, to be reviewed by dentist, to be deliver |
| `case_notes` | **Comments on case** | text | Free text |

---

## 2. CRITICAL SCHEMA ISSUES

### Issue 1: Missing Indexes on Frequently Queried Fields

**Current Indexes (records table)**:
- ✓ idx_records_date_pickup
- ✓ idx_records_doctor_id
- ✓ idx_records_patient_name

**Missing Indexes**:
```sql
-- Critical for workflow queries
ALTER TABLE records ADD INDEX idx_records_case_status (case_status);
ALTER TABLE records ADD INDEX idx_records_date_in (date_in);
ALTER TABLE records ADD INDEX idx_records_date_out (date_out);
ALTER TABLE records ADD INDEX idx_records_created_at (created_at);
ALTER TABLE records ADD INDEX idx_records_order_id (order_id);

-- For other tables
ALTER TABLE orders ADD INDEX idx_orders_created_at (created_at);
ALTER TABLE history ADD INDEX idx_history_created_at (created_at);
ALTER TABLE history ADD INDEX idx_history_record_id (record_id);
```

**Impact**: Queries filtering by status, dates, or order_id will be slow without these.

---

### Issue 2: Inconsistent Data Types for Boolean Fields

**Problem**: Using `varchar(5)` with string values `'true'`/`'false'` instead of native boolean type.

**Affected Fields**:
- `siteStatus.isLocked` → should be `boolean`
- `siteStatus.fakeError` → should be `boolean`
- `siteStatus.phishingMode` → should be `boolean`
- `siteNotifications.isActive` → should be `boolean`

**Migration**:
```sql
-- For siteStatus
ALTER TABLE site_status 
  ADD COLUMN is_locked_bool BOOLEAN DEFAULT false,
  ADD COLUMN fake_error_bool BOOLEAN DEFAULT false,
  ADD COLUMN phishing_mode_bool BOOLEAN DEFAULT false;

UPDATE site_status 
  SET is_locked_bool = (is_locked = 'true'),
      fake_error_bool = (fake_error = 'true'),
      phishing_mode_bool = (phishing_mode = 'true');

ALTER TABLE site_status DROP COLUMN is_locked, is_locked_bool RENAME TO is_locked;
-- ... repeat for others
```

---

### Issue 3: Field Name Confusion (Dates)

**Problem**: Multiple date fields with unclear purposes.

**Current State**:
```
records table has:
  datePickup / timePickup     ← When received from client?
  dateDropoff / timeDropoff   ← When delivered back?
  dateIn / timeIn             ← When entered into system (Case IN)
  dateOut / timeOut           ← When approved for delivery (Case OUT)
  actualDropoff               ← When actually delivered
  finishBy                    ← Hard deadline?
```

**Confusion**: 
- What's the difference between `datePickup` and `dateIn`?
- What's the difference between `timeDropoff` and `actualDropoff`?
- Is `finishBy` a deadline or completion date?

**Recommendation**:
```sql
-- Rename for clarity
ALTER TABLE records 
  RENAME datePickup TO order_date_pickup,
  RENAME timePickup TO order_time_pickup,
  RENAME dateDropoff TO scheduled_date_dropoff,
  RENAME timeDropoff TO scheduled_time_dropoff,
  RENAME actualDropoff TO actual_delivery_datetime,
  RENAME dateIn TO case_received_date,
  RENAME timeIn TO case_received_time,
  RENAME dateOut TO case_approved_date,
  RENAME timeOut TO case_approved_time,
  RENAME finishBy TO deadline_completion;
```

**Field Glossary**:
| Field | Meaning | Set When |
|-------|---------|----------|
| `order_date_pickup` | When client is picking up | Order creation |
| `scheduled_date_dropoff` | Scheduled delivery date back | Order creation |
| `case_received_date/time` | When case received in lab (IN) | Case creation |
| `case_approved_date/time` | When case approved for delivery (OUT) | Status → "to be deliver" |
| `actual_delivery_datetime` | When case actually delivered | Manual update |
| `deadline_completion` | Hard deadline for completion | Order/Case details |

---

### Issue 4: Missing Timestamps in Several Tables

**Tables Missing `createdAt`/`updatedAt`**:
- `appSettings` - missing both
- `caseTypes` - missing both
- `technicians` - has `createdAt` only
- `inventorySuppliers` - has `createdAt` only
- `siteNotifications` - has `createdAt` only
- `siteStatus` - inconsistent timestamp names

**Add to all tables**:
```sql
ALTER TABLE app_settings ADD createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE app_settings ADD updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
-- ... and others
```

---

### Issue 5: Text Field Storing Structured Data

**Problem**: `assignedTechnicians` in records table stores text, should be proper relationship.

**Current**: 
```typescript
assignedTechnicians: text('assigned_technicians')  ← Comma-separated? JSON? Unclear
```

**Should be**:
```sql
-- Create junction table
CREATE TABLE record_technician_assignments (
  id SERIAL PRIMARY KEY,
  record_id INTEGER NOT NULL REFERENCES records(record_id),
  technician_id INTEGER NOT NULL REFERENCES technicians(id),
  assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  assigned_by INTEGER REFERENCES users(id),
  notes TEXT
);

-- Add index
CREATE INDEX idx_record_technician ON record_technician_assignments(record_id);
CREATE INDEX idx_technician_assignments ON record_technician_assignments(technician_id);
```

---

## 3. MISSING AUDIT & TRACKING FEATURES

### Issue 6: No Status Change History

**Problem**: When `caseStatus` changes, there's no history of transitions.

**Recommendation**:
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
CREATE INDEX idx_case_history_date ON case_status_history(changed_at);
```

---

### Issue 7: No Soft Deletes

**Problem**: Deleted records are permanently gone, no audit trail.

**Recommendation**:
```sql
-- Add to records table (and other critical tables)
ALTER TABLE records ADD COLUMN deleted_at TIMESTAMP NULL;
ALTER TABLE records ADD COLUMN deleted_by INTEGER REFERENCES users(id);
ALTER TABLE records ADD COLUMN deletion_reason TEXT;

-- Add index for active records
CREATE INDEX idx_records_active ON records(deleted_at);
```

---

### Issue 8: Missing Audit Logs for Financial Data

**Problem**: Orders and payments have no detailed audit trail.

**Recommendation**:
```sql
CREATE TABLE order_payment_audits (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(order_id),
  old_paid_amount NUMERIC(10, 2),
  new_paid_amount NUMERIC(10, 2),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  changed_by INTEGER REFERENCES users(id),
  change_reason TEXT
);

CREATE INDEX idx_payment_audit_order ON order_payment_audits(order_id);
```

---

## 4. DATA CONSISTENCY ISSUES

### Issue 9: Missing Not Null Constraints

**Fields that should be NOT NULL but aren't**:
- `orders.createdBy` - should track who created the order
- `supply.createdBy` - should track creator
- `history.recordId` - is NOT NULL ✓ (correct)
- `deliveryCourier` - might need default if mandatory
- `deliveryFee` - might need default if optional

---

### Issue 10: Missing Unique Constraints

**Fields that should be unique but aren't**:
- `users.email` - ✓ (has unique constraint)
- `technicians.email` - should be unique
- `inventorySuppliers` - phone should probably be indexed for lookup

---

## 5. RELATIONSHIP & REFERENTIAL INTEGRITY ISSUES

### Issue 11: Weak Doctor-Record Relationship

**Current State**:
- Records have `doctorId` (FK to doctors)
- Orders don't have doctor info directly
- No cascade delete policies defined

**Recommendation**:
```sql
-- Define ON DELETE behavior
ALTER TABLE records 
  DROP CONSTRAINT records_doctor_id_fkey,
  ADD CONSTRAINT records_doctor_id_fkey
    FOREIGN KEY (doctor_id) 
    REFERENCES doctors(doctor_id)
    ON DELETE RESTRICT;  -- Prevent deletion if records exist

-- Similar for other FKs
ALTER TABLE order_items
  DROP CONSTRAINT (if exists),
  ADD CONSTRAINT order_items_order_id_fkey
    FOREIGN KEY (order_id)
    REFERENCES orders(order_id)
    ON DELETE CASCADE;  -- Delete items if order deleted
```

---

### Issue 12: Missing Clinic-Record Connection

**Problem**: Records are linked to doctorId, but which clinic? Requires JOIN.

**Considered but rejected**: Adding clinicId directly would denormalize, as clinic is available through doctor.

---

## 6. PERFORMANCE CONCERNS

### Issue 13: Missing Composite Indexes

**Recommended Composite Indexes**:
```sql
-- For case workflow queries
CREATE INDEX idx_records_clinic_status ON records(
  (SELECT clinic_id FROM doctors WHERE id = doctor_id),
  case_status,
  date_in
);

-- For history timeline
CREATE INDEX idx_history_record_type ON history(record_id, history_type);

-- For inventory tracking
CREATE INDEX idx_inventory_logs_item_date ON inventory_logs(item_id, date);

-- For orders and payments
CREATE INDEX idx_orders_status_date ON orders(
  (CASE WHEN (paid_amount >= order_total) THEN 'paid' ELSE 'unpaid' END),
  created_at
);
```

---

## SUMMARY OF IMPROVEMENTS REQUIRED

### Priority 1 (Critical - Do First)
1. ✓ Add missing indexes on `caseStatus`, `dateIn`, `dateOut`, `createdAt`
2. ✓ Fix remarks field misuse - separate status from notes
3. ✓ Convert boolean varchar fields to actual BOOLEAN type
4. ✓ Create `case_status_history` table for audit trail

### Priority 2 (Important - Do Second)
5. ✓ Add missing timestamps to all tables
6. ✓ Clarify and rename date fields for consistency
7. ✓ Create `record_technician_assignments` junction table
8. ✓ Add soft deletes support

### Priority 3 (Nice to Have - Do Later)
9. ✓ Add payment audit logs
10. ✓ Define cascade delete policies
11. ✓ Add composite indexes for complex queries
12. ✓ Document all field purposes in schema comments

---

## IMPLEMENTATION ROADMAP

**Phase 1** (This Sprint):
- Add missing indexes
- Migrate remarks to proper fields
- Convert boolean fields

**Phase 2** (Next Sprint):
- Add audit tables
- Add missing timestamps
- Rename date fields for clarity

**Phase 3** (Following Sprint):
- Fix relationships
- Add soft deletes
- Add payment audit logs

---

## RECOMMENDATIONS CHECKLIST

- [ ] Review and approve field naming changes
- [ ] Create migration scripts for all changes
- [ ] Update TypeScript schema after migrations
- [ ] Add database comments documenting all fields
- [ ] Create data warehousing/backup strategy for audit tables
- [ ] Add retention policies for audit logs
- [ ] Document new audit table usage in API/business logic
