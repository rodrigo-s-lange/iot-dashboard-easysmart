# 🤖 AI Continuity Guide - EasySmart IoT Platform

**Guia completo para continuidade do desenvolvimento com IA (Claude ou outras LLMs)**

**Versão**: 1.0  
**Última atualização**: 15 Outubro 2025  
**Próxima sessão**: Phase 1.3 - PostgreSQL + InfluxDB Implementation

---

## 🎯 Status Atual do Projeto

### ✅ Completado (Phase 1.0 - 1.2b)

**Backend:**
- ✅ Autenticação JWT com bcrypt
- ✅ Multi-tenant (users, tenants, devices, entities)
- ✅ Sistema de entidades (5 tipos: switch, sensor, number, text, binary_sensor)
- ✅ 6 templates de dispositivos (compressor, gate, hvac, relay, energy, esp32)
- ✅ API REST completa (14 endpoints)
- ✅ MQTT service básico (Mosquitto integration)
- ✅ SQLite como banco de dados atual

**Frontend:**
- ✅ Dashboard moderno com Bootstrap 5
- ✅ Cards dinâmicos por tipo de device
- ✅ Modal de criação de devices
- ✅ Toggle de switches em tempo real
- ✅ Toast notifications
- ✅ Status indicators (online/offline)

**Documentação:**
- ✅ README.md completo
- ✅ ARCHITECTURE.md (dual database strategy)
- ✅ BUSINESS_MODEL.md (technical requirements)
- ✅ INFLUXDB_SETUP.md (implementation guide)
- ✅ SETUP_ENTITIES.md (Phase 1.2a guide)

### 🚧 Em Progresso (Phase 1.3)

**Objetivo:** Migrar para PostgreSQL + InfluxDB

**Tarefas:**
- [ ] Atualizar docker-compose.yml com postgres e influxdb
- [ ] Criar migrations PostgreSQL (schema)
- [ ] Adaptar models de sync (SQLite) para async (PostgreSQL)
- [ ] Implementar InfluxService
- [ ] Atualizar MQTT service para escrever no InfluxDB
- [ ] Criar endpoints de time-series data
- [ ] Implementar retention policies por plano
- [ ] Testar migração completa

---

## 📂 Estrutura do Projeto
```
iot-dashboard-easysmart/
├── config/
│   ├── database.js          # SQLite (será PostgreSQL)
│   ├── influxdb.js          # A criar
│   └── mqtt.js
├── controllers/
│   ├── authController.js
│   ├── deviceController.js
│   └── entityController.js
├── models/
│   ├── User.js
│   ├── Tenant.js
│   ├── Device.js
│   └── Entity.js
├── routes/
│   ├── auth.js
│   ├── devices.js
│   ├── entities.js
│   └── data.js              # A criar (time-series)
├── services/
│   ├── mqttService.js
│   ├── deviceTemplates.js
│   └── influxService.js     # A criar
├── middleware/
│   ├── authMiddleware.js
│   ├── checkPlanLimits.js
│   └── rateLimiter.js
├── views/
│   ├── login.ejs
│   ├── register.ejs
│   └── dashboard.ejs
├── public/
│   ├── css/
│   │   └── dashboard.css
│   ├── js/
│   │   └── dashboard.js
│   └── assets/              # 🆕 Estrutura criada
│       ├── images/
│       ├── icons/
│       └── logos/
├── scripts/
│   ├── migrate.js           # SQLite entities migration
│   ├── create-user.js
│   └── test-entities.js
├── docs/
│   ├── ARCHITECTURE.md
│   ├── BUSINESS_MODEL.md
│   ├── INFLUXDB_SETUP.md
│   ├── SETUP_ENTITIES.md
│   ├── CONTINUITY_GUIDE.md
│   └── AI_CONTEXT.md
├── data/
│   └── database.sqlite      # Banco atual (será migrado)
├── docker-compose.yml       # A atualizar
├── Dockerfile
├── package.json
├── .env.example
└── README.md
```

---

## 🔑 Informações Essenciais

### Servidor

- **Host**: server.local (Ubuntu 24.04 LTS)
- **Hardware**: Intel Core i5-750, 8GB RAM, SSD
- **Docker**: Stack completa via docker-compose
- **Acesso remoto**: Cloudflare Tunnel

### Stack Tecnológica

**Backend:**
- Node.js 18+
- Express.js
- PostgreSQL 16 (em migração)
- InfluxDB 2.7 (em migração)
- SQLite (atual, será descontinuado)
- Mosquitto MQTT
- JWT (jsonwebtoken)
- bcryptjs

**Frontend:**
- EJS templates
- Bootstrap 5
- Vanilla JavaScript
- Chart.js (futuro)

**DevOps:**
- Docker & Docker Compose
- Git/GitHub
- Cloudflare Tunnel

### Portas Usadas

