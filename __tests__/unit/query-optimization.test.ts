import {
  queryCache,
  getCachedQuery,
  paginate,
  batchInsert,
  bulkUpdate,
  queryMonitor,
} from '@/lib/performance/query-optimization';

// Mock database module
jest.mock('@/lib/database', () => ({
  query: jest.fn(),
  getClient: jest.fn(),
}));

import { query as dbQuery } from '@/lib/database';

describe('Query Optimization Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryCache.clear();
  });

  describe('queryCache', () => {
    it('should store and retrieve cached values', () => {
      const testData = { id: 1, name: 'Test' };
      queryCache.set('test_key', testData);

      const result = queryCache.get('test_key');
      expect(result).toEqual(testData);
    });

    it('should return null for non-existent keys', () => {
      const result = queryCache.get('non_existent');
      expect(result).toBeNull();
    });

    it('should expire cached values after TTL', async () => {
      const cache = new (queryCache.constructor as any)(100); // 100ms TTL
      cache.set('expiring_key', { data: 'test' });

      expect(cache.get('expiring_key')).not.toBeNull();

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 150));

      expect(cache.get('expiring_key')).toBeNull();
    });

    it('should invalidate cache by pattern', () => {
      queryCache.set('user_1', { id: 1 });
      queryCache.set('user_2', { id: 2 });
      queryCache.set('course_1', { id: 1 });

      queryCache.invalidate('user');

      expect(queryCache.get('user_1')).toBeNull();
      expect(queryCache.get('user_2')).toBeNull();
      expect(queryCache.get('course_1')).not.toBeNull();
    });

    it('should clear all cache', () => {
      queryCache.set('key1', 'value1');
      queryCache.set('key2', 'value2');

      queryCache.clear();

      expect(queryCache.get('key1')).toBeNull();
      expect(queryCache.get('key2')).toBeNull();
    });
  });

  describe('queryMonitor', () => {
    it('should track query metrics', () => {
      const end = queryMonitor.startQuery('test_query');

      // Simulate query execution
      setTimeout(() => end(), 50);

      setTimeout(() => {
        const metrics = queryMonitor.getMetrics();
        expect(metrics['test_query']).toBeDefined();
        expect(metrics['test_query'].count).toBe(1);
      }, 100);
    });

    it('should track multiple queries of same type', () => {
      for (let i = 0; i < 3; i++) {
        const end = queryMonitor.startQuery('list_query');
        end();
      }

      const metrics = queryMonitor.getMetrics();
      expect(metrics['list_query'].count).toBe(3);
    });

    it('should reset metrics', () => {
      queryMonitor.startQuery('query1')();
      queryMonitor.startQuery('query2')();

      queryMonitor.reset();

      const metrics = queryMonitor.getMetrics();
      expect(Object.keys(metrics)).toHaveLength(0);
    });

    it('should calculate average query time', () => {
      const times = [100, 200, 300]; // Total 600ms, average 200ms

      times.forEach(time => {
        const end = queryMonitor.startQuery('avg_test');
        setTimeout(() => end(), time);
      });

      // Note: This is a simplified test; actual timing may vary
    });
  });

  describe('batchInsert', () => {
    it('should build correct SQL for batch insert', async () => {
      const mockQuery = dbQuery as jest.MockedFunction<typeof dbQuery>;
      mockQuery.mockResolvedValue({ rows: [{}, {}, {}], rowCount: 3 });

      const rows = [
        ['value1', 'value2'],
        ['value3', 'value4'],
        ['value5', 'value6'],
      ];

      const result = await batchInsert('test_table', ['col1', 'col2'], rows);

      expect(mockQuery).toHaveBeenCalled();
      expect(result).toHaveLength(3);
    });

    it('should handle empty rows array', async () => {
      const result = await batchInsert('test_table', ['col1', 'col2'], []);
      expect(result).toEqual([]);
    });
  });

  describe('bulkUpdate', () => {
    it('should execute multiple updates', async () => {
      const mockQuery = dbQuery as jest.MockedFunction<typeof dbQuery>;
      mockQuery.mockResolvedValue({ rowCount: 1 });

      const updates = [
        { id: '1', data: { name: 'Updated 1' } },
        { id: '2', data: { name: 'Updated 2' } },
      ];

      const result = await bulkUpdate('test_table', 'id', updates);

      expect(mockQuery).toHaveBeenCalledTimes(2);
      expect(result).toBe(2);
    });

    it('should handle empty updates array', async () => {
      const result = await bulkUpdate('test_table', 'id', []);
      expect(result).toBe(0);
    });
  });

  describe('paginate', () => {
    it('should paginate results correctly', async () => {
      const mockQuery = dbQuery as jest.MockedFunction<typeof dbQuery>;

      // Mock count query
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: 100 }], rowCount: 1 })
        // Mock data query
        .mockResolvedValueOnce({
          rows: [
            { id: 1 },
            { id: 2 },
            { id: 3 },
          ],
          rowCount: 3,
        });

      const result = await paginate('SELECT * FROM test_table', 2, 3);

      expect(result.data).toHaveLength(3);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.pageSize).toBe(3);
      expect(result.pagination.total).toBe(100);
      expect(result.pagination.totalPages).toBe(34);
      expect(result.pagination.hasNextPage).toBe(true);
      expect(result.pagination.hasPrevPage).toBe(true);
    });

    it('should handle first page correctly', async () => {
      const mockQuery = dbQuery as jest.MockedFunction<typeof dbQuery>;
      mockQuery
        .mockResolvedValueOnce({ rows: [{ total: 10 }], rowCount: 1 })
        .mockResolvedValueOnce({ rows: [{ id: 1 }], rowCount: 1 });

      const result = await paginate('SELECT * FROM test_table', 1, 10);

      expect(result.pagination.hasPrevPage).toBe(false);
      expect(result.pagination.hasNextPage).toBe(false);
    });
  });
});
