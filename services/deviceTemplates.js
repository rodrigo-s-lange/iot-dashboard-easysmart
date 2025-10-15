// services/deviceTemplates.js
// Templates predefinidos para tipos de dispositivos comuns

const DEVICE_TEMPLATES = {
  /**
   * Monitor de Compressor Industrial
   * 1 relay + 5-10 sensores RS485
   */
  compressor_monitor: {
    name: 'Monitor de Compressor',
    description: 'Monitora compressor via RS485 com controle de relé',
    icon: '🏭',
    discovery_mode: 'hybrid', // Aceita auto-discovery + template
    entities: [
      {
        entity_id: 'relay_main',
        entity_type: 'switch',
        name: 'Relé Principal',
        icon: '🔌',
        config: { locked: true },
        value: { state: false }
      },
      {
        entity_id: 'temp_oil',
        entity_type: 'sensor',
        name: 'Temperatura Óleo',
        unit: '°C',
        icon: '🌡️',
        config: { min: 0, max: 150, readonly: true },
        value: { value: 0 }
      },
      {
        entity_id: 'pressure',
        entity_type: 'sensor',
        name: 'Pressão',
        unit: 'PSI',
        icon: '📊',
        config: { min: 0, max: 200, readonly: true },
        value: { value: 0 }
      },
      {
        entity_id: 'vibration',
        entity_type: 'sensor',
        name: 'Vibração',
        unit: 'mm/s',
        icon: '📳',
        config: { min: 0, max: 20, readonly: true },
        value: { value: 0 }
      },
      {
        entity_id: 'current',
        entity_type: 'sensor',
        name: 'Corrente',
        unit: 'A',
        icon: '⚡',
        config: { min: 0, max: 100, readonly: true },
        value: { value: 0 }
      },
      {
        entity_id: 'runtime',
        entity_type: 'sensor',
        name: 'Tempo Operação',
        unit: 'h',
        icon: '⏱️',
        config: { readonly: true },
        value: { value: 0 }
      }
    ]
  },

  /**
   * Controle de Portão Residencial
   */
  gate_controller: {
    name: 'Controle de Portão',
    description: 'Abertura/fechamento com sensores fim de curso',
    icon: '🚪',
    discovery_mode: 'template',
    entities: [
      {
        entity_id: 'gate_open',
        entity_type: 'switch',
        name: 'Abrir Portão',
        icon: '🔓',
        config: { locked: true, momentary: true },
        value: { state: false }
      },
      {
        entity_id: 'gate_close',
        entity_type: 'switch',
        name: 'Fechar Portão',
        icon: '🔒',
        config: { locked: true, momentary: true },
        value: { state: false }
      },
      {
        entity_id: 'sensor_open',
        entity_type: 'binary_sensor',
        name: 'Sensor Aberto',
        icon: '✅',
        config: { readonly: true },
        value: { state: false }
      },
      {
        entity_id: 'sensor_closed',
        entity_type: 'binary_sensor',
        name: 'Sensor Fechado',
        icon: '❌',
        config: { readonly: true },
        value: { state: false }
      }
    ]
  },

  /**
   * Sensor HVAC Industrial
   */
  hvac_sensor: {
    name: 'Sensor HVAC',
    description: 'Monitoramento de temperatura, umidade e CO2',
    icon: '🌡️',
    discovery_mode: 'auto',
    entities: [
      {
        entity_id: 'temperature',
        entity_type: 'sensor',
        name: 'Temperatura',
        unit: '°C',
        icon: '🌡️',
        config: { min: -40, max: 80, readonly: true },
        value: { value: 0 }
      },
      {
        entity_id: 'humidity',
        entity_type: 'sensor',
        name: 'Umidade',
        unit: '%',
        icon: '💧',
        config: { min: 0, max: 100, readonly: true },
        value: { value: 0 }
      },
      {
        entity_id: 'co2',
        entity_type: 'sensor',
        name: 'CO2',
        unit: 'ppm',
        icon: '💨',
        config: { min: 0, max: 5000, readonly: true },
        value: { value: 0 }
      }
    ]
  },

  /**
   * Placa de Relés Genérica
   */
  relay_board: {
    name: 'Placa de Relés',
    description: 'Controle de múltiplos relés',
    icon: '��',
    discovery_mode: 'template',
    entities: [
      {
        entity_id: 'relay_1',
        entity_type: 'switch',
        name: 'Relé 1',
        icon: '1️⃣',
        value: { state: false }
      },
      {
        entity_id: 'relay_2',
        entity_type: 'switch',
        name: 'Relé 2',
        icon: '2️⃣',
        value: { state: false }
      },
      {
        entity_id: 'relay_3',
        entity_type: 'switch',
        name: 'Relé 3',
        icon: '3️⃣',
        value: { state: false }
      },
      {
        entity_id: 'relay_4',
        entity_type: 'switch',
        name: 'Relé 4',
        icon: '4️⃣',
        value: { state: false }
      }
    ]
  },

  /**
   * Medidor de Energia
   */
  energy_meter: {
    name: 'Medidor de Energia',
    description: 'Monitoramento de consumo elétrico',
    icon: '⚡',
    discovery_mode: 'auto',
    entities: [
      {
        entity_id: 'voltage',
        entity_type: 'sensor',
        name: 'Tensão',
        unit: 'V',
        icon: '⚡',
        config: { readonly: true },
        value: { value: 0 }
      },
      {
        entity_id: 'current',
        entity_type: 'sensor',
        name: 'Corrente',
        unit: 'A',
        icon: '🔋',
        config: { readonly: true },
        value: { value: 0 }
      },
      {
        entity_id: 'power',
        entity_type: 'sensor',
        name: 'Potência',
        unit: 'W',
        icon: '💡',
        config: { readonly: true },
        value: { value: 0 }
      },
      {
        entity_id: 'energy',
        entity_type: 'sensor',
        name: 'Energia',
        unit: 'kWh',
        icon: '📊',
        config: { readonly: true },
        value: { value: 0 }
      },
      {
        entity_id: 'power_factor',
        entity_type: 'sensor',
        name: 'Fator de Potência',
        unit: '',
        icon: '📈',
        config: { min: 0, max: 1, readonly: true },
        value: { value: 0 }
      }
    ]
  },

  /**
   * ESP32 Genérico (Auto-discovery)
   */
  esp32_generic: {
    name: 'ESP32 Genérico',
    description: 'Dispositivo com auto-discovery via MQTT',
    icon: '🔧',
    discovery_mode: 'auto',
    entities: []
  }
};

