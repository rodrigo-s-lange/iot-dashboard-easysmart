# 🤖 AI Context - EasySmart IoT Platform

**Complete technical context for AI assistants working on this project**

---

## 🎯 Project Vision

EasySmart is a **multi-tenant SaaS IoT platform** designed to enable individuals and small businesses to monitor and control IoT devices (ESP32, ESP8266, custom hardware) through a centralized dashboard with subscription-based pricing.

### Business Model

- **Free Plan**: 1 device, 30-day trial, basic features
- **Basic Plan**: 5 devices, $19.90/month, 30-day history
- **Premium Plan**: Unlimited devices, $49.90/month, full features + API access

### Target Users

1. **Hobbyists**: Smart home enthusiasts testing IoT projects
2. **Small Businesses**: Monitoring equipment (temperature, humidity, energy)
3. **Integrators**: Building custom automation solutions for clients

---

## 🏗️ Architecture Overview

### Multi-Tenant Design

**Tenant Isolation:**
- Each customer is a "Tenant" with unique ID
- All data (users, devices, sensor readings) filtered by `tenant_id`
- No cross-tenant data leakage (enforced at database + API level)

**Hierarchy:**
```
Tenant (Company/Individual)
  └── Users (owner, member roles)
      └── Devices (ESP32, sensors, actuators)
          └── Sensor Data (telemetry time-series)
```

### Technology Stack

**Backend:**
- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 4.18+
- **Database**: SQLite3 (better-sqlite3) with WAL mode
- **Authentication**: JWT (jsonwebtoken) + bcrypt
- **IoT Protocol**: MQTT (mqtt.js library)
- **Security**: Helmet.js, express-rate-limit, CORS

**Frontend:**
- **Template Engine**: EJS (server-side rendering)
- **CSS Framework**: Bootstrap 5.3 (CDN)
- **JavaScript**: Vanilla JS (no framework)
- **Future**: Chart.js for data visualization

**Infrastructure:**
- **OS**: Ubuntu 24.04 LTS Server (headless)
- **MQTT Broker**: Mosquitto (native systemd service)
- **Remote Access**: Cloudflare Tunnel (easysmart.com.br)
- **Containerization**: Docker (planned for deployment)

---

## 📊 Database Schema (SQLite)

### Core Tables

#### tenants
```sql
CREATE TABLE tenants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,                    -- Company/person name
  email TEXT UNIQUE NOT NULL,            -- Contact email
  plan TEXT DEFAULT 'free',              -- free|basic|premium
  status TEXT DEFAULT 'active',          -- active|suspended|canceled
  trial_ends_at DATETIME,                -- 30 days from registration
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### users
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,            -- FK to tenants
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,                -- bcrypt hash
  role TEXT DEFAULT 'owner',             -- owner|member
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

#### devices
```sql
CREATE TABLE devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,            -- FK to tenants
  user_id INTEGER NOT NULL,              -- FK to users (creator)
  device_id TEXT NOT NULL,               -- Unique identifier (e.g., ESP32_001)
  name TEXT NOT NULL,                    -- User-friendly name
  type TEXT,                             -- ESP32|ESP8266|custom
  status TEXT DEFAULT 'offline',         -- online|offline|error
  last_seen DATETIME,                    -- Last heartbeat timestamp
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(tenant_id, device_id)          -- device_id unique per tenant
);
```

#### sensor_data
```sql
CREATE TABLE sensor_data (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id INTEGER NOT NULL,            -- FK to devices
  sensor TEXT NOT NULL,                  -- temperature|humidity|pressure|etc
  value TEXT NOT NULL,                   -- JSON or numeric string
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (device_id) REFERENCES devices(id)
);
```

#### plans (pre-populated)
```sql
CREATE TABLE plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,             -- free|basic|premium
  max_devices INTEGER NOT NULL,          -- 1|5|-1 (unlimited)
  price DECIMAL(10,2) NOT NULL,          -- 0.00|19.90|49.90
  features TEXT,                         -- JSON string
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO plans (name, max_devices, price, features) VALUES
  ('free', 1, 0.00, '{"mqtt":true,"dashboard":true,"support":"email"}'),
  ('basic', 5, 19.90, '{"mqtt":true,"dashboard":true,"support":"priority","history":"30days"}'),
  ('premium', -1, 49.90, '{"mqtt":true,"dashboard":true,"support":"24/7","history":"unlimited","api":true}');
