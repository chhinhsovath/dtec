# TEC LMS - Server Setup & Configuration Guide

This guide covers connecting the TEC LMS project to your development server and PostgreSQL database.

---

## 🖥️ Server Information

### Development Server Details
```
Server IP: 157.10.73.52
SSH User: ubuntu
SSH Password: en_&xdX#!N(^OqCQzc3RE0B)m6ogU!
Port: 22 (default)
```

### Database Configuration
```
Database Host: 157.10.73.52
Database Port: 5432
Database Name: dtech
Database User: admin
Database Password: P@ssw0rd
```

---

## ⚠️ IMPORTANT SECURITY NOTES

### Before Production
🔴 **CRITICAL**: The credentials above are for DEVELOPMENT ONLY. Before deploying to production:

1. **Change all passwords** - These are development credentials
2. **Use SSH keys** instead of password authentication
3. **Implement firewall rules** - Restrict database access to application server only
4. **Enable SSL/TLS** for PostgreSQL connections
5. **Create application-specific database user** with minimal permissions
6. **Backup credentials** - Store securely (not in git)
7. **Rotate credentials** regularly

### Never Commit Secrets to Git
```bash
# .env.local should NEVER be committed
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
```

---

## 🔌 Connection Methods

### Option 1: SSH Tunnel (Recommended for Development)

SSH tunneling secures the connection and works through firewalls.

#### Step 1: Create SSH Tunnel

```bash
# Keep this terminal open
ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52
# Enter password: en_&xdX#!N(^OqCQzc3RE0B)m6ogU!

# This creates a local port 5433 pointing to remote port 5432
```

#### Step 2: Configure Application for Tunneled Connection

In `.env.local`:
```env
# SSH Tunnel Connection
DB_HOST=localhost
DB_PORT=5433
DB_NAME=dtech
DB_USER=admin
DB_PASSWORD=P@ssw0rd
DB_SSL=false
```

#### Step 3: Test Connection

```bash
# Test with psql (if installed)
psql -h localhost -p 5433 -U admin -d dtech -c "SELECT version();"

# Or use any database tool with these settings
```

---

### Option 2: Direct PostgreSQL Connection (Less Secure)

Only use if firewall allows direct database access.

```env
DB_HOST=157.10.73.52
DB_PORT=5432
DB_NAME=dtech
DB_USER=admin
DB_PASSWORD=P@ssw0rd
DB_SSL=require
```

⚠️ **Risk**: Directly exposing database to internet. Use SSH tunnel instead.

---

## 📋 Setting Up Your Local Development Environment

### Step 1: Install PostgreSQL Tools (macOS)

```bash
# Using Homebrew
brew install postgresql

# This gives you psql and other utilities
```

### Step 2: Update .env.local File

Create `.env.local` in project root:

```env
# ============================================
# DEVELOPMENT - PostgreSQL Configuration
# ============================================

# SSH Tunnel Connection (RECOMMENDED)
DB_HOST=localhost
DB_PORT=5433
DB_NAME=dtech
DB_USER=admin
DB_PASSWORD=P@ssw0rd
DB_SSL=false

# Alternative: Direct Connection (use if SSH tunnel not available)
# DB_HOST=157.10.73.52
# DB_PORT=5432
# DB_NAME=dtech
# DB_USER=admin
# DB_PASSWORD=P@ssw0rd
# DB_SSL=require

# Connection Pool Settings
DB_POOL_MIN=2
DB_POOL_MAX=10
DB_STATEMENT_CACHE_SIZE=20

# ============================================
# Supabase (if using for some features)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# ============================================
# Application
# ============================================
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 3: Create SSH Tunnel Alias (Optional but Recommended)

Add to `~/.bash_profile` or `~/.zshrc`:

```bash
alias tunnel-dtech='ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52'
```

Then just run:
```bash
tunnel-dtech
# Enter password when prompted
```

---

## 🔧 Install PostgreSQL Client Library

Add to `package.json` dependencies:

```bash
npm install pg
npm install --save-dev @types/pg
```

This allows Node.js to connect to PostgreSQL.

---

## 📊 Database Access via Different Tools

### 1. psql (Command Line)

```bash
# With SSH tunnel running
psql -h localhost -p 5433 -U admin -d dtech

