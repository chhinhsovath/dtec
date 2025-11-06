import { Pool, PoolClient, QueryResult } from 'pg';

/**
 * PostgreSQL Connection Pool
 * Uses environment variables from .env.local for configuration
 *
 * Environment Variables:
 * - DB_HOST: Database host (default: localhost)
 * - DB_PORT: Database port (default: 5432)
 * - DB_NAME: Database name
 * - DB_USER: Database user
 * - DB_PASSWORD: Database password
 * - DB_SSL: Use SSL? (default: false)
 * - DB_POOL_MIN: Minimum pool connections (default: 2)
 * - DB_POOL_MAX: Maximum pool connections (default: 10)
 */

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'dtech',
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD,
  ssl:
    process.env.DB_SSL === 'true'
      ? { rejectUnauthorized: false }
      : false,
  max: parseInt(process.env.DB_POOL_MAX || '10', 10),
  min: parseInt(process.env.DB_POOL_MIN || '2', 10),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

/**
 * Handles pool errors
 */
pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

/**
 * Execute a SQL query with optional parameters
 *
 * @param text - SQL query string
 * @param params - Query parameters (for parameterized queries)
 * @returns Query result
 *
 * @example
 * ```typescript
 * const result = await query('SELECT * FROM profiles WHERE id = $1', [userId]);
 * console.log(result.rows);
 * ```
 */
export async function query(
  text: string,
  params?: unknown[]
): Promise<QueryResult> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;

    if (process.env.NODE_ENV === 'development') {
      console.log('Executed query', {
        text: text.substring(0, 50) + '...',
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }

    return result;
  } catch (error) {
    console.error('Database query error', {
      text: text.substring(0, 100),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
}

/**
 * Get a dedicated client from the pool for transactions
 *
 * @returns Database client
 *
 * @example
 * ```typescript
 * const client = await getClient();
 * try {
 *   await client.query('BEGIN');
 *   await client.query('INSERT INTO ...');
 *   await client.query('COMMIT');
 * } catch (error) {
 *   await client.query('ROLLBACK');
 * } finally {
 *   client.release();
 * }
 * ```
 */
export async function getClient(): Promise<PoolClient> {
  const client = await pool.connect();
  return client;
}

/**
 * Test the database connection
 *
 * @returns true if connection successful, false otherwise
 *
 * @example
 * ```typescript
 * const isConnected = await testConnection();
 * if (isConnected) {
 *   console.log('Database is ready');
 * }
 * ```
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful at', result.rows[0].now);
    return true;
  } catch (error) {
    console.error(
      '❌ Database connection failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    return false;
  }
}

/**
 * Get current pool status
 *
 * @returns Pool status information
 *
 * @example
 * ```typescript
 * const status = getPoolStatus();
 * console.log(`Active connections: ${status.totalConnections}`);
 * ```
 */
export function getPoolStatus() {
  return {
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingRequests: pool.waitingCount,
  };
}

/**
 * Health check for the database
 *
 * @returns Health status object
 *
 * @example
 * ```typescript
 * const health = await healthCheck();
 * if (health.healthy) {
 *   console.log('System is healthy');
 * }
 * ```
 */
export async function healthCheck() {
  try {
    const result = await pool.query('SELECT 1');
    const status = getPoolStatus();

    return {
      healthy: true,
      database: 'connected',
      connectionPool: status,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      healthy: false,
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Close the connection pool (call on application shutdown)
 *
 * @example
 * ```typescript
 * process.on('SIGINT', async () => {
 *   await closePool();
 *   process.exit(0);
 * });
 * ```
 */
export async function closePool(): Promise<void> {
  console.log('Closing database connection pool...');
  await pool.end();
  console.log('Database connections closed');
}

// Export the pool for advanced use cases
export { pool };

// Log pool info on module load
if (process.env.NODE_ENV === 'development') {
  console.log('📊 Database Configuration:', {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '5432',
    database: process.env.DB_NAME || 'dtech',
    user: process.env.DB_USER || 'admin',
    maxConnections: process.env.DB_POOL_MAX || '10',
  });
}
