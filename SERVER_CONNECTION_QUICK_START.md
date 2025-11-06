# 🚀 Server Connection - Quick Start Guide

Get your development environment connected to the PostgreSQL server in **5 minutes**.

---

## ⚡ 5-Minute Setup

### Step 1: Copy Environment Configuration (1 minute)

```bash
# Copy the example env file
cp .env.local.example .env.local

# Edit it (or use the defaults - they're already set!)
nano .env.local
```

**The `.env.local` file already has the correct defaults:**
```env
DB_HOST=localhost          # ✅ Default (when using SSH tunnel)
DB_PORT=5433              # ✅ Default (tunnel port)
DB_NAME=dtech             # ✅ Database name
DB_USER=admin             # ✅ Database user
DB_PASSWORD=P@ssw0rd      # ✅ Database password
DB_SSL=false              # ✅ No SSL needed with tunnel
```

**No changes needed!** Just save and close.

---

### Step 2: Open SSH Tunnel (1 minute)

Open a **new terminal** and run:

```bash
ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52
```

When prompted for password, type:
```
en_&xdX#!N(^OqCQzc3RE0B)m6ogU!
```

**You should see:**
```
Welcome to Ubuntu...
$ _
```

⚠️ **KEEP THIS TERMINAL OPEN** - The tunnel must stay active while you develop.

---

### Step 3: Install Dependencies (2 minutes)

In **a different terminal** (keep tunnel open in first terminal):

```bash
cd /path/to/dgtech
npm install
npm install pg
```

---

### Step 4: Start Development (1 minute)

In the **same terminal as Step 3**:

```bash
npm run dev
```

You should see:
```
▲ Next.js 14.2.0
- ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

**Done!** Open http://localhost:3000 in your browser.

---

## ✅ Verify It Works

### Test 1: Check if Server is Accessible

In any terminal:
```bash
psql -h localhost -p 5433 -U admin -d dtech -c "SELECT NOW();"
```

You should see the current database time. ✅

### Test 2: Check Application

1. Open http://localhost:3000 in browser
2. You should see the TEC LMS homepage
3. Try registering or logging in

---

## 🔧 Easier Alternative: Use Our Script

Don't want to manually manage the tunnel? We have a setup script:

```bash
# Make the script executable (first time only)
chmod +x scripts/setup-tunnel.sh

# Run the script
./scripts/setup-tunnel.sh

# It will:
# ✅ Check SSH is available
# ✅ Check port 5433 is free
# ✅ Test SSH connection
# ✅ Create the tunnel
# ✅ Show you next steps
```

---

## 📋 What Each Component Does

| Component | Purpose | Status |
|-----------|---------|--------|
| **SSH Tunnel** | Securely forwards port 5433 to server:5432 | ✅ Running in terminal 1 |
| **PostgreSQL** | Your database (on server) | ✅ Already set up (157.10.73.52) |
| **Next.js App** | Your web application | ✅ Running on localhost:3000 |
| **Database Library** | Node.js → PostgreSQL connection | ✅ Configured in lib/database.ts |

---

## 🚨 Troubleshooting

### "Connection refused" in application

**Cause**: SSH tunnel is not running

**Fix**: Make sure first terminal has:
```
Welcome to Ubuntu...
$ _
```

If you see a prompt, tunnel is open. If you closed it, run again:
```bash
ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52
```

---

### "psql: error: FATAL: Ident authentication failed"

**Cause**: SSH tunnel not working or password wrong

**Fix**:
1. Kill any existing connections: `lsof -ti:5433 | xargs kill -9`
2. Check password is exactly: `en_&xdX#!N(^OqCQzc3RE0B)m6ogU!`
3. Try tunnel again: `ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52`

---

### "Port 5433 already in use"

**Cause**: Another process is using the tunnel port

**Fix**:
```bash
# See what's using port 5433
lsof -i :5433

# Kill it
lsof -ti:5433 | xargs kill -9

# Try tunnel again
ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52
```

---

### Application starts but can't connect to database

**Check**:
1. Is SSH tunnel running? (first terminal should show `$ _`)
2. Is `.env.local` configured correctly?
3. Can you connect with psql? `psql -h localhost -p 5433 -U admin -d dtech -c "SELECT 1;"`

If psql works but app doesn't, check app logs for specific error.

---

## 🎯 What You Have Now

After these steps:

✅ **SSH Access** to development server
✅ **Secure Tunnel** to PostgreSQL database
✅ **Environment Variables** configured
✅ **Node.js Dependencies** installed
✅ **Next.js Application** running locally
✅ **Database Connection** working

---

## 📊 Next: Use the Database

Once everything is working, you can:

### 1. Query the Database in Your App

```typescript
// app/api/test/route.ts
import { query } from '@/lib/database';

export async function GET() {
  const result = await query('SELECT version()');
  return Response.json({ version: result.rows[0] });
}
```

### 2. Create Tables

```typescript
import { query } from '@/lib/database';

const result = await query(`
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
  )
`);
```

### 3. Insert Data

```typescript
const result = await query(
  'INSERT INTO users (email) VALUES ($1) RETURNING *',
  ['user@example.com']
);
console.log(result.rows[0]); // New user
```

---

## 🔐 Important: Security Notes

⚠️ **The credentials you have are for DEVELOPMENT ONLY**:
- ❌ Don't use these credentials in production
- ❌ Don't commit `.env.local` to Git (it's in `.gitignore`)
- ❌ Don't share credentials in messages/emails
- ✅ Create separate credentials for production
- ✅ Rotate credentials periodically

See `SERVER_SETUP.md` for production security best practices.

---

## 📚 Learn More

- **SERVER_SETUP.md** - Detailed server configuration
- **QUICK_REFERENCE.md** - Code snippets and commands
- **CLAUDE.md** - Architecture and patterns
- **README.md** - Complete project documentation

---

## ✨ Summary

Three simple steps:
1. **Terminal 1**: SSH tunnel: `ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52`
2. **Terminal 2**: Install & run: `npm install && npm run dev`
3. **Browser**: Open http://localhost:3000

That's it! Your development environment is ready. 🎉

---

**Estimated Time**: 5-10 minutes
**Difficulty**: Beginner
**Support**: Check troubleshooting section above or read SERVER_SETUP.md
