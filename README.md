# 🏭 IoT Dashboard - Plataforma Industrial Multi-Tenant

Sistema completo de gerenciamento de dispositivos IoT com suporte a templates dinâmicos, auto-discovery MQTT e interface web moderna.

![Version](https://img.shields.io/badge/version-1.2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)

---

## ✨ Features Implementadas

### �� Phase 1.2 (Atual - Completo)

#### Backend (Phase 1.2a)
- ✅ **Sistema de Entidades**: CRUD completo para sensores e atuadores
- ✅ **6 Templates Predefinidos**: Compressor, Portão, HVAC, Relés, Energia, ESP32
- ✅ **Auto-Discovery MQTT**: Dispositivos se registram automaticamente
- ✅ **Multi-Tenant**: Isolamento completo entre clientes
- ✅ **Autenticação JWT**: Segurança robusta com bcrypt
- ✅ **API REST**: 14 endpoints documentados

#### Frontend (Phase 1.2b)
- ✅ **Dashboard Moderno**: Cards dinâmicos por tipo de device
- ✅ **Interface Responsiva**: Bootstrap 5 com design industrial
- ✅ **Controle Real-time**: Toggle switches, atualização de valores
- ✅ **Modal de Criação**: Adicionar devices com preview de entidades
- ✅ **Status Indicators**: Online/Offline com animação pulse
- ✅ **Toast Notifications**: Feedback visual de ações

### 🔜 Roadmap
- 🚧 **Phase 1.3**: Integração MQTT real-time com auto-update
- 📋 **Phase 1.4**: WebSocket para updates em tempo real
- 🎨 **Phase 2.0**: Admin Panel para gestão de usuários
- 🔧 **Phase 2.1**: Customização de templates via UI
- 📊 **Phase 3.0**: Dashboards personalizados com charts

---

## 🏗️ Arquitetura
```
iot-dashboard/
├── config/           # Database & MQTT configs
├── controllers/      # Business logic (auth, devices, entities)
├── models/           # Data models (Device, Entity, User, Tenant)
├── routes/           # API endpoints
├── services/         # Device templates & MQTT service
├── middleware/       # Auth, rate limiting, plan validation
├── views/            # EJS templates (login, register, dashboard)
├── public/           # Static assets
│   ├── css/         # Dashboard styles
│   └── js/          # Frontend logic
└── scripts/          # Migration, testing, user creation
```

---

## 🚀 Quick Start

### Pré-requisitos
- Node.js >= 18.0.0
- SQLite3
- Mosquitto MQTT Broker (opcional para MQTT features)

### Instalação
```bash
# Clone o repositório
git clone https://github.com/rodrigo-s-lange/iot-dashboard-easysmart.git
cd iot-dashboard-easysmart

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
nano .env
```

### Configuração Inicial

**1. Executar migrations:**
```bash
node scripts/migrate.js
```

**2. Criar primeiro usuário:**
```bash
node scripts/create-user.js
```

Isso criará:
- **Username**: `testuser`
- **Password**: `test123`
- **Tenant**: Test Tenant (Premium)

**3. Iniciar servidor:**
```bash
npm start
```

**4. Acessar:** http://localhost:3000

---

## 🎨 Screenshots

### Dashboard Principal
```
┌──────────────────────────────────────────────────────┐
│ 🏭 EasySmart IoT              [Premium] 🚪 Sair     │
├──────────────────────────────────────────────────────┤
│ Meus Dispositivos              [➕ Adicionar] [🔄]   │
│ 2 de 5 dispositivos                                  │
│                                                      │
│ ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│ │🏭 Compressor │  │🚪 Portão     │  │🌡️ HVAC    │ │
│ │🟢 Online     │  │🔴 Offline    │  │🟢 Online   │ │
│ │─────────────│  │─────────────│  │────────────│ │
│ │🔌 Relé: ON  │  │🔓 Abrir     │  │Temp: 24°C │ │
│ │🌡️ 85°C      │  │🔒 Fechar    │  │Umid: 60%  │ │
│ │📊 120 PSI   │  │✅ Aberto    │  │CO2: 450ppm│ │
│ └──────────────┘  └──────────────┘  └────────────┘ │
└──────────────────────────────────────────────────────┘
```

---

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/login       - Login (retorna JWT)
```

### Devices
```
GET    /api/devices/templates    - Listar templates disponíveis
GET    /api/devices              - Listar devices do usuário
POST   /api/devices              - Criar device (auto-cria entities)
GET    /api/devices/:id          - Obter device com entidades
PUT    /api/devices/:id          - Atualizar device
DELETE /api/devices/:id          - Deletar device (cascade entities)
```

### Entities
```
GET    /api/devices/:id/entities           - Listar entidades
POST   /api/devices/:id/entities           - Criar entidade
POST   /api/devices/:id/entities/bulk      - Criar múltiplas
PATCH  /api/devices/:id/entities/:eid/value - Atualizar valor
PUT    /api/entities/:id                   - Atualizar config
DELETE /api/entities/:id                   - Deletar entidade
```

### Exemplo: Criar Device com Template
```bash
curl -X POST http://localhost:3000/api/devices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Compressor Principal",
    "device_id": "COMP_001",
    "type": "compressor_monitor",
    "location": "Sala de Máquinas",
    "discovery_mode": "template"
  }'
