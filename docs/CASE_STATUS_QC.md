# Case Status Quality Control System

## Overview
This quality control system implements role-based case status management with IN/OUT tracking to ensure proper workflow control in the dental practice management system. Cases progress through defined statuses with automatic date/time tracking:
- **Case IN**: Automatically recorded when a case is created (intake/received)
- **Case OUT**: Automatically recorded when status changes to "To Be Deliver" (ready for delivery)

Only users with appropriate roles can make status changes.

## Case Lifecycle

```
1. Case Created (Status: Pending)
   ↓ Automatically sets: dateIn, timeIn
   ↓ (Staff action)
2. Change to "To Be Reviewed By Dentist"
   ↓ (Dentist action)
3. Change to "To Be Deliver" ← Automatically sets: dateOut, timeOut
   ↓ (Technician/Staff action - Case is OUT)
4. Add IN record (only possible at this stage)
   ↓ (Quality Control - Case processing)
```

## Case Statuses

### 1. **Pending** (Initial Status)
- **Default status** for newly created cases
- Indicates the case is awaiting action or review
- **Role allowed to set**: Staff, Admin

### 2. **To Be Reviewed By Dentist**
- Case is ready for dentist review before delivery
- After dentist review and approval, status should change to "To Be Deliver"
- **Role allowed to set**: Staff, Admin
- **Prerequisite**: Usually follows "Pending" status

### 3. **To Be Deliver** (Ready for Action)
- Case is ready for delivery or action to be taken
- **Only** when status is "To Be Deliver" can cases be taken out for action (IN page)
- **Role allowed to set**: Dentist, Admin
- **Indicates**: Case has been approved and is ready for the next phase

## Role-Based Permissions

### Staff Role
- Can change status to:
  - `pending`
  - `to be reviewed by dentist`
- Cannot change to: `to be deliver`

### Dentist Role
- Can change status to:
  - `to be deliver`
- Cannot change to: `pending`, `to be reviewed by dentist`

### Admin Role
- Can change status to all statuses:
  - `pending`
  - `to be reviewed by dentist`
  - `to be deliver`

## Implementation Details

### Database Schema
Added `case_status` column to `records` table:
```sql
ALTER TABLE "records" ADD COLUMN "case_status" varchar(50) DEFAULT 'pending' NOT NULL;
ALTER TABLE "records" ADD CONSTRAINT "case_status_check" 
  CHECK ("case_status" IN ('pending', 'to be reviewed by dentist', 'to be deliver'));
```

Added IN/OUT tracking columns:
```sql
ALTER TABLE "records" ADD COLUMN "date_in" date;
ALTER TABLE "records" ADD COLUMN "time_in" time with time zone;
ALTER TABLE "records" ADD COLUMN "date_out" date;
ALTER TABLE "records" ADD COLUMN "time_out" time with time zone;
```

### IN/OUT Tracking Fields

| Field | When Set | Description |
|-------|----------|-------------|
| `dateIn` | On case creation | Date when case was received/created (intake date) |
| `timeIn` | On case creation | Time when case was received/created (intake time) |
| `dateOut` | When status → "to be deliver" | Date when case goes out for delivery/action |
| `timeOut` | When status → "to be deliver" | Time when case goes out for delivery/action |

### Automatic Date/Time Setting

**When Case is Created (IN):**
- `dateIn` is set to the date provided in the form
- `timeIn` is set to the time provided in the form
- Status defaults to `pending`

**When Status Changes to "To Be Deliver" (OUT):**
- `dateOut` is automatically set to the current date
- `timeOut` is automatically set to the current time
- This marks when the case is ready for delivery/action  CHECK ("case_status" IN ('pending', 'to be reviewed by dentist', 'to be deliver'));
```

### API Endpoint: `/api/case-status`

#### POST Request
Changes the status of a case with role-based permission validation.

**Request Body:**
```json
{
  "recordId": 123,
  "newStatus": "to be deliver"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Case status updated to 'To Be Deliver'",
  "record": {
    "recordId": 123,
    "patientName": "John Doe",
    "caseStatus": "to be deliver"
  }
}
```

**Error Responses:**
- **400**: Invalid recordId or status
- **401**: User not authenticated
- **403**: User role does not have permission to change to that status
- **404**: Record not found
- **500**: Server error

#### GET Request
Returns valid statuses and role permissions.

**Success Response (200):**
```json
{
  "validStatuses": [
    "pending",
    "to be reviewed by dentist",
    "to be deliver"
  ],
  "rolePermissions": {
    "staff": ["pending", "to be reviewed by dentist"],
    "dentist": ["to be deliver"],
    "admin": ["pending", "to be reviewed by dentist", "to be deliver"]
  }
}
```

## IN Page (Action) Restrictions

The IN page (`/IN/[caseNo]`) now enforces that **cases can only be taken out for action if the status is "to be deliver"**:

1. **Status Display**: Shows current case status with color-coded badge
2. **Status Check**: 
   - If status is NOT "to be deliver": Form is disabled, error message displayed
   - If status IS "to be deliver": Form is enabled, user can proceed
3. **Error Message**: Users see clear message about why they cannot proceed

### Visual Indicators:
- **Yellow Warning**: Status is not "To Be Deliver" - action not available
- **Green Success**: Status is "To Be Deliver" - ready for action

## Components

### CaseStatusManager.svelte
Reusable component for displaying and changing case status in forms:

```svelte
<script>
  import CaseStatusManager from '$lib/components/CaseStatusManager.svelte';
  let userRole = 'staff';
