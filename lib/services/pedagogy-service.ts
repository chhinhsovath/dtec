/**
 * Pedagogy Service Layer
 * Handles all database operations for teacher education program management
 * Supports: Competencies, Practicum, Mentorship, Portfolio, Certification
 */

import { query } from '@/lib/database';

// ============================================================================
// COMPETENCY ASSESSMENT
// ============================================================================

export async function getStudentCompetencies(graduateStudentId: string) {
  const result = await query(
    `SELECT
      ca.id as competency_assessment_id,
      ca.graduate_student_id,
      ca.competency_id,
      cl.level_number as current_level,
      ca.score,
      ca.assessment_date,
      ca.assessment_comments_km as feedback_text,
      cf.competency_number,
      cf.name_km,
      cf.name_en,
      cf.description_km,
      cf.description_en
    FROM competency_assessments ca
    JOIN competency_framework cf ON ca.competency_id = cf.id
    LEFT JOIN competency_levels cl ON ca.competency_level_id = cl.id
    WHERE ca.graduate_student_id = $1
    ORDER BY cf.competency_number ASC`,
    [graduateStudentId]
  );
  return result.rows;
}

export async function updateCompetencyAssessment(
  graduateStudentId: string,
  competencyId: string,
  currentLevel: number,
  score: number,
  feedbackText: string,
  mentorId: string
) {
  // First, get the competency_level_id for the given level number
  const levelResult = await query(
    `SELECT id FROM competency_levels WHERE level_number = $1`,
    [currentLevel]
  );
  const competencyLevelId = levelResult.rows[0]?.id;

  const result = await query(
    `INSERT INTO competency_assessments
      (graduate_student_id, competency_id, mentor_id, competency_level_id, score, assessment_comments_km, assessment_date)
    VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)
    ON CONFLICT (graduate_student_id, competency_id, assessment_date)
    DO UPDATE SET
      competency_level_id = $4,
      score = $5,
      assessment_comments_km = $6,
      updated_at = CURRENT_TIMESTAMP
    RETURNING *`,
    [graduateStudentId, competencyId, mentorId, competencyLevelId, score, feedbackText]
  );
  return result.rows[0];
}

export async function getCompetencyFramework(programId: string) {
  const result = await query(
    `SELECT * FROM competency_framework
     WHERE program_id = $1
     ORDER BY competency_number ASC`,
    [programId]
  );
  return result.rows;
}

// ============================================================================
// PRACTICUM MANAGEMENT
// ============================================================================

export async function getStudentPracticumPlacement(graduateStudentId: string) {
  const result = await query(
    `SELECT
      pp.placement_id,
      pp.graduate_student_id,
      pp.partner_school_id,
      pp.start_date,
      pp.end_date,
      pp.placement_status,
      pp.teaching_hours_target,
      pp.teaching_hours_actual,
      pp.placement_supervisor_id,
      ps.school_name_km,
      ps.school_name_en,
      ps.location,
      ps.contact_person,
      ps.contact_phone
    FROM practicum_placements pp
    LEFT JOIN partner_schools ps ON pp.partner_school_id = ps.partner_school_id
    WHERE pp.graduate_student_id = $1
    LIMIT 1`,
    [graduateStudentId]
  );
  return result.rows[0] || null;
}

export async function logTeachingHours(
  graduateStudentId: string,
  placementId: string,
  hoursLogged: number,
  activityDate: string,
  notes: string
) {
  const result = await query(
    `INSERT INTO teaching_hours_log
      (graduate_student_id, placement_id, hours_logged, activity_date, notes)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *`,
    [graduateStudentId, placementId, hoursLogged, activityDate, notes]
  );

  // Update total hours in placement
  await query(
    `UPDATE practicum_placements
     SET teaching_hours_actual = (
       SELECT COALESCE(SUM(hours_logged), 0)
       FROM teaching_hours_log
       WHERE placement_id = $1
     )
     WHERE placement_id = $1`,
    [placementId]
  );

  return result.rows[0];
}

