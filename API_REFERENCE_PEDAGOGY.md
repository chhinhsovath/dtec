# Pedagogy LMS - API Reference Guide

**Version**: 1.0
**Last Updated**: November 6, 2025

---

## 🔌 Base URL
```
Development: http://localhost:3000/api
Production: https://[deployment-url]/api
```

---

## 📊 Graduate Student APIs

### 1. Dashboard Overview

**Endpoint**: `GET /graduate-student/dashboard`

**Purpose**: Get comprehensive dashboard data for logged-in student

**Authentication**: Required (student session cookie)

**Response**:
```json
{
  "success": true,
  "data": {
    "stats": {
      "competencies": {
        "total": 10,
        "proficient": 3
      },
      "teachingHours": {
        "total_hours": 45,
        "avg_hours_per_log": 6.5
      },
      "certification": {
        "completed": 2,
        "total": 15
      },
      "practicum": {
        "placement_status": "active",
        "teaching_hours_actual": 45,
        "teaching_hours_target": 120
      }
    },
    "cohort": {
      "cohort_id": "uuid",
      "batch_code": "Batch 2025-01",
      "batch_year": 2025,
      "batch_name_km": "ក្រុម ២០២៥-០១",
      "planned_size": 30,
      "start_date": "2025-01-06",
      "end_date": "2025-07-06"
    },
    "currentPhase": {
      "phase_id": "uuid",
      "phase_number": 1,
      "name_km": "ដំណាក់កាលទី១៖ មូលដ្ឋាន",
      "name_en": "Phase 1: Foundations",
      "start_week": 1,
      "end_week": 6,
      "duration_weeks": 6
    },
    "program": {
      "program_id": "uuid",
      "code": "TEC-CERT-2025",
      "name_km": "កម្មវិធីត្រៀមបង្រៀនគ្រូច្រៃលំង្វល់ TEC",
      "name_en": "TEC Contract Teacher Training Program"
    },
    "competencies": [
      {
        "competency_id": "uuid",
        "competency_number": 1,
        "name_km": "ការយល់ដឹងខ្លួនឯង",
        "name_en": "Self-Awareness & Reflection"
      },
      // ... 9 more competencies
    ],
    "progressSummary": {
      "competenciesAtLevel3Plus": 3,
      "totalCompetencies": 10,
      "teachingHoursLogged": 45,
      "teachingHoursTarget": 120,
      "certificationsCompleted": 2,
      "totalCertificationRequirements": 15,
      "practicumStatus": "active"
    }
  }
}
```

---

### 2. Competency Assessment

**Get Competencies**
```
GET /graduate-student/competencies
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "competency_assessment_id": "uuid",
      "graduate_student_id": "student-id",
      "competency_id": "uuid",
      "current_level": 2,
      "score": 65,
      "assessment_date": "2025-10-15",
      "feedback_text": "Good progress on classroom management...",
      "competency_number": 5,
      "name_km": "ការគ្រប់គ្រងថ្នាក់រៀន",
      "name_en": "Classroom Management",
      "description_km": "...",
      "description_en": "..."
    }
  ],
  "count": 10
}
```

**Update Competency (Mentor Only)**
```
POST /graduate-student/competencies
Content-Type: application/json
Authorization: Mentor role required

{
  "graduateStudentId": "student-id",
  "competencyId": "uuid",
  "currentLevel": 3,
  "score": 75,
  "feedbackText": "Demonstrated proficient classroom management skills. Keep practicing differentiation strategies."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Competency assessment updated",
  "data": {
    "competency_assessment_id": "uuid",
    "current_level": 3,
    "score": 75,
    "assessment_date": "2025-11-06",
    "feedback_text": "..."
  }
}
```

---

### 3. Practicum Management

**Get Practicum Status**
```
GET /graduate-student/practicum
```

