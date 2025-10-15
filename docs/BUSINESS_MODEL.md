# 💼 EasySmart IoT Platform - Business Model & Technical Requirements

**Requisitos de negócio que impactam arquitetura técnica**

**Versão**: 1.0  
**Última atualização**: 15 Outubro 2025  
**Público**: Time técnico e stakeholders

---

## 🎯 Visão Geral

Plataforma SaaS multi-tenant para gerenciamento de dispositivos IoT com modelo de receita recorrente e vendas de hardware integrado.

---

## 📋 Estrutura de Planos

### Requisitos Técnicos por Plano

| Feature | Free | Starter | Professional | Industrial |
|---------|------|---------|--------------|------------|
| **Max Devices** | 1 | 5 | 20 | Ilimitado |
| **Max Users/Tenant** | 1 | 3 | 10 | Ilimitado |
| **Data Retention** | 30 dias | 90 dias | 365 dias | Indefinido |
| **Reading Frequency** | 1 min | 30 seg | 10 seg | 1 seg |
| **API Rate Limit** | - | 100 req/h | 1000 req/h | 10000 req/h |
| **Webhook Support** | ❌ | ❌ | ✅ | ✅ |
| **Custom Dashboards** | ❌ | ❌ | ✅ | ✅ |
| **White Label** | ❌ | ❌ | ❌ | ✅ |
| **SLA Uptime** | Best effort | 99% | 99.5% | 99.9% |

### Implicações Técnicas

#### Data Retention (InfluxDB)
```flux
// Free plan
retention_policy: 30d

// Starter
retention_policy: 90d

// Professional  
retention_policy: 365d

// Industrial
retention_policy: infinite
+ manual archival to S3/cold storage
```

#### Rate Limiting
```javascript
// Implementation
const rateLimits = {
  free: { requests: 0, period: '1h' },        // No API access
  starter: { requests: 100, period: '1h' },
  professional: { requests: 1000, period: '1h' },
  industrial: { requests: 10000, period: '1h' }
};
```

---

## 🔐 Plan Enforcement

### Database Schema
```sql
-- Tenants table with plan information
CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  plan VARCHAR(50) DEFAULT 'free',
  status VARCHAR(50) DEFAULT 'active',
  plan_limits JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Example plan_limits JSON
{
  "max_devices": 5,
  "max_users": 3,
  "data_retention_days": 90,
  "api_enabled": true,
  "api_rate_limit": 100,
  "ml_features": ["anomaly_detection_basic"],
  "reading_frequency_seconds": 30
}
```

### Middleware Implementation
```javascript
// middleware/checkPlanLimits.js
async function checkDeviceLimit(req, res, next) {
  const tenant = await getTenant(req.tenantId);
  const currentDevices = await countDevices(req.tenantId);
  const limit = tenant.plan_limits.max_devices;
  
  if (currentDevices >= limit && limit !== -1) {
    return res.status(403).json({
      error: 'Device limit reached',
      current: currentDevices,
      limit: limit,
      plan: tenant.plan,
      action: 'upgrade_required'
    });
  }
  
  next();
}
```

---

## 🛒 Hardware Integration

### Device Provisioning Flow
```
1. Hardware manufactured with unique Device ID
   ↓
2. QR Code generated: https://app.easysmart.com.br/provision?id=ABC123
   ↓
3. Customer scans QR on first use
   ↓
4. Auto-creates tenant (if new user) with Free plan
   ↓
5. Device auto-registers and associates with tenant
   ↓
6. Free plan activated (no credit card required)
```

### Implementation
```javascript
// routes/provision.js
router.post('/provision', async (req, res) => {
  const { device_id, activation_code } = req.body;
  
  // Validate activation code
  const hardware = await validateHardware(device_id, activation_code);
  if (!hardware) {
    return res.status(400).json({ error: 'Invalid activation code' });
  }
  
  // Check if already provisioned
  if (hardware.provisioned) {
    return res.status(400).json({ error: 'Device already activated' });
  }
  
  // Create or get tenant
  let tenant = req.tenantId 
    ? await getTenant(req.tenantId)
    : await createTenant({ plan: 'free', source: 'hardware_bundle' });
  
  // Register device
  await registerDevice({
    tenant_id: tenant.id,
    device_id: device_id,
    type: hardware.type,
    status: 'provisioned'
  });
  
  // Mark hardware as provisioned
  await markProvisioned(device_id);
  
  res.json({ 
    success: true,
    device: device_id,
    plan: tenant.plan
  });
});
```

---

## 🤖 Machine Learning Features

### Feature Availability by Plan

| ML Feature | Implementation | Plans |
|------------|----------------|-------|
| **Anomaly Detection (Basic)** | Statistical thresholds | Starter+ |
| **Anomaly Detection (Advanced)** | LSTM/Autoencoder | Professional+ |
| **Predictive Maintenance** | Regression models | Professional+ |
| **Pattern Recognition** | Clustering/Classification | Industrial |
| **Custom Models** | User-uploaded TensorFlow.js | Industrial |
| **Edge Deployment** | Model export to device | Industrial |

### Technical Requirements
```javascript
// Feature flags in tenant config
{
  "ml_features": {
    "anomaly_detection": "basic",      // basic, advanced, off
    "predictive_maintenance": true,
    "pattern_recognition": false,
    "custom_models": false,
    "edge_deployment": false
  }
}

// Middleware check
async function checkMLFeature(feature, req, res, next) {
  const tenant = await getTenant(req.tenantId);
  
  if (!tenant.plan_limits.ml_features.includes(feature)) {
    return res.status(403).json({
      error: 'ML feature not available in your plan',
      feature: feature,
      required_plan: getRequiredPlan(feature),
      action: 'upgrade_required'
    });
  }
  
  next();
}
```

