# 🚀 Setup Guide - Entity System (Phase 1.2a)

**Guia completo de implementação do sistema de entidades para o IoT Dashboard**

---

## 📋 Visão Geral

Este guia documenta o processo de implementação do **Entity System**, que adiciona suporte para:
- ✅ Múltiplas entidades por device (sensores, switches, etc.)
- ✅ 6 templates predefinidos
- ✅ Auto-discovery via MQTT
- ✅ CRUD completo via API REST

**Tempo de implementação**: ~6 horas  
**Complexidade**: Média  
**Pré-requisitos**: Phase 1.1 (autenticação + devices básicos)

---

## 🗂️ Estrutura de Arquivos Criados
```
iot-dashboard/
├── models/
│   └── Entity.js                    # CRUD de entidades
├── services/
│   └── deviceTemplates.js           # Templates predefinidos
├── controllers/
│   └── entityController.js          # Lógica de negócio
├── routes/
│   └── entities.js                  # Endpoints de entidades
└── scripts/
    ├── migrate.js                   # Migration do banco
    └── test-entities.js             # Testes de validação
```

---

## 🗄️ Passo 1: Database Migration

### 1.1. Criar Script de Migração

**Arquivo**: `scripts/migrate.js`
```javascript
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/database.sqlite');
const db = new Database(DB_PATH);

console.log('🔄 Starting database migration...\n');

try {
  // 1. Criar tabela entities
  console.log('📋 Creating entities table...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS entities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id INTEGER NOT NULL,
      entity_id TEXT NOT NULL,              -- Ex: "relay_1", "temp_oil"
      entity_type TEXT NOT NULL,            -- switch, sensor, number, text, binary_sensor
      name TEXT NOT NULL,                   -- Nome amigável
      value TEXT,                           -- JSON: {"state": false} ou {"value": 85.5}
      unit TEXT,                            -- °C, PSI, kWh, etc.
      icon TEXT,                            -- Emoji ou class CSS
      config TEXT,                          -- JSON: configurações
      discovery_mode TEXT DEFAULT 'auto',   -- auto, template
      mqtt_topic TEXT,                      -- Topic MQTT
      last_updated DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (device_id) REFERENCES devices(id) ON DELETE CASCADE,
      UNIQUE(device_id, entity_id)
    );
  `);
  
  // 2. Criar índices
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_entities_device ON entities(device_id);
    CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type);
    CREATE INDEX IF NOT EXISTS idx_entities_mqtt ON entities(mqtt_topic);
  `);
  
  // 3. Criar trigger para auto-update de timestamp
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_entity_timestamp 
    AFTER UPDATE ON entities
    BEGIN
      UPDATE entities SET last_updated = CURRENT_TIMESTAMP 
      WHERE id = NEW.id;
    END;
  `);
  
  // 4. Adicionar colunas à tabela devices (se não existirem)
  const columns = db.prepare("PRAGMA table_info(devices)").all();
  const columnNames = columns.map(col => col.name);
  
  const neededColumns = [
    { name: 'status', type: "TEXT DEFAULT 'offline'" },
    { name: 'last_seen', type: 'DATETIME' },
    { name: 'discovery_mode', type: "TEXT DEFAULT 'template'" },
    { name: 'config', type: 'TEXT' }
  ];
  
  for (const col of neededColumns) {
    if (!columnNames.includes(col.name)) {
      console.log(`  Adding column: ${col.name}`);
      db.exec(`ALTER TABLE devices ADD COLUMN ${col.name} ${col.type}`);
    }
  }
  
  console.log('✅ Migration completed successfully!\n');

} catch (error) {
  console.error('❌ Migration failed:', error.message);
  process.exit(1);
} finally {
  db.close();
}
```

### 1.2. Executar Migration
```bash
node scripts/migrate.js
```

**Saída esperada:**
```
🔄 Starting database migration...
📋 Creating entities table...
✅ Migration completed successfully!
```

---

## 📦 Passo 2: Model Entity

**Arquivo**: `models/Entity.js`

### Métodos Principais

| Método | Descrição |
|--------|-----------|
| `create(entityData)` | Criar nova entidade com validação |
| `findById(id)` | Buscar entidade por ID |
| `findByDeviceId(deviceId)` | Listar entidades de um device |
| `updateValue(deviceId, entityId, value)` | Atualizar valor (toggle, set) |
| `update(id, data)` | Atualizar configuração |
| `delete(id)` | Deletar entidade (respeitando locked) |
| `createMultiple(deviceId, array)` | Bulk insert |

### Validações

- ✅ Entity type obrigatório: `switch`, `sensor`, `number`, `text`, `binary_sensor`
- ✅ Unique constraint: `(device_id, entity_id)`
- ✅ Locked entities não podem ser deletadas
- ✅ JSON parsing automático de `value` e `config`

---

## 🎨 Passo 3: Device Templates

**Arquivo**: `services/deviceTemplates.js`

### Templates Disponíveis

#### 1. Compressor Monitor (Hybrid)
```javascript
{
  name: 'Monitor de Compressor',
  discovery_mode: 'hybrid',
  entities: [
    { entity_id: 'relay_main', type: 'switch', name: 'Relé Principal' },
    { entity_id: 'temp_oil', type: 'sensor', name: 'Temperatura Óleo', unit: '°C' },
    { entity_id: 'pressure', type: 'sensor', name: 'Pressão', unit: 'PSI' },
    // ... mais 3 sensores
  ]
}
```

#### 2. Gate Controller (Template)
```javascript
{
  name: 'Controle de Portão',
  discovery_mode: 'template',
  entities: [
    { entity_id: 'gate_open', type: 'switch', name: 'Abrir Portão' },
    { entity_id: 'gate_close', type: 'switch', name: 'Fechar Portão' },
    { entity_id: 'sensor_open', type: 'binary_sensor', name: 'Sensor Aberto' },
    { entity_id: 'sensor_closed', type: 'binary_sensor', name: 'Sensor Fechado' }
  ]
}
```

#### 3. HVAC Sensor (Auto)
```javascript
{
  name: 'Sensor HVAC',
  discovery_mode: 'auto',
  entities: [
    { entity_id: 'temperature', type: 'sensor', unit: '°C' },
    { entity_id: 'humidity', type: 'sensor', unit: '%' },
    { entity_id: 'co2', type: 'sensor', unit: 'ppm' }
  ]
}
```

### Funções Principais

| Função | Retorno |
|--------|---------|
| `getTemplate(type)` | Template completo |
| `getAllTemplates()` | Lista de templates (sem entities) |
| `generateEntitiesFromTemplate(type, deviceId)` | Array de entities com MQTT topics |
| `isValidType(type)` | Boolean |

---

## 🎮 Passo 4: Controllers

### Entity Controller

**Arquivo**: `controllers/entityController.js`

**Endpoints implementados:**

| Método | Rota | Função |
|--------|------|--------|
| GET | `/api/devices/:deviceId/entities` | `getDeviceEntities` |
| POST | `/api/devices/:deviceId/entities` | `createEntity` |
| POST | `/api/devices/:deviceId/entities/bulk` | `createMultipleEntities` |
| PATCH | `/api/devices/:deviceId/entities/:entityId/value` | `updateEntityValue` |
| PUT | `/api/entities/:entityId` | `updateEntity` |
| DELETE | `/api/entities/:entityId` | `deleteEntity` |

**Validações:**
- ✅ Verificar se device pertence ao usuário
- ✅ Validar entity_id único
- ✅ Validar tipos de valor por entity_type
- ✅ Proteger entidades locked

### Device Controller (Atualizado)

**Novos endpoints:**
```javascript
// GET /api/devices/templates
exports.getTemplates = async (req, res) => {
  const templates = getAllTemplates();
  res.json({ success: true, templates });
};

