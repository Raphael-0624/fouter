#!/bin/bash
# Fouter Services Startup Script

set -e

echo "Starting Fouter services..."

# Load environment variables
export $(cat /home/claudeuser/fouter-project/.env | grep -v '^#' | xargs)

# Start PostgreSQL
echo "Starting PostgreSQL..."
printf 'Fbt+0328' | sudo -S -p '' su - postgres -c "/usr/bin/pg_ctl -D /var/lib/pgsql/data start" 2>/dev/null || echo "PostgreSQL already running"

# Start Redis
echo "Starting Redis..."
redis-cli ping >/dev/null 2>&1 || redis-server --daemonize yes

# Set Python path
export PYTHONPATH=/home/claudeuser/fouter-project/services/auth-service:$PYTHONPATH

# Start Auth Service
echo "Starting Auth Service..."
pkill -f "uvicorn.*auth-service" 2>/dev/null || true
cd /home/claudeuser/fouter-project/services/auth-service
nohup /usr/bin/python3.8 -m uvicorn app.main:app --host 0.0.0.0 --port 8001 > /tmp/auth-service.log 2>&1 &
sleep 2

# Start Rate Limit Service
echo "Starting Rate Limit Service..."
pkill -f "uvicorn.*rate-limit" 2>/dev/null || true
cd /home/claudeuser/fouter-project/services/rate-limit-service
nohup /usr/bin/python3.8 -m uvicorn app.main:app --host 0.0.0.0 --port 8003 > /tmp/rate-limit-service.log 2>&1 &
sleep 2

# Start Admin Service
echo "Starting Admin Service..."
pkill -f "uvicorn.*admin-service" 2>/dev/null || true
cd /home/claudeuser/fouter-project/services/admin-service
nohup /usr/bin/python3.8 -m uvicorn app.main:app --host 0.0.0.0 --port 8004 > /tmp/admin-service.log 2>&1 &
sleep 2

# Start Proxy Service
echo "Starting Proxy Service..."
pkill -f "uvicorn.*proxy-service" 2>/dev/null || true
cd /home/claudeuser/fouter-project/services/proxy-service
nohup /usr/bin/python3.8 -m uvicorn app.main:app --host 0.0.0.0 --port 8002 > /tmp/proxy-service.log 2>&1 &
sleep 2

# Reload Nginx
echo "Reloading Nginx..."
printf 'Fbt+0328' | sudo -S -p '' nginx -s reload 2>/dev/null || printf 'Fbt+0328' | sudo -S -p '' nginx -c /etc/nginx/nginx.conf 2>/dev/null || true

echo ""
echo "=== Service Status ==="
curl -s http://localhost:8001/health && echo ""
curl -s http://localhost:8002/health && echo ""
curl -s http://localhost:8003/health && echo ""
curl -s http://localhost:8004/health && echo ""
echo ""
echo "Fouter is running at: http://8.147.68.240/fouter/"
echo ""
echo "Admin API Key: fk-JjTWGkCSsGyEgbdBIAszmRokT4ri7n47OYRgpdxnAdI"
