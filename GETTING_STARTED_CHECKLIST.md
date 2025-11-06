# Getting Started Checklist - TEC LMS Development Server Setup

Complete this checklist to get your development environment fully configured and connected to the PostgreSQL server.

---

## ✅ Pre-Setup (5 minutes)

- [ ] **Have SSH credentials ready**
  - Server IP: 157.10.73.52
  - Username: ubuntu
  - Password: en_&xdX#!N(^OqCQzc3RE0B)m6ogU!

- [ ] **Have database credentials ready**
  - Database: dtech
  - User: admin
  - Password: P@ssw0rd
  - Host: 157.10.73.52
  - Port: 5432

- [ ] **Ensure SSH is installed** on your machine
  ```bash
  ssh -V  # Should show OpenSSH version
  ```

---

## 📋 Step 1: Clone & Setup Project (3 minutes)

- [ ] **Clone the repository**
  ```bash
  git clone <repository-url>
  cd dgtech
  ```

- [ ] **Install Node.js dependencies**
  ```bash
  npm install
  ```

- [ ] **Install PostgreSQL client library**
  ```bash
  npm install pg
  npm install --save-dev @types/pg
  ```

---

## 🔐 Step 2: Configure Environment (2 minutes)

- [ ] **Copy environment template**
  ```bash
  cp .env.local.example .env.local
  ```

- [ ] **Verify `.env.local` has correct values**
  ```env
  DB_HOST=localhost
  DB_PORT=5433
  DB_NAME=dtech
  DB_USER=admin
  DB_PASSWORD=P@ssw0rd
  DB_SSL=false
  ```

- [ ] **Verify `.env.local` is in `.gitignore`**
  ```bash
  grep ".env.local" .gitignore
  # Should return: .env.local
  ```

---

## 🌐 Step 3: Create SSH Tunnel (1 minute)

### Option A: Manual SSH Tunnel (Recommended for Control)

- [ ] **Open a NEW terminal window** (keep this open)

- [ ] **Create the SSH tunnel**
  ```bash
  ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52
  ```

- [ ] **Enter password when prompted**
  ```
  Password: en_&xdX#!N(^OqCQzc3RE0B)m6ogU!
  ```

- [ ] **Verify tunnel is active**
  - You should see: `Welcome to Ubuntu...`
  - You should see a command prompt: `$ `
  - Keep this window open (do not close)

### Option B: Use Provided Setup Script

- [ ] **Make script executable** (one time only)
  ```bash
  chmod +x scripts/setup-tunnel.sh
  ```

- [ ] **Run the setup script**
  ```bash
  ./scripts/setup-tunnel.sh
  ```

- [ ] **Script will:**
  - ✅ Check SSH availability
  - ✅ Verify port 5433 is free
  - ✅ Test SSH connection
  - ✅ Create the tunnel
  - Keep this window open

---

## 🧪 Step 4: Test Database Connection (2 minutes)

### In a Different Terminal (not the SSH tunnel one):

- [ ] **Install psql if needed** (macOS with Homebrew)
  ```bash
  brew install postgresql
  ```

- [ ] **Test connection**
  ```bash
  psql -h localhost -p 5433 -U admin -d dtech -c "SELECT NOW();"
  ```

- [ ] **Expected output:**
  ```
               now
  ---------------------
  2024-11-04 XX:XX:XX
  ```

- [ ] **If error: "Connection refused"**
  - Make sure SSH tunnel window is still open
  - Go back to Step 3 and verify tunnel is running

---

## 🚀 Step 5: Start Development Server (1 minute)

### In Another Terminal (not SSH tunnel):

- [ ] **Navigate to project directory**
  ```bash
  cd /path/to/dgtech
  ```

- [ ] **Start the development server**
  ```bash
  npm run dev
  ```

- [ ] **Expected output:**
  ```
  ▲ Next.js 14.2.0
  - Local:        http://localhost:3000
  ```

- [ ] **Verify in console:**
  - Should show database connection info
  - No red error messages

---

## 🌍 Step 6: Test Application (2 minutes)

- [ ] **Open browser** and go to http://localhost:3000

- [ ] **Verify homepage loads**
  - Should see TEC LMS landing page
  - All buttons clickable

- [ ] **Test registration**
  - Go to `/auth/register`
  - Create a student account
  - Email: test@example.com
  - Password: password123
  - Role: Student

- [ ] **Test login**
  - Go to `/auth/login`
  - Login with credentials you just created

- [ ] **Verify dashboard loads**
  - Student should see: Student Dashboard
  - Check profile page works

---

## 📊 Step 7: Verify Database Connection from App (2 minutes)

- [ ] **Create test endpoint** (optional - to verify direct DB access)
  ```bash
  # Create app/api/health/route.ts with database test
  ```

- [ ] **Test database query**
  ```bash
  curl http://localhost:3000/api/health
  # Should return successful database status
  ```

---

## 🎨 Step 8: Verify Code Quality (1 minute)

