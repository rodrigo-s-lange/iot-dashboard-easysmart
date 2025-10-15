# 🏗️ EasySmart IoT Platform - Architecture

**Documento técnico completo da arquitetura do sistema**

**Versão**: 1.3.0-beta  
**Última atualização**: 15 Outubro 2025  
**Status**: Em implementação (Phase 1.3)

---

## 📊 Visão Geral

Sistema multi-tenant IoT com arquitetura híbrida de bancos de dados, otimizada para alta performance em leitura de time-series e integridade relacional.

### 🎯 Princípios Arquiteturais

1. **Separation of Concerns**: Dados relacionais vs time-series
2. **Scalability**: Horizontal (InfluxDB) e vertical (PostgreSQL)
3. **Security**: Multi-tenant com isolamento completo
4. **Performance**: Cada DB faz o que faz melhor
5. **Maintainability**: Código limpo, modular e testável
6. **Cost-Effectiveness**: Self-hosted, R$ 0 infrastructure

---

## 🗄️ Database Architecture

### Dual Database Strategy
```
┌─────────────────────────────────────────────────────────┐
│                  APPLICATION LAYER                       │
│                                                          │
│  ┌──────────────┐         ┌──────────────┐             │
│  │   Device     │         │    Data      │             │
│  │   Service    │         │   Service    │             │
│  └──────┬───────┘         └──────┬───────┘             │
│         │                        │                      │
│         │                        │                      │
└─────────┼────────────────────────┼──────────────────────┘
          │                        │
          ▼                        ▼
┌─────────────────┐      ┌──────────────────────┐
│   PostgreSQL    │      │     InfluxDB         │
│   (Relational)  │      │   (Time-Series)      │
├─────────────────┤      ├──────────────────────┤
│ • Users         │      │ • temperature        │
│ • Tenants       │      │ • pressure           │
│ • Devices       │      │ • vibration          │
│ • Entities      │      │ • power_consumption  │
│ • Plans         │      │ • relay_states       │
│ • Permissions   │      │ • ml_predictions     │
└─────────────────┘      └──────────────────────┘
```

---

## 🐘 PostgreSQL - Relational Data

### Responsabilidades

- ✅ **Authentication & Authorization**
- ✅ **Multi-tenant management**
- ✅ **Device & Entity metadata**
- ✅ **Plans & Billing**
- ✅ **Configuration storage**
- ✅ **Referential integrity**

### Schema Design
```sql
-- Multi-tenant structure
tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  plan VARCHAR(50) DEFAULT 'free',
  status VARCHAR(50) DEFAULT 'active',
  trial_ends_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Users with tenant isolation
users (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,  -- bcrypt hashed
  role VARCHAR(50) DEFAULT 'owner',
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Devices metadata
devices (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  user_id INTEGER REFERENCES users(id),
  device_id VARCHAR(100) NOT NULL,  -- Physical device ID
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  location VARCHAR(255),
  status VARCHAR(50) DEFAULT 'offline',
  discovery_mode VARCHAR(50) DEFAULT 'template',
  config JSONB,
  last_seen TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, device_id)
);

-- Entities (sensors/actuators) configuration
entities (
  id SERIAL PRIMARY KEY,
  device_id INTEGER REFERENCES devices(id) ON DELETE CASCADE,
  entity_id VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,  -- switch, sensor, number, text
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(50),
  icon VARCHAR(50),
  config JSONB,
  discovery_mode VARCHAR(50) DEFAULT 'auto',
  mqtt_topic VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(device_id, entity_id)
);

-- Indexes for performance
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_devices_tenant ON devices(tenant_id);
CREATE INDEX idx_devices_status ON devices(status);
CREATE INDEX idx_entities_device ON entities(device_id);
CREATE INDEX idx_entities_mqtt ON entities(mqtt_topic);
```

### Row-Level Security (RLS)
```sql
-- Enable RLS
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their tenant's devices
CREATE POLICY tenant_isolation ON devices
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant_id')::INTEGER);

-- Set tenant context in application
SET app.current_tenant_id = 1;
```

