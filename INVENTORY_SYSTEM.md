# Dental Clinic Inventory System Documentation

## Overview
The inventory system tracks dental supplies, stock levels, usage history (logs), and supplier information.

## Database Tables

### 1. `inventory_suppliers`
Tracks the companies or individuals where supplies are purchased.
- `id` (Serial, Primary Key)
- `name` (String, Required) - Supplier name
- `contact_person` (String) - Main point of contact
- `phone` (String) - Contact number
- `email` (String) - Contact email address
- `address` (Text) - Physical address
- `notes` (Text) - Any extra information
- `created_at` (Timestamp)

### 2. `inventory_items`
The catalog of dental supplies and their current stock levels.
- `id` (Serial, Primary Key)
- `name` (String, Required) - Item name (e.g., Nitrile Gloves)
- `category` (String) - Grouping (e.g., Disposables, Tools)
- `current_stock` (Integer, Default 0) - How many are currently on hand
- `unit` (String) - Measurement unit (e.g., box, piece, pack)
- `minimum_stock_level` (Integer, Default 0) - Alerts staff when stock falls below this number
- `expiration_date` (Date) - Optional expiration date tracking
- `supplier_id` (Integer, Foreign Key) - Links to `inventory_suppliers`
- `created_at` (Timestamp)
- `updated_at` (Timestamp)

### 3. `inventory_logs`
An audit trail recording every time an item is added, removed, or adjusted.
- `id` (Serial, Primary Key)
- `item_id` (Integer, Foreign Key) - Links to `inventory_items`
- `action_type` (String, Required) - Typically `IN`, `OUT`, or `ADJUSTMENT`
- `quantity` (Integer, Required) - Amount changed
- `date` (Timestamp) - When the action happened
- `remarks` (Text) - Reason for the change
- `created_by` (Integer, Foreign Key) - Links to the `users` table to track who made the change

## Key Workflows
1. **Adding a New Supplier:** Go to `/inventory/suppliers` and add a new supplier record.
2. **Adding a New Item:** Go to `/inventory` and add a new item, assigning it a supplier and a minimum stock level.
3. **Receiving Stock (IN):** When new supplies arrive, log an `IN` action for the item with the received quantity. The system automatically updates `current_stock`.
4. **Using Stock (OUT):** When stock is used in the clinic, log an `OUT` action. The system deducts from `current_stock`.
5. **Adjusting Stock (ADJUSTMENT):** If the physical count doesn't match the system, use `ADJUSTMENT` to correct it.
6. **Low Stock Alerts:** Items where `current_stock <= minimum_stock_level` will be visually flagged on the dashboard.
