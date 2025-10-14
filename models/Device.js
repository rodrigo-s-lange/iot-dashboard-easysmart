const db = require('../config/database');
const Plan = require('./Plan');

class Device {
  static create(tenantId, userId, deviceId, name, type = 'ESP32') {
    // Verificar limite do plano
    if (!Plan.canAddDevice(tenantId)) {
      throw new Error('Device limit reached for your plan');
    }

    // Verificar se device_id já existe neste tenant
    const existing = db.prepare(
      'SELECT id FROM devices WHERE tenant_id = ? AND device_id = ?'
    ).get(tenantId, deviceId);
    
    if (existing) {
      throw new Error('Device ID already exists in your account');
    }

    const stmt = db.prepare(`
      INSERT INTO devices (tenant_id, user_id, device_id, name, type)
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(tenantId, userId, deviceId, name, type);
    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM devices WHERE id = ?');
    return stmt.get(id);
  }

  static findByTenant(tenantId) {
    const stmt = db.prepare('SELECT * FROM devices WHERE tenant_id = ? ORDER BY created_at DESC');
    return stmt.all(tenantId);
  }

  static findByDeviceId(tenantId, deviceId) {
    const stmt = db.prepare('SELECT * FROM devices WHERE tenant_id = ? AND device_id = ?');
    return stmt.get(tenantId, deviceId);
  }

  static update(id, tenantId, data) {
    const { name, type, status } = data;
    
    // Verificar se device pertence ao tenant
    const device = db.prepare('SELECT id FROM devices WHERE id = ? AND tenant_id = ?').get(id, tenantId);
    if (!device) {
      throw new Error('Device not found or access denied');
    }

    const stmt = db.prepare(`
      UPDATE devices 
      SET name = COALESCE(?, name),
          type = COALESCE(?, type),
          status = COALESCE(?, status),
          last_seen = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `);

    stmt.run(name, type, status, id, tenantId);
    return this.findById(id);
  }

  static updateStatus(tenantId, deviceId, status) {
    const stmt = db.prepare(`
      UPDATE devices 
      SET status = ?, last_seen = CURRENT_TIMESTAMP
      WHERE tenant_id = ? AND device_id = ?
    `);
    
    stmt.run(status, tenantId, deviceId);
  }

  static delete(id, tenantId) {
    // Verificar se device pertence ao tenant
    const device = db.prepare('SELECT id FROM devices WHERE id = ? AND tenant_id = ?').get(id, tenantId);
    if (!device) {
      throw new Error('Device not found or access denied');
    }

    const stmt = db.prepare('DELETE FROM devices WHERE id = ? AND tenant_id = ?');
    stmt.run(id, tenantId);
  }

  static count(tenantId) {
    const stmt = db.prepare('SELECT COUNT(*) as total FROM devices WHERE tenant_id = ?');
    return stmt.get(tenantId).total;
  }
}

module.exports = Device;
