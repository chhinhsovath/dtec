#!/bin/bash

# Setup Demo Users for DGTech LMS
# This script establishes SSH tunnel and creates demo users

set -e

echo "🚀 Starting Demo Users Setup..."
echo ""

# Step 1: Start SSH Tunnel in background
echo "Step 1: Establishing SSH tunnel to database server..."
ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52 -N &
SSH_PID=$!
echo "✅ SSH tunnel started (PID: $SSH_PID)"

# Step 2: Wait for tunnel to be ready
echo ""
echo "Step 2: Waiting for tunnel to be ready..."
sleep 3

# Step 3: Test connection
echo ""
echo "Step 3: Testing database connection..."
if PGPASSWORD='P@ssw0rd' psql -h localhost -p 5433 -U admin -d dtech -c "SELECT NOW();" > /dev/null 2>&1; then
  echo "✅ Database connection successful"
else
  echo "❌ Database connection failed"
  kill $SSH_PID
  exit 1
fi

# Step 4: Create demo users
echo ""
echo "Step 4: Creating demo users..."
if PGPASSWORD='P@ssw0rd' psql -h localhost -p 5433 -U admin -d dtech -f scripts/create-demo-users.sql; then
  echo "✅ Demo users created successfully"
else
  echo "❌ Failed to create demo users"
  kill $SSH_PID
  exit 1
fi

# Step 5: Verify users
echo ""
echo "Step 5: Verifying demo users..."
PGPASSWORD='P@ssw0rd' psql -h localhost -p 5433 -U admin -d dtech -c "SELECT email, role FROM profiles WHERE email LIKE '%demo%';"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Demo users created:"
echo "  - student@demo.com (role: student)"
echo "  - teacher@demo.com (role: teacher)"
echo "  - admin@demo.com (role: admin)"
echo "  - parent@demo.com (role: parent)"
echo ""
echo "Password for all: demo@123"
echo ""
echo "Login at: http://localhost:3002/auth/login"
echo ""

# Keep tunnel open for a bit
echo "Keeping SSH tunnel open for 60 seconds..."
sleep 60

# Cleanup
echo ""
echo "Closing SSH tunnel..."
kill $SSH_PID
echo "✅ Tunnel closed. Setup complete!"
