// models/Device.js
const db = require('../config/database');
const Plan = require('./Plan');

class Device {
  /**
   * Criar device (assinatura original mantida)
   */
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
      INSERT INTO devices (tenant_id, user_id, device_id, name, type, status, discovery_mode)
      VALUES (?, ?, ?, ?, ?, 'offline', 'template')
    `);

    const result = stmt.run(tenantId, userId, deviceId, name, type);
    return this.findById(result.lastInsertRowid);
  }

  /**
   * Criar device (nova assinatura compatível com entityController)
   */
  static async createFromObject(data, userId) {
    // Buscar tenantId do usuário DIRETAMENTE (sem User.findById)
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    const { name, device_id, type, discovery_mode = 'template' } = data;

    // Validar campos obrigatórios
    if (!name || !device_id || !type) {
      throw new Error('Missing required fields: name, device_id, type');
    }

    // Verificar limite do plano
    if (!Plan.canAddDevice(user.tenant_id)) {
      throw new Error('Device limit reached for your plan');
    }

    // Verificar se device_id já existe
    const existing = db.prepare(
      'SELECT id FROM devices WHERE tenant_id = ? AND device_id = ?'
    ).get(user.tenant_id, device_id);
    
    if (existing) {
      throw new Error('Device ID already exists in your account');
    }

    const stmt = db.prepare(`
      INSERT INTO devices (tenant_id, user_id, device_id, name, type, status, discovery_mode, config)
      VALUES (?, ?, ?, ?, ?, 'offline', ?, ?)
    `);

    const result = stmt.run(
      user.tenant_id,
      userId,
      device_id,
      name,
      type,
      discovery_mode,
      data.config ? JSON.stringify(data.config) : null
    );

    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM devices WHERE id = ?');
    const device = stmt.get(id);
    
    if (device && device.config) {
      device.config = JSON.parse(device.config);
    }
    
    return device;
  }

  static findByTenant(tenantId) {
    const stmt = db.prepare('SELECT * FROM devices WHERE tenant_id = ? ORDER BY created_at DESC');
    const devices = stmt.all(tenantId);
    
    return devices.map(device => ({
      ...device,
      config: device.config ? JSON.parse(device.config) : null
    }));
  }

  /**
   * Buscar devices de um usuário (para entityController)
   */
  static findByUserId(userId) {
    // Buscar tenant_id do usuário diretamente
    const user = db.prepare('SELECT tenant_id FROM users WHERE id = ?').get(userId);
    
    if (!user) {
      return [];
    }

    return this.findByTenant(user.tenant_id);
  }

  static findByDeviceId(tenantId, deviceId) {
    const stmt = db.prepare('SELECT * FROM devices WHERE tenant_id = ? AND device_id = ?');
    const device = stmt.get(tenantId, deviceId);
    
    if (device && device.config) {
      device.config = JSON.parse(device.config);
    }
    
    return device;
  }

  static update(id, tenantId, data) {
    const { name, type, status, discovery_mode, config } = data;
    
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
          discovery_mode = COALESCE(?, discovery_mode),
          config = COALESCE(?, config),
          last_seen = CURRENT_TIMESTAMP
      WHERE id = ? AND tenant_id = ?
    `);

    stmt.run(
      name, 
      type, 
      status, 
      discovery_mode,
      config ? JSON.stringify(config) : null,
      id, 
      tenantId
    );

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

  static async delete(id, tenantId = null) {
    // Se tenantId não fornecido, buscar do device
    if (!tenantId) {
      const device = this.findById(id);
      if (!device) {
        throw new Error('Device not found');
      }
      tenantId = device.tenant_id;
    }

    // Verificar se device pertence ao tenant
    const device = db.prepare('SELECT id FROM devices WHERE id = ? AND tenant_id = ?').get(id, tenantId);
    if (!device) {
      throw new Error('Device not found or access denied');
    }

    const stmt = db.prepare('DELETE FROM devices WHERE id = ? AND tenant_id = ?');
    stmt.run(id, tenantId);
    
    return { success: true, message: 'Device deleted' };
  }

  static count(tenantId) {
    const stmt = db.prepare('SELECT COUNT(*) as total FROM devices WHERE tenant_id = ?');
    return stmt.get(tenantId).total;
  }

  /**
   * Verificar se usuário pode adicionar device (para entityController)
   */
  static async canAddDevice(userId) {
    // Buscar tenant_id do usuário diretamente
    const user = db.prepare('SELECT tenant_id FROM users WHERE id = ?').get(userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    const canAdd = Plan.canAddDevice(user.tenant_id);
    const current = this.count(user.tenant_id);
    const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(user.tenant_id);
    
    return {
      can_add: canAdd,
      current: current,
      limit: tenant.plan === 'premium' ? 5 : 1,
      plan: tenant.plan
    };
  }
}

module.exports = Device;