---

## 📈 InfluxDB - Time-Series Data

### Responsabilidades

- ✅ **High-frequency sensor readings**
- ✅ **Device telemetry**
- ✅ **State change history**
- ✅ **ML training datasets**
- ✅ **Analytics & aggregations**

### Data Model
```
Measurement: sensor_data
├── Tags (indexed)
│   ├── tenant_id: "1"
│   ├── device_id: "COMP_001"
│   ├── entity_id: "temp_oil"
│   └── entity_type: "sensor"
├── Fields (not indexed)
│   ├── value: 85.5
│   ├── unit: "°C"
│   └── quality: 1.0
└── Timestamp: 2025-10-15T12:30:00Z

Measurement: relay_states
├── Tags
│   ├── tenant_id: "1"
│   ├── device_id: "COMP_001"
│   └── entity_id: "relay_main"
├── Fields
│   ├── state: true
│   └── triggered_by: "user_3"
└── Timestamp: 2025-10-15T12:30:05Z
```

### Retention Policies
```flux
// Free plan: 30 days
CREATE RETENTION POLICY "free_plan"
  ON "iot_data"
  DURATION 30d
  REPLICATION 1
  DEFAULT;

// Starter: 90 days
CREATE RETENTION POLICY "starter_plan"
  ON "iot_data"
  DURATION 90d
  REPLICATION 1;

// Professional: 365 days
CREATE RETENTION POLICY "professional_plan"
  ON "iot_data"
  DURATION 365d
  REPLICATION 1;

// Industrial: unlimited (manual management)
CREATE RETENTION POLICY "industrial_plan"
  ON "iot_data"
  DURATION INF
  REPLICATION 1;
```

### Downsampling (Continuous Queries)
```flux
// Aggregate to 5-minute averages after 7 days
option task = {name: "downsample_5min", every: 1h}

from(bucket: "iot_data")
  |> range(start: -8d, stop: -7d)
  |> filter(fn: (r) => r._measurement == "sensor_data")
  |> aggregateWindow(every: 5m, fn: mean)
  |> to(bucket: "iot_data_5min")

// Aggregate to 1-hour averages after 30 days
option task = {name: "downsample_1h", every: 6h}

from(bucket: "iot_data_5min")
  |> range(start: -31d, stop: -30d)
  |> aggregateWindow(every: 1h, fn: mean)
  |> to(bucket: "iot_data_1h")
```

---

## 🔄 Data Flow

### Write Path (IoT → Database)
```
┌──────────────┐
│ IoT Device   │
│ (ESP32)      │
└──────┬───────┘
       │ MQTT Publish
       │ QoS 1
       ▼
┌──────────────────┐
│ Mosquitto Broker │
│ (port 1883)      │
└──────┬───────────┘
       │
       ├────────────────────┐
       │                    │
       ▼                    ▼
┌─────────────┐      ┌──────────────┐
│ PostgreSQL  │      │  InfluxDB    │
│             │      │              │
│ UPDATE      │      │ INSERT       │
│ devices     │      │ sensor_data  │
│ SET         │      │ VALUES(...)  │
│ last_seen   │      │              │
│ status='on' │      │              │
└─────────────┘      └──────────────┘
```

### Read Path (Dashboard ← Database)
```
┌──────────────┐
│   Browser    │
│  (Dashboard) │
└──────┬───────┘
       │ HTTP GET
       │ /api/devices/1
       ▼
┌─────────────────────┐
│  Node.js API        │
│  (Express)          │
└──────┬──────────────┘
       │
       ├───────────────────┐
       │                   │
       ▼                   ▼
┌─────────────┐     ┌──────────────┐
│ PostgreSQL  │     │  InfluxDB    │
│             │     │              │
│ SELECT      │     │ SELECT       │
│ name, type, │     │ value, time  │
│ status      │     │ FROM         │
│ FROM        │     │ sensor_data  │
│ devices     │     │ WHERE...     │
└──────┬──────┘     └──────┬───────┘
       │                   │
       └────────┬──────────┘
                │ JSON merge
                ▼
        ┌───────────────┐
        │  API Response │
        │  {device,     │
        │   timeseries} │
        └───────────────┘
```

