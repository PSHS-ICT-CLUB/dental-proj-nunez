# Schema Audit - Findings with Code References

## 1. REMARKS FIELD MISUSE - CONFIRMED

### Evidence from Schema
```typescript
// src/lib/server/db/schema.ts - Line 151
remarks: text('remarks'),
```

### Current Usage in Code
From [upload_record/+page.server.ts](src/routes/upload_record/+page.server.ts):
```typescript
remarks: 'pending'  // Hardcoded status value
```

From [invoice page](src/routes/invoice/[caseNo]/+page.server.ts):
```typescript
// Used as actual notes in display
```

### Problem
| Purpose | Current Field | Problem |
|---------|---------------|---------|
| Status | `caseStatus` varchar(50) | ✓ Proper enum-like field |
| **Status (DUPLICATE)** | `remarks` text | ✗ **Using TEXT field for status** |
| Notes | `remarks` text | ✗ **Mixed purpose, no dedicated field** |

### Issue
The `remarks` field is conflicted between two uses:
1. Storing status values like `'pending'`, `'finished'`  
2. Storing actual case notes/comments

**With new `caseStatus` field, remarks should be repurposed for NOTES ONLY.**

---

## 2. MISSING INDEXES - CONFIRMED

### Current Indexes (3 total)
```typescript
// Line 177-190 in schema.ts
index('idx_records_date_pickup')    ✓
index('idx_records_doctor_id')      ✓
index('idx_records_patient_name')   ✓
```

### Critical Missing Indexes
```typescript
// These queries will be SLOW:
// Finding all cases in "to be deliver" status
SELECT * FROM records WHERE case_status = 'to be deliver'  // NO INDEX! 

// Finding received cases in date range  
SELECT * FROM records WHERE date_in >= ? AND date_in <= ?  // NO INDEX!

// Finding delivered cases
SELECT * FROM records WHERE date_out IS NOT NULL  // NO INDEX!

// Finding cases by order
SELECT * FROM records WHERE order_id = ?  // NO INDEX!

// Finding recently created cases
SELECT * FROM records ORDER BY created_at DESC  // NO INDEX!
```

### What Should Be Added
```typescript
// Add these to records table definition:
index('idx_records_case_status')      // Frequent workflow filtering
index('idx_records_date_in')          // Date range queries for case intake
index('idx_records_date_out')         // Date range queries for deliveries
index('idx_records_order_id')         // Join performance with orders
index('idx_records_created_at')       // Timeline queries

// For other tables:
index('idx_orders_created_at')        // Orders by date
index('idx_history_record_id')        // History lookups
index('idx_history_created_at')       // Timeline queries
index('idx_inventory_logs_date')      // Stock tracking by date
```

---

## 3. BOOLEAN FIELDS USING VARCHAR - CONFIRMED

### Affected Fields
```typescript
// src/lib/server/db/schema.ts - siteStatus table (Lines 275-287)

isLocked: varchar('is_locked', { length: 5 }).default('false'),  // ✗ WRONG TYPE
fakeError: varchar('fake_error', { length: 5 }).default('false'), // ✗ WRONG TYPE
phishingMode: varchar('phishing_mode', { length: 5 }).default('false'), // ✗ WRONG TYPE

// siteNotifications table (Line 271)
isActive: varchar('is_active', { length: 5 }).default('true'),   // ✗ WRONG TYPE
```

### Why This is Bad
| Aspect | TEXT/VARCHAR Approach | BOOLEAN Approach |
|--------|----------------------|------------------|
| **Storage** | 5+ bytes per field | 1 byte per field |
| **Query Performance** | String comparison required | Bitwise comparison |
| **Data Integrity** | Can store 'yes', 'no', 'maybe', '' | Only true/false |
| **Type Safety** | TypeScript can't enforce | DB enforces type |
| **Query Logic** | `WHERE is_locked = 'true'` | `WHERE is_locked = true` |

### Required Fix
```typescript
// Change from:
isLocked: varchar('is_locked', { length: 5 }).default('false'),

// To:
isLocked: boolean('is_locked').default(false),
```

---

## 4. DATE FIELD CONFUSION - CONFIRMED

### Current Fields in `records` Table

