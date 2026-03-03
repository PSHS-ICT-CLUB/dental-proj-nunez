-- Add missing indexes for critical queries on records table
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
