#!/bin/bash

# TEC LMS - Complete Setup and Development Script
# This script:
# 1. Checks SSH tunnel
# 2. Installs dependencies
# 3. Seeds demo data
# 4. Runs development server

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  TEC LMS - Complete Setup & Development Server${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Check if SSH tunnel is running
echo -e "${YELLOW}[1/4] Checking SSH tunnel...${NC}"
if lsof -i :5433 >/dev/null 2>&1; then
    echo -e "${GREEN}✓ SSH tunnel is already running on port 5433${NC}"
else
    echo -e "${RED}✗ SSH tunnel is NOT running on port 5433${NC}"
    echo ""
    echo -e "${YELLOW}Please start SSH tunnel in another terminal:${NC}"
    echo -e "${BLUE}  ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52${NC}"
    echo ""
    echo "Waiting 5 seconds for you to start tunnel..."
    sleep 5

    if ! lsof -i :5433 >/dev/null 2>&1; then
        echo -e "${RED}✗ SSH tunnel still not running. Exiting.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ SSH tunnel detected!${NC}"
fi
echo ""

# Step 2: Test database connection
echo -e "${YELLOW}[2/4] Testing database connection...${NC}"
if psql -h localhost -p 5433 -U admin -d dtech -c "SELECT 1;" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}✗ Cannot connect to database${NC}"
    echo "Make sure SSH tunnel is running and database exists"
    exit 1
fi
echo ""

# Step 3: Install dependencies
echo -e "${YELLOW}[3/4] Installing dependencies...${NC}"
if ! npm list pg >/dev/null 2>&1; then
    echo "Installing pg package..."
    npm install pg --save >/dev/null 2>&1
    echo -e "${GREEN}✓ Dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Dependencies already installed${NC}"
fi
echo ""

# Step 4: Seed demo data
echo -e "${YELLOW}[4/4] Seeding demo data...${NC}"
echo "Running: psql -h localhost -p 5433 -U admin -d dtech < supabase/migrations/002_demo_data.sql"
echo ""

if psql -h localhost -p 5433 -U admin -d dtech < supabase/migrations/002_demo_data.sql 2>/dev/null; then
    echo ""
    echo -e "${GREEN}✓ Demo data seeded successfully!${NC}"

    # Show statistics
    echo ""
    echo -e "${BLUE}Database Statistics:${NC}"
    psql -h localhost -p 5433 -U admin -d dtech << 'EOF'
SELECT
    (SELECT COUNT(*) FROM institutions) as institutions,
    (SELECT COUNT(*) FROM profiles) as users,
    (SELECT COUNT(*) FROM courses) as courses,
    (SELECT COUNT(*) FROM students) as students,
    (SELECT COUNT(*) FROM enrollments) as enrollments,
    (SELECT COUNT(*) FROM academic_records) as academic_records,
    (SELECT COUNT(*) FROM attendance) as attendance;
EOF
else
    echo -e "${RED}✗ Error seeding demo data${NC}"
    echo "Check if database schema exists (run 001_initial_schema.sql first)"
    exit 1
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ SETUP COMPLETE!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Test Accounts:${NC}"
echo "  alice@test.com       (Student)  - GPA: 3.75"
echo "  bob@test.com         (Student)  - GPA: 3.45"
echo "  charlie@test.com     (Student)  - GPA: 3.65"
echo "  diana@test.com       (Student)  - GPA: 3.50"
echo "  teacher@test.com     (Teacher)  - Can view all students"
echo "  admin@test.com       (Admin)    - Full system access"
echo ""
echo -e "${BLUE}Password for all accounts:${NC}"
echo "  password123"
echo ""
echo -e "${YELLOW}Starting development server...${NC}"
echo -e "${BLUE}Open your browser at: http://localhost:3000${NC}"
echo ""

# Start development server
npm run dev