```

#### subscriptions (future payment integration)
```sql
CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  plan_id INTEGER NOT NULL,
  payment_provider TEXT,                 -- asaas|mercadopago
  external_id TEXT,                      -- Subscription ID in payment gateway
  status TEXT DEFAULT 'active',          -- active|past_due|canceled
  current_period_end DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);
```

---

## 🔐 Authentication System

### Registration Flow

**Endpoint:** `POST /api/auth/register`

**Input:**
```json
{
  "name": "Company Name",
  "email": "contact@company.com",
  "username": "admin",
  "password": "securepass123"
}
```

**Backend Logic:**
1. Validate input (username, email, password ≥8 chars)
2. Check if email/username already exists
3. Calculate trial_ends_at = NOW() + 30 days
4. Create Tenant record (plan='free', status='active')
5. Hash password with bcrypt (10 rounds)
6. Create User record (role='owner', tenant_id linked)
7. Generate JWT token with payload:
```javascript
   {
     id: user.id,
     username: user.username,
     tenant_id: tenant.id,
     plan: tenant.plan,
     role: user.role
   }
```
8. Return token + user + tenant data

**Output:**
```json
{
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "username": "admin", "role": "owner" },
  "tenant": { "id": 1, "plan": "free", "trial_ends_at": "2025-11-13T23:00:00.000Z" }
}
```

### Login Flow

**Endpoint:** `POST /api/auth/login`

**Input:**
```json
{
  "username": "admin",
  "password": "securepass123"
}
```

**Backend Logic:**
1. Find user by username
2. If not found → 401 Unauthorized
3. Fetch tenant via user.tenant_id
4. Check tenant.status === 'active' (else → 403 Account suspended)
5. If plan='free', check trial_ends_at > NOW() (else → 403 Trial expired)
6. Validate password: `bcrypt.compare(password, user.password)`
7. If invalid → 401 Invalid credentials
8. Generate JWT token (same payload as register)
9. Return token + user + tenant data

### JWT Token Details

**Algorithm:** HS256  
**Expiration:** 24 hours  
**Secret:** Stored in `.env` as `JWT_SECRET`

**Middleware:** `middleware/authMiddleware.js`
- Extracts token from `Authorization: Bearer <token>` header
- Verifies signature and expiration
- Attaches decoded payload to `req.user`
- Returns 401 if invalid/expired

---

## 📡 MQTT Integration

### Broker Configuration

**Service:** Mosquitto (systemd native)  
**Port:** 1883 (MQTT), 9001 (WebSocket)  
**Authentication:** Username/password (stored in `/etc/mosquitto/passwd`)  
**Users:**
- `mosquitto` (admin, full access)
- `devices` (IoT devices, restricted to specific topics)

### Topic Structure

**Design Principle:** Tenant isolation via topic prefix
```
{tenant_id}/{device_id}/data/{sensor}      → Device publishes telemetry
{tenant_id}/{device_id}/command/{action}   → Server sends commands
{tenant_id}/{device_id}/status             → Device LWT (Last Will Testament)
```

**Examples:**
```
1/ESP32_001/data/temperature → {"value": 23.5, "unit": "C"}
1/ESP32_001/data/humidity    → {"value": 65.2, "unit": "%"}
1/ESP32_001/command/led      → {"state": "on", "color": "red"}
1/ESP32_001/status           → "online" (or "offline" via LWT)
```

### MQTT Service (`services/mqttService.js`)

**Current Status:** ✅ Connected, ⚠️ Not integrated with telemetry storage

**Methods:**
- `connect()` - Connects to broker on server startup
- `subscribe(topic, callback)` - Subscribe to topic pattern
- `publish(topic, message, options)` - Publish message
- `disconnect()` - Graceful shutdown

**Planned Integration:**
1. On user login → subscribe to `{tenant_id}/+/data/#`
2. On message received → parse JSON → insert into `sensor_data` table
3. Broadcast via WebSocket to dashboard for real-time updates