/**
 * Obter template por tipo
 */
function getTemplate(type) {
  return DEVICE_TEMPLATES[type] || null;
}

/**
 * Listar todos os templates disponíveis
 */
function getAllTemplates() {
  return Object.keys(DEVICE_TEMPLATES).map(key => ({
    type: key,
    name: DEVICE_TEMPLATES[key].name,
    description: DEVICE_TEMPLATES[key].description,
    icon: DEVICE_TEMPLATES[key].icon,
    discovery_mode: DEVICE_TEMPLATES[key].discovery_mode
  }));
}

/**
 * Gerar entidades a partir de template
 * @param {string} type - Tipo do device
 * @param {string} deviceIdentifier - ID do device (para gerar topics MQTT)
 */
function generateEntitiesFromTemplate(type, deviceIdentifier) {
  const template = getTemplate(type);
  if (!template) {
    throw new Error(`Template not found for type: ${type}`);
  }

  const normalizedId = deviceIdentifier.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

  return template.entities.map(entity => ({
    ...entity,
    discovery_mode: 'template',
    mqtt_topic: entity.mqtt_topic || `devices/${normalizedId}/${entity.entity_id}/state`
  }));
}

/**
 * Validar se tipo de device existe
 */
function isValidType(type) {
  return type in DEVICE_TEMPLATES;
}

/**
 * Obter discovery_mode de um template
 */
function getDiscoveryMode(type) {
  const template = getTemplate(type);
  return template ? template.discovery_mode : 'auto';
}

module.exports = {
  DEVICE_TEMPLATES,
  getTemplate,
  getAllTemplates,
  generateEntitiesFromTemplate,
  isValidType,
  getDiscoveryMode
};
