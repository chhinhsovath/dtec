# TEC Teacher Education Pedagogy LMS - Complete Restructuring Plan

## 🎯 Vision
Transform from a generic K-12 School LMS into a specialized **Graduate Teacher Training Program Management System** for preparing contract teachers with focus on pedagogical competency.

---

## 📊 PHASE 1: ARCHITECTURE ANALYSIS & DESIGN

### Current State (K-12 School LMS)
**Core Tables:**
- `profiles` - Generic users (student, teacher, admin)
- `students` - Student enrollment records
- `courses` - Generic courses
- `enrollments` - Course enrollment
- `academic_records` - Grades and GPA (K-12 paradigm)
- `teacher_courses` - Teacher-Course assignments
- `attendance` - Class attendance
- `institutions` - School/Organization

**Problems with current structure:**
- ❌ Role model assumes traditional teacher-student (not mentor-mentee)
- ❌ GPA/Grading system for K-12, not teacher competency
- ❌ No concept of "teaching practice" or "practicum"
- ❌ No mentorship/supervision structure
- ❌ No portfolio/evidence collection
- ❌ No certification pathway
- ❌ Attendance (K-12) instead of teaching hours/practice logs
- ❌ No competency assessment framework

---

## 🏗️ TARGET ARCHITECTURE FOR PEDAGOGY

### New Core Entities

**1. PROGRAM STRUCTURE**
- Teacher Education Program (e.g., "Contract Teacher Certification Program")
- Program Phases (Foundations → Pedagogy → Practicum → Assessment → Certification)
- Modules within each phase (Pedagogy, Curriculum Design, Assessment, etc.)

**2. USERS & ROLES**
Instead of: student, teacher, admin

New roles:
- **Graduate Student** (Teacher Trainee) - Primary learner
- **Mentor/Supervisor** - Experienced educator guiding trainee
- **Pedagogical Content Specialist** - Subject matter expert
- **Program Coordinator** - Manages program flow
- **School Partner/Placement Supervisor** - From partner schools
- **Administrator** - System management

**3. LEARNING OUTCOMES & COMPETENCIES**
- Teacher Competency Framework (Khmer-first)
- Learning Outcomes per module
- Assessment Rubrics
- Evidence Requirements

**4. TEACHING PRACTICE/PRACTICUM**
- Practicum Placements (partner schools)
- Teaching Observations (recorded assessments)
- Lesson Plan Submissions
- Student Feedback Integration
- Hours Tracking (teaching practice hours)

**5. MENTORSHIP**
- Mentor-Mentee Relationships
- Guidance Sessions (scheduled, logged)
- Feedback Cycles
- Progress Reports

**6. PORTFOLIO & EVIDENCE**
- E-Portfolio for each graduate student
- Evidence Types: Lesson Plans, Reflections, Student Feedback, Observation Notes
- Portfolio Review & Sign-off by Mentors

**7. CERTIFICATION PATHWAY**
- Competency Verification Checklist
- Final Assessment
- Certification Status
- Contract Teacher Credential

---

## 📋 DATABASE SCHEMA REDESIGN

### New/Modified Tables

```
PROGRAM MANAGEMENT
├── teacher_education_programs
├── program_phases
├── program_modules
├── learning_outcomes
└── competency_framework

USERS & RELATIONSHIPS
├── profiles (restructured)
├── user_roles (expanded)
├── mentor_relationships
├── program_enrollments

LEARNING & ASSESSMENT
├── module_content
├── assessment_rubrics
├── competency_assessments
├── learning_evidences

TEACHING PRACTICE
├── practicum_placements
├── partner_schools
├── teaching_observations
├── lesson_submissions
├── teaching_hours_log

MENTORSHIP
├── mentor_sessions
├── session_feedback
├── progress_reports

PORTFOLIO
├── e_portfolios
├── portfolio_evidence
├── portfolio_reviews

CERTIFICATION
├── certification_requirements
├── competency_verification
├── certification_status
```

