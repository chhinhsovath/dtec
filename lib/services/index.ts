/**
 * Service Layer Index
 * Exports all service layer classes for easy importing
 * Currently using PostgreSQL direct connection via lib/database
 */

// Bilingual Services
export {
  getLocalizedCourses,
  getLocalizedCourseById,
  getLocalizedInstitutions,
  createBilingualCourse,
  updateBilingualCourse,
  getStudentEnrolledCourses,
  getTeacherCourses,
} from './bilingual-service';

/**
 * SERVICE LAYER SUMMARY
 *
 * Current architecture uses PostgreSQL direct connection via lib/database.
 * Bilingual support functions provide localized content retrieval.
 *
 * USAGE EXAMPLE:
 *
 * import { getLocalizedCourses, getStudentEnrolledCourses } from '@/lib/services';
 *
 * // Get all courses with Khmer localization
 * const courses = await getLocalizedCourses('km');
 *
 * // Get courses enrolled by a student
 * const enrolledCourses = await getStudentEnrolledCourses(studentId, 'km');
 *
 * PATTERN:
 * - All services use PostgreSQL direct connection via lib/database.query()
 * - Error handling is delegated to the caller
 * - All timestamps are handled by database defaults
 * - Bilingual support (English/Khmer) is built into all retrieval functions
 * - Language code: 'en' for English, 'km' for Khmer
 *
 * AVAILABLE SERVICES:
 *
 * Bilingual Services:
 * - getLocalizedCourses(language): Get all courses with localized names
 * - getLocalizedCourseById(courseId, language): Get single course with localization
 * - getLocalizedInstitutions(language): Get all institutions with localization
 * - createBilingualCourse(data): Create course with English/Khmer content
 * - updateBilingualCourse(courseId, data): Update course with bilingual fields
 * - getStudentEnrolledCourses(studentId, language): Get student's enrolled courses
 * - getTeacherCourses(teacherId, language): Get courses taught by teacher
 */
