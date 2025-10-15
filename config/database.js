const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'database.sqlite');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Verificar se tabelas já existem
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();

if (!tables) {
  console.log('📋 Initializing database schema...');
  const schemaPath = path.join(__dirname, 'databaseSchema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
  console.log('✅ Database initialized with multi-tenant schema');
} else {
  console.log('✅ Database already initialized');
}

module.exports = db;
