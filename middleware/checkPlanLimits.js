const Plan = require('../models/Plan');

const checkDeviceLimit = (req, res, next) => {
  const tenantId = req.user.tenant_id;
  
  // Contar devices ANTES de tentar criar
  const currentCount = require('../config/database')
    .prepare('SELECT COUNT(*) as total FROM devices WHERE tenant_id = ?')
    .get(tenantId).total;
  
  // Buscar plano
  const tenant = require('../config/database')
    .prepare('SELECT plan FROM tenants WHERE id = ?')
    .get(tenantId);
  
  const plan = Plan.findByName(tenant.plan);
  
  // -1 = ilimitado
  if (plan.max_devices === -1) {
    return next();
  }
  
  // Verificar se atingiu limite
  if (currentCount >= plan.max_devices) {
    return res.status(403).json({ 
      error: 'Device limit reached for your plan',
      action: 'upgrade_required',
      current_plan: tenant.plan,
      current_devices: currentCount,
      max_devices: plan.max_devices
    });
  }
  
  next();
};

module.exports = { checkDeviceLimit };