---

## 📊 Data Export & API Access

### CSV Export

**Implementation requirements:**
```javascript
// Free plan: No export
// Starter+: CSV export enabled

router.get('/export/:deviceId/:entityId', 
  authMiddleware,
  checkPlanFeature('csv_export'),
  async (req, res) => {
    const { deviceId, entityId } = req.params;
    const { start, end } = req.query;
    
    // Query InfluxDB
    const data = await queryTimeSeries(deviceId, entityId, start, end);
    
    // Convert to CSV
    const csv = convertToCSV(data);
    
    // Set headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${deviceId}_${entityId}.csv"`);
    
    res.send(csv);
  }
);
```

### API Access Control
```javascript
// Professional+ only
router.use('/api/v1/*', 
  authMiddleware,
  checkPlanFeature('api_access'),
  rateLimitByPlan
);
```

---

## 🔄 Upgrade & Downgrade Flow

### Upgrade Process
```javascript
// User initiates upgrade
POST /api/billing/upgrade
{
  "new_plan": "professional",
  "payment_method": "credit_card",
  "billing_cycle": "monthly"  // or "annual"
}

// Backend process:
1. Validate payment method
2. Calculate prorated amount (if mid-cycle)
3. Update tenant.plan
4. Update tenant.plan_limits
5. Send confirmation email
6. Log billing event
```

### Downgrade Restrictions
```javascript
// Validation before downgrade
async function canDowngrade(tenantId, newPlan) {
  const current = await getTenant(tenantId);
  const newLimits = getPlanLimits(newPlan);
  
  // Check if current usage exceeds new limits
  const violations = [];
  
  if (current.device_count > newLimits.max_devices) {
    violations.push({
      resource: 'devices',
      current: current.device_count,
      limit: newLimits.max_devices
    });
  }
  
  if (current.user_count > newLimits.max_users) {
    violations.push({
      resource: 'users',
      current: current.user_count,
      limit: newLimits.max_users
    });
  }
  
  return {
    allowed: violations.length === 0,
    violations: violations
  };
}
```

---

## 📈 Usage Analytics

### Metrics to Track

**Per Tenant:**
- Device count
- API requests/hour
- Data points written/day
- Storage used (InfluxDB)
- Active users
- ML model executions

**System-wide:**
- Total tenants by plan
- Churn rate
- Upgrade conversion rate
- Average devices per tenant

### Implementation
```javascript
// Daily cron job
async function calculateUsageMetrics() {
  const tenants = await getAllTenants();
  
  for (const tenant of tenants) {
    const metrics = {
      tenant_id: tenant.id,
      date: new Date(),
      devices_count: await countDevices(tenant.id),
      api_requests_24h: await getAPIRequests(tenant.id, '24h'),
      storage_mb: await getInfluxDBUsage(tenant.id),
      active_users_7d: await getActiveUsers(tenant.id, '7d')
    };
    
    await saveMetrics(metrics);
    
    // Check if approaching limits
    if (metrics.devices_count >= tenant.plan_limits.max_devices * 0.9) {
      await sendUpgradeNotification(tenant.id, 'devices');
    }
  }
}
```

---

## 🔔 Notification System

### Upgrade Triggers

**Automated in-app notifications when:**

1. Device limit reached (100%)
2. Device limit approaching (90%)
3. Data retention limiting access to old data
4. API rate limit exceeded
5. ML feature attempted but not available

### Implementation
```javascript
// Notification service
async function triggerUpgradeNotification(tenantId, trigger) {
  const notification = {
    tenant_id: tenantId,
    type: 'upgrade_suggestion',
    trigger: trigger,
    suggested_plan: getSuggestedPlan(trigger),
    created_at: new Date()
  };
  
  await saveNotification(notification);
  await sendEmail(notification);
  await createInAppAlert(notification);
}
```

---

## 🔒 White Label Requirements (Industrial Plan)

### Technical Implementation
```javascript
// Tenant-specific branding
{
  "white_label": {
    "enabled": true,
    "company_name": "Cliente Industrial SA",
    "logo_url": "https://cdn.easysmart.com.br/logos/cliente123.png",
    "primary_color": "#0066CC",
    "custom_domain": "iot.clienteindustrial.com.br",
    "email_from": "noreply@clienteindustrial.com.br"
  }
}

// Load branding dynamically
app.get('/', async (req, res) => {
  const tenant = await getTenantByDomain(req.hostname);
  
  res.render('dashboard', {
    branding: tenant.white_label || defaultBranding
  });
});
```

---

## 📋 Development Priorities

### Phase 1.3 (Current)
- ✅ Implement plan limits in middleware
- ✅ Data retention policies in InfluxDB
- ✅ Device provisioning flow

### Phase 1.4
- CSV export functionality
- API access control
- Usage analytics dashboard

### Phase 2.0
- Billing integration (Stripe/Pagar.me)
- Upgrade/downgrade flows
- ML feature flags

### Phase 2.1
- White label support
- Advanced analytics
- Custom domain routing

---

## 🎯 Conclusão

Este documento define os **requisitos técnicos derivados do modelo de negócio SaaS**. Toda feature implementada deve considerar:

1. ✅ **Plan-based access control**
2. ✅ **Resource limits enforcement**
3. ✅ **Usage tracking & analytics**
4. ✅ **Upgrade path implementation**
5. ✅ **Billing system integration**

---

**Documento mantido por:** Rodrigo S. Lange  
**Última atualização:** 15 Outubro 2025  
**Próxima revisão:** Após implementação de billing system
