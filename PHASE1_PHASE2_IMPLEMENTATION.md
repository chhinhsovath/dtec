# Phase 1 & Phase 2: Interactive Assignments & H5P Integration

## Architecture Overview

### Phase 1: Assignment Questions & Student Responses
Enables teachers to create questions (MCQ, short answer, essay, H5P) for assignments and students to submit responses with auto-grading for multiple choice.

### Phase 2: H5P Content Library
Allows teachers to create reusable interactive H5P content (quizzes, videos, drag-drop, etc.) that can be linked to assignments.

---

## Phase 1: COMPLETED ✅

### Database Schema
**Migration File:** `migrations/phase1_phase2_questions_h5p.sql`

**Tables Created:**
- `assignment_questions` - Questions for each assignment
- `question_options` - MCQ options for multiple choice questions
- `assignment_responses` - Student responses to questions
- `h5p_content` - Reusable H5P content (Phase 2)
- `h5p_in_assignments` - Links H5P to assignments (Phase 2)
- `h5p_responses` - H5P interaction tracking (Phase 2)

**Views Created:**
- `v_assignment_questions_with_options` - Question + options summary
- `v_student_assignment_progress` - Student progress tracking

### Backend APIs - COMPLETED ✅

#### Teacher Question Management
```
GET    /api/teacher/assignments/[assignmentId]/questions
       - Fetch all questions for an assignment with options

POST   /api/teacher/assignments/[assignmentId]/questions
       - Create new question (MCQ, short answer, essay, H5P)
       - Auto-generates question number
       - Adds MCQ options if type is 'multiple_choice'

GET    /api/teacher/assignments/[assignmentId]/questions/[questionId]
       - Fetch specific question with all options

PUT    /api/teacher/assignments/[assignmentId]/questions/[questionId]
       - Update question text, description, points, required flag
       - Update MCQ options

DELETE /api/teacher/assignments/[assignmentId]/questions/[questionId]
       - Delete question (cascades to options and responses)
```

#### Student Assignment & Response Submission
```
GET    /api/student/assignments/[assignmentId]
       - Fetch assignment details with all published questions
       - Show existing submission and responses if any
       - Include question options for MCQ

POST   /api/student/assignments/[assignmentId]/submit
       - Submit responses to all questions
       - Auto-grades MCQ questions
       - Creates or updates submission
       - Supports: responseText, selectedOptionId, h5pResponseData
```

#### Teacher Grading Interface
```
GET    /api/teacher/assignments/[assignmentId]/submissions/[submissionId]/responses
       - Fetch all student responses for grading
       - Show auto-graded MCQ scores
       - Display student info, submission date
       - Calculate grading stats

PUT    /api/teacher/assignments/[assignmentId]/submissions/[submissionId]/responses
       - Update scores and feedback for responses
       - Mark essays/short answers as graded
       - Record grading timestamp
```

### API Request/Response Examples

#### Create Question
```bash
POST /api/teacher/assignments/uuid/questions
{
  "questionText": "What is 2+2?",
  "questionDescription": "Simple math",
  "questionType": "multiple_choice",
  "points": 5,
  "required": true,
  "options": [
    { "option_text": "4", "is_correct": true },
    { "option_text": "5", "is_correct": false },
    { "option_text": "3", "is_correct": false }
  ]
}

Response:
{
  "success": true,
  "data": {
    "id": "question-uuid",
    "question_number": 1,
    "question_type": "multiple_choice",
    ...
  }
}
```

#### Submit Response
```bash
POST /api/student/assignments/uuid/submit
{
  "responses": [
    {
      "questionId": "q1-uuid",
      "selectedOptionId": "option-uuid"
    },
    {
      "questionId": "q2-uuid",
      "responseText": "The answer is..."
    }
  ]
}

Response:
{
  "success": true,
  "submissionId": "submission-uuid",
  "responsesCount": 2
}
```