// POST /api/devices - Com auto-criação de entities
exports.createDevice = async (req, res) => {
  const device = await Device.createFromObject(req.body, req.userId);
  
  // Se usar template, criar entidades
  if (device.discovery_mode === 'template' || device.discovery_mode === 'hybrid') {
    const templateEntities = generateEntitiesFromTemplate(type, device_id);
    await Entity.createMultiple(device.id, templateEntities);
  }
  
  // Retornar device com entities
  const entities = Entity.findByDeviceId(device.id);
  res.status(201).json({ device, entities });
};
```

---

## 🛣️ Passo 5: Routes

**Arquivo**: `routes/entities.js`
```javascript
const express = require('express');
const router = express.Router();
const entityController = require('../controllers/entityController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/devices/:deviceId/entities', entityController.getDeviceEntities);
router.post('/devices/:deviceId/entities', entityController.createEntity);
router.post('/devices/:deviceId/entities/bulk', entityController.createMultipleEntities);
router.patch('/devices/:deviceId/entities/:entityId/value', entityController.updateEntityValue);
router.put('/entities/:entityId', entityController.updateEntity);
router.delete('/entities/:entityId', entityController.deleteEntity);

module.exports = router;
```

**Integração no `server.js`:**
```javascript
const entityRoutes = require('./routes/entities');
app.use('/api', entityRoutes);
```

---

## 🧪 Passo 6: Testes

**Arquivo**: `scripts/test-entities.js`

### Workflow de Teste

1. ✅ Listar templates disponíveis
2. ✅ Criar device com template `compressor_monitor`
3. ✅ Gerar 6 entidades automaticamente
4. ✅ Buscar device com entidades
5. ✅ Atualizar valor do relay (toggle ON)
6. ✅ Buscar entidade por MQTT topic

### Executar
```bash
node scripts/test-entities.js
```

**Saída esperada:**
```
🧪 Testing Entity System

