/**
 * Performance Monitoring & Metrics
 * Track Core Web Vitals and application performance
 */

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

/**
 * Core Web Vitals monitoring
 * LCP (Largest Contentful Paint)
 * FID (First Input Delay) / INP (Interaction to Next Paint)
 * CLS (Cumulative Layout Shift)
 */
export class WebVitalsMonitor {
  private metrics: PerformanceMetric[] = [];
  private isClient = typeof window !== 'undefined';

  initializeMonitoring(): void {
    if (!this.isClient) return;

    // Monitor LCP
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.recordMetric('LCP', lastEntry.renderTime || lastEntry.loadTime);
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (error) {
        console.warn('LCP monitoring failed:', error);
      }

      // Monitor CLS
      try {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
              this.recordMetric('CLS', clsValue);
            }
          }
        });
        observer.observe({ entryTypes: ['layout-shift'] });
      } catch (error) {
        console.warn('CLS monitoring failed:', error);
      }

      // Monitor INP (Interaction to Next Paint)
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1] as any;
          this.recordMetric('INP', lastEntry.duration);
        });
        observer.observe({ entryTypes: ['event'] });
      } catch (error) {
        console.warn('INP monitoring failed:', error);
      }
    }

    // Monitor Navigation Timing
    window.addEventListener('load', () => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      const connectTime = perfData.responseEnd - perfData.requestStart;
      const renderTime = perfData.domComplete - perfData.domLoading;
      const domReadyTime = perfData.domContentLoadedEventEnd - perfData.navigationStart;

      this.recordMetric('Page Load Time', pageLoadTime);
      this.recordMetric('Connect Time', connectTime);
      this.recordMetric('Render Time', renderTime);
      this.recordMetric('DOM Ready', domReadyTime);
    });
  }

  private recordMetric(name: string, value: number): void {
    const rating = this.getRating(name, value);
    this.metrics.push({
      name,
      value,
      rating,
      timestamp: Date.now(),
    });

    if (value > 3000) {
      console.warn(`[Performance] ${name}: ${value}ms (${rating})`);
    }
  }

  private getRating(metric: string, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds: Record<string, { good: number; poor: number }> = {
      LCP: { good: 2500, poor: 4000 },
      FID: { good: 100, poor: 300 },
      INP: { good: 200, poor: 500 },
      CLS: { good: 0.1, poor: 0.25 },
      'Page Load Time': { good: 3000, poor: 6000 },
    };

    const threshold = thresholds[metric];
    if (!threshold) return 'needs-improvement';

    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  getMetrics(): PerformanceMetric[] {
    return this.metrics;
  }

  getLastMetric(name: string): PerformanceMetric | undefined {
    return [...this.metrics].reverse().find(m => m.name === name);
  }

  resetMetrics(): void {
    this.metrics = [];
  }

  reportMetrics(): void {
    if (!this.isClient) return;

    const report: Record<string, any> = {};
    const uniqueMetrics = new Map<string, PerformanceMetric>();

    // Get latest value for each metric
    this.metrics.forEach(metric => {
      uniqueMetrics.set(metric.name, metric);
    });

    uniqueMetrics.forEach((metric, name) => {
      report[name] = {
        value: Math.round(metric.value),
        rating: metric.rating,
      };
    });

    console.table(report);
  }
}

/**
 * Memory usage monitoring
 * Detect memory leaks and excessive memory consumption
 */
export class MemoryMonitor {
  private isClient = typeof window !== 'undefined';
  private snapshots: { timestamp: number; usage: number }[] = [];

