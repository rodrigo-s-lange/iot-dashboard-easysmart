// scripts/test-entities.js
require('dotenv').config();
const Device = require('../models/Device');
const Entity = require('../models/Entity');
const { generateEntitiesFromTemplate, getAllTemplates } = require('../services/deviceTemplates');

console.log('🧪 Testing Entity System\n');

async function runTests() {
  try {
    // 1. Listar templates disponíveis
    console.log('📋 Available Templates:');
    const templates = getAllTemplates();
    templates.forEach(t => {
      console.log(`  - ${t.type}: ${t.name} (${t.icon}) - ${t.discovery_mode}`);
    });
    console.log('');

    // 2. Criar device de teste (Compressor Monitor)
    console.log('🏭 Creating test device: Compressor Monitor');
    
    // Assumir user_id = 1 (ajustar conforme necessário)
    const userId = 1;

    const device = await Device.create({
      name: 'Compressor Teste',
      device_id: 'TEST_COMP_01',
      type: 'compressor_monitor',
      discovery_mode: 'template'
    }, userId);

    console.log(`✅ Device created: ID ${device.id}, device_id ${device.device_id}\n`);

    // 3. Gerar entidades do template
    console.log('⚙️ Generating entities from template...');
    const templateEntities = generateEntitiesFromTemplate('compressor_monitor', device.device_id);
    console.log(`  Generated ${templateEntities.length} entities:`);
    templateEntities.forEach(e => {
      console.log(`    - ${e.entity_id} (${e.entity_type}): ${e.name}`);
    });
    console.log('');

    // 4. Criar entidades no banco
    console.log('💾 Creating entities in database...');
    const created = await Entity.createMultiple(device.id, templateEntities);
    console.log(`✅ ${created.length} entities created\n`);

    // 5. Buscar device com entidades
    console.log('📊 Fetching device with entities...');
    const entities = Entity.findByDeviceId(device.id);
    console.log(`Found ${entities.length} entities:\n`);
    
    entities.forEach(entity => {
      console.log(`  ${entity.icon || '📌'} ${entity.name}`);
      console.log(`    Type: ${entity.entity_type}`);
      console.log(`    Entity ID: ${entity.entity_id}`);
      console.log(`    MQTT Topic: ${entity.mqtt_topic}`);
      if (entity.value) {
        console.log(`    Value: ${JSON.stringify(entity.value)}`);
      }
      if (entity.unit) {
        console.log(`    Unit: ${entity.unit}`);
      }
      console.log('');
    });

    // 6. Testar atualização de valor
    console.log('🔄 Testing value update...');
    const relayEntity = entities.find(e => e.entity_type === 'switch');
    if (relayEntity) {
      console.log(`  Toggling ${relayEntity.name} to ON`);
      const updated = await Entity.updateValue(device.id, relayEntity.entity_id, true);
      console.log(`  ✅ Updated: ${JSON.stringify(updated.value)}\n`);
    }

    // 7. Testar busca por tópico MQTT
    console.log('🔍 Testing MQTT topic lookup...');
    const mqttEntity = Entity.findByMqttTopic(entities[0].mqtt_topic);
    if (mqttEntity) {
      console.log(`  ✅ Found entity by topic: ${mqttEntity.name}\n`);
    }

    console.log('✅ All tests passed!\n');
    console.log('⚠️  Remember to delete test device from database\n');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runTests();
