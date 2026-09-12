#!/bin/bash

# Automated Hostinger VPS Deployment Script for Markazu Umar School Management System
# Target OS: Ubuntu 22.04 LTS / Hostinger KVM 1

echo "=========================================================="
echo " Starting MSSMS Hostinger VPS Deployment Sequence "
echo "=========================================================="

# 1. Update packages
sudo apt update && sudo apt upgrade -y

# 2. Install Docker & Docker Compose if missing
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
fi

# 3. Detect docker compose command
if docker compose version &> /dev/null; then
    COMPOSE="docker compose"
else
    COMPOSE="docker-compose"
fi

# 4. Pull latest code & rebuild containers
echo "Rebuilding MSSMS containers using $COMPOSE..."
$COMPOSE build
$COMPOSE up -d --remove-orphans

# 5. Synchronize Database Schema Safely (Prisma Db Push Without Data Loss) & Backfill
echo "Synchronizing PostgreSQL database schema safely without data loss..."
$COMPOSE exec -T app npx prisma@5 db push --skip-generate
cat prisma/backfill.sql | $COMPOSE exec -T postgres psql -U mssms_user -d mssms_db

# 6. Safely prune unused builder cache & dangling images
echo "Pruning unused builder cache & dangling images..."
docker builder prune -f
docker image prune -f

echo "=========================================================="
echo " MSSMS Successfully Deployed on Hostinger VPS! "
echo "=========================================================="
