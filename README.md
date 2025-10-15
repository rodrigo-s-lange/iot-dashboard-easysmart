# EasySmart IoT Platform

**Enterprise-grade Multi-Tenant IoT Dashboard with MQTT integration, JWT authentication, and real-time monitoring.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Status](https://img.shields.io/badge/Status-Active%20Development-yellow.svg)]()

---

## Overview

EasySmart is a production-ready SaaS IoT platform designed for residential and commercial automation. Built with multi-tenant architecture, it enables multiple clients to independently manage their IoT devices with plan-based limitations, real-time MQTT communication, and comprehensive monitoring.

### Key Features

- **Multi-Tenant SaaS Architecture**: Complete data isolation per tenant with subscription plans
- **Plan-Based Subscriptions**: Free (1 device, 30-day trial), Basic (5 devices), Premium (unlimited)
- **JWT Authentication**: Secure token-based auth with bcrypt password hashing (10 rounds)
- **MQTT Protocol**: Real-time bidirectional communication (ESP32, ESP8266, custom devices)
- **RESTful API**: Complete CRUD operations with tenant isolation
- **Web Dashboard**: EJS-powered interface with Bootstrap 5
- **SQLite Database**: Production-ready with WAL mode for concurrency
- **Rate Limiting**: Brute-force protection (5 attempts / 15 min)
- **Docker Ready**: Containerized deployment
- **Cloudflare Tunnel**: Secure remote access (easysmart.com.br)

---

## Current Status

### ✅ Implemented (Phase 1 Complete)

- [x] Multi-tenant database schema
- [x] Tenant + User + Device models
- [x] JWT authentication (register/login)
- [x] Plan-based device limitations
- [x] MQTT Service integration
- [x] Device CRUD API with tenant isolation
- [x] Rate limiting middleware
- [x] Web interface (login/register/dashboard)
- [x] SQLite with automatic schema initialization

### 🚧 In Progress (Phase 2)

- [ ] Device management UI (add/edit/delete via dashboard)
- [ ] Real-time telemetry visualization (Chart.js)
- [ ] MQTT topic subscription per device
- [ ] WebSocket for live updates

### �� Planned (Phase 3+)

- [ ] Payment gateway (Asaas/MercadoPago)
- [ ] Email notifications (trial expiration, alerts)
- [ ] ESP32/ESP8266 firmware examples
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reports

---

## Architecture

### Tech Stack

**Backend:**
- Node.js 20 LTS
- Express.js 4.18+ (REST API)
- MQTT.js 5.3+ (IoT communication)
- better-sqlite3 9.2+ (embedded database)
- jsonwebtoken + bcryptjs (authentication)
- Helmet + CORS (security)
- express-rate-limit (brute-force protection)

**Frontend:**
- EJS Templates (server-side rendering)
- Bootstrap 5.3 (responsive UI)
- Vanilla JavaScript (no framework overhead)
- Chart.js (planned for data visualization)

**Infrastructure:**
- Docker + Docker Compose
- Mosquitto MQTT Broker (native)
- Cloudflare Tunnel
- Ubuntu Server 24.04 LTS

### Database Schema
```
tenants (id, name, email, plan, status, trial_ends_at, created_at)
  ├── users (id, tenant_id, username, email, password, role, created_at)
  └── devices (id, tenant_id, user_id, device_id, name, type, status, last_seen, created_at)
      └── sensor_data (id, device_id, sensor, value, timestamp)

plans (id, name, max_devices, price, features, created_at)
  └── Free: 1 device, $0.00, 30-day trial
  └── Basic: 5 devices, $19.90/month
  └── Premium: unlimited devices, $49.90/month

subscriptions (id, tenant_id, plan_id, payment_provider, external_id, status, current_period_end)
```

### MQTT Topic Structure
```
{tenant_id}/{device_id}/data/{sensor}     → Device publishes telemetry
{tenant_id}/{device_id}/command/{action}  → Server sends commands
{tenant_id}/{device_id}/status            → Device reports online/offline (LWT)
```

**Example:**
```
1/ESP32_001/data/temperature → {"value": 23.5, "unit": "C"}
1/ESP32_001/status → online
```

---

## Installation

### Prerequisites

- Node.js 20.x or higher
- npm 9.x or higher
- SQLite3 CLI (optional, for manual queries)
- Mosquitto MQTT Broker (optional for local dev)
- Git

### Quick Start
```bash
# Clone repository
git clone https://github.com/rodrigo-s-lange/iot-dashboard-easysmart.git
cd iot-dashboard-easysmart

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env  # Set JWT_SECRET and MQTT credentials

# Database is auto-initialized on first run
npm start
```

Server available at: `http://localhost:3000`

### Environment Variables
```env
# JWT Configuration
JWT_SECRET=your-super-secret-key-change-this-in-production

# MQTT Configuration
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_USERNAME=devices
MQTT_PASSWORD=your-mqtt-password

# Server Configuration
PORT=3000
NODE_ENV=development
```

---

## API Documentation

### Authentication Endpoints

#### Register New Tenant
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Company Name",
  "email": "contact@company.com",
  "username": "admin",
  "password": "securepass123"
}
```

**Response (201):**
```json
{
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "contact@company.com",
    "role": "owner"
  },
  "tenant": {
    "id": 1,
    "name": "Company Name",
    "plan": "free",
    "trial_ends_at": "2025-11-13T22:00:00.000Z"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "securepass123"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "username": "admin", "role": "owner" },
  "tenant": { "id": 1, "plan": "free", "trial_ends_at": "2025-11-13T22:00:00.000Z" }
}
```

### Device Management (Protected Routes)

All device endpoints require JWT authentication:
```http
Authorization: Bearer <your-jwt-token>
```

#### List Devices
```http
GET /api/devices
```

**Response:**
```json
{
  "devices": [
    {
      "id": 1,
      "device_id": "ESP32_001",
      "name": "Sensor Sala",
      "type": "ESP32",
      "status": "online",
      "last_seen": "2025-10-14T23:00:00.000Z"
    }
  ],
  "count": 1,
  "plan": "free",
  "can_add_more": false
}
```

#### Create Device
```http
POST /api/devices
Content-Type: application/json

