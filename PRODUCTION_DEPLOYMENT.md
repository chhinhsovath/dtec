# Production Deployment Guide

This guide covers the complete process of deploying the DGTech Khmer-First LMS to production.

## Pre-Deployment Checklist

### Code Quality
- [ ] All tests passing (`npm run test:ci`)
- [ ] Type checking passes (`npx tsc --noEmit`)
- [ ] Linting passes (`npm run lint`)
- [ ] No console errors in development
- [ ] All features working in staging environment

### Performance
- [ ] Core Web Vitals optimized (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- [ ] Bundle size analyzed and optimized
- [ ] Images optimized and using WebP/AVIF formats
- [ ] Code splitting implemented for large components
- [ ] Caching headers configured

### Security
- [ ] Environment variables properly configured
- [ ] Database credentials not committed
- [ ] API endpoints have proper authentication
- [ ] CORS policies configured
- [ ] CSP headers set
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled

### Documentation
- [ ] README.md complete
- [ ] API documentation updated
- [ ] Deployment instructions documented
- [ ] Environment variables documented
- [ ] Database schema documented

### Database
- [ ] All migrations applied
- [ ] Bilingual schema verified
- [ ] Indexes created for performance
- [ ] Backup strategy in place
- [ ] Connection pooling configured

## Environment Configuration

### Required Environment Variables

Create `.env.production`:
```
# Database
DATABASE_URL=postgresql://admin:password@host:5432/dtech
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Next.js
NEXT_PUBLIC_APP_URL=https://production-domain.com
NODE_ENV=production

# Supabase (if using)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Email
SMTP_HOST=mail.host.com
SMTP_PORT=587
SMTP_USER=user@host.com
SMTP_PASSWORD=password

# Security
JWT_SECRET=your-secure-jwt-secret
ENCRYPTION_KEY=your-encryption-key
```

### Vercel Deployment

1. **Connect Repository**
   - Push code to GitHub
   - Connect repository to Vercel

2. **Configure Environment**
   - Add all environment variables in Vercel dashboard
   - Set production environment
   - Configure edge functions if needed

3. **Build Settings**
   - Framework: Next.js
   - Build command: `next build`
   - Output directory: `.next`
   - Install command: `npm install`

4. **Deploy**
   ```bash
   # Vercel automatically deploys on push to main
   git push origin main
   ```

## Build Optimization

### Production Build
```bash
npm run build
npm start
```

### Build Analysis
```bash
# Analyze bundle size
npx next-bundle-analyzer

# Check build output
npm run build -- --debug
```

### Expected Build Output
- Bundle size should be < 200KB gzipped
- Static assets optimized
- Source maps disabled in production
- Tree-shaking enabled

## Deployment Steps

### 1. Pre-Deployment Testing
```bash
# Run all tests
npm run test:ci

# Type checking
npx tsc --noEmit

# Lint code
npm run lint

# Build locally
npm run build
npm start
```

### 2. Database Migration
```bash
# Connect to production database
psql -h host -p 5432 -U admin -d dtech

# Run pending migrations
-- Apply migration files in order
\i migrations/014_bilingual_fields.sql

# Verify schema
\dt
```

### 3. Deploy to Vercel
```bash
# Automatic deployment on git push
git push origin main

# Or manual deployment
vercel deploy --prod
```

### 4. Post-Deployment Verification
```bash
# Check health
curl https://production-domain.com/health

# Verify bilingual support
curl https://production-domain.com/api/courses?language=km
curl https://production-domain.com/api/courses?language=en

# Test key user flows
- Login as admin
- Login as teacher
- Login as student
- Switch languages
- View courses
- Create new course
```

## Monitoring and Logging

### Application Monitoring
```typescript
// Add monitoring in production
import { webVitals } from '@/lib/performance/monitoring';

// Initialize monitoring
webVitals.initializeMonitoring();

// Periodic reporting
setInterval(() => {
  webVitals.reportMetrics();
}, 60000);
```

### Log Aggregation
Configure logs to be sent to:
- CloudWatch (AWS)
- Datadog
- LogRocket
- Sentry (for errors)

### Health Checks
```bash
# Add to deployment
curl https://production-domain.com/health
```

### Key Metrics to Monitor
1. **Performance**
   - Page load time
   - First Contentful Paint (FCP)
   - Largest Contentful Paint (LCP)
   - Cumulative Layout Shift (CLS)

2. **Reliability**
   - API response times
   - Error rates
   - 5xx errors
   - Database connection pool usage

3. **Business**
   - User registrations
   - Course enrollments
   - Logins per language
   - Feature usage

## Rollback Plan

### If Issues Occur
1. **Immediate Rollback**
   ```bash
   # Revert to previous version
   git revert <commit-hash>
   git push origin main

   # Or manual rollback on Vercel
   vercel rollback
   ```

2. **Database Rollback**
   - Keep backup before migration
   - Restore from backup if needed
   - Document rollback steps

3. **Communication**
   - Notify stakeholders
   - Document incident
   - Post-incident review

## Performance Optimization for Production

### Caching Strategy
- Static files: 1 year cache
- API responses: 5 minute cache
- User session: 1 hour cache
- Translation cache: 30 minute cache

### Database Optimization
- Connection pooling enabled
- Query result caching
- Pagination for large datasets
- Indexes on frequently queried fields

### Frontend Optimization
- Code splitting by route
- Lazy loading components
- Image optimization
- CSS/JS minification

## Scaling Considerations

### Horizontal Scaling
- Stateless deployment (no local session storage)
- External session store (Redis)
- Load balancing configured
- Database connection pooling

### Vertical Scaling
- Increase server resources
- Monitor memory usage
- Optimize database queries
- Cache expensive operations

## Security Hardening

### SSL/TLS
- Force HTTPS
- Configure SSL certificate (auto with Vercel)
- Use HTTP Strict-Transport-Security header

### Rate Limiting
- Implement rate limiting on API endpoints
- Prevent brute force attacks
- Configure per-user and per-IP limits

### Input Validation
- Validate all user inputs
- Sanitize database inputs
- Use parameterized queries

### Data Protection
- Encrypt sensitive data in transit (HTTPS)
- Encrypt sensitive data at rest
- Implement data retention policies
- Regular security audits

## Backup and Recovery

### Database Backups
```bash
# Daily automated backups
pg_dump -h host -U admin dtech > backup-$(date +%Y%m%d).sql

# Test restore
createdb dtech_restore
psql -d dtech_restore < backup.sql
```

### Backup Storage
- Store backups in secure location
- Multiple copies in different regions
- Test restore process regularly
- Document recovery procedure

## Disaster Recovery Plan

### Recovery Time Objectives (RTO)
- Critical services: < 1 hour
- Standard services: < 4 hours
- Non-critical: < 24 hours

### Recovery Point Objectives (RPO)
- Database: < 1 hour
- Configuration: < 1 day
- User data: < 1 hour

### Recovery Steps
1. Assess damage
2. Activate backup systems
3. Restore database from backup
4. Verify data integrity
5. Restore application code
6. Perform smoke tests
7. Notify users

## Post-Deployment Tasks

### 1. Monitoring Setup
- Configure application monitoring
- Set up alerting
- Create dashboards
- Test alerting system

### 2. Documentation
- Document deployment process
- Document access procedures
- Document emergency contacts
- Update runbooks

### 3. Team Training
- Train support team on system
- Document troubleshooting procedures
- Create knowledge base articles
- Schedule regular reviews

### 4. User Communication
- Announce new features
- Document new capabilities
- Provide training materials
- Gather feedback

## Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
# Check connection
psql -h host -U admin -d dtech -c "SELECT 1;"

# Check environment variables
echo $DATABASE_URL

# Check pool configuration
# Verify DATABASE_POOL_MIN and DATABASE_POOL_MAX
```

**Memory Leaks**
```bash
# Monitor memory usage
watch -n 1 'ps aux | grep node'

# Check for memory leaks
node --inspect app.js
# Use Chrome DevTools to profile
```

**Performance Degradation**
```bash
# Check slow queries
# Enable query logging
# Use EXPLAIN ANALYZE

# Check cache hit rates
# Monitor database connections
# Check API response times
```

## Maintenance Schedule

### Daily
- Monitor error logs
- Check application status
- Verify backup completion

### Weekly
- Review performance metrics
- Check security logs
- Update dependencies
- Test backup restore

### Monthly
- Review and optimize queries
- Analyze database growth
- Test disaster recovery
- Review access logs

### Quarterly
- Security audit
- Performance audit
- Capacity planning
- Documentation review

## Success Criteria

The deployment is considered successful when:
- ✅ All tests passing
- ✅ No critical errors in logs
- ✅ Core Web Vitals meet targets
- ✅ All features working as expected
- ✅ Database performing optimally
- ✅ Monitoring and alerting active
- ✅ Team trained on new system
- ✅ Users able to access system

## Support and Escalation

### Support Levels
- **Level 1**: User documentation and FAQ
- **Level 2**: Development team troubleshooting
- **Level 3**: Infrastructure and database teams

### Emergency Contacts
- Development Lead: [Name, Contact]
- DevOps Lead: [Name, Contact]
- Database Admin: [Name, Contact]
- On-call Engineer: [Rotation Schedule]

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/deployment)
- [PostgreSQL Performance Tuning](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Vercel Best Practices](https://vercel.com/docs/production-checklist)
- [OWASP Security Checklist](https://cheatsheetseries.owasp.org/)