```typescript
// Line 155-156: Order timing
datePickup: date('date_pickup'),
timePickup: time('time_pickup', { withTimezone: true }),

// Line 157-159: Delivery timing (CONFUSING - 3 different fields!)
dateDropoff: date('date_dropoff'),
actualDropoff: timestamp('actual_dropoff', { withTimezone: true, mode: 'string' }),
timeDropoff: time('time_dropoff', { withTimezone: true }),

// Line 160-165: Case workflow (NEW IN QC SYSTEM)
dateIn: date('date_in'),           // When case ENTERED lab
timeIn: time('time_in'),           // When case ENTERED lab
dateOut: date('date_out'),         // When case APPROVED for delivery
timeOut: time('time_out'),         // When case APPROVED for delivery

// Line 162: Deadline
finishBy: timestamp('finish_by', { withTimezone: true, mode: 'string' }),
```

### Confusion Matrix
| Field | Purpose | When Set | Issue |
|-------|---------|----------|-------|
| `datePickup` | When client picks up case | Order creation | ✓ Clear |
| `dateDropoff` | **What is this date?** | ??? | ✗ Unclear |
| `actualDropoff` | Actually delivered | Manual | Separate from dateDropoff? |
| `timeDropoff` | Time component only (no date!) | ??? | ✗ Confusing |
| `dateIn` | Case received in lab | Case created | ✓ Clear (new) |
| `dateOut` | Case approved for delivery | Status changed | ✓ Clear (new) |
| `finishBy` | Hard deadline? | ??? | ✗ Unclear |

### Example Confusion
```sql
-- What does this query get you?
SELECT * FROM records 
WHERE dateDropoff <= '2024-01-31' 
AND actualDropoff IS NULL;

-- Cases with:
-- - dateDropoff in Jan 2024 (scheduled delivery)
-- - NOT actually delivered yet
-- But what's timeDropoff? Is it the delivery time?
-- Or did client pick it up at timePickup?
```

### Recommended Clarified Names
```typescript
// Rename to clarify intent:
datePickup      → orderPickupDate      (when client picks it up)
timePickup      → orderPickupTime      (what time)

dateDropoff     → scheduledReturnDate  (when we said we'd return it)
timeDropoff     → scheduledReturnTime  (what time)
actualDropoff   → actualDeliveryDate   (when we actually returned it)

dateIn          → caseReceiptDate      (when entered lab)
timeIn          → caseReceiptTime      (what time)

dateOut         → caseApprovalDate     (when approved for delivery)
timeOut         → caseApprovalTime     (what time)

finishBy        → completionDeadline   (hard deadline for case)
```

---

## 5. MISSING TIMESTAMPS IN TABLES - CONFIRMED

### Tables Without `createdAt` or `updatedAt`

```typescript
// Line 34-37: appSettings
export const appSettings = pgTable('app_settings', {
	key: varchar('key', { length: 255 }).primaryKey().notNull(),
	value: text('value').notNull()
	// ✗ NO CREATED_AT, NO UPDATED_AT
});

// Line 130-135: caseTypes  
export const caseTypes = pgTable('case_types', {
	caseTypeId: serial('case_type_id').primaryKey().notNull(),
	caseTypeName: varchar('case_type_name', { length: 255 }).notNull(),
	numberOfCases: integer('number_of_cases').notNull()
	// ✗ NO CREATED_AT, NO UPDATED_AT
});

// Line 267-272: siteNotifications - Missing updatedAt
export const siteNotifications = pgTable('site_notifications', {
	// ... fields ...
	createdAt: timestamp('created_at', ...).default(sql`CURRENT_TIMESTAMP`)
	// ✓ HAS CREATED_AT
	// ✗ MISSING UPDATED_AT
});

// Line 275-287: siteStatus - Missing updatedAt
export const siteStatus = pgTable('site_status', {
	// ... fields ...
	lockedAt: timestamp('locked_at', ...).default(sql`CURRENT_TIMESTAMP`)
	// ✓ HAS CUSTOM TIMESTAMP
	// ✗ MISSING STANDARD UPDATED_AT
});

// Line 316-323: technicians - Missing updatedAt
export const technicians = pgTable('technicians', {
	// ... fields ...
	createdAt: timestamp('created_at', ...).default(sql`CURRENT_TIMESTAMP`)
	// ✓ HAS CREATED_AT
	// ✗ MISSING UPDATED_AT
});
```

### Impact
Without timestamps:
- ❌ Can't audit when settings changed
- ❌ Can't track case type modifications
- ❌ Can't identify old notifications
- ❌ Can't audit staff changes
- ❌ Can't implement data recovery

---