**Response**:
```json
{
  "success": true,
  "data": {
    "placement": {
      "placement_id": "uuid",
      "graduate_student_id": "student-id",
      "partner_school_id": "uuid",
      "start_date": "2025-03-01",
      "end_date": "2025-05-15",
      "placement_status": "active",
      "teaching_hours_target": 120,
      "teaching_hours_actual": 45,
      "placement_supervisor_id": "uuid",
      "school_name_km": "សាលាបឋមសិក្សា X",
      "school_name_en": "Primary School X",
      "location": "Phnom Penh",
      "contact_person": "School Principal",
      "contact_phone": "+855-xx-xxx-xxx"
    },
    "teachingHours": {
      "total_hours": 45,
      "log_entries": 9
    },
    "totalObservations": 4,
    "observations": [
      {
        "observation_id": "uuid",
        "observation_date": "2025-10-20",
        "lesson_title": "Introduction to Fractions",
        "grade_level": "4",
        "strengths_km": "ល្អក្នុងការពិពណ៌នា...",
        "areas_for_improvement_km": "ត្រូវតែរៀបចំពេលវេលាកាន់តែល្អ...",
        "overall_score": 78
      }
    ]
  }
}
```

**Log Teaching Hours**
```
POST /graduate-student/practicum
Content-Type: application/json

{
  "action": "log_hours",
  "placementId": "uuid",
  "hoursLogged": 5.5,
  "activityDate": "2025-11-05",
  "notes": "Taught Grade 4 Mathematics - Introduction to Fractions. Good student engagement."
}
```

**Record Teaching Observation (Mentor Only)**
```
POST /graduate-student/practicum
Content-Type: application/json
Authorization: Mentor role required

{
  "action": "add_observation",
  "graduateStudentId": "student-id",
  "placementId": "uuid",
  "observationDate": "2025-11-05",
  "lessonTitle": "Introduction to Fractions",
  "gradeLevel": "4",
  "strengthsKm": "បង្ហាញការយល់ដឹងលម្អិត...",
  "strengthsEn": "Demonstrated clear understanding of fractions...",
  "areasForImprovementKm": "ត្រូវតែផ្តល់ពេលវេលា...",
  "areasForImprovementEn": "Should allow more time for student practice...",
  "recommendationsKm": "បង្កើនលេខលម្អិតក្នុងលំហាត់...",
  "recommendationsEn": "Increase variety in practice activities...",
  "overallScore": 78
}
```

---

### 4. Mentorship Sessions

**Get Mentoring Sessions**
```
GET /graduate-student/mentorship
GET /graduate-student/mentorship?mentorId=uuid
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "session_id": "uuid",
      "mentor_id": "uuid",
      "graduate_student_id": "student-id",
      "session_date": "2025-11-04",
      "session_duration_minutes": 60,
      "topic_km": "ការគ្រប់គ្រងថ្នាក់រៀន",
      "topic_en": "Classroom Management",
      "feedback_km": "ល្អក្នុងការប្រើប្រាស់ក្បួនដាល់ស្តង់ដារ...",
      "feedback_en": "Good use of standard classroom procedures...",
      "action_items_km": "១. រៀបចំក្បួនបង្កើតបរិយាកាស...",
      "action_items_en": "1. Organize routines for creating positive environment...",
      "created_at": "2025-11-04"
    }
  ],
  "count": 8
}
```

**Create Mentoring Session (Mentor Only)**
```
POST /graduate-student/mentorship
Content-Type: application/json
Authorization: Mentor role required

{
  "graduateStudentId": "student-id",
  "sessionDate": "2025-11-06",
  "sessionDurationMinutes": 60,
  "topicKm": "ការវាយតម្លៃសិស្ស",
  "topicEn": "Student Assessment",
  "feedbackKm": "ល្អក្នុងការប្រើប្រាស់ការវាយតម្លៃ...",
  "feedbackEn": "Good use of formative assessment strategies...",
  "actionItemsKm": "១. បង្កើតរបាប់វាយតម្លៃលម្អិត...",
  "actionItemsEn": "1. Create detailed rubrics for assessment..."
}
```

---

### 5. Portfolio Management

