# 🐳 Docker Quick Start - Bible Chatbot

Get your Bible Chatbot running in Docker in **less than 5 minutes**!

## ⚡ Super Quick Start

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit .env and add your API keys
# Required: GROQ_API_KEY, ASTRADB_ENDPOINT, ASTRADB_APPLICATION_TOKEN

# 3. Run everything
docker-compose up -d

# 4. Access the app
# Frontend: http://localhost
# Backend: http://localhost:8000
```

**That's it!** 🎉

---

## 📦 What You Get

| Service  | Port | URL                   | Description       |
| -------- | ---- | --------------------- | ----------------- |
| Frontend | 80   | http://localhost      | React app (Nginx) |
| Backend  | 8000 | http://localhost:8000 | FastAPI           |
| Database | 3306 | localhost:3306        | MySQL 8.0         |

---

## 🔑 Required Configuration

Edit `.env` file with these **minimum required** values:

```env
# External Services (REQUIRED)
GROQ_API_KEY=your-groq-api-key-here
ASTRADB_ENDPOINT=your-astradb-endpoint
ASTRADB_APPLICATION_TOKEN=your-astradb-token

# Database (can keep defaults for local dev)
MYSQL_ROOT_PASSWORD=rootpassword
MYSQL_DATABASE=bible_chatbot
MYSQL_USER=bibleuser
MYSQL_PASSWORD=biblepass

# Backend (can keep defaults for local dev)
SECRET_KEY=your-super-secret-key-here
```

### Optional (for Google OAuth):

```env
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

---

## 🎯 Common Commands

### Using Docker Compose:

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild and restart
docker-compose up -d --build

# Check status
docker-compose ps
```

### Using Makefile (easier):

```bash
# First time setup
make install

# Start services
make up

# Stop services
make down

# View logs
make logs

# Rebuild
make rebuild

# Check health
make health

# See all commands
make help
```

---

## 🔍 Verify Everything Works

```bash
# Check all services are running
docker-compose ps

# Should show 3 services: frontend, backend, database

# Test backend
curl http://localhost:8000/health
# Should return: {"status":"healthy","service":"bible-chatbot-backend"}

# Test frontend
curl http://localhost/
# Should return HTML

# Test database
docker-compose exec database mysql -u bibleuser -pbiblepass -e "SELECT 1"
# Should return: 1
```

---

## 🐛 Troubleshooting

### Services won't start?

```bash
# Check logs
docker-compose logs

# Check specific service
docker-compose logs backend
docker-compose logs frontend
docker-compose logs database
```

### Port 80 already in use?

```bash
# Option 1: Stop conflicting service
# Windows: Stop IIS
# Linux: sudo systemctl stop apache2

# Option 2: Use different port
# Edit docker-compose.yml:
# frontend:
#   ports:
#     - "8080:80"
```

### Database connection errors?

```bash
# Wait for database to be ready (takes ~30 seconds on first run)
docker-compose logs database

# Restart services
docker-compose restart
```

### Need to reset everything?

```bash
# ⚠️ WARNING: Deletes all data
docker-compose down -v
docker-compose up -d
```

---

## 📊 Monitor Resources

```bash
# View resource usage
docker stats

# View detailed logs
docker-compose logs -f --tail=100
```

---

## 🚀 Next Steps

1. **First Run**: Create an account at http://localhost/signin
2. **Test Chat**: Start a conversation in English or Telugu
3. **Configure OAuth**: Follow `QUICK_START_OAUTH.md` for Google Sign-In
4. **Production**: See `DOCKER_GUIDE.md` for production deployment

---

## 📚 Documentation

- **Complete Guide**: `DOCKER_GUIDE.md`
- **Google OAuth**: `QUICK_START_OAUTH.md`
- **AWS Deployment**: `AWS_DEPLOYMENT_GUIDE.md`
- **Cost Analysis**: `AWS_COST_COMPARISON.md`

---

## 🎯 Architecture

```
┌─────────────────────────────────────────┐
│         http://localhost                │
│              Frontend                   │
│         (React + Nginx)                 │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│      http://localhost:8000              │
│            Backend                      │
│           (FastAPI)                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│       localhost:3306                    │
│          Database                       │
│         (MySQL 8.0)                     │
└─────────────────────────────────────────┘
```

---

## 💡 Pro Tips

1. **Makefile Commands**: Use `make help` to see all available commands
2. **Hot Reload**: Code changes require rebuild: `make rebuild`
3. **Logs**: Always check logs if something fails: `make logs`
4. **Clean Start**: `docker-compose down -v && docker-compose up -d`
5. **Backup**: `make backup` creates database backups
6. **Performance**: Give Docker at least 4GB RAM in Docker Desktop settings

---

**Need Help?** Check `DOCKER_GUIDE.md` for detailed documentation.

Happy Coding! 🚀
