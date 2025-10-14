const db = require('../config/database');

class Plan {
  static findByName(name) {
    const stmt = db.prepare('SELECT * FROM plans WHERE name = ?');
    return stmt.get(name);
  }

  static getAll() {
    const stmt = db.prepare('SELECT * FROM plans ORDER BY price ASC');
    return stmt.all();
  }

  static canAddDevice(tenantId) {
    // Buscar plano do tenant
    const tenant = db.prepare('SELECT plan FROM tenants WHERE id = ?').get(tenantId);
    if (!tenant) return false;
    
    // Buscar limite do plano
    const plan = this.findByName(tenant.plan);
    if (!plan) return false;
    
    // Contar devices atuais
    const count = db.prepare('SELECT COUNT(*) as total FROM devices WHERE tenant_id = ?').get(tenantId);
    
    // -1 = ilimitado
    if (plan.max_devices === -1) return true;
    
    return count.total < plan.max_devices;
  }
}

module.exports = Plan;
