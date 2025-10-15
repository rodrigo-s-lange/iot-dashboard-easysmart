// controllers/deviceController.js
const Device = require('../models/Device');
const Entity = require('../models/Entity');
const { generateEntitiesFromTemplate, isValidType, getAllTemplates } = require('../services/deviceTemplates');

/**
 * Listar todos os devices do usuário
 */
exports.getDevices = async (req, res) => {
  try {
    const devices = Device.findByUserId(req.userId);

    // Adicionar contagem de entidades por device
    const devicesWithCounts = devices.map(device => ({
      ...device,
      entities_count: Entity.findByDeviceId(device.id).length
    }));

    // Verificar limite de devices
    const limits = await Device.canAddDevice(req.userId);

    res.json({
      success: true,
      devices: devicesWithCounts,
      ...limits
    });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
};

/**
 * Criar novo device
 */
exports.createDevice = async (req, res) => {
  try {
    const { name, device_id, type, discovery_mode } = req.body;

    // Validar campos obrigatórios
    if (!name || !device_id || !type) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, device_id, type' 
      });
    }

    // Verificar limite de devices
    const limits = await Device.canAddDevice(req.userId);
    if (!limits.can_add) {
      return res.status(403).json({ 
        error: 'Device limit reached',
        current: limits.current,
        limit: limits.limit,
        plan: limits.plan
      });
    }

    // Validar tipo de device
    if (!isValidType(type)) {
      return res.status(400).json({ 
        error: 'Invalid device type',
        valid_types: getAllTemplates().map(t => t.type)
      });
    }

    // Criar device
    const device = await Device.create(req.body, req.userId);

    // Se usar template, criar entidades predefinidas
    if (device.discovery_mode === 'template' || device.discovery_mode === 'hybrid') {
      try {
        const templateEntities = generateEntitiesFromTemplate(type, device_id);
        if (templateEntities.length > 0) {
          await Entity.createMultiple(device.id, templateEntities);
        }
      } catch (error) {
        console.error('Failed to create template entities:', error);
        // Continuar mesmo se falhar (device já foi criado)
      }
    }

    // Buscar device completo com entidades
    const entities = Entity.findByDeviceId(device.id);

    res.status(201).json({
      success: true,
      message: 'Device created',
      device: {
        ...device,
        entities_count: entities.length
      },
      entities
    });
  } catch (error) {
    console.error('Create device error:', error);
    res.status(500).json({ error: error.message || 'Failed to create device' });
  }
};

/**
 * Obter device específico com suas entidades
 */
exports.getDevice = async (req, res) => {
  try {
    const { id } = req.params;

    const device = Device.findById(id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Verificar permissão
    if (device.user_id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Buscar entidades
    const entities = Entity.findByDeviceId(id);

    res.json({
      success: true,
      device: {
        ...device,
        entities_count: entities.length
      },
      entities
    });
  } catch (error) {
    console.error('Get device error:', error);
    res.status(500).json({ error: 'Failed to fetch device' });
  }
};

/**
 * Atualizar device
 */
exports.updateDevice = async (req, res) => {
  try {
    const { id } = req.params;

    const device = Device.findById(id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Verificar permissão
    if (device.user_id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Atualizar device
    const updated = await Device.update(id, req.body);

    res.json({
      success: true,
      message: 'Device updated',
      device: updated
    });
  } catch (error) {
    console.error('Update device error:', error);
    res.status(500).json({ error: error.message || 'Failed to update device' });
  }
};

/**
 * Deletar device (cascade deleta entities)
 */
exports.deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;

    const device = Device.findById(id);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    // Verificar permissão
    if (device.user_id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await Device.delete(id);

    res.json({
      success: true,
      message: 'Device deleted'
    });
  } catch (error) {
    console.error('Delete device error:', error);
    res.status(500).json({ error: 'Failed to delete device' });
  }
};

/**
 * Listar templates disponíveis
 */
exports.getTemplates = async (req, res) => {
  try {
    const templates = getAllTemplates();
    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
};
