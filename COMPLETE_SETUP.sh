#!/bin/bash

# TEC LMS - COMPLETE SETUP & DEMO DATA SEEDING
# Run this AFTER SSH tunnel is open in another terminal
# Command to open tunnel first:
#   ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52
#   Password: en_&xdX#!N(^OqCQzc3RE0B)m6ogU!

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

cd /Users/chhinhsovath/Documents/GitHub/dgtech

echo -e "${BLUE}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  TEC LMS - COMPLETE AUTOMATED SETUP & SEEDING          ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Check SSH tunnel
echo -e "${YELLOW}[1/5] Checking SSH tunnel connection...${NC}"
if ! lsof -i :5433 >/dev/null 2>&1; then
    echo -e "${RED}❌ SSH tunnel not running on port 5433${NC}"
    echo ""
    echo -e "${YELLOW}Please open a NEW terminal and run:${NC}"
    echo -e "${BLUE}ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52${NC}"
    echo ""
    echo "Password: en_&xdX#!N(^OqCQzc3RE0B)m6ogU!"
    echo ""
    echo "Then come back and run this script again."
    exit 1
fi

# Test database connection
if ! psql -h localhost -p 5433 -U admin -d dtech -c "SELECT 1;" >/dev/null 2>&1; then
    echo -e "${RED}❌ Cannot connect to database${NC}"
    echo "Make sure the database 'dtech' exists and schema is created."
    echo ""
    echo "First create schema by running:"
    echo "psql -h localhost -p 5433 -U admin -d dtech < supabase/migrations/001_initial_schema.sql"
    exit 1
fi

echo -e "${GREEN}✅ SSH tunnel is running and database is connected!${NC}"
echo ""

# Step 2: Install npm dependencies
echo -e "${YELLOW}[2/5] Installing npm dependencies...${NC}"
npm install >/dev/null 2>&1
npm install pg >/dev/null 2>&1
echo -e "${GREEN}✅ Dependencies installed!${NC}"
echo ""

# Step 3: Seed demo data
echo -e "${YELLOW}[3/5] Seeding demo data (this may take a moment)...${NC}"
if psql -h localhost -p 5433 -U admin -d dtech < supabase/migrations/002_demo_data.sql >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Demo data seeded successfully!${NC}"
else
    echo -e "${RED}❌ Error seeding demo data${NC}"
    echo "Make sure database schema is created first."
    echo "Run: psql -h localhost -p 5433 -U admin -d dtech < supabase/migrations/001_initial_schema.sql"
    exit 1
fi
echo ""

# Step 4: Show database statistics
echo -e "${YELLOW}[4/5] Database Statistics${NC}"
psql -h localhost -p 5433 -U admin -d dtech << 'STATSEOF' 2>/dev/null
SELECT
  'Users' as type, (SELECT COUNT(*) FROM profiles)::text as count
UNION ALL
SELECT 'Courses', (SELECT COUNT(*) FROM courses)::text
UNION ALL
SELECT 'Students', (SELECT COUNT(*) FROM students)::text
UNION ALL
SELECT 'Enrollments', (SELECT COUNT(*) FROM enrollments)::text
UNION ALL
SELECT 'Academic Records', (SELECT COUNT(*) FROM academic_records)::text
UNION ALL
SELECT 'Attendance Records', (SELECT COUNT(*) FROM attendance)::text;
STATSEOF
echo ""

# Step 5: Start development server
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ SETUP COMPLETE!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}🧪 TEST ACCOUNTS (Password: password123):${NC}"
echo "  alice@test.com       (Student)  - GPA: 3.75"
echo "  bob@test.com         (Student)  - GPA: 3.45"
echo "  charlie@test.com     (Student)  - GPA: 3.65"
echo "  diana@test.com       (Student)  - GPA: 3.50"
echo "  teacher@test.com     (Teacher)  - Can view all students"
echo "  admin@test.com       (Admin)    - Full system access"
echo ""
echo -e "${YELLOW}⏳ Starting development server...${NC}"
echo -e "${BLUE}Open your browser: http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Keep the SSH tunnel terminal open!${NC}"
echo ""

npm run dev
