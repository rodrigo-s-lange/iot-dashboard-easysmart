# 🔄 Continuity Guide - EasySmart IoT Platform

**Last Updated:** 2025-10-14 23:30 UTC  
**Phase:** 1 Complete, Phase 2 Starting  
**Status:** ✅ Backend 100% Functional, Frontend Basic Working

---

## 📊 Current Project Status

### ✅ Phase 1: Foundation (COMPLETE)

**Multi-Tenant Architecture:**
- ✅ Database schema with tenants, users, devices, plans
- ✅ Tenant isolation on all queries
- ✅ Plan-based device limitations (Free=1, Basic=5, Premium=∞)
- ✅ Trial period logic (30 days for Free plan)

**Authentication System:**
- ✅ Register endpoint creates Tenant + User (owner role)
- ✅ Login validates credentials and checks tenant status
- ✅ JWT tokens with 24h expiration
- ✅ bcrypt password hashing (10 rounds)
- ✅ Rate limiting (5 attempts / 15 min)

**Device Management:**
- ✅ Device CRUD API with tenant isolation
- ✅ Plan limit enforcement via middleware
- ✅ Device status tracking (online/offline)
- ✅ Last seen timestamp

**MQTT Integration:**
- ✅ MQTT Service connected to Mosquitto broker
- ✅ Pub/sub functionality ready
- ⚠️ Not yet integrated with device telemetry display

**Web Interface:**
- ✅ Landing page (`/`)
- ✅ Register page (`/register`) - TESTED & WORKING
- ✅ Login page (`/login`) - TESTED & WORKING
- ✅ Dashboard page (`/dashboard`) - Shows JSON device list
- ⚠️ No device management UI yet (add/edit/delete buttons)

**Testing Status:**
- ✅ Register via web interface saves to database
- ✅ Login redirects to dashboard with valid JWT
- ✅ Dashboard fetches `/api/devices` successfully
- ✅ API tested via curl (all endpoints working)

---

## 🗄️ Database Status

**File Location:** `data/database.sqlite`  
**Schema Version:** Multi-tenant v1.0  
**Auto-initialization:** ✅ Yes (runs on server start)

**Tables:**
```sql
tenants (id, name, email, plan, status, trial_ends_at, created_at)
users (id, tenant_id, username, email, password, role, created_at)
devices (id, tenant_id, user_id, device_id, name, type, status, last_seen, created_at)
sensor_data (id, device_id, sensor, value, timestamp)
plans (id, name, max_devices, price, features, created_at)
subscriptions (id, tenant_id, plan_id, payment_provider, external_id, status, current_period_end)
```

**Default Plans Inserted:**
```
Free: 1 device, $0.00, 30-day trial
Basic: 5 devices, $19.90/month
Premium: unlimited (-1) devices, $49.90/month
```

**Test Data Present:**
```
Tenant: ID=1, email=admin@easysmart.com, plan=free
User: ID=1, username=admin, tenant_id=1, role=owner
```

---

## 🔑 Authentication Flow (Verified Working)

### Register Flow:
1. User submits form at `/register`
2. POST to `/api/auth/register`
3. Backend creates Tenant with plan=free, trial_ends_at=+30 days
4. Backend creates User with role=owner, tenant_id linked
5. JWT token generated with: `{ id, username, tenant_id, plan, role }`
6. Token returned to frontend + stored in localStorage
7. Frontend redirects to `/login` with success message

### Login Flow:
1. User submits form at `/login`
2. POST to `/api/auth/login`
3. Backend validates username exists
4. Backend checks tenant.status === 'active'
5. Backend checks trial_ends_at if plan=free
6. bcrypt.compare validates password
7. JWT token generated and returned
8. Token stored in localStorage
9. Frontend redirects to `/dashboard`

### Dashboard Load:
1. Dashboard checks `localStorage.getItem('token')`
2. If no token → redirect to `/login`
3. If token exists → `fetch('/api/devices', { headers: { Authorization: 'Bearer ' + token }})`
4. Backend middleware verifies JWT
5. Backend filters devices by `tenant_id` from JWT payload
6. JSON response displayed on page

