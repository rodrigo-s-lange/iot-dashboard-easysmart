const mqtt = require('mqtt');
const mqttConfig = require('../config/mqtt');

class MqttService {
  constructor() {
    this.client = null;
    this.subscriptions = new Map();
  }

  connect() {
    const url = `mqtt://${mqttConfig.host}:${mqttConfig.port}`;
    
    this.client = mqtt.connect(url, {
      username: mqttConfig.username,
      password: mqttConfig.password,
      reconnectPeriod: mqttConfig.reconnectPeriod,
      connectTimeout: mqttConfig.connectTimeout
    });

    this.client.on('connect', () => {
      console.log('✅ MQTT connected');
    });

    this.client.on('error', (err) => {
      console.error('❌ MQTT error:', err.message);
    });

    this.client.on('offline', () => {
      console.log('⚠️ MQTT offline');
    });

    this.client.on('reconnect', () => {
      console.log('🔄 MQTT reconnecting...');
    });

    this.client.on('message', (topic, message) => {
      this.handleMessage(topic, message.toString());
    });
  }

  subscribe(topic, callback) {
    if (!this.client) {
      throw new Error('MQTT client not connected');
    }

    this.client.subscribe(topic, (err) => {
      if (err) {
        console.error(`Failed to subscribe to ${topic}:`, err);
      } else {
        console.log(`📡 Subscribed to: ${topic}`);
        this.subscriptions.set(topic, callback);
      }
    });
  }

  publish(topic, message, options = {}) {
    if (!this.client) {
      throw new Error('MQTT client not connected');
    }

    this.client.publish(topic, message, options, (err) => {
      if (err) {
        console.error(`Failed to publish to ${topic}:`, err);
      }
    });
  }

  handleMessage(topic, message) {
    for (const [pattern, callback] of this.subscriptions) {
      if (this.matchTopic(pattern, topic)) {
        callback(topic, message);
      }
    }
  }

  matchTopic(pattern, topic) {
    const patternParts = pattern.split('/');
    const topicParts = topic.split('/');

    if (patternParts.length > topicParts.length) return false;

    for (let i = 0; i < patternParts.length; i++) {
      if (patternParts[i] === '#') return true;
      if (patternParts[i] === '+') continue;
      if (patternParts[i] !== topicParts[i]) return false;
    }

    return patternParts.length === topicParts.length;
  }

  disconnect() {
    if (this.client) {
      this.client.end();
      console.log('🔌 MQTT disconnected');
    }
  }
}

module.exports = new MqttService();