---

## 🔒 Security Measures

### Implemented

1. **Password Security:**
   - bcrypt hashing (10 salt rounds)
   - Minimum 8 characters enforced
   - Never returned in API responses

2. **JWT Security:**
   - 24-hour expiration
   - Signed with strong secret (min 32 chars recommended)
   - Verified on every protected route

3. **Rate Limiting:**
   - 5 login/register attempts per 15 minutes per IP
   - Returns 429 Too Many Requests
   - Currently in-memory (resets on server restart)

4. **HTTP Security (Helmet.js):**
   - Content Security Policy (CSP)
   - XSS protection
   - Frameguard (clickjacking prevention)
   - HSTS (enforces HTTPS)

5. **SQL Injection Prevention:**
   - All queries use prepared statements
   - No string concatenation for SQL

6. **Tenant Isolation:**
   - All queries filtered by `tenant_id` from JWT
   - No direct ID exposure (e.g., `/api/devices/1` checks ownership)

### Planned Improvements

- [ ] Refresh tokens (extend sessions without re-login)
- [ ] Redis-backed rate limiting (persistent across restarts)
- [ ] Email verification on registration
- [ ] Two-factor authentication (2FA)
- [ ] IP whitelisting for admin routes
- [ ] Audit logs (who did what, when)

---

## 🚀 API Endpoints

### Authentication (Public)
```
POST /api/auth/register  → Create new tenant + user
POST /api/auth/login     → Authenticate user
```

### Devices (Protected - Requires JWT)
```
GET    /api/devices           → List all devices for tenant
POST   /api/devices           → Create new device (respects plan limits)
GET    /api/devices/:id       → Get device details
PUT    /api/devices/:id       → Update device (name, type, status)
DELETE /api/devices/:id       → Delete device
```

### Web Pages (Public)
```
GET /                  → Landing page
GET /register          → Registration form
GET /login             → Login form
GET /dashboard         → Device list (requires auth via localStorage token)
```

### Health Check
```
GET /health  → { status: "ok", mqtt: "connected", timestamp: "..." }
```

---

## 🎨 Frontend Architecture

### Views (EJS Templates)

**Location:** `views/` folder

1. **index.ejs** - Landing page
   - Project overview
   - Link to `/register` and `/login`

2. **register.ejs** - Registration form
   - Fields: name, email, username, password
   - Client-side validation (required fields)
   - AJAX POST to `/api/auth/register`
   - On success → redirect to `/login`

3. **login.ejs** - Login form
   - Fields: username, password
   - AJAX POST to `/api/auth/login`
   - On success → store token in localStorage → redirect to `/dashboard`

4. **dashboard.ejs** - Device management (authenticated)
   - Checks localStorage for token
   - If no token → redirect to `/login`
   - Fetches `/api/devices` with Bearer token
   - Currently displays raw JSON
   - **Next Step:** Add device cards, add/edit/delete buttons

### Authentication Flow (Frontend)
```javascript
// On login success
localStorage.setItem('token', data.token);
window.location.href = '/dashboard';

// On dashboard load
const token = localStorage.getItem('token');
if (!token) {
  window.location.href = '/login';
  return;
}

// API calls
fetch('/api/devices', {
  headers: { 'Authorization': 'Bearer ' + token }
});
```

### Styling

- Bootstrap 5.3 via CDN
- No custom CSS yet (default Bootstrap theme)
- Responsive design (mobile-friendly)

