# 🐳 Docker Deployment Guide - Bible Chatbot

Complete guide to deploy the Bible Chatbot using Docker and Docker Compose.

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Configuration](#configuration)
4. [Build & Run](#build--run)
5. [Troubleshooting](#troubleshooting)
6. [Production Deployment](#production-deployment)

---

## ✅ Prerequisites

### Required Software

- **Docker** (20.10+): [Install Docker](https://docs.docker.com/get-docker/)
- **Docker Compose** (2.0+): Usually included with Docker Desktop

### Verify Installation

```bash
docker --version
docker-compose --version
```

---

## 🚀 Quick Start (3 Steps)

### Step 1: Clone and Navigate

```bash
git clone <your-repo-url>
cd bible_chatbot
```

### Step 2: Configure Environment

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your credentials
# REQUIRED: Set these values
# - GROQ_API_KEY
# - ASTRADB_ENDPOINT
# - ASTRADB_APPLICATION_TOKEN
# OPTIONAL: Google OAuth
# - GOOGLE_CLIENT_ID
# - VITE_GOOGLE_CLIENT_ID
```

### Step 3: Run

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

**Your app is now running!**

- Frontend: http://localhost
- Backend API: http://localhost:8000
- Database: localhost:3306

---

## ⚙️ Configuration

### Environment Variables

Create `.env` file in project root:

```env
# Database
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=bible_chatbot
MYSQL_USER=bibleuser
MYSQL_PASSWORD=biblepass

# Backend
SECRET_KEY=your-super-secret-key-here
ALGORITHM=HS256

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# API Configuration
VITE_API_URL=http://localhost:8000

# External Services
ASTRADB_ENDPOINT=your-astradb-endpoint
ASTRADB_APPLICATION_TOKEN=your-astradb-token
GROQ_API_KEY=your-groq-api-key
LANGCHAIN_API_KEY=your-langchain-key  # Optional
```

### Important Notes

⚠️ **Security**: Change default passwords in production!  
⚠️ **API Keys**: Never commit `.env` file to git  
⚠️ **Database**: First run will initialize the database

---

## 🏗️ Build & Run

### Development Mode

```bash
# Build and start all services
docker-compose up -d

# Watch logs in real-time
docker-compose logs -f

# Watch specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database
```

### Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v
```

### Rebuild After Changes

```bash
# Rebuild all services
docker-compose build

# Rebuild specific service
docker-compose build backend

# Rebuild and restart
docker-compose up -d --build
```

---

## 📦 Docker Services

### 1. Database (MySQL)

```yaml
Service: database
Port: 3306
Volume: mysql_data
```

**Access Database:**

```bash
docker-compose exec database mysql -u bibleuser -p
```

### 2. Backend (FastAPI)

```yaml
Service: backend
Port: 8000
Health: http://localhost:8000/health
```

**View Backend Logs:**

```bash
docker-compose logs -f backend
```

**Access Backend Shell:**

```bash
docker-compose exec backend bash
```

### 3. Frontend (React + Nginx)

```yaml
Service: frontend
Port: 80
Health: http://localhost/
```

**Access Nginx Shell:**

```bash
docker-compose exec frontend sh
```

---

## 🔧 Common Commands

### Service Management

```bash
# Start services
docker-compose start

# Stop services
docker-compose stop

# Restart services
docker-compose restart

# Restart specific service
docker-compose restart backend

# View running containers
docker-compose ps

# View resource usage
docker stats
```

### Database Management

```bash
# Run migrations
docker-compose exec backend python -c "from database import Base, engine; Base.metadata.create_all(bind=engine)"

# Backup database
docker-compose exec database mysqldump -u bibleuser -p bible_chatbot > backup.sql

# Restore database
docker-compose exec -T database mysql -u bibleuser -p bible_chatbot < backup.sql

# Access MySQL CLI
docker-compose exec database mysql -u bibleuser -pbiblepass bible_chatbot
```

### Logs & Debugging

```bash
# View all logs
docker-compose logs

# Follow logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs database
```

---

## 🐛 Troubleshooting

### Database Connection Failed

**Problem:** Backend can't connect to database

**Solution:**

```bash
# Check database is running
docker-compose ps database

# Check database logs
docker-compose logs database

# Verify credentials in .env
cat .env | grep MYSQL

# Restart services
docker-compose restart
```

### Frontend Build Fails

**Problem:** Frontend container won't build

**Solution:**

```bash
# Check Node version (requires 18+)
docker run --rm node:20-alpine node --version

# Clean build
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

### Port Already in Use

**Problem:** `Port 80 is already allocated`

**Solution:**

```bash
# Option 1: Stop conflicting service
# Windows: Stop IIS or other web server
# Linux: sudo systemctl stop apache2/nginx

# Option 2: Change port in docker-compose.yml
# frontend:
#   ports:
#     - "8080:80"  # Use port 8080 instead
```

### Health Check Failing

**Problem:** Backend health check fails

**Solution:**

```bash
# Check if backend is running
docker-compose ps backend

# Test health endpoint manually
docker-compose exec backend curl http://localhost:8000/health

# Check environment variables
docker-compose exec backend env | grep DATABASE
```

### Permission Denied (Linux/Mac)

**Problem:** Volume mount permission issues

**Solution:**

```bash
# Fix permissions
sudo chown -R $USER:$USER .

# Or run with sudo
sudo docker-compose up -d
```

---

## 🚀 Production Deployment

### Production docker-compose.yml

Create `docker-compose.prod.yml`:

```yaml
version: "3.8"

services:
  database:
    image: mysql:8.0
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    networks:
      - bible-chatbot-network

  backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    restart: always
    environment:
      DATABASE_URL: mysql+pymysql://${MYSQL_USER}:${MYSQL_PASSWORD}@database:3306/${MYSQL_DATABASE}
      SECRET_KEY: ${SECRET_KEY}
      GOOGLE_CLIENT_ID: ${GOOGLE_CLIENT_ID}
      ASTRADB_ENDPOINT: ${ASTRADB_ENDPOINT}
      ASTRADB_APPLICATION_TOKEN: ${ASTRADB_APPLICATION_TOKEN}
      GROQ_API_KEY: ${GROQ_API_KEY}
    depends_on:
      - database
    networks:
      - bible-chatbot-network
    expose:
      - "8000"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        VITE_GOOGLE_CLIENT_ID: ${VITE_GOOGLE_CLIENT_ID}
        VITE_API_URL: https://api.yourdomain.com
    restart: always
    networks:
      - bible-chatbot-network
    expose:
      - "80"

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend
    networks:
      - bible-chatbot-network

volumes:
  mysql_data:

networks:
  bible-chatbot-network:
    driver: bridge
```

### Production Checklist

- [ ] Set strong passwords in `.env`
- [ ] Configure SSL certificates
- [ ] Set up domain DNS
- [ ] Enable HTTPS
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Enable monitoring (Prometheus/Grafana)
- [ ] Configure log rotation
- [ ] Set resource limits
- [ ] Enable auto-restart policies

### Security Best Practices

1. **Change Default Passwords**

   ```bash
   # Generate strong password
   openssl rand -base64 32
   ```

2. **Use Docker Secrets** (Docker Swarm)

   ```bash
   echo "mysecretpassword" | docker secret create db_password -
   ```

3. **Limit Resource Usage**

   ```yaml
   deploy:
     resources:
       limits:
         cpus: "0.5"
         memory: 512M
   ```

4. **Regular Updates**
   ```bash
   docker-compose pull
   docker-compose up -d
   ```

---

## 📊 Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:8000/health

# Frontend health
curl http://localhost/

# Database health
docker-compose exec database mysqladmin ping
```

### View Resource Usage

```bash
# All containers
docker stats

# Specific container
docker stats bible-chatbot-backend
```

### Log Monitoring

```bash
# Real-time logs
docker-compose logs -f --tail=100

# Export logs
docker-compose logs > logs.txt
```

---

## 🔄 Backup & Restore

### Backup

```bash
# Database backup
docker-compose exec database mysqldump -u bibleuser -p bible_chatbot > backup_$(date +%Y%m%d).sql

# Volume backup
docker run --rm -v bible_chatbot_mysql_data:/data -v $(pwd):/backup alpine tar czf /backup/mysql_backup.tar.gz /data
```

### Restore

```bash
# Restore database
docker-compose exec -T database mysql -u bibleuser -p bible_chatbot < backup_20231201.sql

# Restore volume
docker run --rm -v bible_chatbot_mysql_data:/data -v $(pwd):/backup alpine tar xzf /backup/mysql_backup.tar.gz -C /
```

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [FastAPI Docker Deployment](https://fastapi.tiangolo.com/deployment/docker/)
- [Nginx Docker Image](https://hub.docker.com/_/nginx)
- [MySQL Docker Image](https://hub.docker.com/_/mysql)

---

## 🎯 Quick Reference

| Action               | Command                              |
| -------------------- | ------------------------------------ |
| Start all services   | `docker-compose up -d`               |
| Stop all services    | `docker-compose down`                |
| View logs            | `docker-compose logs -f`             |
| Rebuild              | `docker-compose up -d --build`       |
| Access backend shell | `docker-compose exec backend bash`   |
| Access database      | `docker-compose exec database mysql` |
| Check status         | `docker-compose ps`                  |
| Remove everything    | `docker-compose down -v`             |
| View resource usage  | `docker stats`                       |
| Backend health       | `curl localhost:8000/health`         |

---

**Happy Dockerizing! 🐳**