**Get Portfolio**
```
GET /graduate-student/portfolio
GET /graduate-student/portfolio?competencyId=uuid
```

**Response**:
```json
{
  "success": true,
  "data": {
    "portfolio": {
      "portfolio_id": "uuid",
      "graduate_student_id": "student-id",
      "created_at": "2025-01-07",
      "last_updated": "2025-11-05"
    },
    "evidence": [
      {
        "evidence_id": "uuid",
        "portfolio_id": "uuid",
        "competency_id": "uuid",
        "evidence_type_km": "ផ្នែកគម្រោង",
        "evidence_type_en": "Lesson Plan",
        "title_km": "មេរៀនលេខគណិតវិទ្យា",
        "title_en": "Mathematics Lesson Plan",
        "description_km": "ផ្នែកគម្រោងលម្អិត...",
        "description_en": "Detailed lesson plan for fractions unit...",
        "file_url": "s3://bucket/portfolio/evidence/uuid.pdf",
        "submission_date": "2025-11-04"
      }
    ],
    "evidenceCount": 12
  }
}
```

**Add Portfolio Evidence**
```
POST /graduate-student/portfolio
Content-Type: application/json

{
  "portfolioId": "uuid",
  "competencyId": "uuid",
  "evidenceTypeKm": "ផ្នែកគម្រោង",
  "evidenceTypeEn": "Lesson Plan",
  "titleKm": "មេរៀនលេខគណិតវិទ្យា",
  "titleEn": "Mathematics Lesson Plan",
  "descriptionKm": "ផ្នែកគម្រោងលម្អិត...",
  "descriptionEn": "Detailed lesson plan...",
  "fileUrl": "s3://bucket/portfolio/evidence/new-file.pdf"
}
```

---

### 6. Certification Status

**Get Certification Requirements**
```
GET /graduate-student/certification
```

**Response**:
```json
{
  "success": true,
  "data": {
    "requirements": [
      {
        "certification_status_id": "uuid",
        "graduate_student_id": "student-id",
        "requirement_id": "uuid",
        "is_completed": true,
        "completion_date": "2025-10-15",
        "requirement_name_km": "ទាំងអស់ ១០ សមត្ថភាពនៅលំដាប់ ៣+",
        "requirement_name_en": "All 10 Competencies at Level 3+",
        "requirement_type": "competency_verification"
      },
      {
        "is_completed": false,
        "requirement_name_km": "ធានាលើក ១២០ ម៉ោង",
        "requirement_name_en": "Log 120+ Teaching Hours",
        "requirement_type": "practicum_hours"
      }
    ],
    "readiness": {
      "completedRequirements": 12,
      "totalRequirements": 15,
      "completionPercentage": 0.8,
      "isReadyForCertification": false
    },
    "canIssueCertificate": false
  }
}
```

**Issue Final Certificate (Coordinator Only)**
```
POST /graduate-student/certification
Content-Type: application/json
Authorization: Coordinator role required

{
  "graduateStudentId": "student-id",
  "programId": "uuid",
  "certificationNumber": "TEC-CERT-2025-001",
  "expiryDate": "2030-11-06"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Contract teacher certificate issued successfully",
  "data": {
    "certification_id": "uuid",
    "graduate_student_id": "student-id",
    "program_id": "uuid",
    "certification_number": "TEC-CERT-2025-001",
    "issued_date": "2025-11-06",
    "expiry_date": "2030-11-06",
    "certification_status": "active"
  }
}
```

---

## 👥 Mentor APIs

### 1. Mentor Dashboard

**Endpoint**: `GET /mentor/dashboard`

**Purpose**: Get comprehensive mentor dashboard statistics

**Authentication**: Required (mentor session cookie)