export async function getTotalTeachingHours(graduateStudentId: string) {
  const result = await query(
    `SELECT
      COALESCE(SUM(hours_logged), 0) as total_hours,
      COUNT(*) as log_entries
    FROM teaching_hours_log
    WHERE graduate_student_id = $1`,
    [graduateStudentId]
  );
  return result.rows[0];
}

export async function getTeachingHoursLog(graduateStudentId: string) {
  const result = await query(
    `SELECT * FROM teaching_hours_log
    WHERE graduate_student_id = $1
    ORDER BY activity_date DESC`,
    [graduateStudentId]
  );
  return result.rows;
}

export async function createTeachingObservation(
  graduateStudentId: string,
  placementId: string,
  mentorId: string,
  observationDate: string,
  lessonTitle: string,
  gradeLevel: string,
  strengthsKm: string,
  strengthsEn: string,
  areasForImprovementKm: string,
  areasForImprovementEn: string,
  recommendationsKm: string,
  recommendationsEn: string,
  overallScore: number
) {
  const result = await query(
    `INSERT INTO teaching_observations
      (graduate_student_id, placement_id, mentor_id, observation_date, lesson_title,
       grade_level, strengths_km, strengths_en, areas_for_improvement_km,
       areas_for_improvement_en, recommendations_km, recommendations_en, overall_score)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    RETURNING *`,
    [
      graduateStudentId, placementId, mentorId, observationDate, lessonTitle,
      gradeLevel, strengthsKm, strengthsEn, areasForImprovementKm,
      areasForImprovementEn, recommendationsKm, recommendationsEn, overallScore
    ]
  );
  return result.rows[0];
}

export async function getTeachingObservations(graduateStudentId: string) {
  const result = await query(
    `SELECT * FROM teaching_observations
    WHERE graduate_student_id = $1
    ORDER BY observation_date DESC`,
    [graduateStudentId]
  );
  return result.rows;
}

// ============================================================================
// MENTORSHIP
// ============================================================================

export async function getMentorMentees(mentorId: string) {
  const result = await query(
    `SELECT
      mr.id as mentor_relationship_id,
      mr.mentor_id,
      mr.graduate_student_id,
      mr.assignment_date,
      mr.status as relationship_status,
      gs.student_code,
      p.email,
      p.full_name,
      c.batch_code,
      c.batch_year
    FROM mentor_relationships mr
    JOIN graduate_students gs ON mr.graduate_student_id = gs.id
    JOIN profiles p ON gs.user_id = p.id
    JOIN cohorts c ON gs.cohort_id = c.id
    WHERE mr.mentor_id = $1
    ORDER BY p.full_name ASC`,
    [mentorId]
  );
  return result.rows;
}