  startMonitoring(intervalMs: number = 5000): () => void {
    if (!this.isClient || !('memory' in performance)) {
      console.warn('Memory monitoring not available');
      return () => {};
    }

    const interval = setInterval(() => {
      const usage = (performance as any).memory.usedJSHeapSize;
      this.snapshots.push({ timestamp: Date.now(), usage });

      if (usage > 50 * 1024 * 1024) {
        console.warn(`[Memory] High memory usage: ${(usage / 1024 / 1024).toFixed(2)}MB`);
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }

  getMemoryTrend(): { increasing: boolean; growth: number } {
    if (this.snapshots.length < 2) {
      return { increasing: false, growth: 0 };
    }

    const recent = this.snapshots.slice(-5); // Last 5 samples
    const avg1 = recent.slice(0, 2).reduce((sum, s) => sum + s.usage, 0) / 2;
    const avg2 = recent.slice(-2).reduce((sum, s) => sum + s.usage, 0) / 2;

    return {
      increasing: avg2 > avg1,
      growth: avg2 - avg1,
    };
  }

  resetSnapshots(): void {
    this.snapshots = [];
  }
}

/**
 * Route change performance monitoring
 * Track navigation performance between pages
 */
export class RouteMonitor {
  private routeStartTimes = new Map<string, number>();
  private routeMetrics: Map<string, number[]> = new Map();

  startRoute(routeName: string): void {
    this.routeStartTimes.set(routeName, Date.now());
  }

  endRoute(routeName: string): number {
    const startTime = this.routeStartTimes.get(routeName);
    if (!startTime) {
      console.warn(`No start time for route: ${routeName}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    this.routeStartTimes.delete(routeName);

    // Record metric
    const metrics = this.routeMetrics.get(routeName) || [];
    metrics.push(duration);
    this.routeMetrics.set(routeName, metrics);

    if (duration > 3000) {
      console.warn(`[Route Performance] ${routeName}: ${duration}ms`);
    }

    return duration;
  }

  getRouteMetrics(routeName: string): {
    count: number;
    avgTime: number;
    maxTime: number;
    minTime: number;
  } {
    const metrics = this.routeMetrics.get(routeName) || [];
    if (metrics.length === 0) {
      return { count: 0, avgTime: 0, maxTime: 0, minTime: 0 };
    }

    return {
      count: metrics.length,
      avgTime: Math.round(metrics.reduce((a, b) => a + b) / metrics.length),
      maxTime: Math.max(...metrics),
      minTime: Math.min(...metrics),
    };
  }

  getAllMetrics(): Record<string, any> {
    const result: Record<string, any> = {};
    this.routeMetrics.forEach((metrics, routeName) => {
      result[routeName] = this.getRouteMetrics(routeName);
    });
    return result;
  }

  resetMetrics(): void {
    this.routeStartTimes.clear();
    this.routeMetrics.clear();
  }
}

/**
 * Bundle size monitoring
 * Track JavaScript and CSS bundle sizes
 */
export class BundleMonitor {
  private bundleSize: Record<string, number> = {};

  recordBundleSize(name: string, sizeKb: number): void {
    this.bundleSize[name] = sizeKb;

    // Warn if bundle is large
    if (sizeKb > 100) {
      console.warn(`[Bundle] ${name} is ${sizeKb}KB (consider code splitting)`);
    }
  }

  getTotalSize(): number {
    return Object.values(this.bundleSize).reduce((a, b) => a + b, 0);
  }

  getBundleSizes(): Record<string, number> {
    return { ...this.bundleSize };
  }

  recordInitialBundleSize(): void {
    if (typeof document === 'undefined') return;

    let jsSize = 0;
    let cssSize = 0;

    // Estimate sizes from DOM
    document.querySelectorAll('script').forEach(script => {
      if (script.src) {
        // Rough estimate - would need actual sizes
        jsSize += script.textContent?.length || 0;
      }
    });

    document.querySelectorAll('link[rel="stylesheet"]').forEach(link => {
      // Would need to fetch actual size
      cssSize += 10; // Placeholder
    });

    this.recordBundleSize('JavaScript', jsSize / 1024);
    this.recordBundleSize('CSS', cssSize / 1024);
  }
}

// Export singleton instances
export const webVitals = new WebVitalsMonitor();
export const memoryMonitor = new MemoryMonitor();
export const routeMonitor = new RouteMonitor();
export const bundleMonitor = new BundleMonitor();
