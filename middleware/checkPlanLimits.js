const Plan = require('../models/Plan');

const checkDeviceLimit = (req, res, next) => {
  const tenantId = req.user.tenant_id;
  
  if (!Plan.canAddDevice(tenantId)) {
    return res.status(403).json({ 
      error: 'Device limit reached for your plan',
      action: 'upgrade_required',
      current_plan: req.user.plan
    });
  }
  
  next();
};

module.exports = { checkDeviceLimit };
