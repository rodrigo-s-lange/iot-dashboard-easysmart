// controllers/entityController.js
const Entity = require('../models/Entity');
const Device = require('../models/Device');

/**
 * Listar todas as entidades de um device
 */
exports.getDeviceEntities = async (req, res) => {
  try {
    const { deviceId } = req.params;

    // Verificar se device existe e pertence ao usuário
    const device = Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    if (device.user_id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Buscar entidades
    const entities = Entity.findByDeviceId(deviceId);

    res.json({
      success: true,
      device_id: deviceId,
      count: entities.length,
      entities
    });
  } catch (error) {
    console.error('Get device entities error:', error);
    res.status(500).json({ error: 'Failed to fetch entities' });
  }
};

/**
 * Criar nova entidade
 */
exports.createEntity = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const entityData = req.body;

    // Verificar se device existe e pertence ao usuário
    const device = Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    if (device.user_id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Verificar se entity_id já existe
    const existing = Entity.findByDeviceAndEntityId(deviceId, entityData.entity_id);
    if (existing) {
      return res.status(400).json({ error: 'Entity with this ID already exists' });
    }

    // Criar entidade
    const entity = await Entity.create({
      device_id: deviceId,
      ...entityData
    });

    res.status(201).json({
      success: true,
      message: 'Entity created',
      entity
    });
  } catch (error) {
    console.error('Create entity error:', error);
    res.status(500).json({ error: error.message || 'Failed to create entity' });
  }
};

/**
 * Atualizar valor de uma entidade (toggle, set value)
 */
exports.updateEntityValue = async (req, res) => {
  try {
    const { deviceId, entityId } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: 'Value is required' });
    }

    // Verificar se device existe e pertence ao usuário
    const device = Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    if (device.user_id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Atualizar valor
    const entity = await Entity.updateValue(deviceId, entityId, value);

    // TODO: Publicar no MQTT para enviar comando ao device
    // const mqttService = require('../services/mqttService');
    // mqttService.publish(`devices/${device.device_id}/${entityId}/set`, value);

    res.json({
      success: true,
      message: 'Entity value updated',
      entity
    });
  } catch (error) {
    console.error('Update entity value error:', error);
    res.status(500).json({ error: error.message || 'Failed to update entity' });
  }
};

/**
 * Atualizar configuração de uma entidade (nome, ícone, etc)
 */
exports.updateEntity = async (req, res) => {
  try {
    const { entityId } = req.params;
    const updateData = req.body;

    // Verificar se entidade existe
    const existingEntity = Entity.findById(entityId);
    if (!existingEntity) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    // Verificar se device pertence ao usuário
    const device = Device.findById(existingEntity.device_id);
    if (device.user_id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Atualizar entidade
    const entity = await Entity.update(entityId, updateData);

    res.json({
      success: true,
      message: 'Entity updated',
      entity
    });
  } catch (error) {
    console.error('Update entity error:', error);
    res.status(500).json({ error: error.message || 'Failed to update entity' });
  }
};

/**
 * Deletar entidade
 */
exports.deleteEntity = async (req, res) => {
  try {
    const { entityId } = req.params;

    // Verificar se entidade existe
    const entity = Entity.findById(entityId);
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    // Verificar se device pertence ao usuário
    const device = Device.findById(entity.device_id);
    if (device.user_id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Deletar entidade
    await Entity.delete(entityId);

    res.json({
      success: true,
      message: 'Entity deleted'
    });
  } catch (error) {
    console.error('Delete entity error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete entity' });
  }
};

/**
 * Criar múltiplas entidades de uma vez (bulk)
 * Usado para auto-discovery ou aplicar template
 */
exports.createMultipleEntities = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { entities } = req.body;

    if (!Array.isArray(entities) || entities.length === 0) {
      return res.status(400).json({ error: 'Entities array is required' });
    }

    // Verificar se device existe e pertence ao usuário
    const device = Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }

    if (device.user_id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Criar entidades
    const created = await Entity.createMultiple(deviceId, entities);

    res.status(201).json({
      success: true,
      message: `${created.length} entities created`,
      entities: created
    });
  } catch (error) {
    console.error('Create multiple entities error:', error);
    res.status(500).json({ error: error.message || 'Failed to create entities' });
  }
};
