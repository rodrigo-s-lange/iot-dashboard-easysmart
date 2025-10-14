# EasySmart IoT Platform

**Enterprise-grade IoT Dashboard with multi-tenant architecture, MQTT integration, and real-time monitoring.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20.x-green.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](Dockerfile)

---

## Overview

EasySmart is a scalable IoT platform designed for residential and commercial automation. Built with a multi-tenant SaaS architecture, it allows multiple clients to manage their devices independently with plan-based limitations and real-time MQTT communication.

### Key Features

- **Multi-Tenant Architecture**: Complete data isolation per tenant with role-based access control
- **Plan-Based Subscriptions**: Free (1 device), Basic (5 devices), Premium (unlimited)
- **JWT Authentication**: Secure token-based authentication with bcrypt password hashing
- **MQTT Protocol**: Real-time bidirectional communication with devices (ESP32, ESP8266, etc.)
- **RESTful API**: Complete CRUD operations for users, tenants, and devices
- **Real-Time Dashboard**: WebSocket-powered live data visualization
- **SQLite Database**: Lightweight embedded database with WAL mode for production use
- **Docker Ready**: Containerized deployment with Docker Compose
- **Cloudflare Tunnel**: Secure remote access without port forwarding

---

## Architecture

### Tech Stack

**Backend:**
- Node.js 20 LTS
- Express.js (REST API)
- MQTT.js (IoT communication)
- better-sqlite3 (database)
- jsonwebtoken + bcryptjs (authentication)
- Helmet + CORS (security)

**Frontend:**
- EJS Templates (server-side rendering)
- Bootstrap 5 (responsive UI)
- Chart.js (data visualization)
- WebSocket (real-time updates)

**Infrastructure:**
- Docker + Docker Compose
- Mosquitto MQTT Broker
- Cloudflare Tunnel
- Ubuntu Server 24.04

### Database Schema
```
tenants (id, name, email, plan, status, trial_ends_at)
  └── users (id, tenant_id, username, email, password, role)
  └── devices (id, tenant_id, user_id, device_id, name, type, status)
      └── sensor_data (id, device_id, sensor, value, timestamp)

plans (id, name, max_devices, price, features)
subscriptions (id, tenant_id, plan_id, status, external_id)
```

### MQTT Topic Structure
```
{tenant_id}/{device_id}/data/{sensor}     → Device publishes telemetry
{tenant_id}/{device_id}/command/{action}  → Server sends commands
{tenant_id}/{device_id}/status            → Device reports online/offline
```

---

## Installation

### Prerequisites

- Node.js 20.x or higher
- npm 9.x or higher
- SQLite3
- Mosquitto MQTT Broker (optional, for local development)

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

# Initialize database
node -e "require('./config/database.js')"

# Start server
npm start
```

Server will be available at `http://localhost:3000`

### Docker Deployment
```bash
# Build image
docker build -t easysmart-iot .

# Run with docker-compose
docker-compose up -d
```

---

## API Documentation

### Authentication

#### Register Tenant
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

**Response:**
```json
{
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "username": "admin", "role": "owner" },
  "tenant": { "id": 1, "plan": "free", "trial_ends_at": "2025-11-13" }
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

### Protected Routes

All routes below require JWT authentication:
```http
Authorization: Bearer <token>
```

#### Device Management
```http
GET    /api/devices              # List all devices for tenant
POST   /api/devices              # Create new device (respects plan limits)
GET    /api/devices/:id          # Get device details
PUT    /api/devices/:id          # Update device
DELETE /api/devices/:id          # Delete device
```

---

## Subscription Plans

| Plan | Devices | Price/Month | Features |
|------|---------|-------------|----------|
| **Free** | 1 | $0.00 | 30-day trial, MQTT, Dashboard |
| **Basic** | 5 | $19.90 | Priority support, 30-day history |
| **Premium** | Unlimited | $49.90 | 24/7 support, unlimited history, API access |

Payment integration: Asaas / MercadoPago (coming soon)

---

## MQTT Integration

### Device Connection (ESP32 Example)
```cpp
#include <WiFi.h>
#include <PubSubClient.h>

const char* mqtt_server = "mqtt.easysmart.com.br";
const char* mqtt_user = "devices";
const char* mqtt_pass = "YOUR_PASSWORD";

WiFiClient espClient;
PubSubClient client(espClient);

void setup() {
  client.setServer(mqtt_server, 1883);
  client.connect("ESP32_001", mqtt_user, mqtt_pass);
  
  // Subscribe to commands
  client.subscribe("tenant_1/ESP32_001/command/#");
}

void loop() {
  // Publish sensor data
  float temp = readTemperature();
  char payload[50];
  snprintf(payload, sizeof(payload), "{\"value\":%.2f}", temp);
  client.publish("tenant_1/ESP32_001/data/temperature", payload);
  
  delay(5000);
}
```

---

## Project Structure
```
iot-dashboard/
├── config/
│   ├── database.js          # SQLite connection
│   ├── databaseSchema.sql   # Database schema
│   └── mqtt.js              # MQTT configuration
├── models/
│   ├── User.js              # User model with bcrypt
│   ├── Tenant.js            # Multi-tenant logic
│   ├── Plan.js              # Subscription plans
│   └── Device.js            # Device CRUD (coming soon)
├── controllers/
│   ├── authController.js    # Authentication logic
│   └── deviceController.js  # Device management (coming soon)
├── routes/
│   ├── auth.js              # Auth endpoints
│   └── devices.js           # Device endpoints (coming soon)
├── middleware/
│   ├── authMiddleware.js    # JWT verification
│   ├── rateLimiter.js       # Brute-force protection
│   └── checkPlanLimits.js   # Enforce plan restrictions
├── services/
│   └── mqttService.js       # MQTT pub/sub handler
├── public/                  # Static assets
├── views/                   # EJS templates
├── data/                    # SQLite database (gitignored)
├── server.js                # Express app entry point
├── package.json
└── Dockerfile
```

---

## Security

- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens with 24-hour expiration
- Rate limiting on authentication endpoints (5 attempts / 15 min)
- Helmet.js for HTTP security headers
- CORS configured for production domains
- Environment variables for sensitive data
- SQL injection prevention via prepared statements

---

## Roadmap

### Phase 1 (Current)
- [x] Multi-tenant architecture
- [x] JWT authentication
- [x] MQTT service integration
- [x] Plan-based limitations
- [ ] Device CRUD API
- [ ] Frontend dashboard

### Phase 2
- [ ] Payment gateway (Asaas/MercadoPago)
- [ ] Email notifications
- [ ] WebSocket real-time updates
- [ ] Chart.js data visualization
- [ ] Device configuration UI

### Phase 3
- [ ] Mobile app (React Native)
- [ ] Alexa/Google Home integration
- [ ] Advanced analytics
- [ ] Webhook support
- [ ] Public API with rate limiting

---

## Contributing

This is a private project. For inquiries, contact: rodrigo@easysmart.com.br

---

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

## Support

- **Documentation**: https://docs.easysmart.com.br (coming soon)
- **Email**: support@easysmart.com.br
- **GitHub Issues**: https://github.com/rodrigo-s-lange/iot-dashboard-easysmart/issues

---

**Built with Node.js, Express, MQTT, and passion for IoT automation.**

© 2025 EasySmart IoT Platform. All rights reserved.