</script>

<CaseStatusManager 
  recordId={recordId}
  currentStatus={caseStatus}
  userRole={userRole}
  onStatusChange={(newStatus) => console.log('Status changed to:', newStatus)}
/>
```

**Props:**
- `recordId` (number, required): The case/record ID
- `currentStatus` (string): Current status of the case
- `userRole` (string): User's role for permission checking
- `onStatusChange` (function): Callback when status changes

## Utility Functions (caseStatusUtils.ts)

### Available Functions:

```typescript
// Get available statuses for a role
getAvailableStatusesForRole(userRole: string): CaseStatus[]

// Check if user can change to a status
canChangeToStatus(userRole: string, targetStatus: string): boolean

// Get status display information
getStatusConfig(status: string): {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  description: string;
}

// Check if case can be actioned
canActionCase(caseStatus: string): boolean

// Get status workflow timeline
getStatusWorkflow(): Array<{status, label, nextStages}>
```

## Files Modified/Created

### New Files:
1. `drizzle/0007_add_case_status.sql` - Database migration
2. `src/routes/api/case-status/+server.ts` - API endpoint
3. `src/lib/components/CaseStatusManager.svelte` - Reusable component
4. `src/lib/utils/caseStatusUtils.ts` - Utility functions
5. `docs/CASE_STATUS_QC.md` - This documentation

### Modified Files:
1. `src/lib/server/db/schema.ts` - Added caseStatus field to records table
2. `src/routes/IN/[caseNo]/+page.server.ts` - Added status check before allowing action
3. `src/routes/IN/[caseNo]/+page.svelte` - Added status display and form controls

## Testing the Implementation

### Test Case 1: Staff User Status Change
```
1. Login as staff user
2. Navigate to a case detail page
3. Attempt to change status to "pending" - SHOULD SUCCEED
4. Attempt to change status to "to be deliver" - SHOULD FAIL (permission denied)
```

### Test Case 2: Dentist User Status Change
```
1. Login as dentist user
2. Navigate to a case detail page
3. Attempt to change status to "to be deliver" - SHOULD SUCCEED
4. Attempt to change status to "pending" - SHOULD FAIL (permission denied)
```

### Test Case 3: IN Page Access Control
```
1. Create/navigate to a case with status "pending"
2. Navigate to IN page for that case
3. Form should be DISABLED with error message
4. Change status to "to be deliver"
5. Refresh page - form should now be ENABLED
6. User can now add IN record
```

### Test Case 4: Admin User Full Access
```
1. Login as admin user
2. Should be able to change to any status
3. Should be able to access IN page for any status
```

## Workflow Example

Typical case progression with IN/OUT tracking:

```
1. Case Created (Status: Pending) - CASE IN ✓
   └─ dateIn & timeIn automatically recorded
   └─ (Staff intake action)
   
2. Change to "To Be Reviewed By Dentist" (by Staff)
   └─ Status pending review
   
3. Change to "To Be Deliver" (by Dentist) - CASE OUT ✓
   └─ dateOut & timeOut automatically recorded
   └─ Case is now ready for delivery/action
   
4. Add IN record/Action (only possible now)
   └─ Record case processing photos/details
   └─ (Quality Control - Technician action on ready case)
   
5. Complete case processing
   └─ Case workflow complete
```

### Timeline Example:
```
dateIn:  2026-03-01 (Case received)
timeIn:  14:30

→ Staff reviews → Dentist approves → Status changed to "to be deliver"

dateOut: 2026-03-04 (Case marked OUT)
timeOut: 09:15

→ Case is now active and can be processed
```

## Security Considerations

1. **Role Validation**: All status changes are validated server-side based on user role
2. **User Authentication**: All API requests require valid session
3. **Permission Enforcement**: Users cannot bypass permissions through API or UI
4. **Audit Trail**: Status changes are recorded with `updatedBy` user ID and timestamp
5. **Automatic Tracking**: IN/OUT dates are automatically set, preventing manual manipulation
5. **Database Constraints**: Check constraint on database ensures only valid statuses

## Future Enhancements

1. **Status History Tracking**: Log all status changes with timestamps
2. **Workflow Rules**: Define custom workflows based on case type
3. **Automated Transitions**: Auto-change status based on certain actions
4. **Notifications**: Alert relevant users when status changes
5. **Audit Reports**: Generate reports on status change patterns
6. **Status-based Permissions**: Different features accessible based on status

## Support & Troubleshooting

### Issue: User cannot change status despite having correct role
- Verify user role in database
- Check API response for specific error message
- Ensure database migration has been applied

### Issue: IN page form not disabling even with wrong status
- Clear browser cache
- Verify caseStatus is being loaded correctly
- Check browser console for JavaScript errors

### Issue: API returns 403 Forbidden
- Check user's role is correctly set
- Verify role matches ROLE_PERMISSIONS configuration
- Confirm target status is valid

