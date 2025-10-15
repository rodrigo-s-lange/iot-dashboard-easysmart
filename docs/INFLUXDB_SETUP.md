# 📊 InfluxDB Setup Guide

**Guia completo de implementação e configuração do InfluxDB para time-series data**

**Versão**: 1.0  
**Última atualização**: 15 Outubro 2025  
**Público**: Time técnico

---

## 🎯 Objetivo

Migrar dados de telemetria de **SQLite** para **InfluxDB 2.7**, mantendo PostgreSQL para dados relacionais.

---

## 🏗️ Arquitetura Dual Database
```
┌─────────────────────────────────────────────────────────┐
│                    APPLICATION                           │
└──────────┬────────────────────────┬─────────────────────┘
           │                        │
           ▼                        ▼
    ┌─────────────┐          ┌─────────────┐
    │ PostgreSQL  │          │  InfluxDB   │
    ├─────────────┤          ├─────────────┤
    │ • Users     │          │ • sensor_*  │
    │ • Devices   │          │ • telemetry │
    │ • Entities  │          │ • states    │
    │ • Config    │          │ • ml_pred   │
    └─────────────┘          └─────────────┘
```

---

## 🐳 Docker Setup

### 1. Atualizar `docker-compose.yml`
```yaml
version: '3.8'

services:
  # PostgreSQL - Dados Relacionais
  postgres:
    image: postgres:16-alpine
    container_name: postgres-iot
    restart: unless-stopped
    environment:
      POSTGRES_DB: iot_dashboard
      POSTGRES_USER: iotuser
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    networks:
      - iot-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U iotuser -d iot_dashboard"]
      interval: 10s
      timeout: 5s
      retries: 5

  # InfluxDB - Time Series
  influxdb:
    image: influxdb:2.7-alpine
    container_name: influxdb-iot
    restart: unless-stopped
    environment:
      DOCKER_INFLUXDB_INIT_MODE: setup
      DOCKER_INFLUXDB_INIT_USERNAME: admin
      DOCKER_INFLUXDB_INIT_PASSWORD: ${INFLUXDB_PASSWORD}
      DOCKER_INFLUXDB_INIT_ORG: easysmart
      DOCKER_INFLUXDB_INIT_BUCKET: iot_data
      DOCKER_INFLUXDB_INIT_RETENTION: 30d
      DOCKER_INFLUXDB_INIT_ADMIN_TOKEN: ${INFLUXDB_TOKEN}
    volumes:
      - influxdb_data:/var/lib/influxdb2
      - influxdb_config:/etc/influxdb2
    ports:
      - "8086:8086"
    networks:
      - iot-network
    healthcheck:
      test: ["CMD", "influx", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  # IoT Dashboard
  iot-dashboard:
    build: ./iot-dashboard
    container_name: iot-dashboard
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
      # PostgreSQL
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: iot_dashboard
      DB_USER: iotuser
      DB_PASSWORD: ${POSTGRES_PASSWORD}
      # InfluxDB
      INFLUX_URL: http://influxdb:8086
      INFLUX_TOKEN: ${INFLUXDB_TOKEN}
      INFLUX_ORG: easysmart
      INFLUX_BUCKET: iot_data
      # MQTT
      MQTT_HOST: mosquitto
      MQTT_PORT: 1883
      MQTT_USER: ${MQTT_USER}
      MQTT_PASS: ${MQTT_PASS}
      # JWT
      JWT_SECRET: ${JWT_SECRET}
    volumes:
      - ./iot-dashboard:/app
      - /app/node_modules
    ports:
      - "3000:3000"
    depends_on:
      postgres:
        condition: service_healthy
      influxdb:
        condition: service_healthy
    networks:
      - iot-network

volumes:
  postgres_data:
  influxdb_data:
  influxdb_config:

networks:
  iot-network:
    driver: bridge
```

### 2. Configurar `.env`
```bash
# PostgreSQL
POSTGRES_PASSWORD=sua_senha_postgres_super_segura

# InfluxDB
INFLUXDB_PASSWORD=sua_senha_influx_super_segura
INFLUXDB_TOKEN=seu_token_gerado_aqui

# MQTT
MQTT_USER=devices
MQTT_PASS=sua_senha_mqtt

# JWT
JWT_SECRET=sua_chave_jwt_32_chars_minimo
```