{
  "device_id": "ESP32_001",
  "name": "Sensor Sala",
  "type": "ESP32"
}
```

**Response (201):**
```json
{
  "message": "Device created successfully",
  "device": {
    "id": 1,
    "device_id": "ESP32_001",
    "name": "Sensor Sala",
    "status": "offline"
  }
}
```

**Error (403) - Plan Limit Reached:**
```json
{
  "error": "Device limit reached for your plan",
  "action": "upgrade_required",
  "current_plan": "free",
  "current_devices": 1,
  "max_devices": 1
}
```

#### Update Device
```http
PUT /api/devices/:id
Content-Type: application/json

{
  "name": "Sensor Sala Atualizado",
  "status": "online"
}
```

#### Delete Device
```http
DELETE /api/devices/:id
```

---

## Web Interface

### Pages

- **Landing Page**: `http://localhost:3000/` - Project overview
- **Register**: `http://localhost:3000/register` - Create new tenant account
- **Login**: `http://localhost:3000/login` - Authenticate existing user
- **Dashboard**: `http://localhost:3000/dashboard` - Device management (requires auth)

### Authentication Flow

1. User registers → Creates Tenant + User (owner role)
2. JWT token stored in `localStorage`
3. Dashboard fetches `/api/devices` using Bearer token
4. If token expires (24h), user is redirected to login

---

## MQTT Integration

### Device Connection Example (ESP32)
```cpp
#include <WiFi.h>
#include <PubSubClient.h>

// MQTT Configuration
const char* mqtt_server = "mqtt.easysmart.com.br";
const int mqtt_port = 1883;
const char* mqtt_user = "devices";
const char* mqtt_pass = "YOUR_PASSWORD";

// Device Configuration
const char* tenant_id = "1";
const char* device_id = "ESP32_001";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  Serial.begin(115200);
  
  // Connect WiFi
  WiFi.begin("YOUR_SSID", "YOUR_PASSWORD");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  
  // Connect MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  
  reconnect();
  
  // Subscribe to commands
  String commandTopic = String(tenant_id) + "/" + device_id + "/command/#";
  client.subscribe(commandTopic.c_str());
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();
  
  // Publish sensor data every 5 seconds
  static unsigned long lastPublish = 0;
  if (millis() - lastPublish > 5000) {
    float temperature = readTemperature();
    publishData("temperature", temperature);
    lastPublish = millis();
  }
}

void publishData(const char* sensor, float value) {
  String topic = String(tenant_id) + "/" + device_id + "/data/" + sensor;
  String payload = "{\"value\":" + String(value, 2) + ",\"unit\":\"C\"}";
  client.publish(topic.c_str(), payload.c_str());
}

void callback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Command received: ");
  Serial.println(topic);
  // Handle commands
}

void reconnect() {
  while (!client.connected()) {
    if (client.connect(device_id, mqtt_user, mqtt_pass)) {
      Serial.println("MQTT connected");
    } else {
      delay(5000);
    }
  }
}
```

---