# Common commands
\dt              # List all tables
\d table_name    # Describe table
SELECT * FROM information_schema.tables;  # List all tables
```

### 2. DBeaver (GUI)

1. Download from [dbeaver.io](https://dbeaver.io)
2. Create new connection:
   - **Type**: PostgreSQL
   - **Host**: localhost (if using SSH tunnel) or 157.10.73.52
   - **Port**: 5433 (if tunnel) or 5432
   - **Database**: dtech
   - **User**: admin
   - **Password**: P@ssw0rd
3. Click "Test Connection"

### 3. TablePlus (GUI - macOS/Windows)

1. Download from [tableplus.com](https://tableplus.com)
2. Create new connection > PostgreSQL
3. Fill in same credentials as DBeaver
4. Click "Connect"

### 4. pgAdmin (Web-based)

```bash
# Run pgAdmin in Docker
docker run -p 5050:80 \
  -e PGADMIN_DEFAULT_EMAIL=admin@example.com \
  -e PGADMIN_DEFAULT_PASSWORD=admin \
  dpage/pgadmin4
```

Then access at `http://localhost:5050`

---

## 🚀 Running Migrations on Your Server Database

### Step 1: Identify Current Database Schema

After SSH tunnel is running:

```bash
# List all tables in dtech database
psql -h localhost -p 5433 -U admin -d dtech -c "\dt"

# Export current schema
pg_dump -h localhost -p 5433 -U admin -d dtech --schema-only > current_schema.sql
```

### Step 2: Create Migration Script

Create `migrations/002_update_schema.sql` with your changes:

```sql
-- Migration: Add new tables or modify existing ones
-- Date: 2024-11-04

-- Example: Add new column to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Example: Create new table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Step 3: Run Migration

```bash
# Via psql
psql -h localhost -p 5433 -U admin -d dtech < migrations/002_update_schema.sql

# Or paste directly in psql
psql -h localhost -p 5433 -U admin -d dtech
# Then paste contents and run \q to exit
```

---

## 🔄 Integrating with Node.js Application

### Option 1: Using `pg` Library (Simple)

Create `lib/database.ts`:

```typescript
import { Pool, PoolClient } from 'pg';

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: parseInt(process.env.DB_POOL_MAX || '10'),
  min: parseInt(process.env.DB_POOL_MIN || '2'),
});

export async function query(text: string, params?: any[]) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    console.error('Database query error', { text, error });
    throw error;
  }
}

export async function getClient(): Promise<PoolClient> {
  const client = await pool.connect();
  return client;
}

export { pool };
```

### Option 2: Using Prisma (Recommended for Large Projects)

```bash
npm install @prisma/client
npm install -g prisma
```

Create `.env`:
```
DATABASE_URL="postgresql://admin:P@ssw0rd@localhost:5433/dtech"
```

Initialize Prisma:
```bash
npx prisma init
```

Update `prisma/schema.prisma`:
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Profile {
  id    String     @id @default(cuid())
  email String     @unique
  // ... other fields
}
```

Generate Prisma client:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

Use in code:
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const user = await prisma.profile.findUnique({
  where: { id: userId }
});
```

---

## 🧪 Testing the Connection

### Test Script

Create `lib/test-db.ts`:

```typescript
import { pool } from '@/lib/database';

export async function testDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful!');
    console.log('Current database time:', result.rows[0]);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}
```

Run test:
```bash
# Add to package.json scripts
"test:db": "npx ts-node lib/test-db.ts"

npm run test:db
```

---

## 📱 Connecting from Next.js Pages

### API Route Example

Create `app/api/database/test/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { pool } from '@/lib/database';