```

**Response:**
```json
{
  "success": true,
  "device": {
    "id": 1,
    "name": "Compressor Principal",
    "status": "offline",
    "entities_count": 6
  },
  "entities": [
    {"entity_id": "relay_main", "type": "switch", "name": "Relé Principal"},
    {"entity_id": "temp_oil", "type": "sensor", "name": "Temperatura Óleo", "unit": "°C"},
    ...
  ]
}
```

---

## 🎨 Templates Disponíveis

| Template | Modo | Entidades | Descrição |
|----------|------|-----------|-----------|
| `compressor_monitor` | Hybrid | 1 switch + 5 sensors | Monitor industrial RS485 |
| `gate_controller` | Template | 2 switches + 2 binary_sensors | Controle de portão residencial |
| `hvac_sensor` | Auto | 3 sensors | Temperatura/Umidade/CO2 |
| `relay_board` | Template | 4 switches | Placa de relés genérica |
| `energy_meter` | Auto | 5 sensors | Medidor de energia trifásico |
| `esp32_generic` | Auto | Variável | Auto-discovery completo |

---

## 🔧 Configuração MQTT

### Estrutura de Tópicos
```
devices/{DEVICE_ID}/{ENTITY_ID}/state    - Publica estado atual
devices/{DEVICE_ID}/{ENTITY_ID}/set      - Recebe comandos
devices/{DEVICE_ID}/discovery            - Auto-discovery payload
devices/{DEVICE_ID}/status               - LWT (online/offline)
```

### Exemplo ESP32 (PlatformIO)
```cpp
#include <WiFi.h>
#include <PubSubClient.h>

const char* mqtt_server = "server.local";
const char* device_id = "ESP32_COMP_01";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  // Conectar WiFi
  WiFi.begin(ssid, password);
  
  // Conectar MQTT
  client.setServer(mqtt_server, 1883);
  client.connect(device_id);
  
  // Enviar discovery
  String discovery = R"({
    "entities": [
      {"entity_id": "relay_1", "type": "switch", "name": "Relé 1"},
      {"entity_id": "temp", "type": "sensor", "name": "Temperatura", "unit": "°C"}
    ]
  })";
  client.publish("devices/ESP32_COMP_01/discovery", discovery.c_str(), true);
}

void loop() {
  // Publicar temperatura
  float temp = readTemperature();
  String payload = String(temp);
  client.publish("devices/ESP32_COMP_01/temp/state", payload.c_str());
  
  delay(5000);
}
```

---

## 🔐 Segurança

- ✅ Senhas hashadas com bcrypt (10 rounds)
- ✅ JWT com expiração de 1h
- ✅ Rate limiting: 5 tentativas de login / 15min
- ✅ CORS configurado
- ✅ Isolamento multi-tenant rigoroso
- ✅ Validação de MAC address em devices
- ✅ Plan limits enforcement
- ✅ HTTPS via Cloudflare Tunnel (produção)

---

## 👥 Gerenciamento de Usuários

### Criar Usuário via Script (Recomendado)
```bash
# Editar script para customizar
nano scripts/create-user.js

# Executar
node scripts/create-user.js
```

### Criar Usuário via SQL (Avançado)
```bash
# Gerar hash da senha primeiro
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('suasenha', 10).then(console.log)"

# Inserir no banco
sqlite3 data/database.sqlite << EOF
INSERT INTO users (tenant_id, username, email, password, role) 
VALUES (1, 'novousuario', 'email@example.com', 'HASH_AQUI', 'owner');
