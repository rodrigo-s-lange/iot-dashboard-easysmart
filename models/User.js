const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(tenantId, username, email, password, role = 'owner') {
    // Validações
    if (!username || !email || !password) {
      throw new Error('Username, email, and password are required');
    }
    
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Verificar se email já existe
    const existingEmail = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Verificar se username já existe
    const existingUsername = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existingUsername) {
      throw new Error('Username already exists');
    }

    // Hash assíncrono
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const stmt = db.prepare(`
      INSERT INTO users (tenant_id, username, email, password, role)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(tenantId, username, email, hashedPassword, role);
    return this.findById(result.lastInsertRowid);
  }

  static findByUsername(username) {
    const stmt = db.prepare('SELECT * FROM users WHERE username = ?');
    return stmt.get(username);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = User;
