import redis from '../config/redis.js';
import type { MatchScore, MatchResult } from './matchingEngine.js';

/**
 * Cache key prefixes
 */
const CACHE_PREFIX = {
  MATCH_SCORE: 'match:score:',
  STUDENT_MATCHES: 'match:student:',
  PROJECT_MATCHES: 'match:project:',
} as const;

/**
 * Cache expiration time (1 hour in seconds)
 */
const CACHE_TTL = 3600;

/**
 * Matching cache service for Redis-based caching
 */
export class MatchingCache {
  /**
   * Generate cache key for student-project match score
   */
  private getMatchScoreKey(studentId: string, projectId: string): string {
    return `${CACHE_PREFIX.MATCH_SCORE}${studentId}:${projectId}`;
  }

  /**
   * Generate cache key for student's project recommendations
   */
  private getStudentMatchesKey(studentId: string): string {
    return `${CACHE_PREFIX.STUDENT_MATCHES}${studentId}`;
  }

  /**
   * Generate cache key for project's student matches
   */
  private getProjectMatchesKey(projectId: string): string {
    return `${CACHE_PREFIX.PROJECT_MATCHES}${projectId}`;
  }

  /**
   * Cache a match score result
   */
  async cacheMatchScore(studentId: string, projectId: string, score: MatchScore): Promise<void> {
    try {
      const key = this.getMatchScoreKey(studentId, projectId);
      await redis.setex(key, CACHE_TTL, JSON.stringify(score));
    } catch (error) {
      console.error('Failed to cache match score:', error);
      // Don't throw - caching failure shouldn't break the application
    }
  }

  /**
   * Get cached match score
   */
  async getCachedMatchScore(studentId: string, projectId: string): Promise<MatchScore | null> {
    try {
      const key = this.getMatchScoreKey(studentId, projectId);
      const cached = await redis.get(key);

      if (cached) {
        return JSON.parse(cached) as MatchScore;
      }

      return null;
    } catch (error) {
      console.error('Failed to get cached match score:', error);
      return null;
    }
  }

  /**
   * Cache student's project matches
   */
  async cacheStudentMatches(studentId: string, matches: MatchResult[]): Promise<void> {
    try {
      const key = this.getStudentMatchesKey(studentId);
      await redis.setex(key, CACHE_TTL, JSON.stringify(matches));
    } catch (error) {
      console.error('Failed to cache student matches:', error);
    }
  }

  /**
   * Get cached student matches
   */
  async getCachedStudentMatches(studentId: string): Promise<MatchResult[] | null> {
    try {
      const key = this.getStudentMatchesKey(studentId);
      const cached = await redis.get(key);

      if (cached) {
        return JSON.parse(cached) as MatchResult[];
      }

      return null;
    } catch (error) {
      console.error('Failed to get cached student matches:', error);
      return null;
    }
  }

  /**
   * Cache project's student matches
   */
  async cacheProjectMatches(projectId: string, matches: MatchResult[]): Promise<void> {
    try {
      const key = this.getProjectMatchesKey(projectId);
      await redis.setex(key, CACHE_TTL, JSON.stringify(matches));
    } catch (error) {
      console.error('Failed to cache project matches:', error);
    }
  }

  /**
   * Get cached project matches
   */
  async getCachedProjectMatches(projectId: string): Promise<MatchResult[] | null> {
    try {
      const key = this.getProjectMatchesKey(projectId);
      const cached = await redis.get(key);

      if (cached) {
        return JSON.parse(cached) as MatchResult[];
      }

      return null;
    } catch (error) {
      console.error('Failed to get cached project matches:', error);
      return null;
    }
  }

  /**
   * Invalidate all caches for a specific student
   * Called when student profile is updated
   */
  async invalidateStudentCache(studentId: string): Promise<void> {
    try {
      // Get all keys related to this student
      const matchScorePattern = `${CACHE_PREFIX.MATCH_SCORE}${studentId}:*`;
      const studentMatchesKey = this.getStudentMatchesKey(studentId);

      // Delete student matches cache
      await redis.del(studentMatchesKey);

      // Delete all match score caches for this student
      const matchScoreKeys = await redis.keys(matchScorePattern);
      if (matchScoreKeys.length > 0) {
        await redis.del(...matchScoreKeys);
      }

      // Also need to invalidate project matches that might include this student
      // This is more expensive, so we use a pattern scan
      const projectMatchesPattern = `${CACHE_PREFIX.PROJECT_MATCHES}*`;
      const projectKeys = await redis.keys(projectMatchesPattern);
      if (projectKeys.length > 0) {
        await redis.del(...projectKeys);
      }

      console.log(`✅ Invalidated cache for student: ${studentId}`);
    } catch (error) {
      console.error('Failed to invalidate student cache:', error);
    }
  }

  /**
   * Invalidate all caches for a specific project
   * Called when project is updated or status changes
   */
  async invalidateProjectCache(projectId: string): Promise<void> {
    try {
      // Get all keys related to this project
      const matchScorePattern = `${CACHE_PREFIX.MATCH_SCORE}*:${projectId}`;
      const projectMatchesKey = this.getProjectMatchesKey(projectId);

      // Delete project matches cache
      await redis.del(projectMatchesKey);

      // Delete all match score caches for this project
      const matchScoreKeys = await redis.keys(matchScorePattern);
      if (matchScoreKeys.length > 0) {
        await redis.del(...matchScoreKeys);
      }

      // Also need to invalidate student matches that might include this project
      const studentMatchesPattern = `${CACHE_PREFIX.STUDENT_MATCHES}*`;
      const studentKeys = await redis.keys(studentMatchesPattern);
      if (studentKeys.length > 0) {
        await redis.del(...studentKeys);
      }

      console.log(`✅ Invalidated cache for project: ${projectId}`);
    } catch (error) {
      console.error('Failed to invalidate project cache:', error);
    }
  }

  /**
   * Clear all matching caches
   * Useful for maintenance or when cache becomes stale
   */
  async clearAllCaches(): Promise<void> {
    try {
      const patterns = [
        `${CACHE_PREFIX.MATCH_SCORE}*`,
        `${CACHE_PREFIX.STUDENT_MATCHES}*`,
        `${CACHE_PREFIX.PROJECT_MATCHES}*`,
      ];

      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }

      console.log('✅ Cleared all matching caches');
    } catch (error) {
      console.error('Failed to clear all caches:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    matchScoreCount: number;
    studentMatchesCount: number;
    projectMatchesCount: number;
  }> {
    try {
      const [matchScoreKeys, studentMatchesKeys, projectMatchesKeys] = await Promise.all([
        redis.keys(`${CACHE_PREFIX.MATCH_SCORE}*`),
        redis.keys(`${CACHE_PREFIX.STUDENT_MATCHES}*`),
        redis.keys(`${CACHE_PREFIX.PROJECT_MATCHES}*`),
      ]);

      return {
        matchScoreCount: matchScoreKeys.length,
        studentMatchesCount: studentMatchesKeys.length,
        projectMatchesCount: projectMatchesKeys.length,
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        matchScoreCount: 0,
        studentMatchesCount: 0,
        projectMatchesCount: 0,
      };
    }
  }
}

/**
 * Export singleton instance
 */
export const matchingCache = new MatchingCache();
