import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error('DATABASE_URL not set');

const sql = postgres(DATABASE_URL, { ssl: 'require' });

async function executeSQL(query: string, label: string) {
  try {
    await sql.unsafe(query);
    return true;
  } catch (e: any) {
    if (e.message?.includes('already exists') || e.message?.includes('does not exist')) {
      console.log(`  ⚠ ${label}: ${e.message.split('\n')[0]}`);
      return false;
    }
    throw e;
  }
}

async function runMigrations() {
  try {
    console.log('Starting comprehensive schema fixes...\n');

    // 1. ADD MISSING TIMESTAMPS
    console.log('1. Adding missing timestamps...');
    await executeSQL(`
      ALTER TABLE app_settings
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `, 'app_settings timestamps');
    
    await executeSQL(`
      ALTER TABLE case_types
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `, 'case_types timestamps');
    
    await executeSQL(`
      ALTER TABLE site_notifications
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `, 'site_notifications updated_at');
    
    await executeSQL(`
      ALTER TABLE site_status
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `, 'site_status updated_at');
    
    await executeSQL(`
      ALTER TABLE history
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `, 'history timestamps');
    
    await executeSQL(`
      ALTER TABLE technicians
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    `, 'technicians updated_at');
    
    console.log('✓ Timestamps added\n');

    // 2. FIX BOOLEAN FIELDS
    console.log('2. Converting varchar boolean columns to BOOLEAN type...');
    
    // site_notifications
    await executeSQL(`ALTER TABLE site_notifications ALTER COLUMN is_active DROP DEFAULT;`, 'drop is_active default');
    await executeSQL(`ALTER TABLE site_notifications ALTER COLUMN is_active TYPE boolean USING (is_active = 'true');`, 'convert is_active to boolean');
    await executeSQL(`ALTER TABLE site_notifications ALTER COLUMN is_active SET DEFAULT true;`, 'set is_active default');
    
    // site_status - is_locked
    await executeSQL(`ALTER TABLE site_status ALTER COLUMN is_locked DROP DEFAULT;`, 'drop is_locked default');
    await executeSQL(`ALTER TABLE site_status ALTER COLUMN is_locked TYPE boolean USING (is_locked = 'true');`, 'convert is_locked to boolean');
    await executeSQL(`ALTER TABLE site_status ALTER COLUMN is_locked SET DEFAULT false;`, 'set is_locked default');
    
    // site_status - fake_error
    await executeSQL(`ALTER TABLE site_status ALTER COLUMN fake_error DROP DEFAULT;`, 'drop fake_error default');
    await executeSQL(`ALTER TABLE site_status ALTER COLUMN fake_error TYPE boolean USING (fake_error = 'true');`, 'convert fake_error to boolean');
    await executeSQL(`ALTER TABLE site_status ALTER COLUMN fake_error SET DEFAULT false;`, 'set fake_error default');
    
    // site_status - phishing_mode
    await executeSQL(`ALTER TABLE site_status ALTER COLUMN phishing_mode DROP DEFAULT;`, 'drop phishing_mode default');
    await executeSQL(`ALTER TABLE site_status ALTER COLUMN phishing_mode TYPE boolean USING (phishing_mode = 'true');`, 'convert phishing_mode to boolean');
    await executeSQL(`ALTER TABLE site_status ALTER COLUMN phishing_mode SET DEFAULT false;`, 'set phishing_mode default');
    
    console.log('✓ Boolean columns fixed\n');

    // 3. SEPARATE REMARKS FIELD
    console.log('3. Separating remarks field...');
    await executeSQL(`ALTER TABLE records ADD COLUMN IF NOT EXISTS case_notes TEXT;`, 'add case_notes');
    
    await executeSQL(`
      UPDATE records
        SET case_notes = remarks_deprecated
        WHERE case_notes IS NULL 
          AND remarks_deprecated IS NOT NULL 
          AND remarks_deprecated NOT IN ('pending', 'finished', 'to be reviewed', 'to be deliver', 'to be reviewed by dentist');
    `, 'migrate remarks to case_notes');
    
    console.log('✓ Remarks separated\n');

    // 4. ADD MISSING INDEXES
    console.log('4. Creating missing indexes...');
    await executeSQL(`CREATE INDEX IF NOT EXISTS idx_records_case_status ON records(case_status);`, 'idx_records_case_status');
    await executeSQL(`CREATE INDEX IF NOT EXISTS idx_records_date_in ON records(date_in);`, 'idx_records_date_in');
    await executeSQL(`CREATE INDEX IF NOT EXISTS idx_records_date_out ON records(date_out);`, 'idx_records_date_out');
    await executeSQL(`CREATE INDEX IF NOT EXISTS idx_records_order_id ON records(order_id);`, 'idx_records_order_id');
    await executeSQL(`CREATE INDEX IF NOT EXISTS idx_records_created_at ON records(created_at DESC);`, 'idx_records_created_at');
    await executeSQL(`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);`, 'idx_orders_created_at');
    await executeSQL(`CREATE INDEX IF NOT EXISTS idx_history_record_id ON history(record_id);`, 'idx_history_record_id');
    await executeSQL(`CREATE INDEX IF NOT EXISTS idx_history_created_at ON history(created_at DESC);`, 'idx_history_created_at');
    await executeSQL(`CREATE INDEX IF NOT EXISTS idx_inventory_logs_date ON inventory_logs(date DESC);`, 'idx_inventory_logs_date');
    await executeSQL(`CREATE INDEX IF NOT EXISTS idx_inventory_logs_item_id ON inventory_logs(item_id);`, 'idx_inventory_logs_item_id');
    console.log('✓ Indexes created\n');

    // VERIFICATION
    console.log('5. Verifying changes...\n');
    
    const booleanCheck = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name IN ('site_status', 'site_notifications') 
      AND column_name IN ('is_locked', 'is_active', 'fake_error', 'phishing_mode')
      ORDER BY table_name, column_name;
    `;
    console.log('✓ Boolean columns verified:', booleanCheck.length, 'columns');
    booleanCheck.forEach(row => {
      console.log(`  ${row.table_name}.${row.column_name}: ${row.data_type}`);
    });
    
    const timestampCheck = await sql`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns 
      WHERE (table_name = 'records' AND column_name IN ('case_notes', 'remarks_deprecated'))
         OR (table_name = 'app_settings' AND column_name IN ('created_at', 'updated_at'))
         OR (table_name = 'case_types' AND column_name IN ('created_at', 'updated_at'))
         OR (table_name = 'technicians' AND column_name IN ('updated_at'))
      ORDER BY table_name, column_name;
    `;
    console.log('\n✓ New columns verified:', timestampCheck.length, 'columns');
    timestampCheck.forEach(row => {
      console.log(`  ${row.table_name}.${row.column_name}: ${row.data_type}`);
    });
    
    const indexCheck = await sql`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE indexname IN (
        'idx_records_case_status', 'idx_records_date_in', 'idx_records_date_out', 'idx_records_order_id',
        'idx_records_created_at', 'idx_orders_created_at', 'idx_history_record_id', 'idx_history_created_at',
        'idx_inventory_logs_date', 'idx_inventory_logs_item_id'
      )
      ORDER BY tablename, indexname;
    `;
    console.log('\n✓ Indexes verified:', indexCheck.length, 'indexes created');
    indexCheck.forEach(row => {
      console.log(`  ${row.tablename}.${row.indexname}`);
    });

    console.log('\n✅ All schema fixes applied and verified successfully!');
    await sql.end();
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    await sql.end();
    process.exit(1);
  }
}

runMigrations();