---

## 🔄 DATA MIGRATION STRATEGY

### Step 1: Preserve Existing Data
```
OLD TABLE → NEW MAPPING
profiles → profiles (restructure roles)
students → graduate_students (rename + add fields)
courses → program_modules (rename + restructure)
teacher_courses → mentor_relationships (repurpose)
enrollments → program_enrollments (restructure)
```

### Step 2: Add New Required Fields
```
graduate_students:
  - batch_number (cohort)
  - enrollment_status (active, completed, withdrew)
  - expected_completion_date
  - program_phase_id (which phase in program)

mentors:
  - specialization
  - years_experience
  - max_mentees (capacity)

practicum_placements:
  - partner_school_id
  - start_date
  - end_date
  - placement_supervisor_id
  - required_teaching_hours
  - actual_teaching_hours

competency_assessments:
  - competency_id
  - graduate_student_id
  - assessor_id (mentor)
  - assessment_date
  - score (1-5 scale)
  - evidence_links (lesson plans, observations)
  - feedback_text
  - date_achieved (when competency met)
```

---

## 🎯 KEY FEATURES TO BUILD

### 1. COMPETENCY ASSESSMENT SYSTEM
**What it does:**
- Track progress against pedagogical competencies
- Multiple assessment points (formative and summative)
- Evidence-based verification
- Real-time competency status dashboard

**Competency Examples (Khmer First):**
- 📚 ការយល់ដឹងខ្លួនឯង (Self-awareness & Reflection)
- 🎯 ការផ្លាស់ប្តូរ (Curriculum Design & Adaptation)
- 👥 ការគ្រប់គ្រងថ្នាក់រៀន (Classroom Management)
- 📊 ការវាយតម្លៃសិស្ស (Student Assessment)
- 💡 ការបង្រៀនដែលមានប្រសិទ្ធភាព (Effective Teaching)
- 🔬 ការប្រើបច្ចេកវិទ្យា (Technology Integration)

### 2. PRACTICUM MANAGEMENT
**What it does:**
- Assign students to partner schools
- Track teaching practice hours
- Schedule and record teaching observations
- Manage observation feedback loops
- Generate practicum completion reports

### 3. MENTORSHIP SYSTEM
**What it does:**
- Assign mentors to students (1-to-many)
- Schedule mentoring sessions
- Track guidance and feedback
- Generate mentor reports
- Competency verification by mentors

### 4. E-PORTFOLIO SYSTEM
**What it does:**
- Collect evidence (lesson plans, reflections, videos, feedback)
- Organize by competency
- Track portfolio completion
- Enable peer review
- Generate portfolio certificates

### 5. CERTIFICATION PATHWAY
**What it does:**
- Define required competencies for certification
- Track which competencies are verified
- Generate certification checklist
- Issue contract teacher credentials
- Track certification timeline

---

## 🔀 WORKFLOW TRANSFORMATIONS

### OLD WORKFLOW (K-12)
```
Enrollment → Take Courses → Get Grades → GPA Calculation → Graduation
```

### NEW WORKFLOW (Pedagogy)
```
Graduate Student Enrollment
    ↓
Phase 1: Foundations (Pedagogy, Subject Matter)
    ↓ [Competency Assessments]
Phase 2: Pedagogy Deep Dive (Classroom Management, Assessment Design)
    ↓ [Lesson Plan Submissions, Micro-teaching]
Phase 3: Practicum (Real classroom teaching)
    ├─ Teaching Observations (by mentor)
    ├─ Student Feedback Collection
    ├─ Teaching Hours Logging
    ├─ Reflection Papers
    ↓ [Competency Verification]
Phase 4: Culminating Assessment
    ├─ Portfolio Review
    ├─ Final Competency Check
    ↓
Certification → Contract Teacher Credential
```

---

