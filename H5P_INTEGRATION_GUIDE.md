# H5P Integration Guide for LMS

## Overview

H5P (HTML5 Package) is integrated into the LMS to provide interactive learning content such as:
- Interactive videos
- Quizzes and assessments
- Drag-and-drop activities
- Matching exercises
- Timeline activities
- Memory games
- And 50+ more content types

## Architecture

### 1. **H5P Content Storage**
- H5P files are stored in the database with metadata
- Each H5P content is linked to a course and module
- Teachers can create, edit, and manage H5P content

### 2. **H5P Player Integration**
- H5P content is displayed in an iframe on course pages
- Results are automatically tracked via xAPI (Experience API)
- Student interactions generate learning analytics

### 3. **Result Tracking**
- H5P uses xAPI standards to send results
- Results are captured in `student_quiz_attempts` table
- Scores are automatically converted to grades

## Installation & Setup

### Step 1: Install H5P Dependencies

```bash
npm install h5p-core h5p-editor-player
```

### Step 2: Create H5P Content Directories

```bash
mkdir -p public/h5p/libraries
mkdir -p public/h5p/content
mkdir -p public/h5p/tmp
```

### Step 3: Download H5P Core Files

H5P core files can be:
- Downloaded from https://h5p.org/download
- Or obtained from H5P Hub: https://hub.h5p.org/

Extract to `public/h5p/libraries/`

### Step 4: Setup H5P Endpoints

Create these API routes (similar to existing ones):

```typescript
// app/api/h5p/embed/[id]/route.ts
// Render H5P content player

// app/api/h5p/results/route.ts
// Save xAPI statements from H5P

// app/api/h5p/content/route.ts
// CRUD operations for H5P content
```

### Step 5: Register with H5P Hub (Optional)

For auto-updates and content type availability:

```typescript
import { registerWithH5PHub } from '@/lib/h5p-integration';

// During initial setup
await registerWithH5PHub(
  'https://yourlms.com',
  'admin@yourlms.com'
);
```

## Database Setup

Migration already created in `migrations/005_subject_and_quizzes.sql`

### New Tables:
```
- h5p_contents (stores H5P content packages)
- h5p_content_user_data (tracks user interactions)
- h5p_results (xAPI statements from H5P)
- h5p_libraries (H5P library versions)
```

## Usage Examples

### 1. Create H5P Content (Teacher)

```typescript
import { H5PContentManager } from '@/lib/h5p-integration';

// Create an interactive video quiz
const content = await H5PContentManager.createContent(
  courseId,
  'Introduction to Biology',
  'InteractiveVideo',
  {
    video: {
      sources: [{ src: 'https://example.com/video.mp4' }],
    },
    interactions: [
      {
        type: 'multiple-choice',
        question: 'What is photosynthesis?',
        answers: [...],
      },
    ],
  },
  teacherId
);

// Embed in course material
const embedCode = H5PContentManager.generateEmbedCode(
  content.id,
  courseId
);
```

### 2. Display H5P Content (Student)

**React Component:**
```typescript
// components/H5PPlayer.tsx
import { useEffect } from 'react';

export function H5PPlayer({ contentId }: { contentId: string }) {
  useEffect(() => {
    // Load H5P core and libraries
    const script = document.createElement('script');
    script.src = '/h5p/core/js/h5p-resizer.js';
    document.body.appendChild(script);
  }, []);

  return (
    <div>
      <iframe
        src={`/h5p/embed/${contentId}`}
        width="100%"
        height="500px"
        frameBorder="0"
        allowFullScreen
      ></iframe>
    </div>
  );
}
```

### 3. Process H5P Results

```typescript
import { H5PResultTracker } from '@/lib/h5p-integration';

// When student completes H5P activity
const result = await H5PResultTracker.processQuizResult(
  contentId,
  studentId,
  score,      // e.g., 85
  maxScore,   // e.g., 100
  answers     // Raw xAPI data
);

// Grade is automatically created:
// - Grade recorded in 'grades' table
// - Linked to course
// - Visible in student grades dashboard
```

### 4. Track xAPI Statements

H5P sends xAPI statements like:

```json
{
  "actor": {
    "mbox": "student@example.com",
    "name": "John Student"
  },
  "verb": {
    "id": "http://adlnet.gov/expapi/verbs/completed"
  },
  "object": {
    "id": "https://yourlms.com/h5p/content/123",
    "definition": {
      "type": "http://adlnet.gov/expapi/activities/assessment",
      "name": { "en": "Biology Quiz" }
    }
  },
  "result": {
    "score": { "scaled": 0.85, "raw": 85, "max": 100 },
    "duration": "PT45S",
    "completion": true
  }
}
```

