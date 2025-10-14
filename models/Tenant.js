const db = require('../config/database');

class Tenant {
  static create(name, email, plan = 'free') {
    // Calcular trial (30 dias)
    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + 30);
    
    const stmt = db.prepare(`
      INSERT INTO tenants (name, email, plan, trial_ends_at)
      VALUES (?, ?, ?, ?)
    `);
    
    const result = stmt.run(name, email, plan, trialEndsAt.toISOString());
    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    const stmt = db.prepare('SELECT * FROM tenants WHERE id = ?');
    return stmt.get(id);
  }

  static findByEmail(email) {
    const stmt = db.prepare('SELECT * FROM tenants WHERE email = ?');
    return stmt.get(email);
  }

  static isActive(tenantId) {
    const tenant = this.findById(tenantId);
    if (!tenant) return false;
    
    // Verificar status
    if (tenant.status !== 'active') return false;
    
    // Verificar trial (se free)
    if (tenant.plan === 'free') {
      const trialEnd = new Date(tenant.trial_ends_at);
      if (new Date() > trialEnd) return false;
    }
    
    return true;
  }

  static updatePlan(tenantId, plan) {
    const stmt = db.prepare('UPDATE tenants SET plan = ? WHERE id = ?');
    stmt.run(plan, tenantId);
  }
}

module.exports = Tenant;
