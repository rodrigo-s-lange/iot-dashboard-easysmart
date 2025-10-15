# 🏭 IoT Dashboard - Plataforma Industrial Multi-Tenant

Sistema completo de gerenciamento de dispositivos IoT com suporte a templates dinâmicos, auto-discovery MQTT e interface web moderna.

![Version](https://img.shields.io/badge/version-1.2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)

---

## ✨ Features

### 🎯 Phase 1.2a (Atual - Backend Completo)
- ✅ **Sistema de Entidades**: CRUD completo para sensores e atuadores
- ✅ **6 Templates Predefinidos**: Compressor, Portão, HVAC, Relés, Energia, ESP32
- ✅ **Auto-Discovery MQTT**: Dispositivos se registram automaticamente
- ✅ **Multi-Tenant**: Isolamento completo entre clientes
- ✅ **Autenticação JWT**: Segurança robusta
- ✅ **API REST**: Endpoints completos documentados

### 🔜 Roadmap
- 🚧 **Phase 1.2b**: Dashboard UI com cards dinâmicos
- 📋 **Phase 1.3**: Integração MQTT real-time
- 🎨 **Phase 2.0**: Customização de templates via UI

---

## 🏗️ Arquitetura
```
iot-dashboard/
├── config/           # Database & MQTT configs
├── controllers/      # Business logic
├── models/           # Data models (Device, Entity, User, Tenant)
├── routes/           # API endpoints
├── services/         # Device templates & MQTT service
├── middleware/       # Auth & rate limiting
├── views/            # EJS templates
├── public/           # Static assets
└── scripts/          # Migration & test scripts
```

---

## 🚀 Quick Start

### Pré-requisitos
- Node.js >= 18.0.0
- SQLite3
- Mosquitto MQTT Broker

### Instalação
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/iot-dashboard.git
cd iot-dashboard

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
nano .env

# Executar migrações
node scripts/migrate.js

# Iniciar servidor
npm start
```

### Primeira Execução
```bash
# Criar usuário de teste
sqlite3 data/database.sqlite << 'SQL'
INSERT INTO tenants (name, plan) VALUES ('Test Company', 'free');
INSERT INTO users (tenant_id, username, email, password) 
VALUES (last_insert_rowid(), 'admin', 'admin@test.com', 
        '$2b$10$rBV2Hq3r6txlOvKj4j5xFeAJPBolKFl.YN7cKfzFbfLVp.GYzqYfK');
SQL

# Credenciais padrão:
# Username: admin
# Password: test123
```

---

## 📡 API Endpoints

### Authentication
```
POST   /api/auth/register    - Criar conta
POST   /api/auth/login       - Login (retorna JWT)
```

### Devices
```
GET    /api/devices/templates    - Listar templates disponíveis
GET    /api/devices              - Listar devices do usuário
POST   /api/devices              - Criar device
GET    /api/devices/:id          - Obter device com entidades
PUT    /api/devices/:id          - Atualizar device
DELETE /api/devices/:id          - Deletar device
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

---

## 🎨 Templates Disponíveis

| Template | Tipo | Entidades | Uso |
|----------|------|-----------|-----|
| `compressor_monitor` | Hybrid | 1 switch + 5 sensors | Monitoramento industrial RS485 |
| `gate_controller` | Template | 2 switches + 2 binary_sensors | Controle de portão residencial |
| `hvac_sensor` | Auto | 3 sensors | Temperatura/Umidade/CO2 |
| `relay_board` | Template | 4 switches | Placa de relés genérica |
| `energy_meter` | Auto | 5 sensors | Medidor de energia |
| `esp32_generic` | Auto | Variável | Auto-discovery completo |

---

## 🔧 Configuração MQTT

### Tópicos
```
devices/{DEVICE_ID}/{ENTITY_ID}/state    - Estado atual
devices/{DEVICE_ID}/{ENTITY_ID}/set      - Comando de controle
devices/{DEVICE_ID}/discovery            - Auto-discovery
```

### Exemplo ESP32
```cpp
#include <WiFi.h>
#include <PubSubClient.h>

const char* mqtt_server = "server.local";
const char* device_id = "ESP32_001";

void setup() {
  client.connect(device_id);
  
  // Publicar discovery
  client.publish("devices/ESP32_001/discovery", 
                 "{\"entities\":[{\"entity_id\":\"relay_1\",\"type\":\"switch\"}]}");
}

void loop() {
  // Publicar estado
  client.publish("devices/ESP32_001/relay_1/state", "true");
}
```

---

## 🧪 Testes
```bash
# Testar sistema de entidades
node scripts/test-entities.js

# Output esperado:
# ✅ All tests passed!
# - 6 templates listados
# - Device criado com entidades
# - Valor de relay atualizado
# - Lookup por MQTT topic funcionando
```

---

## 📊 Database Schema
```
tenants
├── id, name, plan (free/premium)

users
├── id, tenant_id, username, email, password

devices
├── id, tenant_id, user_id, device_id
├── name, type, status, discovery_mode

entities
├── id, device_id, entity_id, entity_type
├── name, value, unit, icon, config
└── mqtt_topic, discovery_mode
```

---

## �� Segurança

- ✅ Senhas hashadas com bcrypt (10 rounds)
- ✅ JWT com expiração de 1h
- ✅ Rate limiting em rotas de autenticação
- ✅ CORS configurado
- ✅ Isolamento multi-tenant
- ✅ Validação de MAC address
- ✅ HTTPS via Cloudflare Tunnel (produção)

---

## 📚 Documentação Adicional

- [AI Context](docs/AI_CONTEXT.md) - Contexto técnico completo
- [Continuity Guide](docs/CONTINUITY_GUIDE.md) - Status do projeto
- [Testing Guide](docs/TESTING_GUIDE.md) - Procedimentos de teste
- [Setup Entities](SETUP_ENTITIES.md) - Guia de implementação Phase 1.2a

---

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'feat: add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

---

## 📝 Licença

MIT License - veja [LICENSE](LICENSE) para detalhes

---

## 👥 Autores

- **Rodrigo** - Desenvolvimento principal
- Consultoria IA: Claude (Anthropic)

---

## 🙏 Agradecimentos

- Home Assistant - Inspiração para templates
- ESPHome - Conceitos de auto-discovery
- Mosquitto - MQTT broker confiável

---

**Versão**: 1.2.0  
**Última atualização**: Outubro 2025  
**Status**: ✅ Backend completo, UI em desenvolvimento
