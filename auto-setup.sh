#!/bin/bash

# TEC LMS - Automated Full Setup
# This does everything for you:
# 1. Checks SSH tunnel
# 2. Installs dependencies
# 3. Seeds demo data
# 4. Starts dev server

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}╔═══════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   TEC LMS - COMPLETE AUTOMATED SETUP                 ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════╝${NC}"
echo ""

# Check SSH tunnel
echo -e "${YELLOW}⏳ Checking SSH tunnel...${NC}"
for i in {1..5}; do
    if lsof -i :5433 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ SSH tunnel is running!${NC}"
        break
    fi
    if [ $i -eq 5 ]; then
        echo -e "${RED}❌ SSH tunnel NOT running on port 5433${NC}"
        echo ""
        echo -e "${YELLOW}Please open a new terminal and run:${NC}"
        echo -e "${BLUE}ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52${NC}"
        echo ""
        echo "Password: en_&xdX#!N(^OqCQzc3RE0B)m6ogU!"
        echo ""
        echo "Then come back here and run this script again."
        exit 1
    fi
    echo "Waiting for tunnel... ($i/5)"
    sleep 1
done

echo ""
echo -e "${YELLOW}✅ Testing database connection...${NC}"
if psql -h localhost -p 5433 -U admin -d dtech -c "SELECT 1;" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connected!${NC}"
else
    echo -e "${RED}❌ Cannot connect to database${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}⏳ Installing npm dependencies...${NC}"
npm install >/dev/null 2>&1
npm install pg >/dev/null 2>&1
echo -e "${GREEN}✅ Dependencies installed!${NC}"

echo ""
echo -e "${YELLOW}⏳ Seeding demo data (this may take a moment)...${NC}"
if psql -h localhost -p 5433 -U admin -d dtech < supabase/migrations/002_demo_data.sql >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Demo data seeded!${NC}"
else
    echo -e "${RED}❌ Error seeding demo data${NC}"
    echo "Make sure schema was created first (001_initial_schema.sql)"
    exit 1
fi

echo ""
echo -e "${BLUE}📊 Database Statistics:${NC}"
psql -h localhost -p 5433 -U admin -d dtech << 'EOF' 2>/dev/null
SELECT
  (SELECT COUNT(*) FROM profiles) as users,
  (SELECT COUNT(*) FROM courses) as courses,
  (SELECT COUNT(*) FROM students) as students,
  (SELECT COUNT(*) FROM enrollments) as enrollments,
  (SELECT COUNT(*) FROM attendance) as attendance;
EOF

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ SETUP COMPLETE!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}🧪 Test Accounts (Password: password123):${NC}"
echo "  alice@test.com       (Student)  - GPA: 3.75"
echo "  bob@test.com         (Student)  - GPA: 3.45"
echo "  charlie@test.com     (Student)  - GPA: 3.65"
echo "  diana@test.com       (Student)  - GPA: 3.50"
echo "  teacher@test.com     (Teacher)"
echo "  admin@test.com       (Admin)"
echo ""
echo -e "${BLUE}🌐 Starting development server...${NC}"
echo -e "${YELLOW}Open your browser: ${NC}${BLUE}http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}⚠️  Keep the SSH tunnel window open! Do not close it!${NC}"
echo ""

npm run dev
