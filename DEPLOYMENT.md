# TEC LMS - Deployment Guide

This guide covers deploying the TEC LMS to production using Vercel and Supabase.

---

## 🚀 Deployment Options

### Recommended: Vercel + Supabase
- **Best for**: Production deployment
- **Cost**: Free tier available
- **Features**: Automatic deployments, SSL, CDN, serverless functions

### Alternative: Self-hosted
- **Best for**: Full control, custom infrastructure
- **Cost**: Variable (server costs)
- **Features**: Complete control, custom configurations

---

## 📋 Pre-Deployment Checklist

- [ ] All Phase 1 features tested locally
- [ ] Environment variables documented
- [ ] Database migrations ready
- [ ] Production Supabase project created
- [ ] Domain name ready (optional)
- [ ] SSL certificate (handled by Vercel)

---

## 🌐 Option 1: Deploy to Vercel (Recommended)

### Step 1: Prepare Your Repository

1. **Initialize Git** (if not already done):
```bash
git init
git add .
git commit -m "Initial commit - Phase 1 complete"
```

2. **Push to GitHub**:
```bash
# Create a new repository on GitHub first
git remote add origin https://github.com/yourusername/tec-lms.git
git branch -M main
git push -u origin main
```

### Step 2: Create Production Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project for production:
   - **Name**: TEC LMS Production
   - **Database Password**: Use a strong password (save it!)
   - **Region**: Choose closest to your users
3. Wait for provisioning (2-3 minutes)

### Step 3: Run Production Database Migration

1. In your production Supabase project, go to SQL Editor
2. Copy contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run in SQL Editor
4. Verify all tables were created (check Database > Tables)

### Step 4: Configure Production Authentication

1. Go to Authentication > Providers
2. Enable Email provider
3. Go to Authentication > URL Configuration
4. Set **Site URL** to your production URL:
   - If using Vercel: `https://your-app.vercel.app`
   - If using custom domain: `https://yourdomain.com`
5. Add Redirect URLs:
   - `https://your-app.vercel.app/auth/callback`
   - `https://your-app.vercel.app/**` (wildcard)

### Step 5: Deploy to Vercel

#### Option A: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New" > "Project"
3. Import your GitHub repository
4. Configure project:
   - **Framework Preset**: Next.js
   - **Root Directory**: ./
   - **Build Command**: `npm run build`
   - **Output Directory**: .next

5. Add Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-production-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
```

6. Click "Deploy"
7. Wait 2-3 minutes for deployment

#### Option B: Using Vercel CLI

1. **Install Vercel CLI**:
```bash
npm install -g vercel
```

2. **Login to Vercel**:
```bash
vercel login
```

3. **Deploy**:
```bash
vercel
```

4. **Add Environment Variables**:
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

5. **Deploy to Production**:
```bash
vercel --prod
```

### Step 6: Verify Deployment

1. Visit your deployment URL
2. Test registration with a new account
3. Test login
4. Test all three role dashboards
5. Check Supabase logs for any errors

### Step 7: Configure Custom Domain (Optional)

1. In Vercel Dashboard, go to your project
2. Click "Settings" > "Domains"
3. Add your custom domain
4. Follow DNS configuration instructions
5. Wait for DNS propagation (can take up to 48 hours)
6. Update Supabase Auth URLs with new domain

---

## 🖥️ Option 2: Self-Hosted Deployment

### Requirements
- Node.js 18+ server
- Nginx or Apache
- SSL certificate (Let's Encrypt recommended)
- PM2 or similar process manager

### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx
```

### Step 2: Clone and Build

```bash
# Clone repository
git clone https://github.com/yourusername/tec-lms.git
cd tec-lms

# Install dependencies
npm install

# Create .env.local with production values
nano .env.local

# Build application
npm run build
```

### Step 3: Configure PM2

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'tec-lms',
    script: 'npm',
    args: 'start',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 4: Configure Nginx

Create `/etc/nginx/sites-available/tec-lms`:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/tec-lms /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 5: SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## 🔒 Security Best Practices

### Environment Variables
- ✅ Never commit `.env.local` to Git
- ✅ Use different credentials for dev/staging/prod
- ✅ Rotate keys regularly
- ✅ Use Vercel's encrypted environment variables

### Database Security
- ✅ Enable Row Level Security (already done)
- ✅ Use strong database passwords
- ✅ Limit service role key usage
- ✅ Enable Supabase's built-in security features
- ✅ Regular database backups