These are automatically tracked and converted to grades.

## Available H5P Content Types

### Interactive Learning
- **Interactive Video** - Videos with quizzes and interactive elements
- **Course Presentation** - Slides with animations and interactions
- **Timeline** - Interactive timelines
- **Image Hotspots** - Clickable image regions

### Assessments
- **Quiz (H5P)** - Multiple question types with auto-grading
- **Multiple Choice** - Single/multiple answer questions
- **True/False** - Yes/no questions
- **Essay** - Short answer text submission
- **Fill in the Blanks** - Text input blanks

### Activities
- **Drag and Drop** - Drag objects to targets
- **Matching Table** - Match pairs
- **Memory Game** - Find matching pairs
- **Flashcards** - Spaced repetition learning
- **Hangman** - Word guessing game

### And 40+ more at https://h5p.org/content-types

## Admin Dashboard for H5P

Create admin page to manage H5P:

```
/admin/h5p-management
├─ View all H5P content in system
├─ Download/export results
├─ Manage H5P libraries
├─ Configure content types
└─ View analytics
```

## Security Considerations

1. **Content Validation**
   - Validate all H5P JSON before storing
   - Sanitize user input in content

2. **Access Control**
   - Only enrolled students can access course H5P
   - Teachers can edit only own content
   - Admins can manage all H5P

3. **Result Integrity**
   - xAPI statements are signed
   - Prevent manual score manipulation
   - Log all grade modifications

4. **File Upload Limits**
   - H5P packages limited to 50MB
   - Virus scan uploaded packages
   - Store in isolated directory

## Performance Optimization

1. **Lazy Loading**
   ```typescript
   // Load H5P core only when needed
   dynamic(() => import('@/components/H5PPlayer'), {
     loading: () => <p>Loading interactive content...</p>,
   })
   ```

2. **Caching**
   - Cache H5P libraries for 1 week
   - Cache student results in Redis

3. **CDN**
   - Serve H5P libraries from CDN
   - Cache frequently used content types

## Troubleshooting

### H5P Content Not Loading
- Check if H5P libraries are in correct directory
- Verify file permissions (755 for directories, 644 for files)
- Check browser console for JavaScript errors

### Results Not Being Saved
- Verify xAPI endpoint is receiving POST requests
- Check database connection
- Ensure Content Security Policy allows iframes

### Scoring Issues
- Verify H5P content has correct points assigned
- Check if student's browser is sending complete xAPI data
- Review raw xAPI statements in database

## Migration Path from Existing Quiz System

If you have existing quizzes:

1. Export questions from old system
2. Create H5P Quiz content with those questions
3. Update course materials to use new H5P content
4. Run migration script to map old results to new system

## API Endpoints

```typescript
// CRUD Operations
GET    /api/h5p/content
POST   /api/h5p/content              // Create
GET    /api/h5p/content/:id           // Get
PUT    /api/h5p/content/:id           // Update
DELETE /api/h5p/content/:id           // Delete

// Results/Tracking
POST   /api/h5p/results               // Save xAPI statement
GET    /api/h5p/results/:contentId    // Get results for content
GET    /api/h5p/results/student/:id   // Get student's H5P results

// Embed
GET    /h5p/embed/:id                 // Render H5P player

// Analytics
GET    /api/h5p/analytics             // Admin analytics
```

## Next Steps

1. **Complete H5P Core Installation**
   - Download core files from h5p.org
   - Setup file permissions

2. **Create Teacher Interface**
   - Build H5P content creator page
   - Allow import from H5P Hub

3. **Build Tracking Dashboard**
   - Display H5P results in student grades
   - Show completion rates
   - Analytics for teachers

4. **Mobile Responsiveness**
   - Ensure H5P content works on mobile
   - Test with various screen sizes

## Resources

- **H5P Documentation:** https://h5p.org/documentation
- **H5P Hub:** https://hub.h5p.org/
- **xAPI (Experience API):** https://xapi.com/
- **H5P GitHub:** https://github.com/h5p

## Support

For H5P-specific issues:
- File issues at https://github.com/h5p/h5p-core/issues
- Community forums: https://h5p.org/forum
- Commercial support: https://h5p.com/

---

**Status:** Phase 4 - H5P integration framework created
**Next:** Complete implementation of H5P endpoints and UI