### 3. Gerar Token InfluxDB
```bash
# Método 1: Gerar manualmente
openssl rand -hex 32

# Método 2: Usar o InfluxDB CLI após primeiro start
docker exec influxdb-iot influx auth create \
  --org easysmart \
  --description "IoT Dashboard Token" \
  --read-buckets \
  --write-buckets
```

---

## 📦 Instalação Node.js Client
```bash
# Adicionar ao package.json
npm install @influxdata/influxdb-client @influxdata/influxdb-client-apis
```

---

## 🔧 Configuração do Cliente

### `config/influxdb.js`
```javascript
const { InfluxDB, Point } = require('@influxdata/influxdb-client');

const url = process.env.INFLUX_URL || 'http://localhost:8086';
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG || 'easysmart';
const bucket = process.env.INFLUX_BUCKET || 'iot_data';

// Cliente de escrita
const writeClient = new InfluxDB({ url, token }).getWriteApi(org, bucket, 'ns');

// Cliente de leitura
const queryClient = new InfluxDB({ url, token }).getQueryApi(org);

// Configurações de escrita
writeClient.useDefaultTags({ environment: process.env.NODE_ENV || 'development' });

module.exports = {
  writeClient,
  queryClient,
  Point,
  bucket,
  org
};
```

---

## 📝 Data Model

### Measurements (Tabelas)
```
sensor_data
├── Tags (indexed)
│   ├── tenant_id: "1"
│   ├── device_id: "COMP_001"
│   ├── entity_id: "temp_oil"
│   └── entity_type: "sensor"
├── Fields (values)
│   ├── value: 85.5
│   └── unit: "°C"
└── Timestamp (nanosecond precision)

relay_states
├── Tags
│   ├── tenant_id: "1"
│   ├── device_id: "COMP_001"
│   └── entity_id: "relay_main"
├── Fields
│   ├── state: 1  (1=on, 0=off)
│   └── triggered_by: "user_3"
└── Timestamp

device_telemetry
├── Tags
│   ├── tenant_id: "1"
│   └── device_id: "COMP_001"
├── Fields
│   ├── cpu_usage: 45.2
│   ├── memory_mb: 128
│   ├── uptime_seconds: 86400
│   └── rssi: -67
└── Timestamp
```

---

## 🔌 Service Layer

### `services/influxService.js`
```javascript
const { writeClient, queryClient, Point, bucket } = require('../config/influxdb');

class InfluxService {
  /**
   * Escrever leitura de sensor
   */
  async writeSensorData(data) {
    const { tenant_id, device_id, entity_id, entity_type, value, unit } = data;

    const point = new Point('sensor_data')
      .tag('tenant_id', tenant_id.toString())
      .tag('device_id', device_id)
      .tag('entity_id', entity_id)
      .tag('entity_type', entity_type)
      .floatField('value', parseFloat(value));

    if (unit) {
      point.stringField('unit', unit);
    }

    writeClient.writePoint(point);
    
    // Flush periodicamente (a cada 1s ou quando buffer encher)
    await writeClient.flush();
  }

  /**
   * Escrever mudança de estado de relay
   */
  async writeRelayState(data) {
    const { tenant_id, device_id, entity_id, state, triggered_by } = data;

    const point = new Point('relay_states')
      .tag('tenant_id', tenant_id.toString())
      .tag('device_id', device_id)
      .tag('entity_id', entity_id)
      .intField('state', state ? 1 : 0);

    if (triggered_by) {
      point.stringField('triggered_by', triggered_by);
    }

    writeClient.writePoint(point);
    await writeClient.flush();
  }

  /**
   * Query: Últimos valores
   */
  async getLatestValues(tenant_id, device_id, entity_id) {
    const query = `
      from(bucket: "${bucket}")
        |> range(start: -1h)
        |> filter(fn: (r) => r["_measurement"] == "sensor_data")
        |> filter(fn: (r) => r["tenant_id"] == "${tenant_id}")
        |> filter(fn: (r) => r["device_id"] == "${device_id}")
        |> filter(fn: (r) => r["entity_id"] == "${entity_id}")
        |> last()
    `;

    const result = [];
    
    return new Promise((resolve, reject) => {
      queryClient.queryRows(query, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          result.push(o);
        },
        error(error) {
          reject(error);
        },
        complete() {
          resolve(result);
        }
      });
    });
  }

  /**
   * Query: Série temporal com intervalo
   */
  async getTimeSeries(tenant_id, device_id, entity_id, start, end) {
    const query = `
      from(bucket: "${bucket}")
        |> range(start: ${start}, stop: ${end})
        |> filter(fn: (r) => r["_measurement"] == "sensor_data")
        |> filter(fn: (r) => r["tenant_id"] == "${tenant_id}")
        |> filter(fn: (r) => r["device_id"] == "${device_id}")
        |> filter(fn: (r) => r["entity_id"] == "${entity_id}")
        |> filter(fn: (r) => r["_field"] == "value")
        |> aggregateWindow(every: 1m, fn: mean, createEmpty: false)
    `;

    const result = [];
    
    return new Promise((resolve, reject) => {
      queryClient.queryRows(query, {
        next(row, tableMeta) {
          const o = tableMeta.toObject(row);
          result.push({
            time: o._time,
            value: o._value
          });
        },
        error(error) {
          reject(error);
        },
        complete() {
          resolve(result);
        }
      });
    });
  }

  /**
   * Fechar conexões
   */
  async close() {
    await writeClient.close();
  }
}

module.exports = new InfluxService();
```

