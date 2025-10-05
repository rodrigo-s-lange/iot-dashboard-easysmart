# IoT Dashboard - EasySmart

Multi-device IoT Dashboard with MQTT integration, JWT authentication, and real-time monitoring.

## Features

- 🔐 JWT Authentication with bcrypt
- 📡 MQTT multi-tenant topic structure
- 📊 Real-time data visualization (Chart.js)
- 💾 SQLite database for telemetry
- 🔌 WebSocket for live updates
- 🐳 Docker containerized
- ☁️ Cloudflare Tunnel integration

## Tech Stack

**Backend:**
- Node.js 20 LTS
- Express.js
- MQTT.js
- better-sqlite3
- jsonwebtoken + bcryptjs

**Frontend:**
- EJS templates
- Bootstrap 5
- Chart.js
- Vanilla JavaScript

## Project Structure


iot-dashboard/
├── config/          # Database and MQTT configuration
├── models/          # Data models (User, Device, SensorData)
├── controllers/     # Business logic
├── routes/          # API endpoints
├── middleware/      # Auth, rate limiting, error handling
├── services/        # MQTT service, external integrations
├── utils/           # Helper functions
├── public/          # Static assets (CSS, JS, images)
├── views/           # EJS templates
└── data/            # SQLite database

## Quick Start

Coming soon...

## License

MIT
