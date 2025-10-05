# 🖥️ Server Infrastructure - EasySmart IoT Ecosystem

> **Complete documentation of production server setup, services, and configurations**

⚠️ **Security Note**: This document contains NO passwords. Credentials are stored securely in local `.env` files and password managers.

---

## 📋 Table of Contents

- [Hardware Specifications](#hardware-specifications)
- [Operating System](#operating-system)
- [Network Configuration](#network-configuration)
- [Docker Services](#docker-services)
- [Native Services](#native-services)
- [Directory Structure](#directory-structure)
- [Access URLs](#access-urls)
- [Important Paths](#important-paths)
- [Service Management](#service-management)

---

## 💻 Hardware Specifications

### Server: `server.easysmart.com.br`

| Component | Specification |
|-----------|--------------|
| **Hostname** | `server` (mDNS: `server.local`) |
| **CPU** | Intel Core i5-750 (Lynnfield, 4 cores/4 threads, 45nm) |
| **RAM** | 8GB DDR3 |
| **Storage** | Samsung 850 EVO SSD (SATA III 6Gb/s) |
| **Motherboard** | ASUS P7H57D-V EVO |
| **PSU** | 750W 80+ Bronze PFC Active |
| **Mode** | Headless (no monitor/keyboard - SSH only) |

### BIOS Configuration
- **SATA Mode**: AHCI
- **Boot**: UEFI
- **Note**: SATA II port shows better performance than SATA III (hardware quirk)

### Performance Metrics
- **Idle Power**: ~120-140W
- **Load Power**: ~180-220W
- **Estimated Cost**: R$ 40-50/month (24/7 operation)
- **CPU Idle**: ~5-10%
- **CPU Load (with Dashboard)**: ~15-25%
- **RAM Usage**: ~3-4GB / 8GB
- **SSD**: TRIM enabled, SMART monitoring active

---

## 🐧 Operating System

### Ubuntu Server 24.04 LTS

| Parameter | Value |
|-----------|-------|
| **Hostname** | `server` |
| **Domain** | `easysmart.com.br` |
| **Timezone** | `America/Sao_Paulo` |
| **Kernel** | Linux 6.x (latest LTS) |
| **Filesystem** | ext4 with LVM |
| **User** | `rodrigo` (sudoer) |

### System Access
```bash
# Local network
ssh rodrigo@server.local
ssh rodrigo@192.168.X.X

# Credentials: [OMITTED - see local password manager]

🌐 Network Configuration
DNS & Domain

Domain: easysmart.com.br
DNS Provider: Cloudflare
Local mDNS: server.local

Cloudflare Tunnel (Zero Trust)
Tunnel Name: homeassistant.easysmart.com.br
Public Hostnames:
SubdomainLocal ServicePorthomeassistant.easysmart.com.brHome Assistant8123esphome.easysmart.com.brESPHome6052portainer.easysmart.com.brPortainer9000mqtt.easysmart.com.brMosquitto WebSocket9001devices.easysmart.com.brIoT Dashboard3000
Service: cloudflared.service (systemd)
Configuration: /etc/cloudflared/config.yml
Add new hostname:

Cloudflare Dashboard → Zero Trust → Access → Tunnels
Select tunnel → Configure → Public Hostname
Add subdomain + local service URL
Save (auto-reloads)


🐳 Docker Services
Main Stack: ~/docker/docker-compose.yml
ServiceContainerPortsStatusHome Assistanthomeassistant8123✅ RunningESPHomeesphome6052✅ RunningPortainerportainer9000, 9443✅ RunningWatchtowerwatchtower-✅ Running (auto-update)IoT Dashboardiot-dashboard3000🔄 In Development
Docker Compose Example (IoT Dashboard)
yaml# ~/docker/docker-compose.yml
services:
  iot-dashboard:
    build: ./iot-dashboard
    container_name: iot-dashboard
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - TZ=America/Sao_Paulo
    env_file:
      - ./iot-dashboard/.env
    volumes:
      - ./iot-dashboard/data:/app/data
    networks:
      - iot-network

networks:
  iot-network:
    driver: bridge
Useful Commands
bash# List running containers
docker ps

# View logs
docker logs -f iot-dashboard

# Restart service
docker restart iot-dashboard

# Update containers
cd ~/docker
docker compose pull
docker compose up -d

# Access container shell
docker exec -it iot-dashboard sh

⚙️ Native Services (Non-Docker)
Mosquitto MQTT Broker
Status: ✅ Running (systemd)
Ports:

1883 - MQTT protocol
9001 - WebSocket

Configuration: /etc/mosquitto/mosquitto.conf
conflistener 1883
protocol mqtt

listener 9001
protocol websockets

allow_anonymous false
password_file /etc/mosquitto/passwd

persistence true
persistence_location /var/lib/mosquitto/
Users:

mosquitto (admin)
devices (IoT devices)

Password file: /etc/mosquitto/passwd (hashed with mosquitto_passwd)
Management:
bash# Status
sudo systemctl status mosquitto

# Restart
sudo systemctl restart mosquitto

# View ports
sudo ss -tlnp | grep -E '1883|9001'

# Test publish
mosquitto_pub -h localhost -u devices -P [PASSWORD] -t test/topic -m "hello"

# Test subscribe
mosquitto_sub -h localhost -u devices -P [PASSWORD] -t test/topic

Cloudflare Tunnel (cloudflared)
Status: ✅ Running (systemd)
Service file: /etc/systemd/system/cloudflared.service
Configuration: /etc/cloudflared/config.yml
Management:
bash# Status
sudo systemctl status cloudflared

# Restart
sudo systemctl restart cloudflared

# Logs
sudo journalctl -u cloudflared -f

📁 Directory Structure
Project Root: /home/rodrigo/docker/
/home/rodrigo/docker/
├── docker-compose.yml          # Main orchestration file
├── homeassistant/
│   └── config/                 # Home Assistant configs
├── esphome/
│   └── config/                 # ESPHome device configs
├── portainer/
│   └── data/                   # Portainer data
└── iot-dashboard/              # 🆕 IoT Dashboard (this project)
    ├── .git/
    ├── .env                    # Environment variables (NOT in Git)
    ├── .env.example            # Template (IN Git)
    ├── config/
    ├── models/
    ├── controllers/
    ├── routes/
    ├── middleware/
    ├── services/
    ├── utils/
    ├── public/
    │   ├── css/
    │   ├── js/
    │   └── assets/
    ├── views/
    ├── data/
    │   └── iot.db              # SQLite database
    ├── docs/
    │   ├── AI_CONTEXT.md
    │   ├── AI_PROMPTS.md
    │   └── SERVER_INFRASTRUCTURE.md
    ├── package.json
    ├── Dockerfile
    └── README.md

🔗 Access URLs
Local Network Access
Home Assistant:  http://server:8123
                 http://server.local:8123

ESPHome:         http://server:6052

Portainer:       http://server:9000

IoT Dashboard:   http://server:3000

MQTT:            mqtt://server:1883
MQTT WebSocket:  ws://server:9001
Remote Access (via Cloudflare Tunnel)
Home Assistant:  https://homeassistant.easysmart.com.br
ESPHome:         https://esphome.easysmart.com.br
Portainer:       https://portainer.easysmart.com.br
IoT Dashboard:   https://devices.easysmart.com.br
MQTT WebSocket:  wss://mqtt.easysmart.com.br:443

📂 Important Paths
Home Assistant

Config: ~/docker/homeassistant/config/configuration.yaml
Automations: ~/docker/homeassistant/config/automations.yaml
Backups: Created via HA UI → Settings → System → Backups

Trusted Proxies (for Cloudflare Tunnel):
yaml# configuration.yaml
http:
  use_x_forwarded_for: true
  trusted_proxies:
    - 172.16.0.0/12
    - 192.168.0.0/16
    - 10.0.0.0/8
    - 127.0.0.1
    - ::1

Mosquitto MQTT

Config: /etc/mosquitto/mosquitto.conf
Password file: /etc/mosquitto/passwd
Persistence: /var/lib/mosquitto/


IoT Dashboard

Project root: ~/docker/iot-dashboard/
Environment: ~/docker/iot-dashboard/.env
Database: ~/docker/iot-dashboard/data/iot.db
Logs: docker logs iot-dashboard


🔧 Service Management
Systemd Services
bash# Mosquitto MQTT
sudo systemctl status mosquitto
sudo systemctl restart mosquitto
sudo systemctl enable mosquitto

# Cloudflare Tunnel
sudo systemctl status cloudflared
sudo systemctl restart cloudflared
sudo systemctl enable cloudflared

# Docker
sudo systemctl status docker
sudo systemctl restart docker
Docker Services
bash# View all services
cd ~/docker
docker compose ps

# Restart specific service
docker compose restart iot-dashboard

# View logs
docker compose logs -f iot-dashboard

# Rebuild and restart
docker compose up -d --build iot-dashboard

💾 Backup Strategy
Home Assistant
bash# Via UI (recommended)
Settings → System → Backups → Create Backup

# Via CLI
docker exec homeassistant ha backups new --name "backup-$(date +%Y%m%d)"
IoT Dashboard
bash# Backup SQLite database
docker exec iot-dashboard cp /app/data/iot.db /app/data/iot.db.backup
docker cp iot-dashboard:/app/data/iot.db.backup ~/backups/

# Full backup (configs + database)
tar -czf ~/backups/iot-dashboard-$(date +%Y%m%d).tar.gz ~/docker/iot-dashboard/
Mosquitto
bash# Backup password file
sudo cp /etc/mosquitto/passwd /etc/mosquitto/passwd.backup

# Backup config
sudo cp /etc/mosquitto/mosquitto.conf ~/backups/mosquitto.conf.backup

🛠️ Troubleshooting
Home Assistant not loading via Cloudflare (400/502)

Check trusted_proxies in configuration.yaml
Restart HA container: docker restart homeassistant
Check Cloudflare Tunnel status: sudo systemctl status cloudflared

MQTT not connecting
bash# 1. Check service
sudo systemctl status mosquitto

# 2. Check ports
sudo ss -tlnp | grep 1883

# 3. Test connection
mosquitto_pub -h localhost -u devices -P [PASSWORD] -t test -m "test"

# 4. Check logs
sudo journalctl -u mosquitto -n 50
Docker containers not starting
bash# Check Docker service
sudo systemctl status docker

# View container logs
docker logs container-name

# Check resources
docker stats

# Restart Docker
sudo systemctl restart docker

🔐 Security Notes
Credentials Management

⚠️ NEVER commit .env files to Git
✅ Use .env.example as template (committed)
✅ Store real credentials in password manager
✅ Use strong, unique passwords for each service

Firewall (Future Enhancement)
bash# Install UFW
sudo apt install ufw

# Allow SSH
sudo ufw allow 22/tcp

# Allow specific services (local network only)
sudo ufw allow from 192.168.0.0/16 to any port 8123
sudo ufw allow from 192.168.0.0/16 to any port 1883

# Enable
sudo ufw enable

📊 Monitoring (Future)
Planned integrations:

 Prometheus + Grafana for metrics
 Uptime monitoring
 Disk space alerts
 Temperature monitoring


📚 Related Documentation

AI_CONTEXT.md - Project vision and architecture
AI_PROMPTS.md - AI assistant guidelines
ARCHITECTURE.md - System design (future)
DEVELOPMENT.md - Developer workflow (future)


Document Version: 1.0.0
Last Updated: 2025-10-05
Maintained by: Rodrigo S. Lange
Built with ❤️ for the EasySmart IoT Ecosystem
