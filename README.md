# 🏭 EasySmart IoT Platform

**Plataforma SaaS completa para gerenciamento de dispositivos IoT industriais e residenciais com Machine Learning integrado**

![Version](https://img.shields.io/badge/version-1.3.0--beta-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![PostgreSQL](https://img.shields.io/badge/postgresql-16-blue)
![InfluxDB](https://img.shields.io/badge/influxdb-2.7-orange)

---

## ✨ Visão Geral

Sistema de gerenciamento IoT multi-tenant com arquitetura híbrida de bancos de dados, suporte a Machine Learning e modelo de negócio SaaS flexível.

### 🎯 Diferenciais

- 🔐 **Multi-tenant** com isolamento completo
- 📊 **Dual Database**: PostgreSQL (relacional) + InfluxDB (time-series)
- 🤖 **Machine Learning** integrado (TensorFlow.js)
- 📱 **Templates Dinâmicos** para diversos tipos de dispositivos
- 🔌 **Auto-Discovery** via MQTT
- 📈 **Dashboards Inteligentes** com histórico e analytics
- 💰 **Modelo SaaS** com planos flexíveis

---

## 🏗️ Arquitetura
```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│  Web Dashboard │ Mobile App (future) │ API Clients      │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│               APPLICATION LAYER                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Auth API │  │Device API│  │ Data API │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│  ┌──────────────────────────────────────┐              │
│  │   MQTT Service (Mosquitto)            │              │
│  └──────────────────────────────────────┘              │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                  DATA LAYER                              │
│  ┌─────────────────────┐  ┌──────────────────────┐     │
│  │   PostgreSQL 16     │  │    InfluxDB 2.7      │     │
│  ├─────────────────────┤  ├──────────────────────┤     │
│  │ • Users & Auth      │  │ • Sensor readings    │     │
│  │ • Tenants & Plans   │  │ • Telemetry data     │     │
│  │ • Devices metadata  │  │ • Time-series        │     │
│  │ • Entities config   │  │ • ML training data   │     │
│  │ • Permissions       │  │ • Analytics          │     │
│  └─────────────────────┘  └──────────────────────┘     │
└─────────────────────────────────────────────────────────┘
```

### 🔄 Data Flow
```
IoT Device (ESP32)
    │ MQTT Publish
    ▼
Mosquitto Broker
    │
    ├──► PostgreSQL (device status, metadata)
    │
    └──► InfluxDB (sensor readings, telemetry)
         │
         ▼
    TensorFlow.js (ML processing)
         │
         ▼
    Dashboard (real-time charts)
```

---

## 💰 Modelo de Negócio SaaS

| Plan | Devices | Data Retention | ML Features | Price |
|------|---------|----------------|-------------|-------|
| **Free** | 1 (hardware bundle) | 30 dias | ❌ | R$ 0/mês |
| **Starter** | 5 | 90 dias | ✅ Basic | Sob consulta |
| **Professional** | 20 | 365 dias | ✅ Intermediate | Sob consulta |
| **Industrial** | Ilimitado | Indefinido | ✅ Advanced + Edge | Sob consulta |

### 📦 Hardware com Plano Free

Dispositivos vendidos com **1 ano de plano gratuito incluído**:
- ESP32 Generic Devices
- Compressor Monitor Industrial
- Outros dispositivos IoT da linha EasySmart

---

## 🎯 Features Implementadas

### ✅ Phase 1.2 - Dashboard Básico (Completo)

**Backend:**
- ✅ Autenticação JWT com bcrypt
- ✅ Multi-tenant com isolamento
- ✅ Sistema de entidades (CRUD)
- ✅ 6 templates predefinidos
- ✅ API REST completa (14 endpoints)
- ✅ Rate limiting e segurança

**Frontend:**
- ✅ Dashboard moderno responsivo
- ✅ Cards dinâmicos por tipo
- ✅ Controle de switches em tempo real
- ✅ Modal de criação de devices
- ✅ Status indicators (online/offline)
- ✅ Toast notifications

### 🚧 Phase 1.3 - Database Migration (Em Progresso)

- [ ] PostgreSQL setup via Docker
- [ ] InfluxDB setup via Docker
- [ ] Migration: SQLite → PostgreSQL
- [ ] MQTT → InfluxDB pipeline
- [ ] Retention policies por plano
- [ ] Backup automation

### 📋 Roadmap

**Phase 1.4 - Smart Dashboards**
- Historical data visualization
- Chart.js/Plotly integration
- Real-time charts (WebSocket)
- CSV export functionality
- Custom date range filters

**Phase 2.0 - Machine Learning**
- TensorFlow.js integration
- Anomaly detection models
- Predictive maintenance alerts
- Pattern recognition
- Model training pipeline

**Phase 2.1 - Admin Panel**
- User management interface
- Plan management
- Billing integration
- Usage analytics
- Device provisioning

**Phase 3.0 - Advanced Features**
- Mobile app (React Native)
- Custom widgets marketplace
- Third-party integrations
- Advanced ML edge computing

---

## 🚀 Quick Start

### Pré-requisitos

- Docker & Docker Compose
- Node.js >= 18.0.0
- Git

### Instalação
```bash
# 1. Clone o repositório
git clone https://github.com/rodrigo-s-lange/iot-dashboard-easysmart.git
cd iot-dashboard-easysmart

# 2. Configurar variáveis de ambiente
cp .env.example .env
nano .env

# 3. Subir stack completa via Docker
docker-compose up -d

# 4. Executar migrations
docker exec iot-dashboard npm run migrate

# 5. Criar primeiro usuário
docker exec iot-dashboard npm run create-user

# 6. Acessar
# http://localhost:3000
```

### Configuração Mínima `.env`
```bash
# PostgreSQL
POSTGRES_PASSWORD=sua_senha_super_segura

# InfluxDB
INFLUXDB_PASSWORD=outra_senha_segura
INFLUXDB_TOKEN=seu_token_influxdb

# JWT
JWT_SECRET=chave_jwt_secreta_minimo_32_chars

# MQTT (se usar Mosquitto)
MQTT_USER=devices
MQTT_PASS=senha_mqtt
```

---

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/login       - Login e obtenção de JWT
GET    /api/auth/me          - Informações do usuário logado
```

### Devices
```
GET    /api/devices/templates    - Listar templates disponíveis
GET    /api/devices              - Listar devices do usuário
POST   /api/devices              - Criar device (auto-cria entities)
GET    /api/devices/:id          - Obter device específico
PUT    /api/devices/:id          - Atualizar device
DELETE /api/devices/:id          - Deletar device (cascade)
```

### Entities
```
GET    /api/devices/:id/entities               - Listar entidades
POST   /api/devices/:id/entities               - Criar entidade
POST   /api/devices/:id/entities/bulk          - Criar múltiplas
PATCH  /api/devices/:id/entities/:eid/value    - Atualizar valor
PUT    /api/entities/:id                       - Atualizar config
DELETE /api/entities/:id                       - Deletar entidade
```

### Time-Series Data (Phase 1.3+)
```
GET    /api/data/:deviceId/:entityId?start=&end=  - Query histórico
GET    /api/data/:deviceId/:entityId/latest       - Último valor
POST   /api/data/export                           - Exportar CSV
```

---

## 🎨 Device Templates

| Template | Discovery Mode | Entidades | Uso |
|----------|----------------|-----------|-----|
| `compressor_monitor` | Hybrid | 1 switch + 5 sensors | Monitoramento industrial RS485 |
| `gate_controller` | Template | 2 switches + 2 binary_sensors | Controle de portão residencial |
| `hvac_sensor` | Auto | 3 sensors | Temperatura/Umidade/CO2 |
| `relay_board` | Template | 4 switches | Placa de relés genérica |
| `energy_meter` | Auto | 5 sensors | Medidor de energia trifásico |
| `esp32_generic` | Auto | Variável | Auto-discovery completo |

---

## 🔧 Configuração MQTT

### Estrutura de Tópicos
```
devices/{DEVICE_ID}/status               - LWT (online/offline)
devices/{DEVICE_ID}/discovery            - Auto-discovery payload
devices/{DEVICE_ID}/{ENTITY_ID}/state    - Estado atual
devices/{DEVICE_ID}/{ENTITY_ID}/set      - Comando de controle
```

### Exemplo ESP32 (Arduino)
```cpp
#include <WiFi.h>
#include <PubSubClient.h>

const char* device_id = "ESP32_COMP_01";
const char* mqtt_server = "server.local";

void setup() {
  client.connect(device_id);
  
  // Auto-discovery
  String discovery = R"({
    "entities": [
      {"entity_id": "relay_1", "type": "switch", "name": "Relé 1"},
      {"entity_id": "temp", "type": "sensor", "name": "Temperatura", "unit": "°C"}
    ]
  })";
  client.publish("devices/ESP32_COMP_01/discovery", discovery.c_str(), true);
}