---

## 🔧 Development Environment

### Server Setup

**Hostname:** server.local  
**OS:** Ubuntu 24.04 LTS Server  
**Architecture:** x86_64  
**SSH Access:** `ssh rodrigo@server.local`

**Services Running:**
- Node.js app (port 3000)
- Mosquitto MQTT (ports 1883, 9001)
- Home Assistant (port 8123)
- ESPHome (port 6052)
- Portainer (ports 9000, 9443)

### Project Structure
```
~/docker/iot-dashboard/
├── config/
│   ├── database.js           # SQLite connection + auto-schema
│   ├── databaseSchema.sql    # SQL schema definition
│   └── mqtt.js               # MQTT broker config
├── models/
│   ├── User.js               # User CRUD + password validation
│   ├── Tenant.js             # Tenant logic + trial checking
│   ├── Plan.js               # Plan limits enforcement
│   └── Device.js             # Device CRUD with tenant isolation
├── controllers/
│   ├── authController.js     # Register/login logic
│   └── deviceController.js   # Device endpoints
├── routes/
│   ├── auth.js               # Auth API routes
│   ├── devices.js            # Device API routes
│   └── web.js                # Web page routes
├── middleware/
│   ├── authMiddleware.js     # JWT verification
│   ├── rateLimiter.js        # Brute-force protection
│   └── checkPlanLimits.js    # Enforce device limits
├── services/
│   └── mqttService.js        # MQTT pub/sub handler
├── views/
│   ├── index.ejs             # Landing page
│   ├── login.ejs             # Login form
│   ├── register.ejs          # Registration form
│   └── dashboard.ejs         # Device list
├── public/                   # Static assets (future)
├── data/
│   └── database.sqlite       # SQLite database (gitignored)
├── docs/
│   ├── AI_CONTEXT.md         # This file
│   ├── AI_PROMPTS.md         # Development guidelines
│   └── CONTINUITY_GUIDE.md   # Session handoff instructions
├── server.js                 # Express app entry point
├── package.json              # Dependencies
├── .env                      # Environment variables (gitignored)
├── .env.example              # Environment template
└── .gitignore                # Git exclusions
```

### Environment Variables (`.env`)
```env
# JWT Configuration
JWT_SECRET=your-super-secret-key-change-this

# MQTT Configuration
MQTT_HOST=localhost
MQTT_PORT=1883
MQTT_USERNAME=devices
MQTT_PASSWORD=your-mqtt-password

# Server Configuration
PORT=3000
NODE_ENV=development
```

### Git Workflow

**Repository:** https://github.com/rodrigo-s-lange/iot-dashboard-easysmart

**Branching:**
- `main` - Production-ready code
- Feature branches as needed

**Commit Convention:**
```
type(scope): description

Examples:
feat(auth): implement JWT authentication
fix(db): correct tenant isolation query
docs(readme): update API documentation
refactor(mqtt): extract subscription logic
```

---

## 🧪 Testing Strategy

### Manual Testing Checklist

**Authentication:**
- [x] Register creates tenant + user
- [x] Register saves to database
- [x] Login with correct credentials succeeds
- [x] Login with wrong password fails (401)
- [x] Login with inactive tenant fails (403)
- [x] JWT token stored in localStorage
- [x] Protected routes reject invalid tokens

**Device Management:**
- [x] Create device works within plan limits
- [x] Create device blocks when limit exceeded
- [x] List devices shows only tenant's devices
- [x] Update device changes only owner's devices
- [x] Delete device removes only owner's devices
- [ ] Device status updates via MQTT

**Frontend:**
- [x] Register page loads
- [x] Register form submits successfully
- [x] Login page loads
- [x] Login form submits successfully
- [x] Dashboard requires authentication
- [x] Dashboard fetches device list
- [ ] Dashboard shows device cards (not raw JSON)
- [ ] Add device button works
- [ ] Edit device button works
- [ ] Delete device button works

