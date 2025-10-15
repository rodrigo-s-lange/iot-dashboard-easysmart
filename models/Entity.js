// models/Entity.js
const db = require('../config/database');

class Entity {
  /**
   * Criar nova entidade
   */
  static async create(entityData) {
    const {
      device_id,
      entity_id,
      entity_type,
      name,
      value = null,
      unit = null,
      icon = null,
      config = null,
      discovery_mode = 'auto',
      mqtt_topic = null
    } = entityData;

    // Validar dados obrigatórios
    if (!device_id || !entity_id || !entity_type || !name) {
      throw new Error('Missing required fields: device_id, entity_id, entity_type, name');
    }

    // Validar entity_type
    const validTypes = ['switch', 'sensor', 'number', 'text', 'binary_sensor'];
    if (!validTypes.includes(entity_type)) {
      throw new Error(`Invalid entity_type. Must be one of: ${validTypes.join(', ')}`);
    }

    const stmt = db.prepare(`
      INSERT INTO entities (
        device_id, entity_id, entity_type, name, value, unit, icon, config, discovery_mode, mqtt_topic
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      device_id,
      entity_id,
      entity_type,
      name,
      value ? JSON.stringify(value) : null,
      unit,
      icon,
      config ? JSON.stringify(config) : null,
      discovery_mode,
      mqtt_topic
    );

    return this.findById(result.lastInsertRowid);
  }

  /**
   * Buscar entidade por ID
   */
  static findById(id) {
    const stmt = db.prepare('SELECT * FROM entities WHERE id = ?');
    const entity = stmt.get(id);
    
    if (entity) {
      entity.value = entity.value ? JSON.parse(entity.value) : null;
      entity.config = entity.config ? JSON.parse(entity.config) : null;
    }
    
    return entity;
  }

  /**
   * Buscar todas as entidades de um device
   */
  static findByDeviceId(deviceId) {
    const stmt = db.prepare('SELECT * FROM entities WHERE device_id = ? ORDER BY created_at ASC');
    const entities = stmt.all(deviceId);
    
    return entities.map(entity => ({
      ...entity,
      value: entity.value ? JSON.parse(entity.value) : null,
      config: entity.config ? JSON.parse(entity.config) : null
    }));
  }

  /**
   * Buscar entidade específica de um device
   */
  static findByDeviceAndEntityId(deviceId, entityId) {
    const stmt = db.prepare('SELECT * FROM entities WHERE device_id = ? AND entity_id = ?');
    const entity = stmt.get(deviceId, entityId);
    
    if (entity) {
      entity.value = entity.value ? JSON.parse(entity.value) : null;
      entity.config = entity.config ? JSON.parse(entity.config) : null;
    }
    
    return entity;
  }

  /**
   * Atualizar valor de uma entidade (via MQTT ou UI)
   */
  static async updateValue(deviceId, entityId, newValue) {
    const entity = this.findByDeviceAndEntityId(deviceId, entityId);
    if (!entity) {
      throw new Error('Entity not found');
    }

    // Validar tipo de valor
    let valueToStore;
    if (entity.entity_type === 'switch' || entity.entity_type === 'binary_sensor') {
      valueToStore = { state: Boolean(newValue) };
    } else if (entity.entity_type === 'sensor' || entity.entity_type === 'number') {
      valueToStore = { value: Number(newValue) };
    } else {
      valueToStore = { value: String(newValue) };
    }

    const stmt = db.prepare(`
      UPDATE entities 
      SET value = ?, last_updated = CURRENT_TIMESTAMP 
      WHERE device_id = ? AND entity_id = ?
    `);

    stmt.run(JSON.stringify(valueToStore), deviceId, entityId);

    return this.findByDeviceAndEntityId(deviceId, entityId);
  }

  /**
   * Atualizar configuração de uma entidade
   */
  static async update(id, updateData) {
    const { name, unit, icon, config } = updateData;

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }
    if (unit !== undefined) {
      updates.push('unit = ?');
      values.push(unit);
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      values.push(icon);
    }
    if (config !== undefined) {
      updates.push('config = ?');
      values.push(JSON.stringify(config));
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id);

    const stmt = db.prepare(`
      UPDATE entities 
      SET ${updates.join(', ')}
      WHERE id = ?
    `);

    stmt.run(...values);

    return this.findById(id);
  }

  /**
   * Deletar entidade
   */
  static async delete(id) {
    const entity = this.findById(id);
    if (!entity) {
      throw new Error('Entity not found');
    }

    // Se for template e locked, não pode deletar
    if (entity.discovery_mode === 'template') {
      const config = entity.config || {};
      if (config.locked) {
        throw new Error('Cannot delete locked template entity');
      }
    }

    const stmt = db.prepare('DELETE FROM entities WHERE id = ?');
    stmt.run(id);

    return { success: true, message: 'Entity deleted' };
  }

  /**
   * Deletar todas as entidades de um device (cascade)
   */
  static async deleteByDeviceId(deviceId) {
    const stmt = db.prepare('DELETE FROM entities WHERE device_id = ?');
    const result = stmt.run(deviceId);
    return result.changes;
  }

  /**
   * Criar múltiplas entidades de uma vez (auto-discovery ou template)
   */
  static async createMultiple(deviceId, entitiesArray) {
    const created = [];
    
    for (const entityData of entitiesArray) {
      try {
        const entity = await this.create({
          device_id: deviceId,
          ...entityData
        });
        created.push(entity);
      } catch (error) {
        console.error(`Failed to create entity ${entityData.entity_id}:`, error.message);
      }
    }

    return created;
  }

  /**
   * Buscar entidades por tópico MQTT
   */
  static findByMqttTopic(topic) {
    const stmt = db.prepare('SELECT * FROM entities WHERE mqtt_topic = ?');
    const entity = stmt.get(topic);
    
    if (entity) {
      entity.value = entity.value ? JSON.parse(entity.value) : null;
      entity.config = entity.config ? JSON.parse(entity.config) : null;
    }
    
    return entity;
  }
}

module.exports = Entity;