- [ ] **Type check**
  ```bash
  npx tsc --noEmit
  # Should show 0 errors
  ```

- [ ] **Lint check**
  ```bash
  npm run lint
  # Should show 0 errors (or only warnings)
  ```

---

## 📝 Step 9: Setup Git & Documentation (2 minutes)

- [ ] **Initialize git** (if not already done)
  ```bash
  git init
  git add .
  git commit -m "Initial commit: TEC LMS with server connection"
  ```

- [ ] **Create local git branches**
  ```bash
  git checkout -b develop
  git checkout -b feature/phase-2-implementation
  ```

- [ ] **Read documentation** (in priority order)
  - [ ] Start with: `SERVER_CONNECTION_QUICK_START.md` (5 min)
  - [ ] Then: `CLAUDE.md` (10 min)
  - [ ] Then: `SERVER_SETUP.md` (15 min)
  - [ ] Reference: `QUICK_REFERENCE.md` (as needed)

---

## ✨ Final Verification Checklist

Your development environment is **READY** when:

- [ ] ✅ SSH tunnel is open and showing `$ ` prompt
- [ ] ✅ Database connection test passed (`psql` command worked)
- [ ] ✅ Next.js dev server running on localhost:3000
- [ ] ✅ Application homepage loads in browser
- [ ] ✅ Can register new account
- [ ] ✅ Can login with account
- [ ] ✅ Dashboard displays correctly
- [ ] ✅ TypeScript type checking passes
- [ ] ✅ ESLint passes
- [ ] ✅ `.env.local` is in `.gitignore`

---

## 🚨 Terminal Windows You Should Have

| Terminal # | Purpose | Should Show | Keep Open? |
|-----------|---------|------------|-----------|
| 1 | SSH Tunnel | `$ _` (command prompt) | ✅ YES (Always) |
| 2 | Development Server | `NextJS running on port 3000` | ✅ YES (During dev) |
| 3+ | General Commands | Regular shell prompt | Optional |

**Remember**: If Terminal 1 (SSH Tunnel) closes, database connection breaks!

---

## 🐛 Troubleshooting Quick Fixes

### Application starts but can't connect to database
1. Check Terminal 1: Is SSH tunnel still running?
2. Run: `psql -h localhost -p 5433 -U admin -d dtech -c "SELECT 1;"`
3. If psql fails, restart SSH tunnel in Terminal 1

### Port 5433 already in use
```bash
lsof -ti:5433 | xargs kill -9
# Then restart SSH tunnel
```

### "password authentication failed"
- Verify password exactly: `en_&xdX#!N(^OqCQzc3RE0B)m6ogU!`
- No spaces before/after
- Try with single quotes: `'en_&xdX#!N(^OqCQzc3RE0B)m6ogU!'`

### Next.js won't start
```bash
# Clear cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules
npm install

# Start again
npm run dev
```

### TypeScript errors about database types
```bash
# Make sure pg types are installed
npm install --save-dev @types/pg

# Verify import works
npx tsc --noEmit
```

---

## 📚 Next Steps After Setup

Once everything is working:

1. **Read Architecture Guide** → Read `CLAUDE.md`
2. **Start Development** → Read `QUICK_REFERENCE.md`
3. **Create First Feature** → Check `CONTRIBUTING.md`
4. **Deploy Changes** → Check `DEPLOYMENT.md` (when ready)

---

## 💡 Pro Tips

- **Alias for SSH Tunnel** (add to `~/.zshrc` or `~/.bash_profile`):
  ```bash
  alias tunnel-dtech='ssh -L 5433:157.10.73.52:5432 ubuntu@157.10.73.52'
  ```
  Then just run: `tunnel-dtech`

- **Database Tool Recommendations**:
  - DBeaver (free, GUI)
  - TablePlus (macOS, nice UI)
  - pgAdmin (web-based)

- **Monitor Tunnel Status**:
  ```bash
  # In another terminal
  lsof -i :5433
  # Should show: ssh ... (LISTEN on 127.0.0.1:5433)
  ```

- **Keep Notes**:
  - Document any server-specific settings
  - Note any issues encountered
  - Share solutions with team

---

## ✅ Congratulations!

You've successfully:
- ✅ Cloned and set up the TEC LMS project
- ✅ Configured environment variables
- ✅ Created SSH tunnel to server
- ✅ Connected to PostgreSQL database
- ✅ Started the development server
- ✅ Tested the application
- ✅ Verified code quality

**You're ready to start developing!** 🎉

---

## 📞 Need Help?

1. **Quick issues?** → Check "Troubleshooting Quick Fixes" above
2. **Detailed setup help?** → Read `SERVER_SETUP.md`
3. **Development questions?** → Check `QUICK_REFERENCE.md`
4. **Architecture confusion?** → Read `CLAUDE.md`

---

**Time to Complete**: 20-30 minutes
**Difficulty**: Beginner-friendly with clear steps
**Support**: All documentation files available in repository

Good luck! 🚀