### Application Security
- ✅ Keep dependencies updated
- ✅ Enable HTTPS only
- ✅ Set secure headers
- ✅ Implement rate limiting (future)
- ✅ Monitor for security vulnerabilities

---

## 📊 Monitoring & Maintenance

### Vercel Monitoring
- **Analytics**: Built-in Vercel Analytics
- **Logs**: Real-time function logs
- **Performance**: Core Web Vitals tracking

### Supabase Monitoring
- **Database**: Query performance
- **Auth**: Login attempts, failures
- **Storage**: Usage metrics
- **API**: Request logs

### Recommended Tools
- **Error Tracking**: Sentry
- **Uptime Monitoring**: UptimeRobot
- **Performance**: Lighthouse CI
- **Logs**: Papertrail or Logtail

---

## 🔄 Continuous Deployment

### Automatic Deployments with Vercel

1. **Connect GitHub**: Already done during setup
2. **Configure branches**:
   - `main` → Production
   - `develop` → Preview
   - Feature branches → Preview

3. **Deployment triggers**:
   - Push to main → Auto-deploy to production
   - Pull request → Deploy preview
   - Merge PR → Deploy to production

### Deployment Workflow

```bash
# Development
git checkout -b feature/new-feature
# Make changes
git commit -m "Add new feature"
git push origin feature/new-feature

# Create PR on GitHub
# Vercel creates preview deployment
# Review and test preview
# Merge PR → Auto-deploy to production
```

---

## 🧪 Testing Before Deployment

### Pre-Deployment Tests

```bash
# Build test
npm run build

# Lint check
npm run lint

# Type check
npx tsc --noEmit

# Test production build locally
npm run build && npm start
```

### Manual Testing Checklist
- [ ] Homepage loads correctly
- [ ] Registration works for all roles
- [ ] Login/logout works
- [ ] All dashboards accessible
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Fast page loads

---

## 🆘 Troubleshooting Deployment Issues

### Build Fails on Vercel

**Issue**: Build error during deployment

**Solutions**:
```bash
# Test build locally first
npm run build

# Check Node version matches
node --version  # Should be 18+

# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Environment Variables Not Working

**Issue**: App can't connect to Supabase

**Solutions**:
- Verify all env vars are set in Vercel
- Check for typos in variable names
- Ensure no trailing spaces
- Redeploy after adding variables

### Database Connection Issues

**Issue**: "relation does not exist" errors

**Solutions**:
- Verify migration ran successfully
- Check Supabase project is active
- Verify connection string is correct
- Check RLS policies are enabled

### Authentication Redirect Issues

**Issue**: Auth redirects not working

**Solutions**:
- Update Supabase Auth URLs
- Add all redirect URLs to allowlist
- Check Site URL is correct
- Clear browser cache

---

## 📈 Scaling Considerations

### Current Setup (Phase 1)
- **Users**: Up to 1,000
- **Concurrent**: 100
- **Database**: 500MB (Supabase free tier)

### Scaling Options

#### Supabase
- **Pro Plan**: $25/month
  - 8GB database
  - 50GB bandwidth
  - Daily backups

#### Vercel
- **Pro Plan**: $20/month per user
  - Unlimited bandwidth
  - Advanced analytics
  - Team collaboration

### Performance Optimization
- [ ] Enable Vercel Edge Functions
- [ ] Implement database connection pooling
- [ ] Add Redis caching (future)
- [ ] Optimize images with Next.js Image
- [ ] Enable Supabase CDN

---

## 📞 Support & Resources

### Documentation
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Production](https://supabase.com/docs/guides/platform/going-into-prod)

### Community
- Next.js Discord
- Supabase Discord
- GitHub Issues

---

## ✅ Post-Deployment Checklist

- [ ] Application accessible at production URL
- [ ] All three roles can register
- [ ] Login/logout works correctly
- [ ] Dashboards load properly
- [ ] No console errors
- [ ] SSL certificate active
- [ ] Custom domain configured (if applicable)
- [ ] Monitoring tools set up
- [ ] Backup strategy in place
- [ ] Team has access to deployments
- [ ] Documentation updated with production URLs

---

**Deployment Time**: 30-60 minutes  
**Difficulty**: Intermediate  
**Cost**: Free tier available

Good luck with your deployment! 🚀
