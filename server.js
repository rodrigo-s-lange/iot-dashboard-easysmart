require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const mqttService = require('./services/mqttService');
const authRoutes = require('./routes/auth');
const deviceRoutes = require('./routes/devices');
const authenticate = require('./middleware/authMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static('public'));

// View engine
app.set('view engine', 'ejs');
app.set('views', './views');

// Connect to MQTT broker
mqttService.connect();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);

// Protected route example
app.get('/api/protected', authenticate, (req, res) => {
  res.json({ message: 'Access granted', user: req.user });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    mqtt: mqttService.client?.connected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString() 
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  mqttService.disconnect();
  process.exit(0);
});

module.exports = app;

// ---- Auto-mounted web routes (added by assistant) ----
try {
  const webRoutes = require('./routes/web');
  if (webRoutes) app.use('/', webRoutes);
} catch (err) {
  console.error('Warning: failed adding web routes:', err.message);
}
// -----------------------------------------------------