---

## 🚀 Server Configuration

**File:** `server.js`  
**Port:** 3000  
**Host:** 0.0.0.0 (accepts external connections)

**Middleware Stack:**
```javascript
1. helmet (CSP configured to allow inline scripts + Bootstrap CDN)
2. cors (enabled for all origins in dev)
3. express.json() (parse JSON bodies)
4. express.urlencoded({ extended: true })
5. express.static('public') (serve static assets)
```

**View Engine:**
- EJS templates in `views/` folder
- Bootstrap 5.3 via CDN
- No compilation needed (server-side rendering)

**Routes Mounted:**
```javascript
/api/auth/*         → routes/auth.js (register, login)
/api/devices/*      → routes/devices.js (CRUD, requires JWT)
/*                  → routes/web.js (web pages: /, /login, /register, /dashboard)
```

**MQTT Connection:**
- Auto-connects on server start
- Host: localhost (Mosquitto native)
- Port: 1883
- Username: devices
- Password: (from .env)

---

## 🐛 Known Issues & Fixes

### Issue 1: CSP Blocking Bootstrap (RESOLVED)
**Symptom:** Console errors about refused to load Bootstrap CSS  
**Cause:** Helmet's default CSP too restrictive  
**Fix:** Updated `server.js` with custom CSP allowing cdn.jsdelivr.net  

### Issue 2: Server Using Wrong Database (RESOLVED)
**Symptom:** Data not persisting after register  
**Cause:** `config/database.js` pointed to `iot.db` instead of `database.sqlite`  
**Fix:** Changed line 5 to: `const dbPath = path.join(__dirname, '..', 'data', 'database.sqlite');`  
**Verification:** `sqlite3 data/database.sqlite "SELECT * FROM tenants;"` shows data  

### Issue 3: Rate Limiter Blocking Legitimate Users (KNOWN)
**Symptom:** 429 Too Many Requests after 5 failed attempts  
**Workaround:** Restart server to reset counter  
**Future Fix:** Implement Redis for persistent rate limit storage  

### Issue 4: Dashboard Shows Raw JSON (EXPECTED)
**Status:** Not a bug - UI not implemented yet  
**Next Step:** Add HTML/CSS to render device cards with add/edit/delete buttons  

---

## 📂 File Changes Since Last Session

**Modified:**
```
server.js                      → Added CSP config, mounted web routes
config/database.js             → Fixed dbPath to database.sqlite
views/register.ejs             → Created (working)
views/login.ejs                → Created (working)
views/dashboard.ejs            → Created (basic JSON display)
views/index.ejs                → Created (landing page)
routes/web.js                  → Created (web page routes)
```

**Created:**
```
models/Tenant.js               → Multi-tenant logic
models/Plan.js                 → Plan limits enforcement
models/Device.js               → Device CRUD with tenant isolation
controllers/deviceController.js → Device endpoints
routes/devices.js              → Device API routes
middleware/checkPlanLimits.js  → Enforce device limits
config/databaseSchema.sql      → Complete schema definition
```

**Not Modified (Stable):**
```
models/User.js                 → Working correctly
controllers/authController.js  → Working correctly
routes/auth.js                 → Working correctly
middleware/authMiddleware.js   → Working correctly
middleware/rateLimiter.js      → Working (needs Redis upgrade)
services/mqttService.js        → Connected but not used yet
```

---

## 🎯 Next Steps (Phase 2)

### Priority 1: Device Management UI (Next Session)
**Goal:** User can add/edit/delete devices via dashboard  

**Tasks:**
1. Update `views/dashboard.ejs`:
   - Add Bootstrap card layout for devices
   - Add "Add Device" button → modal form
   - Add edit/delete buttons per device
   - Show device status (online/offline) with color badges
   - Show plan usage: "1/1 devices (Free plan)"

2. Create JavaScript in dashboard:
   - `addDevice()` → POST to `/api/devices`
   - `editDevice(id)` → PUT to `/api/devices/:id`
   - `deleteDevice(id)` → DELETE to `/api/devices/:id`
   - Refresh device list after mutations

