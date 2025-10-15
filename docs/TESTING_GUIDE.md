# 🧪 Testing Guide - EasySmart IoT Platform

**Complete testing procedures for manual validation**

---

## 📋 Table of Contents

- [Testing Environment](#testing-environment)
- [Authentication Tests](#authentication-tests)
- [Device Management Tests](#device-management-tests)
- [Frontend Tests](#frontend-tests)
- [MQTT Tests](#mqtt-tests)
- [Database Tests](#database-tests)
- [Security Tests](#security-tests)

---

## 🌍 Testing Environment

### Prerequisites
```bash
# Server must be running
cd ~/docker/iot-dashboard
npm start

# Should see:
# ✅ Database initialized with multi-tenant schema
# 🚀 Server running on http://localhost:3000
# ✅ MQTT connected
```

### Test User Credentials

**Default Test Account:**
- Username: `admin`
- Password: `admin123`
- Email: `admin@easysmart.com`
- Plan: `free` (1 device)

---

## 🔐 Authentication Tests

### Test 1: Register New Tenant

**Endpoint:** `POST /api/auth/register`
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Company",
    "email": "test@example.com",
    "username": "testuser",
    "password": "test1234"
  }'
```

**Expected Response (201):**
```json
{
  "message": "Account created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "testuser",
    "email": "test@example.com",
    "role": "owner"
  },
  "tenant": {
    "id": 1,
    "name": "Test Company",
    "plan": "free",
    "trial_ends_at": "2025-11-13T..."
  }
}
```

**Validation:**
```bash
# Verify in database
sqlite3 data/database.sqlite "SELECT id, name, plan FROM tenants WHERE email='test@example.com';"
# Should return: 1|Test Company|free

sqlite3 data/database.sqlite "SELECT id, username, tenant_id FROM users WHERE username='testuser';"
# Should return: 1|testuser|1
```

---

### Test 2: Login with Valid Credentials

**Endpoint:** `POST /api/auth/login`
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "test1234"
  }'
```

**Expected Response (200):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { "id": 1, "username": "testuser", "role": "owner" },
  "tenant": { "id": 1, "plan": "free", "trial_ends_at": "..." }
}
```

**Save token for next tests:**
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### Test 3: Login with Wrong Password
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "wrongpass"
  }'
```

**Expected Response (401):**
```json
{
  "error": "Invalid credentials"
}
```

---

### Test 4: Rate Limiting
```bash
# Attempt login 6 times with wrong password
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"username":"testuser","password":"wrong"}'
  echo "\nAttempt $i"
done
```

**Expected Response (after 5 attempts):**
```json
{
  "error": "Too many attempts, please try again later"
}
```

**Note:** Rate limiter resets after 15 minutes or server restart.

---

## 📱 Device Management Tests

### Test 5: Create Device (Within Limits)

**Endpoint:** `POST /api/devices`
```bash
curl -X POST http://localhost:3000/api/devices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "ESP32_001",
    "name": "Sensor Sala",
    "type": "ESP32"
  }'
```

**Expected Response (201):**
```json
{
  "message": "Device created successfully",
  "device": {
    "id": 1,
    "tenant_id": 1,
    "user_id": 1,
    "device_id": "ESP32_001",
    "name": "Sensor Sala",
    "type": "ESP32",
    "status": "offline",
    "last_seen": null,
    "created_at": "2025-10-14 23:00:00"
  }
}
```

**Validation:**
```bash
sqlite3 data/database.sqlite "SELECT device_id, name, tenant_id FROM devices;"
# Should return: ESP32_001|Sensor Sala|1
```

---

### Test 6: Attempt to Exceed Plan Limit
```bash
# Try to create second device (Free plan = 1 device max)
curl -X POST http://localhost:3000/api/devices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "ESP32_002",
    "name": "Sensor Quarto",
    "type": "ESP32"
  }'
```

**Expected Response (403):**
```json
{
  "error": "Device limit reached for your plan",
  "action": "upgrade_required",
  "current_plan": "free",
  "current_devices": 1,
  "max_devices": 1
}
```

---

### Test 7: List Devices

**Endpoint:** `GET /api/devices`
```bash
curl -X GET http://localhost:3000/api/devices \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200):**
```json
{
  "devices": [
    {
      "id": 1,
      "device_id": "ESP32_001",
      "name": "Sensor Sala",
      "type": "ESP32",
      "status": "offline",
      "last_seen": null
    }
  ],
  "count": 1,
  "plan": "free",
  "can_add_more": false
}
```

---

### Test 8: Update Device

**Endpoint:** `PUT /api/devices/:id`
```bash
curl -X PUT http://localhost:3000/api/devices/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sensor Sala Atualizado",
    "status": "online"
  }'
```

**Expected Response (200):**
```json
{
  "message": "Device updated successfully",
  "device": {
    "id": 1,
    "name": "Sensor Sala Atualizado",
    "status": "online",
    "last_seen": "2025-10-14 23:05:00"
  }
}
```

---

### Test 9: Delete Device

**Endpoint:** `DELETE /api/devices/:id`
```bash
curl -X DELETE http://localhost:3000/api/devices/1 \
  -H "Authorization: Bearer $TOKEN"
```

**Expected Response (200):**
```json
{
  "message": "Device deleted successfully"
}
```

**Validation:**
```bash
sqlite3 data/database.sqlite "SELECT COUNT(*) FROM devices WHERE id=1;"
# Should return: 0
```

---

## 🌐 Frontend Tests

### Test 10: Register via Web Interface

**Steps:**
1. Open browser: `http://localhost:3000/register`
2. Fill form:
   - Nome: Test Web User
   - E-mail: webuser@test.com
   - Usuário: webuser
   - Senha: webpass123
3. Click "Registrar"

**Expected:**
- ✅ Alert: "Conta criada com sucesso! Faça login para continuar."
- ✅ Redirect to `/login`
- ✅ Form fields clear

**Console (F12):**
- ✅ No red errors
- ⚠️ Yellow warning about Bootstrap `.css.map` (can ignore)

---

### Test 11: Login via Web Interface

**Steps:**
1. At `http://localhost:3000/login`
2. Enter credentials:
   - Usuário: webuser
   - Senha: webpass123
3. Click "Entrar"

**Expected:**
- ✅ Redirect to `/dashboard`
- ✅ JWT token stored in `localStorage` (check DevTools → Application → Local Storage)
- ✅ Dashboard displays JSON device list

---

### Test 12: Dashboard Authentication

**Steps:**
1. Clear localStorage: DevTools → Application → Local Storage → Clear
2. Navigate to `http://localhost:3000/dashboard`

**Expected:**
- ✅ Redirect to `/login` (no token = not authenticated)

---

### Test 13: Dashboard Loads Devices

**Steps:**
1. Login as `webuser`
2. Dashboard should display:

**Expected:**
```json
{
  "devices": [],
  "count": 0,
  "plan": "free",
  "can_add_more": true
}
```

---

## �� MQTT Tests

### Test 14: MQTT Connection

**Check server logs on startup:**
```
✅ MQTT connected
```

**Manual test:**
```bash
# Install mosquitto-clients
sudo apt install mosquitto-clients

# Subscribe to test topic
mosquitto_sub -h localhost -p 1883 -u devices -P YOUR_PASSWORD -t "test/topic" &

# Publish test message
mosquitto_pub -h localhost -p 1883 -u devices -P YOUR_PASSWORD -t "test/topic" -m "Hello MQTT"
```

**Expected:**
- Subscriber receives "Hello MQTT"

---

### Test 15: Device Telemetry Simulation
```bash
# Publish as if ESP32_001 sending temperature
mosquitto_pub -h localhost -p 1883 -u devices -P YOUR_PASSWORD \
  -t "1/ESP32_001/data/temperature" \
  -m '{"value":23.5,"unit":"C"}'
```

**Expected (future implementation):**
- Data inserted into `sensor_data` table
- Dashboard updates in real-time

**Current Status:** ⚠️ Not yet implemented

---

## 💾 Database Tests

### Test 16: Verify Schema
```bash
sqlite3 data/database.sqlite ".schema"
```

**Expected Output:**
```sql
CREATE TABLE tenants (...);
CREATE TABLE users (...);
CREATE TABLE devices (...);
CREATE TABLE sensor_data (...);
CREATE TABLE plans (...);
CREATE TABLE subscriptions (...);
```

---

### Test 17: Check Default Plans
```bash
sqlite3 data/database.sqlite "SELECT name, max_devices, price FROM plans;"
```

**Expected:**
```
free|1|0.0
basic|5|19.9
premium|-1|49.9
```

---

### Test 18: Verify Tenant Isolation
```bash
# Create two tenants
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Tenant A","email":"a@test.com","username":"tenanta","password":"pass1234"}'

# Save TOKEN_A

curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Tenant B","email":"b@test.com","username":"tenantb","password":"pass1234"}'

# Save TOKEN_B

# Create device for Tenant A
curl -X POST http://localhost:3000/api/devices \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"device_id":"ESP_A","name":"Device A","type":"ESP32"}'

# Try to list devices as Tenant B
curl -X GET http://localhost:3000/api/devices \
  -H "Authorization: Bearer $TOKEN_B"
```

**Expected for Tenant B:**
```json
{
  "devices": [],
  "count": 0,
  "plan": "free",
  "can_add_more": true
}
```

**Validation:** Tenant B should NOT see Tenant A's devices.

---

## 🔒 Security Tests

### Test 19: JWT Expiration

**Steps:**
1. Generate token with 1-second expiration (modify code temporarily):
```javascript
   jwt.sign(payload, secret, { expiresIn: '1s' })
```
2. Wait 2 seconds
3. Try to access protected route

**Expected:**
```json
{
  "error": "Invalid or expired token"
}
```

---

### Test 20: SQL Injection Prevention
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin\" OR \"1\"=\"1",
    "password": "anything"
  }'
```

**Expected:**
```json
{
  "error": "Invalid credentials"
}
```

**Validation:** No SQL error, no unauthorized access.

---

### Test 21: XSS Prevention
```bash
curl -X POST http://localhost:3000/api/devices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "XSS_TEST",
    "name": "<script>alert(\"XSS\")</script>",
    "type": "ESP32"
  }'
```

**Expected:**
- Device created with name as plain text (no script execution)
- When viewing in browser, script tags rendered as text, not executed

---

## 📊 Test Results Template

### Session: [Date]

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Register New Tenant | ✅ PASS | Token generated |
| 2 | Login Valid Credentials | ✅ PASS | - |
| 3 | Login Wrong Password | ✅ PASS | 401 returned |
| 4 | Rate Limiting | ✅ PASS | Blocked after 5 attempts |
| 5 | Create Device | ✅ PASS | - |
| 6 | Exceed Plan Limit | ✅ PASS | 403 returned |
| 7 | List Devices | ✅ PASS | - |
| 8 | Update Device | ✅ PASS | - |
| 9 | Delete Device | ✅ PASS | - |
| 10 | Register Web | ✅ PASS | - |
| 11 | Login Web | ✅ PASS | Redirected to dashboard |
| 12 | Dashboard Auth | ✅ PASS | Redirected to login |
| 13 | Dashboard Loads | ✅ PASS | JSON displayed |
| 14 | MQTT Connection | ✅ PASS | - |
| 15 | Device Telemetry | ⚠️ TODO | Not implemented |
| 16 | Verify Schema | ✅ PASS | - |
| 17 | Check Plans | ✅ PASS | 3 plans present |
| 18 | Tenant Isolation | ✅ PASS | - |
| 19 | JWT Expiration | ⚠️ SKIP | Needs code change |
| 20 | SQL Injection | ✅ PASS | - |
| 21 | XSS Prevention | ✅ PASS | - |

---

## 🔄 Regression Testing

**Run after any code changes:**
```bash
# Quick smoke test
curl http://localhost:3000/health
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Full regression (automated script coming soon):**
- All authentication tests
- Device CRUD tests
- Frontend navigation tests

---

**End of Testing Guide**  
**Last Updated:** 2025-10-14 23:30 UTC  
**Next Update:** After Phase 2 completion