## 6. ASSIGNED TECHNICIANS AS TEXT - CONFIRMED

### Current Implementation
```typescript
// Line 165 in schema.ts
assignedTechnicians: text('assigned_technicians'),
```

### Problem
```typescript
// What format is this text in?
// JSON array?
assignedTechnicians: '[1,2,3]'

// Comma-separated?
assignedTechnicians: '1,2,3'

// Space-separated?
assignedTechnicians: '1 2 3'

// Serialized object?
// Unclear from schema!
```

### Why This is Bad
```sql
-- Can you query it?
SELECT * FROM records WHERE assignedTechnicians LIKE '%3%'  -- ✗ Bug-prone

-- Can you join it?
SELECT * FROM records INNER JOIN technicians 
  ON -- ??? How to join text to integer?

-- Can you aggregate by technician?
-- Can't do GROUP BY assignedTechnicians

-- What if a technician is removed?
-- We'd need string manipulation to delete
```

### Proper Solution - Junction Table
```typescript
// Create new table:
export const recordTechnicianAssignments = pgTable(
  'record_technician_assignments',
  {
    id: serial('id').primaryKey(),
    recordId: integer('record_id').references(() => records.recordId),
    technicianId: integer('technician_id').references(() => technicians.id),
    assignedDate: timestamp('assigned_date').default(sql`CURRENT_TIMESTAMP`),
    assignedBy: integer('assigned_by').references(() => users.id),
    notes: text('notes')
  }
);

// Then query properly:
SELECT r.*, t.* FROM records r
  INNER JOIN record_technician_assignments rta ON r.record_id = rta.record_id
  INNER JOIN technicians t ON rta.technician_id = t.id
  WHERE r.record_id = ?
```

---

## 7. MISSING SOFT DELETES - CONFIRMED

### Current State
```typescript
// No deleted_at field in any table
// Example from records table:
export const records = pgTable('records', {
  recordId: serial('record_id').primaryKey().notNull(),
  orderId: integer('order_id'),
  // ... other fields ...
  updatedBy: integer('updated_by').references(() => users.id)
  // ✗ NO DELETED_AT, NO DELETED_BY, NO DELETION_REASON
});
```

### Risk
```sql
-- If you do DELETE FROM records WHERE record_id = 123
-- The record is GONE FOREVER - irreversible!

-- Audit trail is lost
-- Financial records are deleted
-- Order history is incomplete
-- Can't debug what happened
```

### Proper Solution
```typescript
export const records = pgTable('records', {
  // ... existing fields ...
  
  // Add soft delete support:
  deletedAt: timestamp('deleted_at'),  // NULL = active, timestamp = deleted
  deletedBy: integer('deleted_by').references(() => users.id),
  deletionReason: text('deletion_reason'),
  
  // Then add index for filtering:
  // index('idx_records_deleted').on(deletedAt)
});

// Usage:
// DELETE operation becomes UPDATE:
UPDATE records SET deleted_at = NOW(), deleted_by = ?, deletion_reason = ?
WHERE record_id = ?;

// SELECT operations filter active only:
SELECT * FROM records WHERE deleted_at IS NULL;
```

---

## QUICK SUMMARY TABLE

| Issue | Severity | Affected | Fix Complexity |
|-------|----------|----------|-----------------|
| Remarks misuse | **CRITICAL** | Financial tracking | Low |
| Missing indexes | **CRITICAL** | Performance | Low |
| Boolean as varchar | **HIGH** | Data integrity | Medium |
| Date field confusion | **HIGH** | Query logic | Medium |
| Missing timestamps | **HIGH** | Audit trail | Low |
| Technician text field | **HIGH** | Data integrity | High |
| No soft deletes | **MEDIUM** | Data recovery | High |
| Missing ForeignKey constraints | **MEDIUM** | Referential integrity | Medium |

---

## IMPLEMENTATION PRIORITY

### 🔴 Do IMMEDIATELY (This Week)
1. Add indexes for workflow queries (caseStatus, dateIn, dateOut)
2. Migrate remarks: separate notes from status
3. Convert boolean fields from varchar to boolean
4. Add missing timestamps to all tables

### 🟠 Do SOON (Next Week)
5. Clarify and rename date fields for consistency
6. Create record-technician junction table
7. Add soft delete support

### 🟡 Do LATER (Nice to Have)
8. Add case status change history table
9. Add payment audit logs
10. Add composite indexes for complex queries