3. Add error handling:
   - Show "Limit reached, upgrade required" message
   - Display API errors in user-friendly format

**Expected Commit:** `feat(ui): implement device management interface with add/edit/delete`

---

### Priority 2: MQTT Real-Time Integration
**Goal:** Devices publish data → Dashboard shows live updates  

**Tasks:**
1. Update `services/mqttService.js`:
   - Subscribe to `{tenant_id}/{device_id}/data/#` on tenant login
   - Parse JSON payloads from devices
   - Insert into `sensor_data` table

2. Create WebSocket endpoint:
   - `ws://localhost:3000/ws` 
   - Authenticate via JWT in query param
   - Broadcast new sensor data to connected clients

3. Update `views/dashboard.ejs`:
   - Connect to WebSocket on page load
   - Update device cards in real-time without refresh

**Expected Commit:** `feat(mqtt): integrate real-time telemetry with WebSocket updates`

---

### Priority 3: Data Visualization
**Goal:** Show sensor data in charts  

**Tasks:**
1. Add Chart.js CDN to dashboard
2. Create device detail page: `/dashboard/device/:id`
3. Fetch last 100 readings: `GET /api/devices/:id/data`
4. Render line chart (time vs value)
5. Auto-update chart via WebSocket

**Expected Commit:** `feat(ui): add Chart.js visualization for sensor data`

---

## 🔧 Development Workflow

### Starting Development Session:
```bash
cd ~/docker/iot-dashboard
git pull origin main
git log --oneline -5              # Check recent commits
npm start                         # Start server
```

### Testing Changes:
```bash
# Web UI
http://localhost:3000/register    # Test registration
http://localhost:3000/login       # Test login
http://localhost:3000/dashboard   # Test dashboard

# API
curl http://localhost:3000/api/devices -H "Authorization: Bearer TOKEN"

# Database
sqlite3 data/database.sqlite "SELECT * FROM tenants;"
sqlite3 data/database.sqlite "SELECT * FROM devices WHERE tenant_id=1;"
```

### Committing Changes:
```bash
git add .
git commit -m "type(scope): description"
git push origin main
```

**Commit Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `refactor`: Code restructure (no functionality change)
- `test`: Add tests
- `chore`: Maintenance (dependencies, configs)

---

## 🚨 Important Notes for Next Session

### Environment Access:
- **Server:** server.local (Ubuntu 24.04)
- **SSH:** `ssh rodrigo@server.local`
- **VSCode:** Remote-SSH extension
- **Browser Testing:** Use `http://localhost:3000` (not server.local) to avoid CORS issues

### Database:
- **DO NOT** delete `data/database.sqlite` unless instructed
- Always backup before schema changes: `cp data/database.sqlite data/database.backup`
- Use `sqlite3 data/database.sqlite` for manual queries

### Authentication:
- Test credentials: `admin` / `admin123`
- JWT secret in `.env` (never commit)
- Tokens expire after 24 hours

### MQTT:
- Broker: localhost:1883
- Username: devices
- Password: in `.env` file
- Service auto-connects on server start

### Code Style:
- One feature per commit
- Descriptive commit messages
- Test before committing
- Document complex logic with comments

---

## 📞 Contacts & Resources

- **GitHub:** https://github.com/rodrigo-s-lange/iot-dashboard-easysmart
- **Domain:** easysmart.com.br (Cloudflare Tunnel configured)
- **MQTT Topics:** See README.md for structure
- **API Docs:** See README.md for endpoints

---

## ✅ Session Handoff Checklist

When starting a new session, verify:
- [ ] Server is running (`npm start`)
- [ ] Database file exists (`ls data/database.sqlite`)
- [ ] Latest code pulled (`git pull origin main`)
- [ ] Environment variables set (`.env` file present)
- [ ] MQTT connected (check server logs)
- [ ] Web interface accessible (`http://localhost:3000`)
- [ ] Test login works with known credentials

---

**End of Continuity Guide**  
**Next Session Goal:** Implement device management UI (add/edit/delete)
