const Device = require('../models/Device');
const Plan = require('../models/Plan');

class DeviceController {
  static async create(req, res) {
    const { device_id, name, type } = req.body;
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;

    try {
      const device = Device.create(tenantId, userId, device_id, name, type);
      
      res.status(201).json({
        message: 'Device created successfully',
        device
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async list(req, res) {
    const tenantId = req.user.tenant_id;

    try {
      const devices = Device.findByTenant(tenantId);
      const deviceCount = Device.count(tenantId);
      const canAdd = Plan.canAddDevice(tenantId);

      res.json({
        devices,
        count: deviceCount,
        plan: req.user.plan,
        can_add_more: canAdd
      });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async getOne(req, res) {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;

    try {
      const device = Device.findById(id);
      
      if (!device || device.tenant_id !== tenantId) {
        return res.status(404).json({ error: 'Device not found' });
      }

      res.json({ device });
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  }

  static async update(req, res) {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;
    const { name, type, status } = req.body;

    try {
      const device = Device.update(id, tenantId, { name, type, status });
      
      res.json({
        message: 'Device updated successfully',
        device
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    const { id } = req.params;
    const tenantId = req.user.tenant_id;

    try {
      Device.delete(id, tenantId);
      
      res.json({ message: 'Device deleted successfully' });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
}

module.exports = DeviceController;