export async function GET() {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = \'public\'');

    return NextResponse.json({
      success: true,
      message: 'Database connected',
      tableCount: result.rows[0].count,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
```

Access at `http://localhost:3000/api/database/test`

---

## 🐛 Troubleshooting Connection Issues

### Issue: "Connection refused on port 5432"

**Solution**:
1. Verify SSH tunnel is running: `ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52`
2. Check tunnel is active: `lsof -i :5433` should show connection
3. If not running, restart tunnel

### Issue: "FATAL: role 'admin' does not exist"

**Solution**:
1. SSH to server: `ssh ubuntu@157.10.73.52`
2. Connect to postgres: `sudo -u postgres psql`
3. List users: `\du`
4. Create user if missing: `CREATE USER admin WITH PASSWORD 'P@ssw0rd';`

### Issue: "FATAL: database 'dtech' does not exist"

**Solution**:
1. Connect via SSH: `ssh ubuntu@157.10.73.52`
2. Connect to postgres: `sudo -u postgres psql`
3. List databases: `\l`
4. Create if missing: `CREATE DATABASE dtech OWNER admin;`

### Issue: "SSL: SSLV3_ALERT_HANDSHAKE_FAILURE"

**Solution**:
1. Disable SSL if using SSH tunnel: Set `DB_SSL=false`
2. If direct connection needed: Set `DB_SSL=require` and ensure server has SSL cert

### Issue: "too many connections"

**Solution**:
1. Reduce pool size in `.env.local`
2. Restart Node.js application
3. Close unused connections on server

---

## 📊 Monitoring Database Connection

Create `lib/db-monitor.ts`:

```typescript
import { pool } from '@/lib/database';

export async function getPoolStatus() {
  return {
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingRequests: pool.waitingCount,
  };
}

// Add to health check endpoint
export async function healthCheck() {
  try {
    const result = await pool.query('SELECT 1');
    const status = await getPoolStatus();

    return {
      database: 'healthy',
      connectionPool: status,
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      database: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
  }
}
```

---

## 🔒 Production Checklist

Before deploying to production, ensure:

- [ ] SSH keys configured (no password auth)
- [ ] Firewall restricts database to app server only
- [ ] PostgreSQL has SSL enabled
- [ ] Create dedicated database user with minimal permissions
- [ ] Enable connection logging
- [ ] Set up automated backups
- [ ] Document all credentials securely (1Password, AWS Secrets Manager, etc.)
- [ ] Rotate credentials every 90 days
- [ ] Monitor slow queries
- [ ] Set up alerting for connection failures
- [ ] Test disaster recovery procedures
- [ ] Enable audit logging on sensitive operations

---

## 🔐 Creating Limited-Privilege Database User (Recommended)

For the application, create a user with minimal permissions:

```bash
# SSH to server
ssh ubuntu@157.10.73.52

# Connect as admin
psql -h localhost -U admin -d dtech

# Create application user
CREATE USER app_user WITH PASSWORD 'AppSecurePassword123!';

# Grant only necessary permissions
GRANT CONNECT ON DATABASE dtech TO app_user;
GRANT USAGE ON SCHEMA public TO app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_user;

# Make default for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO app_user;
```

Then update `.env.local`:
```env
DB_USER=app_user
DB_PASSWORD=AppSecurePassword123!
```

---

## 📚 Useful Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pg Node.js Library](https://node-postgres.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [SSH Tunneling Guide](https://www.postgresql.org/docs/current/libpq-envars.html)
- [Database Connection Pooling](https://node-postgres.com/features/pooling)

---

## 🆘 Support & Next Steps

1. **Test SSH Connection**: `ssh ubuntu@157.10.73.52`
2. **Set Up SSH Tunnel**: `ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52`
3. **Configure .env.local**: Copy values to your environment
4. **Test Database Connection**: Use psql or DBeaver
5. **Install pg Library**: `npm install pg`
6. **Run Application**: `npm run dev`

---

**Last Updated**: November 4, 2024
**Environment**: Development
**Status**: Ready for Configuration