---

## 🔄 Integração MQTT → InfluxDB

### Atualizar `services/mqttService.js`
```javascript
const mqtt = require('mqtt');
const influxService = require('./influxService');
const Device = require('../models/Device');

class MqttService {
  constructor() {
    this.client = null;
  }

  connect() {
    this.client = mqtt.connect(`mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`, {
      username: process.env.MQTT_USER,
      password: process.env.MQTT_PASS
    });

    this.client.on('connect', () => {
      console.log('✅ MQTT connected');
      
      // Subscribe to all sensor data
      this.client.subscribe('devices/+/+/state');
      this.client.subscribe('devices/+/status');
    });

    this.client.on('message', async (topic, message) => {
      await this.handleMessage(topic, message);
    });
  }

  async handleMessage(topic, message) {
    const parts = topic.split('/');
    
    try {
      // devices/{DEVICE_ID}/{ENTITY_ID}/state
      if (parts[3] === 'state') {
        const device_id = parts[1];
        const entity_id = parts[2];
        const payload = JSON.parse(message.toString());

        // Buscar device no PostgreSQL
        const device = await Device.findByDeviceId(device_id);
        if (!device) return;

        // Buscar entity no PostgreSQL
        const entity = await Entity.findByDeviceAndEntityId(device.id, entity_id);
        if (!entity) return;

        // Escrever no InfluxDB
        if (entity.entity_type === 'sensor') {
          await influxService.writeSensorData({
            tenant_id: device.tenant_id,
            device_id: device_id,
            entity_id: entity_id,
            entity_type: entity.entity_type,
            value: payload.value,
            unit: entity.unit
          });
        } else if (entity.entity_type === 'switch') {
          await influxService.writeRelayState({
            tenant_id: device.tenant_id,
            device_id: device_id,
            entity_id: entity_id,
            state: payload.state,
            triggered_by: payload.triggered_by || 'device'
          });
        }

        // Atualizar last_seen no PostgreSQL
        await Device.updateLastSeen(device.id);
      }
      
      // devices/{DEVICE_ID}/status (LWT)
      if (parts[2] === 'status') {
        const device_id = parts[1];
        const status = message.toString(); // 'online' or 'offline'
        
        const device = await Device.findByDeviceId(device_id);
        if (device) {
          await Device.updateStatus(device.id, status);
        }
      }
    } catch (error) {
      console.error('MQTT message handling error:', error);
    }
  }
}

module.exports = new MqttService();
```

---

## 📊 API Endpoints