---

## 🔌 MQTT Integration

### Topic Structure
```
devices/{DEVICE_ID}/status               # LWT: online/offline
devices/{DEVICE_ID}/discovery            # Auto-discovery payload
devices/{DEVICE_ID}/{ENTITY_ID}/state    # Sensor readings
devices/{DEVICE_ID}/{ENTITY_ID}/set      # Control commands
devices/{DEVICE_ID}/telemetry            # Batch telemetry
```

### Message Flow
```javascript
// Device publishes temperature
PUBLISH devices/COMP_001/temp_oil/state
{
  "value": 85.5,
  "unit": "°C",
  "timestamp": 1697376000
}

// MQTT Service receives
mqttClient.on('message', async (topic, message) => {
  const data = JSON.parse(message);
  const parts = topic.split('/');
  
  // Write to InfluxDB
  await influxWrite({
    measurement: 'sensor_data',
    tags: {
      device_id: parts[1],
      entity_id: parts[2]
    },
    fields: {
      value: data.value
    },
    timestamp: data.timestamp
  });
  
  // Update PostgreSQL status
  await pgQuery(
    'UPDATE devices SET last_seen = NOW(), status = $1 WHERE device_id = $2',
    ['online', parts[1]]
  );
});
```

---

## 🤖 Machine Learning Pipeline

### Architecture
```
┌──────────────────┐
│   InfluxDB       │
│  (Training Data) │
└────────┬─────────┘
         │ Batch export
         ▼
┌──────────────────────┐
│  TensorFlow.js       │
│  Training Service    │
│  (Node.js)           │
└────────┬─────────────┘
         │ Trained model
         ▼
┌──────────────────────┐
│  Model Storage       │
│  (File system/S3)    │
└────────┬─────────────┘
         │ Load model
         ▼
┌──────────────────────┐
│  Inference Service   │
│  (Real-time)         │
└────────┬─────────────┘
         │ Predictions
         ▼
┌──────────────────────┐
│  InfluxDB            │
│  (ml_predictions)    │
└──────────────────────┘
```

### ML Features by Plan

| Feature | Starter | Professional | Industrial |
|---------|---------|--------------|------------|
| Anomaly Detection | ❌ | ✅ Basic | ✅ Advanced |
| Predictive Maintenance | ❌ | ✅ | ✅ |
| Pattern Recognition | ❌ | ❌ | ✅ |
| Custom Models | ❌ | ❌ | ✅ |
| Edge Deployment | ❌ | ❌ | ✅ |

---

## 🐳 Docker Architecture

### Container Stack
```yaml
services:
  postgres-iot:
    - Relational database
    - Port: 5432
    - Volume: postgres_data
    
  influxdb-iot:
    - Time-series database
    - Port: 8086
    - Volume: influxdb_data
    
  iot-dashboard:
    - Node.js application
    - Port: 3000
    - Depends on: postgres, influxdb
    
  mosquitto:
    - MQTT broker
    - Ports: 1883, 9001
    - Volume: mosquitto_data
```

### Network Communication
```
┌─────────────────────────────────────────┐
│          Docker Network: iot-network    │
│                                         │
│  ┌──────────┐     ┌──────────┐        │
│  │ Postgres │◄────┤ Dashboard│        │
│  │  :5432   │     │  :3000   │        │
│  └──────────┘     └────┬─────┘        │
│                        │               │
│  ┌──────────┐         │               │
│  │ InfluxDB │◄────────┤               │
│  │  :8086   │         │               │
│  └──────────┘         │               │
│                        │               │
│  ┌──────────┐         │               │
│  │Mosquitto │◄────────┘               │
│  │  :1883   │                         │
│  └──────────┘                         │
└─────────────────────────────────────────┘
```

---

