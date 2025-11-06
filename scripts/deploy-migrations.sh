#!/bin/bash

###############################################################################
# DGTech Teacher Modules Migration Deployment Script
#
# This script deploys the teacher modules migration (003_teacher_modules.sql)
# to the production or development PostgreSQL database.
#
# Usage:
#   ./scripts/deploy-migrations.sh [environment] [password]
#
# Arguments:
#   environment - 'dev' (localhost:5433) or 'prod' (157.10.73.52:5432)
#   password    - Database password (optional, will prompt if not provided)
#
# Examples:
#   ./scripts/deploy-migrations.sh dev
#   ./scripts/deploy-migrations.sh prod P@ssw0rd
#
###############################################################################

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-dev}"
DATABASE_PASSWORD="${2:-}"
MIGRATION_FILE="supabase/migrations/003_teacher_modules.sql"

# Set environment-specific variables
if [ "$ENVIRONMENT" = "dev" ]; then
    DB_HOST="localhost"
    DB_PORT="5433"
    DB_NAME="dtech"
    DB_USER="admin"
    SSH_REQUIRED=false
    echo -e "${BLUE}🔧 Development Mode (localhost:5433)${NC}"
elif [ "$ENVIRONMENT" = "prod" ]; then
    DB_HOST="157.10.73.52"
    DB_PORT="5433"  # Use SSH tunnel port
    DB_NAME="dtech"
    DB_USER="admin"
    SSH_REQUIRED=true
    SSH_HOST="ubuntu@157.10.73.52"
    SSH_PASSWORD="en_&xdX#!N(^OqCQzc3RE0B)m6ogU!"
    echo -e "${BLUE}🚀 Production Mode (via SSH tunnel)${NC}"
else
    echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
    echo "Usage: ./scripts/deploy-migrations.sh [dev|prod] [password]"
    exit 1
fi

# Verify migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Migration Deployment Plan${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Environment:      ${YELLOW}$ENVIRONMENT${NC}"
echo -e "Database Host:    ${YELLOW}$DB_HOST:$DB_PORT${NC}"
echo -e "Database Name:    ${YELLOW}$DB_NAME${NC}"
echo -e "Migration File:   ${YELLOW}$MIGRATION_FILE${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get database password if not provided
if [ -z "$DATABASE_PASSWORD" ]; then
    echo -e "${YELLOW}📝 Enter database password:${NC}"
    read -s DATABASE_PASSWORD
fi

# Function to execute migration
execute_migration() {
    echo ""
    echo -e "${BLUE}🔄 Deploying migration...${NC}"

    export PGPASSWORD="$DATABASE_PASSWORD"

    psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -f "$MIGRATION_FILE"

    unset PGPASSWORD
}

# Function to verify migration
verify_migration() {
    echo ""
    echo -e "${BLUE}✓ Verifying tables were created...${NC}"

    export PGPASSWORD="$DATABASE_PASSWORD"

    psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -c "SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name LIKE '%announcement%'
            OR table_name LIKE '%assessment%'
            OR table_name LIKE '%question%'
            OR table_name LIKE '%submission%'
            OR table_name LIKE '%grade%'
            ORDER BY table_name;"

    unset PGPASSWORD
}

# Main execution
echo ""
echo -e "${YELLOW}⚠️  Before proceeding:${NC}"
echo "  1. Ensure you have database backup"
echo "  2. Ensure no other migrations are running"
echo "  3. This migration is idempotent (safe to run multiple times)"
echo ""

read -p "Continue deployment? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Deployment cancelled.${NC}"
    exit 0
fi

# Execute migration
if execute_migration; then
    echo -e "${GREEN}✅ Migration deployed successfully!${NC}"
else
    echo -e "${RED}❌ Migration deployment failed!${NC}"
    echo -e "${RED}Please check the error messages above.${NC}"
    exit 1
fi

# Verify migration
echo ""
if verify_migration; then
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}✨ Migration deployment complete!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}📊 Tables created:${NC}"
    echo "  ✅ course_announcements"
    echo "  ✅ assessments"
    echo "  ✅ questions"
    echo "  ✅ question_options"
    echo "  ✅ submissions"
    echo "  ✅ submission_answers"
    echo "  ✅ grades"
    echo ""
    echo -e "${BLUE}🚀 Next steps:${NC}"
    echo "  1. Restart your development server: npm run dev"
    echo "  2. Test teacher modules in browser"
    echo "  3. Create sample assessments and submissions"
    echo "  4. Verify grading functionality"
    echo ""
else
    echo -e "${RED}⚠️  Verification failed${NC}"
    exit 1
fi