export async function createMentorSession(
  mentorId: string,
  graduateStudentId: string,
  sessionDate: string,
  sessionDurationMinutes: number,
  topicKm: string,
  topicEn: string,
  feedbackKm: string,
  feedbackEn: string,
  actionItemsKm: string,
  actionItemsEn: string
) {
  const result = await query(
    `INSERT INTO mentor_sessions
      (mentor_id, graduate_student_id, session_date, session_duration_minutes,
       topic_km, topic_en, feedback_km, feedback_en, action_items_km, action_items_en)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      mentorId, graduateStudentId, sessionDate, sessionDurationMinutes,
      topicKm, topicEn, feedbackKm, feedbackEn, actionItemsKm, actionItemsEn
    ]
  );
  return result.rows[0];
}

export async function getMentorSessions(graduateStudentId: string, mentorId?: string) {
  const params = mentorId ? [graduateStudentId, mentorId] : [graduateStudentId];
  const whereClause = mentorId ? 'AND mentor_id = $2' : '';

  const result = await query(
    `SELECT * FROM mentor_sessions
    WHERE graduate_student_id = $1 ${whereClause}
    ORDER BY session_date DESC`,
    params
  );
  return result.rows;
}

// ============================================================================
// PORTFOLIO & EVIDENCE
// ============================================================================

export async function getStudentPortfolio(graduateStudentId: string) {
  const result = await query(
    `SELECT * FROM e_portfolios
    WHERE graduate_student_id = $1
    LIMIT 1`,
    [graduateStudentId]
  );
  return result.rows[0] || null;
}

export async function createPortfolioEvidence(
  portfolioId: string,
  competencyId: string,
  evidenceTypeKm: string,
  evidenceTypeEn: string,
  titleKm: string,
  titleEn: string,
  descriptionKm: string,
  descriptionEn: string,
  fileUrl: string,
  submissionDate: string
) {
  const result = await query(
    `INSERT INTO portfolio_evidence
      (portfolio_id, competency_id, evidence_type_km, evidence_type_en,
       title_km, title_en, description_km, description_en, file_url, submission_date)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING *`,
    [
      portfolioId, competencyId, evidenceTypeKm, evidenceTypeEn,
      titleKm, titleEn, descriptionKm, descriptionEn, fileUrl, submissionDate
    ]
  );
  return result.rows[0];
}

export async function getPortfolioEvidence(portfolioId: string, competencyId?: string) {
  const whereClause = competencyId ? 'AND competency_id = $2' : '';
  const params = competencyId ? [portfolioId, competencyId] : [portfolioId];

  const result = await query(
    `SELECT * FROM portfolio_evidence
    WHERE portfolio_id = $1 ${whereClause}
    ORDER BY submission_date DESC`,
    params
  );
  return result.rows;
}

// ============================================================================
// CERTIFICATION
// ============================================================================

export async function getCertificationStatus(graduateStudentId: string) {
  const result = await query(
    `SELECT
      cs.certification_status_id,
      cs.graduate_student_id,
      cs.requirement_id,
      cs.is_completed,
      cs.completion_date,
      cr.requirement_name_km,
      cr.requirement_name_en,
      cr.requirement_type
    FROM certification_status cs
    JOIN certification_requirements cr ON cs.requirement_id = cr.requirement_id
    WHERE cs.graduate_student_id = $1
    ORDER BY cr.requirement_type, cr.requirement_name_en`,
    [graduateStudentId]
  );
  return result.rows;
}

export async function checkCertificationReadiness(graduateStudentId: string) {
  const result = await query(
    `SELECT
      COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_requirements,
      COUNT(*) as total_requirements,
      COUNT(CASE WHEN is_completed = true THEN 1 END)::float /
        COUNT(*)::float as completion_percentage
    FROM certification_status
    WHERE graduate_student_id = $1`,
    [graduateStudentId]
  );

  const row = result.rows[0];
  return {
    completedRequirements: row.completed_requirements,
    totalRequirements: row.total_requirements,
    completionPercentage: parseFloat(row.completion_percentage || 0),
    isReadyForCertification: row.completed_requirements === row.total_requirements
  };
}

export async function issueFinalCertification(
  graduateStudentId: string,
  programId: string,
  certificationNumber: string,
  issuedDate: string,
  expiryDate: string
) {
  const result = await query(
    `INSERT INTO final_certifications
      (graduate_student_id, program_id, certification_number, issued_date, expiry_date, certification_status)
    VALUES ($1, $2, $3, $4, $5, 'active')
    RETURNING *`,
    [graduateStudentId, programId, certificationNumber, issuedDate, expiryDate]
  );
  return result.rows[0];
}

// ============================================================================
// PROGRAM & PHASE MANAGEMENT
// ============================================================================

export async function getProgramDetails(programCode: string) {
  const result = await query(
    `SELECT * FROM teacher_education_programs
    WHERE code = $1`,
    [programCode]
  );
  return result.rows[0] || null;
}

export async function getProgramPhases(programId: string) {
  const result = await query(
    `SELECT * FROM program_phases
    WHERE program_id = $1
    ORDER BY phase_number ASC`,
    [programId]
  );
  return result.rows;
}

export async function getStudentCohort(graduateStudentId: string) {
  const result = await query(
    `SELECT
      c.id as cohort_id,
      c.batch_code,
      c.batch_year,
      c.batch_name_km,
      c.batch_name_en,
      c.planned_size,
      c.start_date,
      c.end_date,
      c.status as cohort_status
    FROM cohorts c
    JOIN graduate_students gs ON c.id = gs.cohort_id
    WHERE gs.id = $1`,
    [graduateStudentId]
  );
  return result.rows[0] || null;
}

export async function getStudentCurrentPhase(graduateStudentId: string) {
  const result = await query(
    `SELECT
      pp.id as phase_id,
      pp.phase_number,
      pp.name_km,
      pp.name_en,
      pp.description_km,
      pp.description_en,
      pp.start_week,
      pp.end_week,
      pp.duration_weeks
    FROM program_phases pp
    JOIN graduate_students gs ON pp.id = gs.program_phase_id
    WHERE gs.id = $1`,
    [graduateStudentId]
  );
  return result.rows[0] || null;
}

// ============================================================================
// DASHBOARD STATISTICS
// ============================================================================

export async function getStudentDashboardStats(graduateStudentId: string) {
  // Get all stats in parallel
  const [
    competenciesResult,
    teachingHoursResult,
    certificateResult,
    practicumResult
  ] = await Promise.all([
    query(
      `SELECT COUNT(*) as total,
              SUM(CASE WHEN score >= 41 THEN 1 ELSE 0 END) as proficient
       FROM competency_assessments
       WHERE graduate_student_id = $1`,
      [graduateStudentId]
    ),
    query(
      `SELECT COALESCE(SUM(duration_minutes::float / 60), 0) as total_hours,
              COALESCE(AVG(duration_minutes::float / 60), 0) as avg_hours_per_log
       FROM teaching_hours_log thl
       JOIN practicum_placements pp ON thl.practicum_placement_id = pp.id
       WHERE pp.graduate_student_id = $1`,
      [graduateStudentId]
    ),
    query(
      `SELECT COUNT(CASE WHEN is_completed = true THEN 1 END) as completed,
              COUNT(*) as total
       FROM certification_status
       WHERE graduate_student_id = $1`,
      [graduateStudentId]
    ),
    query(
      `SELECT status as placement_status, actual_teaching_hours_logged as teaching_hours_actual, required_teaching_hours as teaching_hours_target
       FROM practicum_placements
       WHERE graduate_student_id = $1
       LIMIT 1`,
      [graduateStudentId]
    )
  ]);

  return {
    competencies: competenciesResult.rows[0] || { total: 0, proficient: 0 },
    teachingHours: teachingHoursResult.rows[0] || { total_hours: 0, avg_hours_per_log: 0 },
    certification: certificateResult.rows[0] || { completed: 0, total: 0 },
    practicum: practicumResult.rows[0] || null
  };
}

export async function getMentorDashboardStats(mentorId: string) {
  const [
    menteesResult,
    observationsResult,
    sessionsResult
  ] = await Promise.all([
    query(
      `SELECT COUNT(*) as total_mentees
       FROM mentor_relationships
       WHERE mentor_id = $1 AND status = 'active'`,
      [mentorId]
    ),
    query(
      `SELECT COUNT(*) as total_observations
       FROM teaching_observations
       WHERE mentor_id = $1`,
      [mentorId]
    ),
    query(
      `SELECT COUNT(*) as total_sessions
       FROM mentor_sessions ms
       JOIN mentor_relationships mr ON ms.mentor_relationship_id = mr.id
       WHERE mr.mentor_id = $1`,
      [mentorId]
    )
  ]);

  return {
    totalMentees: menteesResult.rows[0]?.total_mentees || 0,
    totalObservations: observationsResult.rows[0]?.total_observations || 0,
    totalSessions: sessionsResult.rows[0]?.total_sessions || 0
  };
}
