require('dotenv').config();

module.exports = {
  host: process.env.MQTT_HOST || 'localhost',
  port: parseInt(process.env.MQTT_PORT) || 1883,
  username: process.env.MQTT_USERNAME || 'devices',
  password: process.env.MQTT_PASSWORD || '0039',
  reconnectPeriod: 5000,
  connectTimeout: 30000
};