### API Testing (curl)
```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Co","email":"test@test.com","username":"test","password":"test1234"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test1234"}'

# Create device (replace TOKEN)
curl -X POST http://localhost:3000/api/devices \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"device_id":"ESP32_001","name":"Sensor Test","type":"ESP32"}'

# List devices
curl -X GET http://localhost:3000/api/devices \
  -H "Authorization: Bearer TOKEN"
```

---

## 🎯 Current Phase & Next Steps

### Phase 1: Foundation ✅ COMPLETE

**Achievements:**
- Multi-tenant architecture
- Authentication system
- Device CRUD API
- Basic web interface
- MQTT service connected
- Database auto-initialization

### Phase 2: Core Features 🚧 IN PROGRESS

**Priority 1: Device Management UI (Next Session)**
- Add device cards to dashboard
- Implement add/edit/delete via modal forms
- Show plan usage and upgrade prompt

**Priority 2: MQTT Real-Time Integration**
- Subscribe to device topics on login
- Store telemetry in sensor_data table
- WebSocket for live dashboard updates

**Priority 3: Data Visualization**
- Integrate Chart.js
- Device detail page with historical charts
- Real-time chart updates

### Phase 3: SaaS Features 📋 PLANNED

- Payment gateway integration (Asaas)
- Email notifications (trial expiration, alerts)
- Admin panel (manage all tenants)
- Usage analytics dashboard

---

## 🚨 Important Technical Decisions

### Why SQLite?

**Pros:**
- Zero configuration (embedded)
- Perfect for MVP/prototyping
- Sufficient for 100-200 concurrent devices
- Easy backups (single file)

**Migration Path:**
- When > 50 devices or multiple servers needed → PostgreSQL
- Schema is 95% compatible (only `AUTOINCREMENT` → `SERIAL`)

### Why EJS over React?

**Pros:**
- Server-side rendering (SEO-friendly)
- No build process (faster development)
- Lower complexity for simple UI

**Future:**
- Mobile app will use React Native
- Admin panel may use React for complex UI

### Why Mosquitto over Cloud MQTT?

**Pros:**
- Full control over broker
- No external dependencies
- Zero cost
- Custom ACL rules

**Future:**
- May add EMQX for clustering/high availability

---

## 📚 Key Learnings & Gotchas

### Database

1. **Foreign Keys:** Must enable explicitly in SQLite
```javascript
   db.pragma('foreign_keys = ON');
```

2. **WAL Mode:** Enables concurrent reads
```javascript
   db.pragma('journal_mode = WAL');
```

3. **Schema Initialization:** Auto-runs on server start via `config/database.js`

### Helmet CSP

Default CSP blocks inline scripts and external resources. Must configure:
```javascript
helmet({
  contentSecurityPolicy: {
    directives: {
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"]
    }
  }
})
```

### Rate Limiter

In-memory storage resets on server restart. Use Redis in production:
```javascript
const RedisStore = require('rate-limit-redis');
const limiter = rateLimit({
  store: new RedisStore({ client: redisClient })
});
```

### MQTT Wildcards

- `+` matches single level: `1/+/data` → `1/ESP32_001/data`
- `#` matches multiple levels: `1/#` → `1/ESP32_001/data/temperature`

---

## 🔗 Resources & Documentation

- **Node.js Docs:** https://nodejs.org/docs/
- **Express.js:** https://expressjs.com/
- **better-sqlite3:** https://github.com/WiseLibs/better-sqlite3
- **MQTT.js:** https://github.com/mqttjs/MQTT.js
- **Bootstrap 5:** https://getbootstrap.com/docs/5.3/
- **JWT.io:** https://jwt.io/introduction
- **Mosquitto:** https://mosquitto.org/documentation/

---

**End of AI Context**  
**Last Updated:** 2025-10-14 23:30 UTC  
**Next Review:** After Phase 2 completion