**Response**:
```json
{
  "success": true,
  "data": {
    "stats": {
      "totalMentees": 6,
      "totalObservations": 15,
      "totalSessions": 12
    },
    "mentees": [
      {
        "mentor_relationship_id": "uuid",
        "mentor_id": "mentor-uuid",
        "graduate_student_id": "student-id-1",
        "assignment_date": "2025-01-07",
        "relationship_status": "active",
        "student_code": "GS-00001",
        "email": "student1@tec.kh",
        "full_name": "Student One",
        "batch_code": "Batch 2025-01",
        "batch_year": 2025
      }
    ],
    "summary": {
      "totalMentees": 6,
      "totalObservations": 15,
      "totalSessions": 12,
      "averageSessionDuration": 60,
      "menteesStatuses": {
        "active": 6
      }
    }
  }
}
```

### 2. Get Mentees List

**Endpoint**: `GET /mentor/mentees`

**Purpose**: Get list of all mentees assigned to mentor

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "mentor_relationship_id": "uuid",
      "graduate_student_id": "student-id",
      "student_code": "GS-00001",
      "email": "student1@tec.kh",
      "full_name": "Student Name",
      "relationship_status": "active",
      "batch_code": "Batch 2025-01",
      "batch_year": 2025
    }
  ],
  "count": 6
}
```

---

## ✅ Competency Levels Reference

All competency assessments use a **1-5 level scale**:

| Level | Name | Description |
|-------|------|-------------|
| 1 | Beginning | Needs support, foundational understanding |
| 2 | Developing | Making progress, showing growth |
| 3 | Proficient | **Meets standard** ✅ (Required for certification) |
| 4 | Advanced | Exceeds standard, consistent excellence |
| 5 | Master | Exemplary, mentors others |

**Minimum for Certification**: **Level 3+ on ALL 10 competencies**

---

## 🧪 Testing API Endpoints

### Using cURL

**Get Graduate Student Dashboard**
```bash
curl -X GET http://localhost:3000/api/graduate-student/dashboard \
  -H "Cookie: user_id=your-user-id; role=graduate_student" \
  -H "Content-Type: application/json"
```

**Update Competency Assessment (as Mentor)**
```bash
curl -X POST http://localhost:3000/api/graduate-student/competencies \
  -H "Cookie: user_id=mentor-user-id; role=mentor" \
  -H "Content-Type: application/json" \
  -d '{
    "graduateStudentId": "student-id",
    "competencyId": "comp-uuid",
    "currentLevel": 3,
    "score": 75,
    "feedbackText": "Good progress..."
  }'
```

**Log Teaching Hours**
```bash
curl -X POST http://localhost:3000/api/graduate-student/practicum \
  -H "Cookie: user_id=student-id; role=graduate_student" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "log_hours",
    "placementId": "placement-uuid",
    "hoursLogged": 5.5,
    "activityDate": "2025-11-06",
    "notes": "Taught Grade 4 Math..."
  }'
```

---

## 🔑 Required Cookies

All requests require authentication cookies:

```
user_id=<user-uuid>    # User's unique identifier
role=<role-type>       # One of: graduate_student, mentor, coordinator, admin
```

**Role Permissions**:
- **graduate_student**: Can read own data, log hours, submit evidence
- **mentor**: Can assess competencies, add observations, create sessions
- **coordinator**: Can issue certificates, view all program data
- **admin**: Full system access

---

## 📝 Error Responses

All errors follow this format:

```json
{
  "error": "Error message",
  "details": "More specific error information"
}
```

**Common Status Codes**:
- `200` - Success
- `400` - Bad request (missing fields, validation error)
- `401` - Unauthorized (no valid session)
- `403` - Forbidden (insufficient permissions for role)
- `500` - Server error

---

## 🔄 Data Consistency Notes

1. **Competency Levels**: Always 1-5, with 3+ required for certification
2. **Teaching Hours**: Cumulative across all logs for practicum placement
3. **Practicum Status**: Calculated based on placement dates
4. **Certification Readiness**: Requires ALL 10 competencies at Level 3+, 120+ teaching hours logged, and all requirements completed
5. **Timestamps**: All dates in ISO 8601 format (YYYY-MM-DD)

---

**API Version**: 1.0
**Last Updated**: November 6, 2025
**Status**: Active Development
