#!/bin/bash

# TEC LMS - SSH Tunnel Setup Script
# This script helps establish an SSH tunnel to the development server
# Author: Development Team
# Date: November 2024

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_IP="157.10.73.52"
SERVER_USER="ubuntu"
LOCAL_PORT="5433"
REMOTE_PORT="5432"
TUNNEL_NAME="dtech-db-tunnel"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  TEC LMS - Database SSH Tunnel Setup${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Check if SSH is available
echo -e "${YELLOW}[1/4] Checking SSH availability...${NC}"
if ! command -v ssh &> /dev/null; then
    echo -e "${RED}❌ SSH is not installed. Please install OpenSSH.${NC}"
    exit 1
fi
echo -e "${GREEN}✅ SSH is available${NC}"
echo ""

# Step 2: Check if port 5433 is available
echo -e "${YELLOW}[2/4] Checking if port ${LOCAL_PORT} is available...${NC}"
if lsof -Pi :${LOCAL_PORT} -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port ${LOCAL_PORT} is already in use${NC}"
    echo "   Try killing existing tunnel with: lsof -ti:${LOCAL_PORT} | xargs kill -9"
    read -p "   Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ Port ${LOCAL_PORT} is available${NC}"
fi
echo ""

# Step 3: Test SSH connection
echo -e "${YELLOW}[3/4] Testing SSH connection to ${SERVER_IP}...${NC}"
if ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new "${SERVER_USER}@${SERVER_IP}" "echo 'SSH connection successful'" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ SSH connection successful${NC}"
else
    echo -e "${RED}❌ Cannot connect to SSH server${NC}"
    echo "   Server: ${SERVER_IP}"
    echo "   User: ${SERVER_USER}"
    echo "   Please verify credentials and firewall settings"
    exit 1
fi
echo ""

# Step 4: Create and test tunnel
echo -e "${YELLOW}[4/4] Establishing SSH tunnel...${NC}"
echo -e "   Local Port: ${LOCAL_PORT}"
echo -e "   Remote: ${SERVER_IP}:${REMOTE_PORT}"
echo ""

# Create the SSH tunnel
echo -e "${BLUE}Creating tunnel: ssh -L ${LOCAL_PORT}:${SERVER_IP}:${REMOTE_PORT} ${SERVER_USER}@${SERVER_IP}${NC}"
echo ""
echo -e "${YELLOW}Tunnel is now active!${NC}"
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ SSH Tunnel Setup Complete${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo "Database Connection Details:"
echo "  Host: localhost"
echo "  Port: ${LOCAL_PORT}"
echo "  Database: dtech"
echo "  User: admin"
echo ""
echo "Next steps:"
echo "  1. Keep this terminal window open (tunnel must stay active)"
echo "  2. In a new terminal, configure .env.local with:"
echo "     DB_HOST=localhost"
echo "     DB_PORT=${LOCAL_PORT}"
echo "  3. Run: npm run dev"
echo ""
echo "To test the connection:"
echo "  psql -h localhost -p ${LOCAL_PORT} -U admin -d dtech"
echo ""
echo "Press Ctrl+C to close the tunnel"
echo ""

# Keep the tunnel open
ssh -L ${LOCAL_PORT}:${SERVER_IP}:${REMOTE_PORT} ${SERVER_USER}@${SERVER_IP}
