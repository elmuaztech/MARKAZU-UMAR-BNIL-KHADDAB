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

# 3. Pull latest code & rebuild containers
echo "Rebuilding MSSMS containers..."
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# 4. Synchronize Database Schema (Prisma Db Push) & Seed Defaults
echo "Synchronizing PostgreSQL database schema & seeding records..."
docker-compose exec -T app npx prisma db push --accept-data-loss
docker-compose exec -T app npx prisma db seed

echo "=========================================================="
echo " MSSMS Successfully Deployed on Hostinger VPS! "
echo "=========================================================="
