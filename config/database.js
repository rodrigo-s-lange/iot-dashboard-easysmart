const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'iot.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Load and execute schema
const schemaPath = path.join(__dirname, 'databaseSchema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// Execute schema (drop old tables and create new)
db.exec(schema);

console.log('✅ Database initialized with multi-tenant schema');

module.exports = db;