void loop() {
  float temp = readTemperature();
  String payload = String(temp);
  client.publish("devices/ESP32_COMP_01/temp/state", payload.c_str());
  delay(5000);
}
```

---

## 🔐 Segurança

- ✅ Passwords com bcrypt (10 rounds)
- ✅ JWT com expiração de 1h
- ✅ Rate limiting (5 login attempts / 15min)
- ✅ CORS configurado
- ✅ Multi-tenant row-level security
- ✅ SQL injection protection (prepared statements)
- ✅ XSS prevention
- ✅ HTTPS via Cloudflare Tunnel

---

## 👥 Gerenciamento de Usuários

### Via Script (Recomendado)
```bash
# Criar usuário com prompt interativo
npm run create-user

# Ou diretamente
node scripts/create-user.js
```

### Via SQL (Avançado)
```bash
# Gerar hash
node -e "require('bcryptjs').hash('senha123', 10).then(console.log)"

# Inserir
psql iot_dashboard -c "INSERT INTO users (tenant_id, username, email, password) VALUES (1, 'user', 'email@test.com', 'HASH');"
```

---

## 📚 Documentação Adicional

- [Architecture](docs/ARCHITECTURE.md) - Arquitetura detalhada
- [InfluxDB Setup](docs/INFLUXDB_SETUP.md) - Guia de configuração time-series
- [ML Features](docs/ML_FEATURES.md) - Machine Learning integration
- [Business Model](docs/BUSINESS_MODEL.md) - Modelo de negócio SaaS
- [Continuity Guide](docs/CONTINUITY_GUIDE.md) - Status e roadmap
- [Testing Guide](docs/TESTING_GUIDE.md) - Testes e validação

---

## 🐳 Docker Services
```
postgres-iot        - PostgreSQL 16
influxdb-iot        - InfluxDB 2.7
iot-dashboard       - Node.js application
mosquitto           - MQTT broker
(existing services: home-assistant, esphome, portainer)
```

### Resource Usage

| Service | RAM | Disk | CPU |
|---------|-----|------|-----|
| PostgreSQL | 100-200 MB | 1-5 GB | Low |
| InfluxDB | 200-500 MB | 5-50 GB | Medium |
| Dashboard | 50-100 MB | 500 MB | Low |

---

## 🧪 Testing
```bash
# Unit tests
npm test

# Integration tests
npm run test:integration

# Test entities system
npm run test:entities

# API tests (requires running server)
npm run test:api
```

---

## 📝 Licença

MIT License - veja [LICENSE](LICENSE)

---

## �� Autores

- **Rodrigo S. Lange** - Founder & Lead Developer
- Powered by **Claude AI** (Anthropic)

---

## 🙏 Agradecimentos

- Home Assistant - Entity system inspiration
- InfluxDB - Time-series excellence
- PostgreSQL - Rock-solid relational DB
- Mosquitto - Reliable MQTT broker
- TensorFlow.js - ML at the edge

---

**Version**: 1.3.0-beta  
**Last Update**: 15 Outubro 2025  
**Status**: 🚧 Phase 1.3 in progress (PostgreSQL + InfluxDB migration)  
**Production Ready**: ⚠️ Not yet (MVP stage)

---

📧 **Contact**: [rodrigo.s.lange@example.com](mailto:rodrigo.s.lange@example.com)  
🌐 **Website**: https://easysmart.com.br  
🐙 **GitHub**: https://github.com/rodrigo-s-lange/iot-dashboard-easysmart