## 📊 KEY DASHBOARDS NEEDED

### For Graduate Students
- 📈 My Competency Progress
- 📋 Practicum Status & Hours Logged
- 👥 Mentor Feedback & Guidance
- 📁 My Portfolio & Evidence
- 🏆 Certification Pathway Progress

### For Mentors
- 👤 My Mentees Progress
- 📊 Competency Assessment Results
- 📝 Observation Feedback History
- 📅 Scheduled Mentoring Sessions
- 🎯 Competency Verification Checklist

### For Program Coordinators
- 👥 Cohort Management
- 📊 Program Phase Progress
- 🏫 Practicum Placement Status
- 🏆 Certification Tracking
- 📈 Program Metrics & Reports

---

## 🇰🇭 KHMER-FIRST LOCALIZATION

**Critical Areas for Khmer-First Content:**
1. Competency Framework (all in Khmer)
2. Assessment Rubrics (clear Khmer language)
3. Learning Outcomes (Khmer descriptions)
4. Module Content (Khmer primary)
5. Feedback Templates (Khmer language)
6. Reports & Certificates (Khmer primary)

---

## 📅 IMPLEMENTATION PHASES

| Phase | Duration | Focus |
|-------|----------|-------|
| **Phase 1** | Week 1-2 | Database schema redesign, data migration |
| **Phase 2** | Week 2-3 | New user roles, mentor relationships |
| **Phase 3** | Week 3-4 | Competency assessment system |
| **Phase 4** | Week 4-5 | Practicum management system |
| **Phase 5** | Week 5-6 | Mentorship workflows |
| **Phase 6** | Week 6-7 | E-Portfolio system |
| **Phase 7** | Week 7-8 | Certification pathway |
| **Phase 8** | Week 8-9 | UI/UX redesign for pedagogy context |
| **Phase 9** | Week 9-10 | Testing & validation |

---

## ⚠️ CRITICAL MIGRATION CONSIDERATIONS

### Data That Needs Mapping:
- ✅ Existing users → Graduate Students + Mentors + Coordinators
- ✅ Current courses → Program Modules
- ✅ Current enrollments → Program Enrollments (with phases)
- ✅ Academic records → Competency Assessments
- ⚠️ Attendance records → Teaching Hours Log (different context)

### Data Loss Prevention:
- ✅ Archive old K-12 data separately
- ✅ Create mapping tables for reference
- ✅ Validate all data migrations
- ✅ Maintain audit trail

---

## 🚀 NEXT STEPS

1. ✅ **Review & Approve** this restructuring plan
2. ⬜ **Detailed Database Schema** - Create SQL migrations
3. ⬜ **Data Migration Scripts** - Preserve existing data
4. ⬜ **API Endpoints Redesign** - Update for pedagogy workflows
5. ⬜ **UI Components Redesign** - Pedagogy-focused interfaces
6. ⬜ **Feature Implementation** - Phase by phase

---

## 📞 QUESTIONS TO FINALIZE DESIGN

Before implementation, please clarify:

1. **Program Structure:**
   - How many phases in your teacher training program?
   - What are the phase names/durations?
   - How many modules per phase?

2. **Competencies:**
   - Do you have an existing competency framework?
   - How many competencies (target: 8-12)?
   - Who assesses? (Mentors only? External assessors?)

3. **Practicum:**
   - How many partner schools?
   - Required teaching hours target?
   - Who supervises? (Mentor? School principal? Both?)

4. **Certification:**
   - What determines "ready for contract"?
   - How many competencies must be verified?
   - Final assessment type?

5. **Cohort Management:**
   - Expected batch size?
   - Fixed intake dates or rolling enrollment?
   - Program duration (weeks/months)?

---

**Status:** 🟠 PENDING APPROVAL & CLARIFICATION
**Last Updated:** 2025-11-06
**Next Action:** Await user confirmation to proceed with Phase 2
