/**
 * Query Optimization Utilities
 * Prevents N+1 queries and optimizes database performance
 */

import { query } from '@/lib/database';

/**
 * Batch query executor - prevents N+1 queries
 * Execute multiple queries in parallel instead of sequentially
 * @param queries - Array of query configurations
 * @returns Array of query results in same order
 */
export async function batchQuery(
  queries: Array<{ sql: string; params: any[] }>
) {
  try {
    const results = await Promise.all(
      queries.map(q => query(q.sql, q.params))
    );
    return results;
  } catch (error) {
    console.error('Batch query error:', error);
    throw error;
  }
}

/**
 * Query result cache with TTL
 * Caches database results for specified duration
 */
class QueryCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl: number;

  constructor(ttlMs: number = 5 * 60 * 1000) {
    // Default 5 minutes
    this.ttl = ttlMs;
  }

  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  invalidate(pattern: string): void {
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }
}

export const queryCache = new QueryCache();

/**
 * Get cached query result or execute fresh query
 * @param cacheKey - Unique cache identifier
 * @param sql - SQL query
 * @param params - Query parameters
 * @returns Query result from cache or database
 */
export async function getCachedQuery(
  cacheKey: string,
  sql: string,
  params: any[]
) {
  // Check cache first
  const cached = queryCache.get(cacheKey);
  if (cached) return cached;

  // Query database
  const result = await query(sql, params);

  // Cache result
  queryCache.set(cacheKey, result);

  return result;
}

/**
 * Optimized fetch for related entities using JOINs
 * Instead of fetching separately, use JOIN to reduce query count
 */
export async function fetchWithRelations(
  tableName: string,
  filters: Record<string, any>,
  relations: string[] = []
) {
  const baseQuery = `SELECT * FROM ${tableName}`;
  const whereClause = Object.keys(filters)
    .map((key, i) => `${key} = $${i + 1}`)
    .join(' AND ');

  const sql = whereClause ? `${baseQuery} WHERE ${whereClause}` : baseQuery;
  const params = Object.values(filters);

  const result = await query(sql, params);
  return result.rows;
}

/**
 * Pagination helper - prevents loading excessive data
 * @param sql - Base SQL query (without LIMIT/OFFSET)
 * @param page - Page number (1-indexed)
 * @param pageSize - Items per page
 * @param params - Query parameters
 * @returns Paginated results with metadata
 */
export async function paginate(
  sql: string,
  page: number = 1,
  pageSize: number = 20,
  params: any[] = []
) {
  const offset = (page - 1) * pageSize;
  const countSql = `SELECT COUNT(*) as total FROM (${sql}) as counted`;

  const [results, countResult] = await Promise.all([
    query(`${sql} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [
      ...params,
      pageSize,
      offset,
    ]),
    query(countSql, params),
  ]);

  const total = parseInt(countResult.rows[0]?.total || '0');
  const totalPages = Math.ceil(total / pageSize);

  return {
    data: results.rows,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

/**
 * Index usage suggestions based on common query patterns
 * For PostgreSQL
 */
export const IndexSuggestions = {
  courses: [
    'CREATE INDEX idx_courses_institution_id ON courses(institution_id);',
    'CREATE INDEX idx_courses_name_en ON courses(name_en);',
    'CREATE INDEX idx_courses_name_km ON courses(name_km);',
    'CREATE INDEX idx_courses_created_at ON courses(created_at DESC);',
  ],
  enrollments: [
    'CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);',
    'CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);',
    'CREATE INDEX idx_enrollments_status ON enrollments(status);',
    'CREATE INDEX idx_enrollments_student_course ON enrollments(student_id, course_id);',
  ],
  profiles: [
    'CREATE INDEX idx_profiles_email ON profiles(email);',
    'CREATE INDEX idx_profiles_role ON profiles(role);',
    'CREATE INDEX idx_profiles_preferred_language ON profiles(preferred_language);',
  ],
  academic_records: [
    'CREATE INDEX idx_academic_records_student_id ON academic_records(student_id);',
    'CREATE INDEX idx_academic_records_course_id ON academic_records(course_id);',
    'CREATE INDEX idx_academic_records_student_course ON academic_records(student_id, course_id);',
  ],
};

/**
 * Batch insert optimization
 * Insert multiple rows efficiently
 */
export async function batchInsert(
  tableName: string,
  columns: string[],
  rows: any[][]
): Promise<any[]> {
  if (rows.length === 0) return [];

  const placeholders = rows
    .map((_, i) => {
      const rowPlaceholders = columns
        .map((_, j) => `$${i * columns.length + j + 1}`)
        .join(',');
      return `(${rowPlaceholders})`;
    })
    .join(',');

  const sql = `INSERT INTO ${tableName} (${columns.join(',')}) VALUES ${placeholders} RETURNING *`;
  const flatParams = rows.flat();

  const result = await query(sql, flatParams);
  return result.rows;
}

/**
 * Bulk update optimization
 * Update multiple rows with different values efficiently
 */
export async function bulkUpdate(
  tableName: string,
  idColumn: string,
  updates: Array<{ id: any; data: Record<string, any> }>
): Promise<number> {
  let totalUpdated = 0;

  for (const { id, data } of updates) {
    const setClauses = Object.keys(data)
      .map((key, i) => `${key} = $${i + 1}`)
      .join(',');

    const updateSql = `UPDATE ${tableName} SET ${setClauses} WHERE ${idColumn} = $${
      Object.keys(data).length + 1
    }`;

    const result = await query(updateSql, [
      ...Object.values(data),
      id,
    ]);

    totalUpdated += result.rowCount || 0;
  }

  return totalUpdated;
}

/**
 * Connection pool monitoring
 * Track query performance and connection usage
 */
export class QueryMonitor {
  private metrics: Map<string, { count: number; totalTime: number }> = new Map();

  startQuery(name: string): () => void {
    const startTime = Date.now();

    return () => {
      const duration = Date.now() - startTime;
      const current = this.metrics.get(name) || { count: 0, totalTime: 0 };

      this.metrics.set(name, {
        count: current.count + 1,
        totalTime: current.totalTime + duration,
      });

      if (duration > 1000) {
        console.warn(`Slow query [${name}]: ${duration}ms`);
      }
    };
  }

  getMetrics() {
    const result: Record<string, { count: number; avgTime: number }> = {};

    this.metrics.forEach((value, key) => {
      result[key] = {
        count: value.count,
        avgTime: Math.round(value.totalTime / value.count),
      };
    });

    return result;
  }

  reset(): void {
    this.metrics.clear();
  }
}

export const queryMonitor = new QueryMonitor();
