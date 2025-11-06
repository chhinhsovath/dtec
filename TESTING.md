# Testing Guide

This document provides a comprehensive guide to running tests for the DGTech LMS project.

## Test Structure

The project includes three types of tests:

### 1. Unit Tests
- **Location**: `__tests__/unit/`
- **Framework**: Jest
- **Purpose**: Test individual functions and utilities in isolation
- **Coverage**: Bilingual utilities, query optimization, caching strategies

### 2. Integration Tests
- **Location**: `__tests__/integration/`
- **Framework**: Jest
- **Purpose**: Test interactions between components and services
- **Coverage**: API endpoints, database operations, service layers

### 3. E2E Tests
- **Location**: `e2e/`
- **Framework**: Playwright
- **Purpose**: Test complete user workflows and page interactions
- **Coverage**: Dashboard pages, navigation, responsive design, accessibility

## Running Tests

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests Only
```bash
npm run test:integration
```

### E2E Tests
```bash
npm run test:e2e
```

### All Tests (Watch Mode)
```bash
npm run test
```

### All Tests with Coverage Report
```bash
npm run test:coverage
```

### CI Mode (Non-Interactive)
```bash
npm run test:ci
```

## Test Configuration

### Jest Configuration
- **File**: `jest.config.ts`
- **Test Pattern**: `**/__tests__/**/*.test.ts(x)` or `**/?(*.)+(spec|test).ts(x)`
- **Coverage Threshold**: 50% for all metrics
- **Environment**: jsdom (simulates browser environment)

### Playwright Configuration
- **File**: `playwright.config.ts`
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Pixel 5, iPhone 12
- **Base URL**: http://localhost:3000
- **Reporters**: HTML report with screenshots and videos on failure

## Writing Tests

### Unit Test Example
```typescript
import { getLocalizedName } from '@/lib/i18n/bilingual-utils';

describe('getLocalizedName', () => {
  it('should return English name when language is en', () => {
    const record = {
      id: '1',
      name_en: 'Course in English',
      name_km: 'វគ្គសិក្សា',
    };

    const result = getLocalizedName(record, 'en');
    expect(result).toBe('Course in English');
  });
});
```

### E2E Test Example
```typescript
import { test, expect } from '@playwright/test';

test('should load dashboard', async ({ page }) => {
  await page.goto('/dashboard/admin');
  expect(page).toHaveURL('/dashboard/admin');
});
```

## Coverage Requirements

The project maintains a minimum coverage of **50%** across all metrics:
- **Branches**: 50%
- **Functions**: 50%
- **Lines**: 50%
- **Statements**: 50%

To view coverage:
```bash
npm run test:coverage
# Open coverage/lcov-report/index.html in browser
```

## Testing Best Practices

### 1. Unit Tests
- Test one thing per test
- Use descriptive test names
- Mock external dependencies
- Test both happy and unhappy paths
- Keep tests focused and isolated

### 2. Integration Tests
- Test component interactions
- Use real database queries (with test data)
- Test error handling
- Test data flow between components

### 3. E2E Tests
- Test user workflows
- Test cross-browser compatibility
- Test responsive design
- Test accessibility
- Use data-testid for reliable selectors

## Test Data

### Fixtures
- **Location**: `__tests__/fixtures/`
- **Purpose**: Reusable test data
- **Example**: Mock user records, course data, etc.

### Database Setup
For integration tests, use test database:
```bash
# Run migrations on test database
psql -h localhost -p 5433 -U admin -d dtech_test -f migrations/*.sql
```

## CI/CD Integration

### GitHub Actions
The project includes GitHub Actions workflows that:
1. Run unit tests on every push
2. Run E2E tests on pull requests
3. Generate coverage reports
4. Fail build if coverage drops below threshold

## Common Issues

### Jest Not Finding Modules
- Check `jest.config.ts` for correct path mapping
- Ensure `@/` alias points to project root

### Playwright Tests Timing Out
- Increase timeout in `playwright.config.ts`
- Check if dev server is running
- Verify network connectivity

### Coverage Not Meeting Threshold
- Write tests for untested code paths
- Check coverage report for gaps
- Use `npm run test:coverage` to identify areas

## Debugging Tests

### Jest Debugging
```bash
# Run single test file
npm test -- bilingual-utils.test.ts

# Run single test
npm test -- -t "should return English name"

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Playwright Debugging
```bash
# Debug mode with Inspector
npx playwright test --debug

# Run single test
npx playwright test dashboard.spec.ts

# Run specific test
npx playwright test dashboard.spec.ts -g "should load admin dashboard"
```

## Performance Testing

The project includes performance monitoring utilities:

```typescript
import { webVitals, routeMonitor } from '@/lib/performance/monitoring';

// Initialize monitoring
webVitals.initializeMonitoring();

// Track route changes
routeMonitor.startRoute('admin-dashboard');
// ... perform actions
const duration = routeMonitor.endRoute('admin-dashboard');

// Get metrics
webVitals.reportMetrics();
```

## Continuous Improvement

### Test Metrics to Track
1. **Coverage**: Aim for >80% (threshold is 50%)
2. **Test Execution Time**: Keep unit tests fast (<5s)
3. **Flaky Tests**: Identify and fix intermittent failures
4. **Test Maintenance**: Update tests when features change

### Regular Maintenance
- Review and update test data regularly
- Remove obsolete tests
- Refactor duplicated test code
- Keep dependencies updated

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Best Practices](https://testing-library.com/docs/queries/about)
- [MDN Testing Best Practices](https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Testing)

## Questions or Issues?

If you encounter test-related issues:
1. Check test error messages carefully
2. Run tests in isolation to identify root cause
3. Check GitHub issues for similar problems
4. Create detailed issue with reproduction steps