📋 Available Templates:
  - compressor_monitor: Monitor de Compressor (🏭) - hybrid
  - gate_controller: Controle de Portão (🚪) - template
  ...

🏭 Creating test device: Compressor Monitor
✅ Device created: ID 1, device_id TEST_COMP_01

⚙️ Generating entities from template...
  Generated 6 entities

💾 Creating entities in database...
✅ 6 entities created

📊 Fetching device with entities...
Found 6 entities:
  🔌 Relé Principal (switch)
  🌡️ Temperatura Óleo (sensor) - 0 °C
  ...

🔄 Testing value update...
  ✅ Updated: {"state":true}

✅ All tests passed!
```

---

## 📡 Passo 7: Testes de API (cURL)

### 1. Login
```bash
export TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"test123"}' | jq -r '.token')
```

### 2. Listar Templates
```bash
curl -X GET http://localhost:3000/api/devices/templates \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 3. Criar Device com Template
```bash
curl -X POST http://localhost:3000/api/devices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Compressor Principal",
    "device_id": "COMP_001",
    "type": "compressor_monitor",
    "discovery_mode": "template"
  }' | jq
```

### 4. Listar Entidades
```bash
curl -X GET http://localhost:3000/api/devices/1/entities \
  -H "Authorization: Bearer $TOKEN" | jq
```

### 5. Toggle Relay
```bash
curl -X PATCH http://localhost:3000/api/devices/1/entities/relay_main/value \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": true}' | jq
```

---

## 🔧 Troubleshooting

### Erro: "User not found"

**Causa**: Schema recriou tabela users  
**Solução**:
```bash
# Recriar usuário
sqlite3 data/database.sqlite << 'SQL'
INSERT INTO users (tenant_id, username, email, password) 
VALUES (1, 'admin', 'admin@test.com', 
        '$2b$10$rBV2Hq3r6txlOvKj4j5xFeAJPBolKFl.YN7cKfzFbfLVp.GYzqYfK');
SQL
```

### Erro: "Device limit reached"

**Causa**: Plan limits ativos  
**Solução**:
```bash
# Atualizar plano para premium
sqlite3 data/database.sqlite \
  "UPDATE tenants SET plan = 'premium' WHERE id = 1;"
```

### Erro: "Entity with this ID already exists"

**Causa**: Tentando criar entidade duplicada  
**Solução**: Use `entity_id` único por device

---

## ✅ Checklist de Implementação

- [ ] Migration executada sem erros
- [ ] Tabela `entities` criada
- [ ] Colunas adicionadas à tabela `devices`
- [ ] Model `Entity.js` criado
- [ ] Service `deviceTemplates.js` criado
- [ ] Controller `entityController.js` criado
- [ ] Routes `/api/devices/:id/entities` funcionando
- [ ] Device controller atualizado
- [ ] Server.js registrando entity routes
- [ ] Testes passando (`test-entities.js`)
- [ ] API testada com cURL
- [ ] Documentação atualizada

---

## 📊 Resultado Final

**Database Schema:**
```
users → tenants → devices → entities
                         ↓
                    (1:N relationship)
```

**API Endpoints:** 14 (6 novos)  
**Templates:** 6 predefinidos  
**Entity Types:** 5 suportados  
**Arquivos Criados:** 6  
**Linhas de Código:** ~1.200

---

## 🎯 Próximos Passos (Phase 1.2b)

1. **Dashboard UI** - Renderizar cards dinâmicos
2. **Templates Frontend** - JavaScript por tipo
3. **Modal de Criação** - Interface para adicionar devices
4. **Real-time Updates** - WebSocket ou polling

---

**Versão**: 1.0  
**Data**: 15/10/2025  
**Autor**: Rodrigo S. Lange  
**Status**: ✅ Implementação completa e testada