#### Grade Responses
```bash
PUT /api/teacher/assignments/uuid/submissions/uuid/responses
{
  "responseUpdates": [
    {
      "responseId": "response-uuid",
      "score": 3.5,
      "feedback": "Good explanation, minor grammar issue"
    }
  ]
}
```

### Question Types Supported
1. **Multiple Choice** - Auto-graded, options stored in DB
2. **Short Answer** - Manual grading, stores text response
3. **Essay** - Manual grading, stores long text response
4. **H5P** - Links to H5P content, stores interaction data

---

## Frontend: TODO 🚧

### Teacher Question Builder
**File:** `app/dashboard/teacher/assignments/[id]/questions/page.tsx`

Features needed:
- [ ] List all questions for assignment
- [ ] Create new question form with type selector
- [ ] MCQ option builder interface
- [ ] Edit existing questions
- [ ] Delete questions with confirmation
- [ ] Reorder questions (drag-drop)
- [ ] Preview question as student

### Student Assignment Submission
**File:** `app/dashboard/student/assignments/[id]/page.tsx`

Features needed:
- [ ] Display assignment details and due date
- [ ] Render all question types dynamically
  - MCQ: Radio buttons or dropdown
  - Short Answer: Text input
  - Essay: Text area with word count
  - H5P: Embedded H5P content
- [ ] Save progress automatically (auto-save)
- [ ] Submit all responses
- [ ] Show confirmation before submit
- [ ] Display submission status

### Teacher Grading Interface
**File:** `app/dashboard/teacher/assignments/[id]/submissions/[submissionId]/page.tsx`

Features needed:
- [ ] List all student submissions with status
- [ ] Open submission to view all responses
- [ ] Display student answer for each question
- [ ] Show auto-graded MCQ scores
- [ ] Input manual scores for essay/short answer
- [ ] Add feedback/comments per question
- [ ] Calculate total score
- [ ] Save grades
- [ ] Download grading report

---

## Phase 2: H5P Integration - TODO 🚧

### Database Schema - COMPLETED ✅
Already included in `migrations/phase1_phase2_questions_h5p.sql`

Tables:
- `h5p_content` - H5P content library
- `h5p_in_assignments` - Links H5P to assignment questions
- `h5p_responses` - Tracks student H5P interactions

### Backend APIs - TODO

```
GET    /api/teacher/h5p-content
       - List all H5P content created by teacher

POST   /api/teacher/h5p-content
       - Create new H5P content
       - Store H5P JSON structure

GET    /api/teacher/h5p-content/[contentId]
       - Get specific H5P content

PUT    /api/teacher/h5p-content/[contentId]
       - Update H5P content

DELETE /api/teacher/h5p-content/[contentId]
       - Delete H5P content

POST   /api/teacher/assignments/[assignmentId]/questions/[questionId]/link-h5p
       - Link H5P content to question
```

### Frontend H5P Components - TODO

**Teacher H5P Studio:**
- Create/edit H5P content using H5P editor
- Publish to content library
- Link to assignments

**Student H5P Interaction:**
- Display H5P content embedded in assignment
- Capture H5P interaction data
- Pass interaction data to response submission

### H5P Integration Approach

1. **H5P Hub Integration** (Recommended)
   - Use official H5P npm packages
   - Content types: Quiz, Interactive Video, Drag & Drop, Memory, etc.
   - Auto-grading for interactive quizzes

2. **H5P Library Setup**
   ```typescript
   // lib/h5p.ts
   - H5P validation
   - Content serialization
   - Interaction data tracking
   ```

3. **H5P Editor Component**
   ```tsx
   // components/H5PEditor.tsx
   - H5P content creation UI
   - JSON editor with validation
   - Preview functionality
   ```

---

## Implementation Checklist

### Phase 1: Complete
- [x] Database schema design
- [x] Migration SQL file created
- [x] Teacher question CRUD APIs
- [x] Student response submission API
- [x] Teacher grading API
- [x] Auto-grading for MCQ
- [ ] Frontend question builder
- [ ] Frontend student submission UI
- [ ] Frontend teacher grading UI