### `routes/data.js`
```javascript
const express = require('express');
const router = express.Router();
const influxService = require('../services/influxService');
const authMiddleware = require('../middleware/authMiddleware');

// Últimos valores
router.get('/:deviceId/:entityId/latest', authMiddleware, async (req, res) => {
  try {
    const { deviceId, entityId } = req.params;
    
    // Verificar permissão (device pertence ao tenant do usuário)
    const device = await Device.findById(deviceId);
    if (device.tenant_id !== req.tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const data = await influxService.getLatestValues(
      req.tenantId,
      device.device_id,
      entityId
    );

    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Série temporal
router.get('/:deviceId/:entityId', authMiddleware, async (req, res) => {
  try {
    const { deviceId, entityId } = req.params;
    const { start, end } = req.query;

    // Validar datas
    if (!start || !end) {
      return res.status(400).json({ error: 'start and end required' });
    }

    // Verificar permissão
    const device = await Device.findById(deviceId);
    if (device.tenant_id !== req.tenantId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const data = await influxService.getTimeSeries(
      req.tenantId,
      device.device_id,
      entityId,
      start,
      end
    );

    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

### Registrar no `server.js`
```javascript
const dataRoutes = require('./routes/data');
app.use('/api/data', dataRoutes);
```

---

## 🔄 Retention Policies

### Criar Buckets por Plano
```bash
# Free plan: 30 dias
docker exec influxdb-iot influx bucket create \
  --name iot_data_free \
  --org easysmart \
  --retention 720h

# Starter: 90 dias
docker exec influxdb-iot influx bucket create \
  --name iot_data_starter \
  --org easysmart \
  --retention 2160h

# Professional: 365 dias
docker exec influxdb-iot influx bucket create \
  --name iot_data_professional \
  --org easysmart \
  --retention 8760h

# Industrial: sem limite
docker exec influxdb-iot influx bucket create \
  --name iot_data_industrial \
  --org easysmart \
  --retention 0
```

### Escrever no Bucket Correto
```javascript
// Modificar influxService.js
async writeSensorData(data) {
  const { tenant_id, ... } = data;
  
  // Buscar plano do tenant
  const tenant = await Tenant.findById(tenant_id);
  const bucket = `iot_data_${tenant.plan}`;
  
  // Usar bucket específico
  const writeClient = new InfluxDB({ url, token })
    .getWriteApi(org, bucket, 'ns');
  
  // ... resto do código
}
```

---

## 🧪 Testes

### Script de Teste
```javascript
// scripts/test-influxdb.js
const influxService = require('../services/influxService');

async function test() {
  console.log('🧪 Testing InfluxDB connection...\n');

  // Escrever dados de teste
  await influxService.writeSensorData({
    tenant_id: 1,
    device_id: 'TEST_001',
    entity_id: 'temp_test',
    entity_type: 'sensor',
    value: 25.5,
    unit: '°C'
  });

  console.log('✅ Write successful\n');

  // Aguardar processamento
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Ler dados
  const data = await influxService.getLatestValues(1, 'TEST_001', 'temp_test');
  console.log('✅ Read successful:');
  console.log(JSON.stringify(data, null, 2));

  await influxService.close();
}

test().catch(console.error);
```

### Executar
```bash
node scripts/test-influxdb.js
```

---

## 📈 Downsampling (Continuous Queries)

### Criar Task de Agregação
```flux
// Via InfluxDB UI ou CLI
option task = {name: "downsample_5min", every: 1h, offset: 5m}

from(bucket: "iot_data")
  |> range(start: -2h)
  |> filter(fn: (r) => r["_measurement"] == "sensor_data")
  |> aggregateWindow(every: 5m, fn: mean, createEmpty: false)
  |> to(bucket: "iot_data_5min", org: "easysmart")
```

---

## 🔒 Backup & Recovery

### Backup
```bash
# Backup completo
docker exec influxdb-iot influx backup /tmp/backup

# Copiar para host
docker cp influxdb-iot:/tmp/backup ./backup_$(date +%Y%m%d)
```

### Restore
```bash
# Copiar backup para container
docker cp ./backup_20251015 influxdb-iot:/tmp/restore

# Restaurar
docker exec influxdb-iot influx restore /tmp/restore
```

---

## ✅ Checklist de Implementação

- [ ] Docker Compose atualizado
- [ ] Variáveis de ambiente configuradas
- [ ] Token InfluxDB gerado
- [ ] npm packages instalados
- [ ] config/influxdb.js criado
- [ ] services/influxService.js criado
- [ ] MQTT Service atualizado
- [ ] API routes criadas
- [ ] Testes passando
- [ ] Buckets por plano criados
- [ ] Backup configurado

---

**Documento mantido por:** Rodrigo S. Lange  
**Última atualização:** 15 Outubro 2025  
**Status**: Pronto para implementação Phase 1.3
