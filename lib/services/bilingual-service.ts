/**
 * Bilingual Service
 * Handles fetching and managing bilingual content from the database
 */

import { query } from '@/lib/database';
import {
  getLocalizedName,
  getLocalizedDescription,
  transformToLocalized,
  BilingualRecord,
} from '@/lib/i18n/bilingual-utils';
import { Language } from '@/lib/i18n/i18n';

/**
 * Fetch all courses with localized names
 * @param language - Target language (en or km)
 * @returns Array of courses with localized content
 */
export async function getLocalizedCourses(language: Language = 'km') {
  try {
    const result = await query(
      `
      SELECT
        id,
        code,
        name,
        name_en,
        name_km,
        description,
        description_en,
        description_km,
        institution_id,
        created_at,
        updated_at
      FROM courses
      ORDER BY created_at DESC
      `,
      []
    );

    return transformToLocalized(result.rows as BilingualRecord[], language);
  } catch (error) {
    console.error('Error fetching localized courses:', error);
    throw error;
  }
}

/**
 * Fetch course by ID with localized content
 * @param courseId - Course ID
 * @param language - Target language (en or km)
 * @returns Course with localized content
 */
export async function getLocalizedCourseById(
  courseId: string,
  language: Language = 'km'
) {
  try {
    const result = await query(
      `
      SELECT
        id,
        code,
        name,
        name_en,
        name_km,
        description,
        description_en,
        description_km,
        institution_id,
        created_at,
        updated_at
      FROM courses
      WHERE id = $1
      `,
      [courseId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const record = result.rows[0] as BilingualRecord;
    return {
      ...record,
      name: getLocalizedName(record, language),
      description: getLocalizedDescription(record, language),
    };
  } catch (error) {
    console.error('Error fetching localized course:', error);
    throw error;
  }
}

/**
 * Fetch all institutions with localized names
 * @param language - Target language (en or km)
 * @returns Array of institutions with localized content
 */
export async function getLocalizedInstitutions(language: Language = 'km') {
  try {
    const result = await query(
      `
      SELECT
        id,
        name,
        name_en,
        name_km,
        code,
        description,
        description_en,
        description_km,
        created_at,
        updated_at
      FROM institutions
      ORDER BY created_at DESC
      `,
      []
    );

    return transformToLocalized(result.rows as BilingualRecord[], language);
  } catch (error) {
    console.error('Error fetching localized institutions:', error);
    throw error;
  }
}

/**
 * Create a new course with bilingual content
 * @param courseData - Course data with bilingual fields
 * @returns Created course record
 */
export async function createBilingualCourse(courseData: {
  code: string;
  name_en: string;
  name_km: string;
  description_en?: string;
  description_km?: string;
  institution_id?: string;
}) {
  try {
    const result = await query(
      `
      INSERT INTO courses (code, name, name_en, name_km, description, description_en, description_km, institution_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, code, name, name_en, name_km, description, description_en, description_km, institution_id, created_at, updated_at
      `,
      [
        courseData.code,
        courseData.name_en || courseData.name_km, // Use available language as default name
        courseData.name_en,
        courseData.name_km,
        courseData.description_en || courseData.description_km || null,
        courseData.description_en || null,
        courseData.description_km || null,
        courseData.institution_id || null,
      ]
    );

    return result.rows[0] as BilingualRecord;
  } catch (error) {
    console.error('Error creating bilingual course:', error);
    throw error;
  }
}

/**
 * Update a course with bilingual content
 * @param courseId - Course ID
 * @param courseData - Updated course data
 * @returns Updated course record
 */
export async function updateBilingualCourse(
  courseId: string,
  courseData: Partial<{
    code: string;
    name_en: string;
    name_km: string;
    description_en: string;
    description_km: string;
  }>
) {
  try {
    // Build dynamic UPDATE query
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (courseData.code !== undefined) {
      fields.push(`code = $${paramIndex++}`);
      values.push(courseData.code);
    }
    if (courseData.name_en !== undefined) {
      fields.push(`name_en = $${paramIndex++}`);
      values.push(courseData.name_en);
    }
    if (courseData.name_km !== undefined) {
      fields.push(`name_km = $${paramIndex++}`);
      values.push(courseData.name_km);
    }
    if (courseData.description_en !== undefined) {
      fields.push(`description_en = $${paramIndex++}`);
      values.push(courseData.description_en);
    }
    if (courseData.description_km !== undefined) {
      fields.push(`description_km = $${paramIndex++}`);
      values.push(courseData.description_km);
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push(`updated_at = NOW()`);
    values.push(courseId);

    const result = await query(
      `
      UPDATE courses
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, code, name, name_en, name_km, description, description_en, description_km, institution_id, created_at, updated_at
      `,
      values
    );

    return result.rows[0] || null;
  } catch (error) {
    console.error('Error updating bilingual course:', error);
    throw error;
  }
}

/**
 * Get courses enrolled by a student with localized names
 * @param studentId - Student ID
 * @param language - Target language (en or km)
 * @returns Array of enrolled courses with localized content
 */
export async function getStudentEnrolledCourses(
  studentId: string,
  language: Language = 'km'
) {
  try {
    const result = await query(
      `
      SELECT DISTINCT
        c.id,
        c.code,
        c.name,
        c.name_en,
        c.name_km,
        c.description,
        c.description_en,
        c.description_km,
        c.institution_id,
        e.enrollment_date,
        e.status,
        c.created_at,
        c.updated_at
      FROM courses c
      JOIN enrollments e ON c.id = e.course_id
      WHERE e.student_id = $1
      ORDER BY e.enrollment_date DESC
      `,
      [studentId]
    );

    return result.rows.map((record: any) => ({
      ...record,
      name: getLocalizedName(record, language),
      description: getLocalizedDescription(record, language),
    }));
  } catch (error) {
    console.error('Error fetching student enrolled courses:', error);
    throw error;
  }
}

/**
 * Get courses taught by a teacher with localized names
 * @param teacherId - Teacher ID
 * @param language - Target language (en or km)
 * @returns Array of taught courses with localized content
 */
export async function getTeacherCourses(
  teacherId: string,
  language: Language = 'km'
) {
  try {
    const result = await query(
      `
      SELECT DISTINCT
        c.id,
        c.code,
        c.name,
        c.name_en,
        c.name_km,
        c.description,
        c.description_en,
        c.description_km,
        c.institution_id,
        tc.created_at,
        c.updated_at
      FROM courses c
      JOIN teacher_courses tc ON c.id = tc.course_id
      WHERE tc.teacher_id = $1
      ORDER BY tc.created_at DESC
      `,
      [teacherId]
    );

    return result.rows.map((record: any) => ({
      ...record,
      name: getLocalizedName(record, language),
      description: getLocalizedDescription(record, language),
    }));
  } catch (error) {
    console.error('Error fetching teacher courses:', error);
    throw error;
  }
}