### Phase 2: In Progress
- [x] Database schema designed
- [ ] H5P Editor integration
- [ ] H5P Content APIs
- [ ] H5P Question linking
- [ ] H5P interaction tracking
- [ ] H5P Library management UI

### Testing & Deployment
- [ ] Unit tests for APIs
- [ ] Integration tests (teacher → student → grading)
- [ ] End-to-end tests
- [ ] Performance testing with many questions
- [ ] Security audit
- [ ] Database migration testing
- [ ] Production deployment

---

## Student Learning Flow

```
1. Student navigates to assignment
   ↓
2. System fetches assignment + all questions
   ↓
3. Student answers questions:
   - MCQ: Selects option
   - Short Answer: Types response
   - Essay: Types detailed answer
   - H5P: Interacts with content
   ↓
4. Student clicks "Submit"
   ↓
5. System sends all responses to API
   ↓
6. API auto-grades MCQ questions
   ↓
7. Teacher receives notification
   ↓
8. Teacher grades essay/short answer
   ↓
9. Student sees final score + feedback
```

---

## Teacher Grading Flow

```
1. Teacher views assignment
   ↓
2. Teacher sees submission list with status
   ↓
3. Teacher clicks submission to grade
   ↓
4. System shows all student responses
   ↓
5. For each question:
   - Show student's answer
   - Show auto-graded score (if MCQ)
   - Teacher can override score
   - Teacher adds feedback
   ↓
6. Teacher clicks "Save Grades"
   ↓
7. Student notification: "Your assignment has been graded"
```

---

## Key Features Summary

### Auto-Grading
- Multiple choice questions auto-grade immediately
- Correct answer = full points, incorrect = 0 points
- Manual grading available for overrides

### Question Bank
- Questions stored per assignment
- Can be reused via H5P (Phase 2)
- Full CRUD operations by teacher

### Response Tracking
- All responses stored with timestamps
- Student can revise before due date
- Teacher can see revision history

### H5P Reusability
- Create H5P content once
- Link to multiple assignments
- Reuse across different courses
- Track usage statistics

---

## Security Considerations

1. **Authorization**
   - Teachers can only access their own assignments
   - Students can only access enrolled courses
   - Header-based authentication (x-teacher-id, x-student-id)

2. **Data Validation**
   - All inputs validated before DB insert
   - Points/scores must be numeric
   - Question text required

3. **Cascade Deletes**
   - Deleting assignment deletes all questions
   - Deleting questions deletes all responses
   - Clean data consistency

---

## Next Steps

1. **Apply Database Migration**
   ```bash
   PGPASSWORD='P@ssw0rd' psql -h 157.10.73.52 -p 5433 -U admin -d dtech -f migrations/phase1_phase2_questions_h5p.sql
   ```

2. **Build Phase 1 Frontend** (Teacher Question Builder)
   - Start with question listing page
   - Add create/edit/delete functionality
   - Implement MCQ option builder

3. **Build Student Submission UI**
   - Fetch assignment + questions
   - Render question types dynamically
   - Submit responses to API

4. **Build Teacher Grading UI**
   - View student responses
   - Grade essay/short answer
   - Provide feedback

5. **Phase 2: H5P Integration**
   - Install H5P npm packages
   - Create H5P content editor UI
   - Link H5P to assignments

---

## File References

- **Database Migration:** `/migrations/phase1_phase2_questions_h5p.sql`
- **Teacher APIs:** `/app/api/teacher/assignments/[assignmentId]/questions/*`
- **Student APIs:** `/app/api/student/assignments/[assignmentId]/*`
- **Teacher Grading API:** `/app/api/teacher/assignments/[assignmentId]/submissions/[submissionId]/responses`

---

## Questions & Support

For integration questions or implementation details, refer to:
- API endpoint comments for request/response structure
- Database schema for relationships and constraints
- Test examples in API files for usage patterns
