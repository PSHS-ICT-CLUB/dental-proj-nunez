-- Drop tables in the correct order to satisfy dependencies
DROP TABLE IF EXISTS history CASCADE; -- Drop history first, as it depends on records
DROP TABLE IF EXISTS records CASCADE; -- Drop records next, as both history and other tables depend on it.
DROP TABLE IF EXISTS doctors CASCADE; -- Drop doctors, which depends on clinics
DROP TABLE IF EXISTS clinics CASCADE; -- Drop clinics last, as it is depended on by doctors.
DROP TABLE IF EXISTS case_types CASCADE; -- Drop clinics last, as it is depended on by doctors.
DROP TABLE IF EXISTS supply CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;

CREATE TABLE supply (
	supply_id SERIAL PRIMARY KEY,
	supply_date DATE NOT NULL,
	supply_cost DECIMAL NOT NULL,
	supply_description TEXT
);

-- Table for Case Type
CREATE TABLE case_types (
    case_type_id SERIAL PRIMARY KEY,
    case_type_name VARCHAR(255) NOT NULL UNIQUE,
    number_of_cases INTEGER NOT NULL
);

-- Table for Clinics
CREATE TABLE clinics (
    clinic_id SERIAL PRIMARY KEY,
    clinic_name VARCHAR(255) NOT NULL UNIQUE
);

-- Table for Doctors
CREATE TABLE doctors (
    doctor_id SERIAL PRIMARY KEY,
    doctor_name VARCHAR(255) NOT NULL,
    clinic_id INTEGER REFERENCES clinics(clinic_id)
);

-- Table for orders
CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    order_date DATE NOT NULL,
    -- order_total DECIMAL GENERATED ALWAYS AS (
    --         (SELECT COALESCE(SUM(item_cost * item_quantity), 0)
    --         FROM order_items
    --         WHERE order_items.order_id = orders.order_id)
    --     ) STORED,
    order_total DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    excess_payment DECIMAL(10, 2),
	payment_method VARCHAR(255) NOT NULL ,
    payment_status VARCHAR(255) GENERATED ALWAYS AS (
        CASE 
            WHEN paid_amount >= order_total THEN 'paid'
            ELSE 'unpaid'
        END
    ) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
-- Table for Order Items
CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id),
    up_or_down VARCHAR(255) NOT NULL,
    case_type_id INTEGER REFERENCES case_types(case_type_id) NOT NULL,
    case_no SERIAL NOT NULL,
    item_cost DECIMAL NOT NULL,
    item_quantity INTEGER NOT NULL,
    order_description TEXT
);

-- Table for Records
CREATE TABLE records (
    record_id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(order_id),
    date_pickup DATE,
	time_pickup TIME WITH TIME ZONE,
	date_dropoff DATE,
	time_dropoff TIME WITH TIME ZONE,
    doctor_id INTEGER REFERENCES doctors(doctor_id) NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    description TEXT,
	remarks TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


CREATE INDEX idx_orders_payment_status ON orders(payment_status);

-- Table for History
CREATE TABLE history (
    history_id SERIAL PRIMARY KEY,
    history_type VARCHAR(255) NOT NULL,
    history_date DATE,
	history_time TIME WITH TIME ZONE DEFAULT CURRENT_TIME,
    record_id INTEGER REFERENCES records(record_id) NOT NULL,
	image_data BYTEA
);


-- Optional indexes for faster lookups
CREATE INDEX idx_records_patient_name ON records (patient_name);
CREATE INDEX idx_records_date_pickup ON records (date_pickup);
CREATE INDEX idx_records_doctor_id ON records (doctor_id);

-- Performance Indexes (Foreign Keys)
CREATE INDEX idx_orderItems_order_id ON order_items USING btree (order_id);
CREATE INDEX idx_orderItems_case_type_id ON order_items USING btree (case_type_id);
CREATE INDEX idx_doctors_clinic_id ON doctors USING btree (clinic_id);
CREATE INDEX idx_history_record_id ON history USING btree (record_id);

-- Sample Data Insertion
-- INSERT INTO clinics (clinic_name)
-- VALUES
--     ('St. Jude Clinic'),
--     ('Metro Medical Center');

-- INSERT INTO doctors (doctor_name, clinic_id)
-- VALUES
--     ('Dr. Ana Reyes', (SELECT clinic_id FROM clinics WHERE clinic_name = 'St. Jude Clinic')),
--     ('Dr. Ben Cruz', (SELECT clinic_id FROM clinics WHERE clinic_name = 'St. Jude Clinic')),
--     ('Dr. Carla Diaz', (SELECT clinic_id FROM clinics WHERE clinic_name = 'Metro Medical Center'));

-- -- Modified INSERT INTO records to use clinic and doctor names directly.
-- INSERT INTO records (case_type, date_pickup, doctor_name, clinic_name, patient_name, total_amount, paid_amount)
-- VALUES
--     ('OR', '2025-05-04', 'Dr. Ana Reyes', 'St. Jude Clinic', 'Juan Dela Cruz', 1500.00, 1500.00),
--     ('BJ', '2025-05-10', 'Dr. Ben Cruz', 'St. Jude Clinic', 'Maria Santos', 800.00, 1000.00),
--     ('IVO', '2025-05-15', 'Dr. Carla Diaz', 'Metro Medical Center', 'Ricardo Gomez', 1200.00, 1000.00);


--      { value: 'OR', label: 'OR' },
    --   { value: 'F', label: 'F' },
    --   { value: 'TH', label: 'TH' },
    --   { value: 'IVO', label: 'IVO' },
    --   { value: 'R', label: 'R' },
    --   { value: 'P', label: 'P' },
    --   { value: 'TIL', label: 'TIL' },
    --   { value: 'Z', label: 'Z' },
    --   { value: 'TC', label: 'TC' },
    --   { value: 'R', label: 'R' },
    --   { value: 'BJ', label: 'BJ' },
-- Inserting into case_types table
INSERT INTO case_types (case_type_name, number_of_cases)
VALUES
    ('OR', 0),
    ('F', 0),
    ('TH', 0),
    ('IVO', 0),
    ('R', 0),
    ('P', 0),
    ('TIL', 0),
    ('Z', 0),
    ('TC', 0),
    ('BJ', 0);