## 🔐 Security Architecture

### Authentication Flow
```
1. User submits credentials
   ↓
2. API validates (bcrypt.compare)
   ↓
3. Generate JWT (1h expiration)
   ↓
4. Return token to client
   ↓
5. Client stores in localStorage
   ↓
6. Subsequent requests include JWT in header
   ↓
7. authMiddleware validates token
   ↓
8. Extracts userId, tenantId
   ↓
9. Sets context for RLS
   ↓
10. Execute query with tenant isolation
```

### Multi-Tenant Isolation
```javascript
// Middleware sets tenant context
async function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  const decoded = jwt.verify(token, JWT_SECRET);
  
  // Get user's tenant
  const user = await pool.query(
    'SELECT tenant_id FROM users WHERE id = $1',
    [decoded.userId]
  );
  
  // Set tenant context for RLS
  await pool.query(
    "SET LOCAL app.current_tenant_id = $1",
    [user.rows[0].tenant_id]
  );
  
  req.userId = decoded.userId;
  req.tenantId = user.rows[0].tenant_id;
  next();
}
```

---

## 📊 Performance Considerations

### Database Sizing

**PostgreSQL:**
```
Users: 1000 → ~10 MB
Devices: 10,000 → ~50 MB
Entities: 100,000 → ~100 MB
Total metadata: ~200 MB
```

**InfluxDB:**
```
1 device, 10 sensors, 1 reading/min
= 10 * 60 * 24 * 30 = 432,000 points/month
≈ 50 MB/month (compressed)

1,000 devices = 50 GB/month
Retention 30d (free) = 50 GB
Retention 365d (pro) = 600 GB
```

### Query Optimization

**PostgreSQL:**
- Indexes on tenant_id, device_id
- EXPLAIN ANALYZE for slow queries
- Connection pooling (pg-pool)

**InfluxDB:**
- Tags for indexed fields
- Fields for data values
- Downsampling for old data
- Sharding by tenant_id

---

## 🔄 Backup & Recovery

### PostgreSQL Backup
```bash
# Daily automated backup
docker exec postgres-iot pg_dump -U iotuser iot_dashboard | gzip > backup_$(date +%Y%m%d).sql.gz

# Restore
gunzip < backup_20251015.sql.gz | docker exec -i postgres-iot psql -U iotuser iot_dashboard
```

### InfluxDB Backup
```bash
# Weekly backup
docker exec influxdb-iot influx backup /backup/influx_$(date +%Y%m%d)

# Restore
docker exec influxdb-iot influx restore /backup/influx_20251015
```

---

## 📈 Scalability Path

### Phase 1: Single Server (Current)
- Self-hosted
- Docker Compose
- Up to 1,000 devices

### Phase 2: Load Balancing
- Nginx load balancer
- Multiple app instances
- Up to 10,000 devices

### Phase 3: Database Clustering
- PostgreSQL replication
- InfluxDB clustering
- Up to 100,000 devices

### Phase 4: Cloud Migration
- Managed PostgreSQL (RDS/Cloud SQL)
- InfluxDB Cloud
- Kubernetes orchestration
- Unlimited devices

---

## 🎯 Design Decisions

### Why Dual Database?

| Decision | Reasoning |
|----------|-----------|
| PostgreSQL for metadata | ACID, referential integrity, complex queries |
| InfluxDB for telemetry | Optimized for time-series, compression, retention policies |
| Self-hosted | Cost R$ 0, data privacy, full control |
| Docker Compose | Easy deployment, reproducible, portable |

### Trade-offs

**Complexity:**
- ⚠️ Two databases to manage
- ✅ Each does what it does best

**Consistency:**
- ⚠️ Eventual consistency between DBs
- ✅ PostgreSQL ensures relational integrity

**Performance:**
- ✅ Optimized queries for each workload
- ✅ No mixing concerns

---

**Documento mantido por:** Rodrigo S. Lange  
**Última revisão:** 15 Outubro 2025  
**Próxima revisão:** Phase 1.3 completion