## Project Structure
```
iot-dashboard-easysmart/
├── config/
│   ├── database.js           # SQLite connection + schema loader
│   ├── databaseSchema.sql    # Complete database schema
│   └── mqtt.js               # MQTT broker configuration
├── models/
│   ├── User.js               # User model (bcrypt validation)
│   ├── Tenant.js             # Tenant model (multi-tenant logic)
│   ├── Plan.js               # Subscription plans + limits
│   └── Device.js             # Device CRUD with tenant isolation
├── controllers/
│   ├── authController.js     # Register/login logic
│   └── deviceController.js   # Device management
├── routes/
│   ├── auth.js               # Authentication endpoints
│   ├── devices.js            # Device CRUD endpoints
│   └── web.js                # Web pages (login/register/dashboard)
├── middleware/
│   ├── authMiddleware.js     # JWT verification
│   ├── rateLimiter.js        # Brute-force protection
│   └── checkPlanLimits.js    # Enforce plan device limits
├── services/
│   └── mqttService.js        # MQTT pub/sub handler
├── views/
│   ├── index.ejs             # Landing page
│   ├── login.ejs             # Login form
│   ├── register.ejs          # Registration form
│   └── dashboard.ejs         # Device list (authenticated)
├── public/                   # Static assets (CSS/JS/images)
├── data/
│   ├── database.sqlite       # SQLite database (gitignored)
│   ├── database.sqlite-shm   # Shared memory (gitignored)
│   └── database.sqlite-wal   # Write-ahead log (gitignored)
├── docs/
│   ├── AI_CONTEXT.md         # Complete project context for LLMs
│   ├── AI_PROMPTS.md         # Development guidelines for assistants
│   └── CONTINUITY_GUIDE.md   # Session recovery instructions
├── server.js                 # Express app entry point
├── package.json              # Dependencies and scripts
├── .env                      # Environment variables (gitignored)
├── .env.example              # Environment template
├── .gitignore                # Git exclusions
├── Dockerfile                # Container image (planned)
├── docker-compose.yml        # Multi-container setup (planned)
└── README.md                 # This file
```

---

## Security

### Implemented Measures

- **Password Hashing**: bcrypt with 10 salt rounds
- **JWT Tokens**: 24-hour expiration, signed with HS256
- **Rate Limiting**: 5 login attempts per 15 minutes per IP
- **Helmet.js**: Security headers (CSP, XSS protection)
- **CORS**: Configured for production domains only
- **SQL Injection Prevention**: Prepared statements (better-sqlite3)
- **Tenant Isolation**: All queries filtered by tenant_id
- **Input Validation**: Required fields enforced at model level

### Best Practices

- Never commit `.env` or `data/*.sqlite` files
- Rotate JWT_SECRET in production
- Use HTTPS in production (Cloudflare Tunnel handles this)
- Monitor failed login attempts
- Regularly update dependencies (`npm audit`)

---

## Testing

### Manual Testing Checklist

- [x] Register new tenant via web interface
- [x] Verify tenant + user created in database
- [x] Login with correct credentials
- [x] Login fails with wrong password (401)
- [x] JWT stored in localStorage after login
- [x] Dashboard loads device list via API
- [x] Create device respects plan limits
- [x] Rate limiter blocks after 5 failed attempts
- [ ] Device publishes MQTT data
- [ ] Dashboard shows real-time updates

### API Testing (curl examples)
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@test.com","username":"test","password":"test1234"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test1234"}'

# List devices (replace TOKEN)
curl -X GET http://localhost:3000/api/devices \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create device
curl -X POST http://localhost:3000/api/devices \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"device_id":"ESP32_001","name":"Sensor Test","type":"ESP32"}'
```

---

## Deployment

### Production Checklist

- [ ] Set strong `JWT_SECRET` in production `.env`
- [ ] Configure MQTT broker credentials
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (Cloudflare Tunnel configured)
- [ ] Configure backups for `data/database.sqlite`
- [ ] Set up monitoring (logs, uptime)
- [ ] Test all endpoints in production environment
- [ ] Configure firewall (only ports 22, 80, 443, 1883 open)

### Docker Deployment (Planned)
```bash
docker-compose up -d
```

---

## Roadmap

### Phase 1: Foundation (✅ Complete)
- [x] Multi-tenant architecture
- [x] JWT authentication
- [x] Device CRUD with plan limits
- [x] Web interface (login/register/dashboard)
- [x] MQTT service integration
- [x] SQLite with auto-schema

### Phase 2: Core Features (🚧 Current)
- [ ] Device management UI (add/edit/delete via dashboard)
- [ ] Real-time MQTT telemetry display
- [ ] Chart.js data visualization
- [ ] WebSocket live updates
- [ ] Device status indicators (online/offline)

### Phase 3: SaaS Features
- [ ] Payment gateway (Asaas API)
- [ ] Plan upgrade/downgrade flow
- [ ] Email notifications (Nodemailer)
- [ ] Usage analytics per tenant
- [ ] Admin panel (manage all tenants)

### Phase 4: Advanced
- [ ] Mobile app (React Native)
- [ ] Voice assistant integration (Alexa/Google Home)
- [ ] Advanced automation rules
- [ ] Public API with rate limiting
- [ ] Webhook support

---

## Contributing

This is a private project under active development. For collaboration inquiries:

- **Email**: rodrigo@easysmart.com.br
- **GitHub Issues**: https://github.com/rodrigo-s-lange/iot-dashboard-easysmart/issues

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Support

- **Documentation**: https://github.com/rodrigo-s-lange/iot-dashboard-easysmart
- **Issues**: https://github.com/rodrigo-s-lange/iot-dashboard-easysmart/issues
- **Email**: support@easysmart.com.br

---

**Built with Node.js, Express, MQTT, and passion for IoT automation.**

© 2025 EasySmart IoT Platform. All rights reserved.