- 3000: IoT Dashboard (Node.js)
- 5432: PostgreSQL
- 8086: InfluxDB
- 1883: MQTT (Mosquitto)
- 8123: Home Assistant
- 6052: ESPHome
- 9000/9443: Portainer

---

## 🎨 Filosofia de Desenvolvimento

### Princípios

1. **Um passo por vez**: Implementar, testar, commitar
2. **Documentação first**: Atualizar docs junto com código
3. **Clean code**: Separação de responsabilidades
4. **Security**: Multi-tenant isolation, JWT, bcrypt
5. **Scalability**: Arquitetura preparada para crescimento
6. **Developer experience**: VSCode-friendly, clear structure

### Convenções

**Git Commits:**
```bash
feat: add new feature
fix: bug fix
docs: documentation only
style: formatting
refactor: code restructure
test: add tests
chore: maintenance
```

**Código:**
- Async/await para operações assíncronas
- Try/catch para error handling
- Middleware para validações
- Services para lógica de negócio
- Controllers para rotas

**Nomenclatura:**
- Arquivos: camelCase.js
- Classes: PascalCase
- Variáveis: camelCase
- Constantes: UPPER_SNAKE_CASE
- Databases: snake_case

---

## 🚀 Próximos Passos (Phase 1.3)

### Prioridade 1: Docker Setup

**Arquivo:** `docker-compose.yml`

Adicionar serviços:
```yaml
postgres:
  image: postgres:16-alpine
  # ... (ver docs/INFLUXDB_SETUP.md)

influxdb:
  image: influxdb:2.7-alpine
  # ... (ver docs/INFLUXDB_SETUP.md)
```

**Comandos:**
```bash
docker-compose up -d postgres influxdb
docker-compose logs -f
```

### Prioridade 2: PostgreSQL Migration

**Criar:** `scripts/migrate-postgres.js`

Tarefas:
1. Criar schema no PostgreSQL
2. Copiar dados de SQLite → PostgreSQL
3. Validar integridade
4. Backup SQLite antes de remover

**Schema:**
- tenants
- users
- devices
- entities

### Prioridade 3: Atualizar Models

**Mudança:** Sync → Async

**Antes (SQLite):**
```javascript
const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
const user = stmt.get(userId); // Sync
```

**Depois (PostgreSQL):**
```javascript
const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
const user = result.rows[0]; // Async
```

**Arquivos a atualizar:**
- models/User.js
- models/Tenant.js
- models/Device.js
- models/Entity.js

### Prioridade 4: InfluxDB Service

**Criar:** `services/influxService.js`

Implementar:
- writeSensorData()
- writeRelayState()
- getLatestValues()
- getTimeSeries()

**Referência:** `docs/INFLUXDB_SETUP.md`

### Prioridade 5: MQTT → InfluxDB Pipeline

**Atualizar:** `services/mqttService.js`

Fluxo:
```
MQTT message
  ↓
Parse topic/payload
  ↓
Update PostgreSQL (last_seen, status)
  ↓
Write to InfluxDB (telemetry)
```

### Prioridade 6: API Endpoints

**Criar:** `routes/data.js`

Endpoints:
- GET /api/data/:deviceId/:entityId/latest
- GET /api/data/:deviceId/:entityId?start=&end=
- POST /api/data/export (CSV)

### Prioridade 7: Testes

**Criar:** `scripts/test-influxdb.js`

Validar:
- Escrita no InfluxDB
- Leitura de time-series
- Retention policies
- Performance

---

## 🔧 Comandos Úteis

### Docker
```bash
# Ver logs
docker-compose logs -f [service_name]

# Reiniciar serviço
docker-compose restart [service_name]

# Entrar no container
docker exec -it [container_name] /bin/sh

# Limpar volumes
docker-compose down -v
```

### PostgreSQL
```bash
# CLI
docker exec -it postgres-iot psql -U iotuser -d iot_dashboard

# Backup
docker exec postgres-iot pg_dump -U iotuser iot_dashboard > backup.sql

# Restore
cat backup.sql | docker exec -i postgres-iot psql -U iotuser iot_dashboard
```

### InfluxDB
```bash
# CLI
docker exec -it influxdb-iot influx

# Criar bucket
docker exec influxdb-iot influx bucket create --name test --org easysmart

# Query
docker exec influxdb-iot influx query 'from(bucket:"iot_data") |> range(start:-1h)'
```

### Git
```bash
# Ver status
git status

# Commitar
git add .
git commit -m "feat: description"
git push origin main

# Ver log
git log --oneline -10
```

---

## 📚 Documentação de Referência

### Interna (neste repo)
- `README.md` - Visão geral e quick start
- `docs/ARCHITECTURE.md` - Arquitetura detalhada
- `docs/INFLUXDB_SETUP.md` - Guia de implementação InfluxDB
- `docs/BUSINESS_MODEL.md` - Requisitos técnicos por plano

