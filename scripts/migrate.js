// scripts/migrate.js
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/database.sqlite');
const db = new Database(DB_PATH);

console.log('🔄 Starting database migration...\n');

try {
  // 1. Criar tabela entities
  console.log('📋 Creating entities table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS entities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      entity_id TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      name TEXT NOT NULL,
      value TEXT,
      unit TEXT,
      icon TEXT,
      config TEXT,
      discovery_mode TEXT DEFAULT 'auto',
      mqtt_topic TEXT,
      last_updated DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
      UNIQUE(device_id, entity_id)
    );
  `);
  console.log('✅ Entities table created\n');

  // 2. Criar índices
  console.log('📊 Creating indexes...');
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_entities_device ON entities(device_id);
    CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type);
    CREATE INDEX IF NOT EXISTS idx_entities_mqtt ON entities(mqtt_topic);
  `);
  console.log('✅ Indexes created\n');

  // 3. Criar trigger
  console.log('⚡ Creating triggers...');
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_entity_timestamp 
    AFTER UPDATE ON entities
    BEGIN
      UPDATE entities SET last_updated = CURRENT_TIMESTAMP 
      WHERE id = NEW.id;
    END;
  `);
  console.log('✅ Triggers created\n');

  // 4. Verificar colunas existentes em devices
  console.log('�� Checking devices table...');
  const columns = db.prepare("PRAGMA table_info(devices)").all();
  const columnNames = columns.map(col => col.name);
  
  console.log('  Current columns:', columnNames.join(', '));

  // 5. Adicionar colunas necessárias
  const neededColumns = [
    { name: 'status', type: "TEXT DEFAULT 'offline'" },
    { name: 'last_seen', type: 'DATETIME' },
    { name: 'discovery_mode', type: "TEXT DEFAULT 'template'" },
    { name: 'config', type: 'TEXT' }
  ];

  for (const col of neededColumns) {
    if (!columnNames.includes(col.name)) {
      console.log(`  Adding column: ${col.name}`);
      db.exec(`ALTER TABLE devices ADD COLUMN ${col.name} ${col.type}`);
    }
  }
  console.log('✅ Devices table updated\n');

  // 6. Criar índice de MAC apenas se coluna existir
  if (columnNames.includes('mac_address')) {
    console.log('🔑 Creating MAC address index...');
    db.exec(`CREATE INDEX IF NOT EXISTS idx_devices_mac ON devices(mac_address)`);
    console.log('✅ MAC index created\n');
  } else {
    console.log('⚠️  Column mac_address not found, skipping index creation\n');
  }

  // 7. Atualizar devices existentes
  console.log('🔄 Updating existing devices...');
  const updateResult = db.prepare(`
    UPDATE devices 
    SET status = 'offline', discovery_mode = 'template'
    WHERE status IS NULL
  `).run();
  console.log(`✅ Updated ${updateResult.changes} devices\n`);

  console.log('✅ Migration completed successfully!\n');

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  console.error(error.stack);
  process.exit(1);
} finally {
  db.close();
}