### Externa
- PostgreSQL: https://www.postgresql.org/docs/16/
- InfluxDB: https://docs.influxdata.com/influxdb/v2.7/
- Node.js pg: https://node-postgres.com/
- InfluxDB Client: https://github.com/influxdata/influxdb-client-js
- Express: https://expressjs.com/
- Bootstrap 5: https://getbootstrap.com/docs/5.3/

---

## 🎯 Objetivos de Curto Prazo

### Esta Semana
- [ ] Docker Compose atualizado e testado
- [ ] PostgreSQL rodando e acessível
- [ ] InfluxDB rodando e configurado
- [ ] Schema PostgreSQL criado

### Próxima Semana
- [ ] Models migrados para async
- [ ] InfluxService implementado
- [ ] MQTT pipeline funcionando
- [ ] Testes passando

### Mês 1
- [ ] Migration completa de SQLite → PostgreSQL + InfluxDB
- [ ] API de time-series funcionando
- [ ] Dashboard exibindo histórico
- [ ] Phase 1.3 completa

---

## ⚠️ Pontos de Atenção

### Decisões Técnicas Importantes

1. **Dual Database**: PostgreSQL (relacional) + InfluxDB (time-series)
   - Não tentar fazer tudo no InfluxDB
   - Cada DB para seu propósito

2. **Multi-tenant Isolation**: 
   - SEMPRE filtrar por tenant_id
   - Row-Level Security no PostgreSQL
   - Tags no InfluxDB

3. **Plan Limits**:
   - Enforcement via middleware
   - Validar antes de criar recursos
   - Notificar quando próximo do limite

4. **MQTT Topics**:
   - Estrutura: devices/{DEVICE_ID}/{ENTITY_ID}/state
   - LWT: devices/{DEVICE_ID}/status
   - Discovery: devices/{DEVICE_ID}/discovery

5. **API Rate Limiting**:
   - Por plano (free=no API, starter=100/h, etc)
   - Usar middleware rateLimiter

### Armadilhas Comuns

❌ **Não fazer:**
- Misturar dados relacionais no InfluxDB
- Esquecer tenant_id em queries
- Commits sem testar
- Hardcoded credentials
- Usar localStorage para senhas

✅ **Sempre fazer:**
- Testar antes de commitar
- Usar variáveis de ambiente
- Validar permissões (tenant isolation)
- Documentar decisões importantes
- Um feature = um commit

---

## 🤝 Trabalhando com IA

### Como Usar Este Documento

**Para Claude (ou outra LLM):**

1. **Sempre ler este documento no início da sessão**
2. **Verificar "Status Atual" e "Próximos Passos"**
3. **Seguir a estrutura de arquivos**
4. **Manter filosofia de desenvolvimento**
5. **Atualizar este documento ao final**

### Template de Início de Sessão
```
Olá! Vou continuar o desenvolvimento do EasySmart IoT Platform.

Por favor:
1. Leia AI_CONTINUITY_GUIDE.md
2. Verifique docs/CONTINUITY_GUIDE.md (status técnico)
3. Me diga qual Phase estamos e próximos passos
4. Vamos implementar um passo por vez com commits

Estrutura:
- Implementar feature
- Testar localmente
- Commitar com mensagem semântica
- Atualizar documentação se necessário
- Repetir

Pronto para começar!
```

### Perguntas Frequentes (FAQ)

**P: Qual banco de dados usar agora?**
R: Em migração. SQLite atual, PostgreSQL + InfluxDB em implementação (Phase 1.3)

**P: Como criar usuário?**
R: `node scripts/create-user.js` (gera hash bcrypt correto)

**P: Estrutura de planos?**
R: Free (1 dev), Starter (5 dev), Professional (20 dev), Industrial (ilimitado)

**P: MQTT topics?**
R: devices/{DEVICE_ID}/{ENTITY_ID}/state para sensores

**P: Como testar API?**
R: cURL ou Postman, precisa de JWT token (login primeiro)

---

## 📝 Histórico de Atualizações

| Data | Versão | Mudanças |
|------|--------|----------|
| 2025-10-15 | 1.0 | Criação inicial do documento |

---

## 🎓 Conclusão

Este documento é a **fonte única de verdade** para continuidade do projeto.

**Sempre:**
1. ✅ Ler este doc ao iniciar nova sessão
2. ✅ Seguir os próximos passos definidos
3. ✅ Atualizar ao completar Phase
4. ✅ Commitar mudanças importantes

**Próxima sessão começa em:** Phase 1.3 - Docker Setup

---

**Documento mantido por:** Rodrigo S. Lange  
**IA Partner:** Claude (Anthropic)  
**Última sessão produtiva:** 15 Outubro 2025  
**Próxima milestone:** PostgreSQL + InfluxDB operational
