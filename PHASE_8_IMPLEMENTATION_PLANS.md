# 🚀 PHASE 8: Enhancement Features Implementation Plans

**Project**: TEC LMS - Grade 12 & Bachelor Student Platform
**Date**: November 5, 2024
**Status**: Ready for Implementation
**Target Deployment**: 6-7 weeks
**Platform**: Next.js 14, PostgreSQL, Tailwind CSS, TypeScript

---

## 📊 Overview

This document provides detailed implementation plans for the 5 essential enhancement features that will bring the TEC LMS to full feature parity with Coursera and enterprise LMS platforms.

### Implementation Roadmap

```
Week 1-2: Email Notification System (Foundation)
  └─ SendGrid API integration, email templates, queue system

Week 2-3: Attendance Tracking System (Quick win)
  └─ QR code marking, attendance reports, statistics

Week 3-4: Real-time Chat/Messaging (Core feature)
  └─ WebSocket implementation, message history, file sharing

Week 5-6: Live Classes (Zoom Integration) (Complex)
  └─ Zoom API, scheduling, recording, Q&A integration

Week 6-7: Parent/Guardian Portal (Data aggregation)
  └─ Child performance view, alerts, communication
```

### Feature Priority Matrix

| Feature | Priority | Effort | Impact | Week |
|---------|----------|--------|--------|------|
| Email Notifications | HIGH | 1-2 wks | Foundation for all | 1-2 |
| Attendance Tracking | HIGH | 2-3 wks | Grade 12 requirement | 2-3 |
| Real-time Chat | HIGH | 3-4 wks | Student engagement | 3-4 |
| Live Classes | MEDIUM | 3-4 wks | Premium feature | 5-6 |
| Parent Portal | MEDIUM | 2-3 wks | Value-add feature | 6-7 |

---

## 🔔 Feature 1: Email Notification System (Enhanced)

**Estimated Effort**: 1-2 weeks
**Complexity**: Medium
**Dependencies**: Existing notification system
**Key Technology**: SendGrid, Node.js Email service

### 1.1 Overview

Transform the existing notification queue system into a fully functional email delivery system using SendGrid API. This is the foundation for all other features that require user notifications.

### 1.2 Database Schema

```sql
-- Update notification_queue table for production email tracking
ALTER TABLE notification_queue ADD COLUMN (
  queue_id BIGSERIAL PRIMARY KEY,
  notification_id BIGINT NOT NULL REFERENCES notifications(id),
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  template_name VARCHAR(100),
  template_data JSONB,
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, bounced, failed
  sendgrid_message_id VARCHAR(255),
  send_attempts INT DEFAULT 0,
  last_attempt_at TIMESTAMP,
  sent_at TIMESTAMP,
  error_message TEXT,
  error_code VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email templates table
CREATE TABLE IF NOT EXISTS email_templates (
  template_id BIGSERIAL PRIMARY KEY,
  template_name VARCHAR(100) UNIQUE NOT NULL,
  template_type VARCHAR(50), -- forum_reply, certificate_issued, etc.
  subject_template VARCHAR(255) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB, -- Variables like {{student_name}}, {{course_name}}
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email delivery analytics
CREATE TABLE IF NOT EXISTS email_analytics (
  analytics_id BIGSERIAL PRIMARY KEY,
  template_name VARCHAR(100),
  notification_type VARCHAR(50),
  total_sent INT DEFAULT 0,
  total_delivered INT DEFAULT 0,
  total_bounced INT DEFAULT 0,
  total_failed INT DEFAULT 0,
  delivery_rate DECIMAL(5,2), -- Percentage
  bounce_rate DECIMAL(5,2),
  open_rate DECIMAL(5,2),
  click_rate DECIMAL(5,2),
  date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes
CREATE INDEX idx_notification_queue_status ON notification_queue(status);
CREATE INDEX idx_notification_queue_created ON notification_queue(created_at);
CREATE INDEX idx_email_templates_name ON email_templates(template_name);
CREATE INDEX idx_email_templates_type ON email_templates(template_type);
CREATE INDEX idx_email_analytics_date ON email_analytics(date);
```

### 1.3 Environment Configuration

```env
# .env.local
SENDGRID_API_KEY=SG.xxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@techlms.com
SENDGRID_FROM_NAME=TEC LMS

# Email retry settings
EMAIL_MAX_RETRIES=3
EMAIL_RETRY_INTERVAL_MINUTES=5

# Development
NEXT_PUBLIC_EMAIL_MOCK=false # true for local testing
```

### 1.4 SendGrid API Setup

```typescript
// lib/email/sendgrid.ts

import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

interface EmailPayload {
  recipient_email: string;
  subject: string;
  template_name: string;
  template_data: Record<string, any>;
  notification_id?: number;
}

export async function sendEmailViaSendGrid(payload: EmailPayload) {
  try {
    // Get template from database
    const template = await getEmailTemplate(payload.template_name);

    if (!template) {
      throw new Error(`Template not found: ${payload.template_name}`);
    }

    // Process template variables
    const htmlContent = processTemplate(
      template.html_content,
      payload.template_data
    );
    const subject = processTemplate(
      template.subject_template,
      payload.template_data
    );

    // Send email
    const msg = {
      to: payload.recipient_email,
      from: process.env.SENDGRID_FROM_EMAIL!,
      subject: subject,
      html: htmlContent,
      text: template.text_content,
      replyTo: process.env.SENDGRID_FROM_EMAIL!,
    };

    const response = await sgMail.send(msg);

    // Log successful send
    await logEmailSend({
      notification_id: payload.notification_id,
      recipient_email: payload.recipient_email,
      status: 'sent',
      sendgrid_message_id: response[0].headers['x-message-id'],
      template_name: payload.template_name,
    });

    return { success: true, messageId: response[0].headers['x-message-id'] };
  } catch (error: any) {
    // Log failure
    await logEmailSend({
      notification_id: payload.notification_id,
      recipient_email: payload.recipient_email,
      status: 'failed',
      error_message: error.message,
      error_code: error.code,
      template_name: payload.template_name,
    });

    throw error;
  }
}

function processTemplate(template: string, data: Record<string, any>): string {
  let result = template;
  Object.entries(data).forEach(([key, value]) => {
    result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
  });
  return result;
}

async function getEmailTemplate(templateName: string) {
  const result = await query(
    'SELECT * FROM email_templates WHERE template_name = $1 AND is_active = true',
    [templateName]
  );
  return result.rows[0] || null;
}

async function logEmailSend(data: any) {
  await query(
    `INSERT INTO notification_queue
     (notification_id, recipient_email, template_name, status, sendgrid_message_id, error_message, error_code)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      data.notification_id,
      data.recipient_email,
      data.template_name,
      data.status,
      data.sendgrid_message_id,
      data.error_message,
      data.error_code,
    ]
  );
}
```

### 1.5 Email Templates

```typescript
// lib/email/templates.ts - Pre-defined templates

export const EMAIL_TEMPLATES = {
  FORUM_REPLY: {
    name: 'forum_reply',
    subject: 'New reply to your discussion: {{thread_title}}',
    htmlTemplate: `
      <h2>New Reply in {{course_name}}</h2>
      <p>Hi {{student_name}},</p>
      <p><strong>{{replier_name}}</strong> replied to your discussion:</p>
      <blockquote>{{reply_text}}</blockquote>
      <p><a href="{{discussion_link}}">View Discussion</a></p>
    `,
  },

  CERTIFICATE_ISSUED: {
    name: 'certificate_issued',
    subject: 'Congratulations! You earned a certificate in {{course_name}}',
    htmlTemplate: `
      <h2>Certificate Earned! 🏆</h2>
      <p>Hi {{student_name}},</p>
      <p>Congratulations on completing <strong>{{course_name}}</strong>!</p>
      <p>Your certificate is ready to download and share.</p>
      <p><a href="{{certificate_link}}">View Certificate</a></p>
    `,
  },

  QUIZ_GRADED: {
    name: 'quiz_graded',
    subject: 'Your quiz {{quiz_name}} has been graded',
    htmlTemplate: `
      <h2>Quiz Graded</h2>
      <p>Hi {{student_name}},</p>
      <p>Your quiz <strong>{{quiz_name}}</strong> in {{course_name}} has been graded.</p>
      <p><strong>Score: {{score}}/{{total_points}}</strong> ({{percentage}}%)</p>
      <p><a href="{{quiz_link}}">View Details</a></p>
    `,
  },

  PATH_MILESTONE: {
    name: 'path_milestone',
    subject: 'Milestone achieved in {{path_name}}!',
    htmlTemplate: `
      <h2>Path Milestone 🎯</h2>
      <p>Hi {{student_name}},</p>
      <p>You've completed {{completed_courses}} courses in {{path_name}}!</p>
      <p><a href="{{path_link}}">Continue Learning</a></p>
    `,
  },

  ATTENDANCE_ALERT: {
    name: 'attendance_alert',
    subject: 'Attendance reminder for {{class_name}}',
    htmlTemplate: `
      <h2>Mark Your Attendance</h2>
      <p>Hi {{student_name}},</p>
      <p>{{class_name}} class is happening in 15 minutes.</p>
      <p>Please mark your attendance: <a href="{{attendance_link}}">Mark Present</a></p>
    `,
  },

  LIVE_CLASS_STARTS: {
    name: 'live_class_starts',
    subject: 'Live class {{class_name}} is starting now!',
    htmlTemplate: `
      <h2>Live Class Starting 🎥</h2>
      <p>Hi {{student_name}},</p>
      <p><strong>{{class_name}}</strong> by {{teacher_name}} is starting now!</p>
      <p><a href="{{class_link}}">Join Class</a></p>
    `,
  },
};
```

### 1.6 Email Queue Worker API

```typescript
// app/api/email/process-queue/route.ts

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { sendEmailViaSendGrid } from '@/lib/email/sendgrid';

/**
 * Process pending emails in the queue
 * This should be called by a cron job or scheduled task
 * Endpoint: GET /api/email/process-queue
 * Recommended: Run every 2 minutes
 */
export async function GET(request: Request) {
  // Verify API key (use internal cron secret)
  const apiKey = request.headers.get('x-api-key');
  if (apiKey !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'INVALID_API_KEY' },
      { status: 401 }
    );
  }

  try {
    // Get pending emails (limit to 50 per batch)
    const result = await query(
      `SELECT * FROM notification_queue
       WHERE status = 'pending' AND send_attempts < $1
       ORDER BY created_at ASC
       LIMIT 50`,
      [process.env.EMAIL_MAX_RETRIES || 3]
    );

    const pendingEmails = result.rows;
    let successCount = 0;
    let failureCount = 0;

    // Process each email
    for (const email of pendingEmails) {
      try {
        // Get notification details
        const notifResult = await query(
          'SELECT * FROM notifications WHERE id = $1',
          [email.notification_id]
        );

        const notification = notifResult.rows[0];

        // Send email
        await sendEmailViaSendGrid({
          recipient_email: email.recipient_email,
          subject: email.subject,
          template_name: email.template_name,
          template_data: email.template_data || {},
          notification_id: email.notification_id,
        });

        successCount++;

        // Update queue record
        await query(
          `UPDATE notification_queue
           SET status = 'sent', send_attempts = send_attempts + 1, sent_at = NOW()
           WHERE queue_id = $1`,
          [email.queue_id]
        );
      } catch (error: any) {
        failureCount++;

        // Update with retry count
        await query(
          `UPDATE notification_queue
           SET status = 'failed', send_attempts = send_attempts + 1,
               last_attempt_at = NOW(), error_message = $1
           WHERE queue_id = $2`,
          [error.message, email.queue_id]
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Email queue processed',
      stats: {
        processed: pendingEmails.length,
        successful: successCount,
        failed: failureCount,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Queue processing failed',
        code: 'QUEUE_PROCESS_ERROR',
        message: error.message,
      },
      { status: 500 }
    );
  }
}
```

### 1.7 Email Management Dashboard

```typescript
// app/dashboard/admin/email-management/page.tsx

'use client';

import { useState, useEffect } from 'react';
import { formatDate, formatTimeAgo } from '@/lib/i18n/i18n';

export default function EmailManagementPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [queueStats, setQueueStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [templatesRes, analyticsRes, queueRes] = await Promise.all([
        fetch('/api/email/templates'),
        fetch('/api/email/analytics'),
        fetch('/api/email/queue-stats'),
      ]);

      if (templatesRes.ok) {
        setTemplates(await templatesRes.json());
      }
      if (analyticsRes.ok) {
        setAnalytics(await analyticsRes.json());
      }
      if (queueRes.ok) {
        setQueueStats(await queueRes.json());
      }
    } catch (error) {
      console.error('Failed to fetch email data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-8">
      {/* Queue Statistics */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-sm font-semibold text-blue-900">Pending</div>
          <div className="text-2xl font-bold text-blue-600">{queueStats?.pending || 0}</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-sm font-semibold text-green-900">Sent Today</div>
          <div className="text-2xl font-bold text-green-600">{queueStats?.sent_today || 0}</div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="text-sm font-semibold text-yellow-900">Failed</div>
          <div className="text-2xl font-bold text-yellow-600">{queueStats?.failed || 0}</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-sm font-semibold text-purple-900">Success Rate</div>
          <div className="text-2xl font-bold text-purple-600">
            {analytics?.overall_success_rate || '0'}%
          </div>
        </div>
      </section>

      {/* Email Templates */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Email Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map((template) => (
            <div key={template.template_id} className="bg-white border border-gray-200 rounded-lg p-4">
              <h3 className="font-bold">{template.template_name}</h3>
              <p className="text-sm text-gray-600 mt-2">{template.subject_template}</p>
              <div className="mt-4 flex gap-2">
                <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200">
                  Edit
                </button>
                <button className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm hover:bg-green-200">
                  Test Send
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Email Analytics Chart */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Delivery Analytics (Last 30 Days)</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          {/* Add Chart.js or similar visualization here */}
          <div className="h-64 flex items-center justify-center text-gray-400">
            Analytics chart placeholder
          </div>
        </div>
      </section>
    </div>
  );
}
```

### 1.8 Testing Checklist

- [ ] SendGrid account created and API key configured
- [ ] Test email send in development (mock mode)
- [ ] Test email send to real email address
- [ ] Verify email queue creation on notification
- [ ] Test retry logic (fail 1st, succeed 2nd)
- [ ] Test template variable substitution
- [ ] Verify email appears in SendGrid dashboard
- [ ] Test batch processing of 50+ emails
- [ ] Monitor bounce rate and failures
- [ ] Verify webhook integration for delivery status

**Estimated LOC**: 800-1000 lines
**Dependencies**: SendGrid SDK, existing notifications table

---

## 📋 Feature 2: Attendance Tracking System

**Estimated Effort**: 2-3 weeks
**Complexity**: Medium
**Dependencies**: Courses, Students, Classes
**Key Technology**: QR codes, SMS (optional)

### 2.1 Overview

Complete attendance tracking system with QR code marking, manual entry, reports, and integration with parent portal.

### 2.2 Database Schema

```sql
-- Attendance records
CREATE TABLE IF NOT EXISTS attendance_records (
  attendance_id BIGSERIAL PRIMARY KEY,
  class_session_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  course_id BIGINT NOT NULL,
  marked_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'absent', -- present, absent, late, excused
  marked_by BIGINT, -- teacher_id who marked
  marking_method VARCHAR(20), -- qr_code, manual, mobile, auto
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  marked_via_device VARCHAR(100), -- device info for tracking
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_session_id) REFERENCES class_sessions(session_id),
  FOREIGN KEY (student_id) REFERENCES students(student_id),
  FOREIGN KEY (course_id) REFERENCES courses(course_id),
  FOREIGN KEY (marked_by) REFERENCES profiles(id)
);

-- Class sessions (schedule instances)
CREATE TABLE IF NOT EXISTS class_sessions (
  session_id BIGSERIAL PRIMARY KEY,
  course_id BIGINT NOT NULL,
  class_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  topic VARCHAR(255),
  qr_code_token VARCHAR(100) UNIQUE,
  qr_code_expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_by BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(course_id),
  FOREIGN KEY (created_by) REFERENCES profiles(id)
);

-- Attendance exemptions (excused absences)
CREATE TABLE IF NOT EXISTS attendance_exemptions (
  exemption_id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL,
  class_session_id BIGINT,
  course_id BIGINT,
  reason VARCHAR(255) NOT NULL,
  exemption_date DATE NOT NULL,
  approved_by BIGINT,
  approval_status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  evidence_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id),
  FOREIGN KEY (class_session_id) REFERENCES class_sessions(session_id),
  FOREIGN KEY (course_id) REFERENCES courses(course_id),
  FOREIGN KEY (approved_by) REFERENCES profiles(id)
);

-- Attendance statistics (cached for performance)
CREATE TABLE IF NOT EXISTS attendance_statistics (
  stat_id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL,
  course_id BIGINT NOT NULL,
  total_classes INT DEFAULT 0,
  classes_attended INT DEFAULT 0,
  classes_absent INT DEFAULT 0,
  classes_late INT DEFAULT 0,
  classes_excused INT DEFAULT 0,
  attendance_percentage DECIMAL(5, 2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(student_id),
  FOREIGN KEY (course_id) REFERENCES courses(course_id),
  UNIQUE(student_id, course_id)
);

-- Add indexes
CREATE INDEX idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX idx_attendance_records_course ON attendance_records(course_id);
CREATE INDEX idx_attendance_records_date ON attendance_records(created_at);
CREATE INDEX idx_class_sessions_course ON class_sessions(course_id);
CREATE INDEX idx_class_sessions_date ON class_sessions(class_date);
CREATE INDEX idx_attendance_stats_student ON attendance_statistics(student_id);
```

### 2.3 QR Code Generation

```typescript
// lib/attendance/qr-code.ts

import QRCode from 'qrcode';
import crypto from 'crypto';

interface QRCodePayload {
  sessionId: number;
  courseId: number;
  token: string;
  expiresAt: Date;
}

/**
 * Generate QR code token for attendance marking
 * Token is valid for 1 hour (configurable)
 */
export async function generateAttendanceQRCode(sessionId: number): Promise<{
  token: string;
  expiresAt: Date;
  qrCodeDataUrl: string;
}> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Create QR code payload (minimal for fast scanning)
  const payload: QRCodePayload = {
    sessionId,
    courseId: 0, // Will be filled by backend
    token,
    expiresAt,
  };

  // Generate QR code
  const qrCodeDataUrl = await QRCode.toDataURL(
    JSON.stringify(payload),
    { errorCorrectionLevel: 'H', width: 300 }
  );

  return { token, expiresAt, qrCodeDataUrl };
}

/**
 * Verify QR code token and extract session info
 */
export function verifyAttendanceQRCode(token: string, sessionId: number): boolean {
  // This would be validated against database record
  // Token should match and not be expired
  return true;
}
```

### 2.4 Teacher Attendance API

```typescript
// app/api/attendance/mark/route.ts

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * POST /api/attendance/mark
 * Mark student attendance (multiple methods: QR, manual, mobile)
 */
export async function POST(request: Request) {
  const session = await getSession();

  if (!session || session.role !== 'teacher') {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'TEACHER_ONLY' },
      { status: 403 }
    );
  }

  const {
    sessionId,
    studentId,
    status, // present, absent, late, excused
    markingMethod, // qr_code, manual, mobile
    latitude,
    longitude,
    notes,
  } = await request.json();

  // Validate inputs
  if (!sessionId || !studentId || !status) {
    return NextResponse.json(
      { error: 'Missing required fields', code: 'INVALID_REQUEST' },
      { status: 400 }
    );
  }

  try {
    // Verify session exists
    const sessionResult = await query(
      'SELECT * FROM class_sessions WHERE session_id = $1',
      [sessionId]
    );

    if (sessionResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Class session not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const classSession = sessionResult.rows[0];

    // Verify student is enrolled
    const enrollResult = await query(
      `SELECT * FROM enrollments
       WHERE student_id = $1 AND course_id = $2 AND status = 'active'`,
      [studentId, classSession.course_id]
    );

    if (enrollResult.rowCount === 0) {
      return NextResponse.json(
        { error: 'Student not enrolled in course', code: 'NOT_ENROLLED' },
        { status: 400 }
      );
    }

    // Check for existing attendance record
    const existingResult = await query(
      `SELECT * FROM attendance_records
       WHERE student_id = $1 AND class_session_id = $2`,
      [studentId, sessionId]
    );

    let attendanceRecord;

    if (existingResult.rowCount > 0) {
      // Update existing record
      const updateResult = await query(
        `UPDATE attendance_records
         SET status = $1, marked_at = NOW(), marked_by = $2,
             marking_method = $3, latitude = $4, longitude = $5, notes = $6
         WHERE attendance_id = $7
         RETURNING *`,
        [
          status,
          session.id,
          markingMethod || 'manual',
          latitude,
          longitude,
          notes,
          existingResult.rows[0].attendance_id,
        ]
      );
      attendanceRecord = updateResult.rows[0];
    } else {
      // Create new record
      const insertResult = await query(
        `INSERT INTO attendance_records
         (class_session_id, student_id, course_id, status, marked_at,
          marked_by, marking_method, latitude, longitude, notes)
         VALUES ($1, $2, $3, $4, NOW(), $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          sessionId,
          studentId,
          classSession.course_id,
          status,
          session.id,
          markingMethod || 'manual',
          latitude,
          longitude,
          notes,
        ]
      );
      attendanceRecord = insertResult.rows[0];
    }

    // Update attendance statistics (cached)
    await updateAttendanceStatistics(studentId, classSession.course_id);

    return NextResponse.json({
      success: true,
      data: {
        attendance_id: attendanceRecord.attendance_id,
        student_id: attendanceRecord.student_id,
        status: attendanceRecord.status,
        marked_at: attendanceRecord.marked_at,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to mark attendance', code: 'MARK_ERROR', message: error.message },
      { status: 500 }
    );
  }
}

async function updateAttendanceStatistics(studentId: number, courseId: number) {
  const stats = await query(
    `SELECT
      COUNT(*) as total_classes,
      SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as classes_attended,
      SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as classes_absent,
      SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as classes_late,
      SUM(CASE WHEN status = 'excused' THEN 1 ELSE 0 END) as classes_excused
     FROM attendance_records
     WHERE student_id = $1 AND course_id = $2`,
    [studentId, courseId]
  );

  const row = stats.rows[0];
  const attendancePercentage =
    row.total_classes > 0 ? ((row.classes_attended / row.total_classes) * 100).toFixed(2) : 0;

  await query(
    `INSERT INTO attendance_statistics
     (student_id, course_id, total_classes, classes_attended, classes_absent,
      classes_late, classes_excused, attendance_percentage)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (student_id, course_id) DO UPDATE SET
     total_classes = $3,
     classes_attended = $4,
     classes_absent = $5,
     classes_late = $6,
     classes_excused = $7,
     attendance_percentage = $8,
     last_updated = NOW()`,
    [
      studentId,
      courseId,
      row.total_classes,
      row.classes_attended,
      row.classes_absent,
      row.classes_late,
      row.classes_excused,
      attendancePercentage,
    ]
  );
}
```

### 2.5 Teacher Attendance UI

```typescript
// app/dashboard/teacher/courses/[courseId]/attendance/page.tsx

'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode.react';
import { formatDate } from '@/lib/i18n/i18n';

export default function AttendancePage({ params }: { params: { courseId: string } }) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [qrCode, setQrCode] = useState<string>('');
  const [attendance, setAttendance] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    try {
      const response = await fetch(`/api/classes/sessions?courseId=${params.courseId}`);
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function selectSession(session: any) {
    setSelectedSession(session);

    // Generate QR code for this session
    const qrResponse = await fetch(`/api/attendance/generate-qr`, {
      method: 'POST',
      body: JSON.stringify({ sessionId: session.session_id }),
    });

    if (qrResponse.ok) {
      const data = await qrResponse.json();
      setQrCode(data.qr_code_url);
    }

    // Fetch enrolled students
    const studentsResponse = await fetch(
      `/api/courses/${params.courseId}/students`
    );
    if (studentsResponse.ok) {
      setStudents(await studentsResponse.json());
      setAttendance({});
    }
  }

  async function markAttendance(studentId: number, status: string) {
    setAttendance({ ...attendance, [studentId]: status });

    await fetch('/api/attendance/mark', {
      method: 'POST',
      body: JSON.stringify({
        sessionId: selectedSession.session_id,
        studentId,
        status,
        markingMethod: 'manual',
      }),
    });
  }

  async function saveSession() {
    const response = await fetch('/api/classes/sessions', {
      method: 'PUT',
      body: JSON.stringify({ sessionId: selectedSession.session_id }),
    });

    if (response.ok) {
      alert('Attendance saved successfully');
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Attendance Management</h1>

      {/* Session Selection */}
      <div>
        <h2 className="text-xl font-bold mb-3">Select Class Session</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {sessions.map((session) => (
            <button
              key={session.session_id}
              onClick={() => selectSession(session)}
              className={`p-4 border-2 rounded-lg transition ${
                selectedSession?.session_id === session.session_id
                  ? 'border-blue-600 bg-blue-50'
                  : 'border-gray-200 hover:border-blue-300'
              }`}
            >
              <div className="font-bold">{formatDate(session.class_date)}</div>
              <div className="text-sm text-gray-600">{session.topic}</div>
              <div className="text-xs text-gray-500">
                {session.start_time} - {session.end_time}
              </div>
            </button>
          ))}
        </div>
      </div>

      {selectedSession && (
        <>
          {/* QR Code Display */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="font-bold mb-4">QR Code for Quick Marking</h3>
            {qrCode ? (
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded border border-gray-300">
                  {/* QR Code would render here */}
                  <div className="w-48 h-48 bg-gray-200 flex items-center justify-center">
                    QR Code
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">Generating QR code...</div>
            )}
          </div>

          {/* Student Attendance List */}
          <div>
            <h3 className="text-xl font-bold mb-4">Mark Attendance</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-4 py-2 text-left">Student Name</th>
                    <th className="px-4 py-2 text-center">Present</th>
                    <th className="px-4 py-2 text-center">Late</th>
                    <th className="px-4 py-2 text-center">Absent</th>
                    <th className="px-4 py-2 text-center">Excused</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.student_id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3">{student.user_name}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => markAttendance(student.student_id, 'present')}
                          className={`px-3 py-1 rounded ${
                            attendance[student.student_id] === 'present'
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-200 hover:bg-green-200'
                          }`}
                        >
                          ✓
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => markAttendance(student.student_id, 'late')}
                          className={`px-3 py-1 rounded ${
                            attendance[student.student_id] === 'late'
                              ? 'bg-yellow-500 text-white'
                              : 'bg-gray-200 hover:bg-yellow-200'
                          }`}
                        >
                          ⏱
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => markAttendance(student.student_id, 'absent')}
                          className={`px-3 py-1 rounded ${
                            attendance[student.student_id] === 'absent'
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-200 hover:bg-red-200'
                          }`}
                        >
                          ✕
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => markAttendance(student.student_id, 'excused')}
                          className={`px-3 py-1 rounded ${
                            attendance[student.student_id] === 'excused'
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 hover:bg-blue-200'
                          }`}
                        >
                          👤
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={saveSession}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Attendance
            </button>
          </div>
        </>
      )}
    </div>
  );
}
```

### 2.6 Attendance Reports API

```typescript
// app/api/attendance/reports/route.ts

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * GET /api/attendance/reports
 * Get attendance reports by course, student, or date range
 */
export async function GET(request: Request) {
  const session = await getSession();

  if (!session || !['teacher', 'admin'].includes(session.role)) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get('courseId');
  const studentId = searchParams.get('studentId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const reportType = searchParams.get('type') || 'summary';

  try {
    if (reportType === 'summary' && courseId) {
      // Course attendance summary
      const result = await query(
        `SELECT
          s.student_id, u.user_name,
          COUNT(*) as total_classes,
          SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END) as present,
          SUM(CASE WHEN ar.status = 'late' THEN 1 ELSE 0 END) as late,
          SUM(CASE WHEN ar.status = 'absent' THEN 1 ELSE 0 END) as absent,
          SUM(CASE WHEN ar.status = 'excused' THEN 1 ELSE 0 END) as excused,
          ROUND(
            (SUM(CASE WHEN ar.status = 'present' THEN 1 ELSE 0 END)::numeric /
             COUNT(*)::numeric * 100), 2
          ) as attendance_percentage
         FROM students s
         JOIN profiles u ON s.user_id = u.id
         JOIN enrollments e ON s.student_id = e.student_id
         LEFT JOIN attendance_records ar ON s.student_id = ar.student_id
           AND ar.course_id = $1
         WHERE e.course_id = $1 AND e.status = 'active'
         GROUP BY s.student_id, u.user_name
         ORDER BY attendance_percentage DESC`,
        [courseId]
      );

      return NextResponse.json({
        success: true,
        reportType: 'summary',
        courseId,
        data: result.rows,
      });
    }

    if (reportType === 'detailed' && studentId && courseId) {
      // Detailed attendance by session
      const result = await query(
        `SELECT
          ar.attendance_id, cs.class_date, cs.start_time, cs.topic,
          ar.status, ar.marked_at, ar.notes
         FROM attendance_records ar
         JOIN class_sessions cs ON ar.class_session_id = cs.session_id
         WHERE ar.student_id = $1 AND ar.course_id = $2
         ORDER BY cs.class_date DESC`,
        [studentId, courseId]
      );

      return NextResponse.json({
        success: true,
        reportType: 'detailed',
        studentId,
        courseId,
        data: result.rows,
      });
    }

    return NextResponse.json(
      { error: 'Invalid report parameters', code: 'INVALID_REPORT' },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Report generation failed', code: 'REPORT_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
```

### 2.7 Testing Checklist

- [ ] QR code generation and validation
- [ ] Manual attendance marking for single student
- [ ] Bulk attendance marking (entire class)
- [ ] Attendance statistics calculation (percentage)
- [ ] Late vs absent vs excused differentiation
- [ ] Exemption approval workflow
- [ ] Attendance reports generation (CSV export)
- [ ] Mobile QR code scanning
- [ ] Duplicate entry prevention
- [ ] Parent portal attendance view

**Estimated LOC**: 1200-1500 lines
**Dependencies**: Courses, Students, Classes, Enrollments tables

---

## 💬 Feature 3: Real-time Chat/Messaging

**Estimated Effort**: 3-4 weeks
**Complexity**: High
**Dependencies**: WebSocket server, Student/Teacher relationships
**Key Technology**: Socket.IO, Redis

### 3.1 Overview

Comprehensive real-time messaging system supporting direct messages, course announcements, group chats, and file sharing.

### 3.2 Database Schema

```sql
-- Conversation threads
CREATE TABLE IF NOT EXISTS conversations (
  conversation_id BIGSERIAL PRIMARY KEY,
  conversation_type VARCHAR(20), -- direct, course, group
  course_id BIGINT,
  title VARCHAR(255),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  archived_at TIMESTAMP,
  created_by BIGINT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(course_id),
  FOREIGN KEY (created_by) REFERENCES profiles(id)
);

-- Conversation participants
CREATE TABLE IF NOT EXISTS conversation_participants (
  participant_id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  role VARCHAR(20), -- owner, admin, member
  is_muted BOOLEAN DEFAULT FALSE,
  last_read_message_id BIGINT,
  last_read_at TIMESTAMP,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  left_at TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES profiles(id),
  UNIQUE(conversation_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS messages (
  message_id BIGSERIAL PRIMARY KEY,
  conversation_id BIGINT NOT NULL,
  sender_id BIGINT NOT NULL,
  message_text TEXT NOT NULL,
  message_type VARCHAR(20), -- text, image, file, system
  is_edited BOOLEAN DEFAULT FALSE,
  edited_at TIMESTAMP,
  is_deleted BOOLEAN DEFAULT FALSE,
  deleted_at TIMESTAMP,
  deleted_by BIGINT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES profiles(id)
);

-- Message attachments
CREATE TABLE IF NOT EXISTS message_attachments (
  attachment_id BIGSERIAL PRIMARY KEY,
  message_id BIGINT NOT NULL,
  file_name VARCHAR(255),
  file_size INT,
  file_type VARCHAR(50),
  file_url VARCHAR(500),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(message_id) ON DELETE CASCADE
);

-- Message read receipts
CREATE TABLE IF NOT EXISTS message_read_receipts (
  receipt_id BIGSERIAL PRIMARY KEY,
  message_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (message_id) REFERENCES messages(message_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES profiles(id),
  UNIQUE(message_id, user_id)
);

-- Add indexes
CREATE INDEX idx_conversations_type ON conversations(conversation_type);
CREATE INDEX idx_conversations_course ON conversations(course_id);
CREATE INDEX idx_participants_user ON conversation_participants(user_id);
CREATE INDEX idx_participants_conversation ON conversation_participants(conversation_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_attachments_message ON message_attachments(message_id);
CREATE INDEX idx_read_receipts_message ON message_read_receipts(message_id);
```

### 3.3 WebSocket Server Setup

```typescript
// lib/websocket/socket-server.ts

import { Server } from 'socket.io';
import { createServer } from 'http';
import { query } from '@/lib/db';

let io: Server;

export function initializeWebSocket(server: any) {
  io = new Server(server, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join conversation room
    socket.on('join_conversation', async (data) => {
      const { conversationId, userId } = data;

      // Verify user is participant
      const result = await query(
        `SELECT * FROM conversation_participants
         WHERE conversation_id = $1 AND user_id = $2`,
        [conversationId, userId]
      );

      if (result.rowCount > 0) {
        socket.join(`conversation_${conversationId}`);

        // Mark as online
        io.to(`conversation_${conversationId}`).emit('user_online', {
          userId,
          timestamp: new Date(),
        });
      }
    });

    // Send message
    socket.on('send_message', async (data) => {
      const { conversationId, senderId, messageText } = data;

      try {
        // Save to database
        const result = await query(
          `INSERT INTO messages (conversation_id, sender_id, message_text)
           VALUES ($1, $2, $3)
           RETURNING *`,
          [conversationId, senderId, messageText]
        );

        const message = result.rows[0];

        // Broadcast to all participants
        io.to(`conversation_${conversationId}`).emit('new_message', {
          message_id: message.message_id,
          conversation_id: message.conversation_id,
          sender_id: message.sender_id,
          message_text: message.message_text,
          created_at: message.created_at,
        });
      } catch (error) {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Mark message as read
    socket.on('read_message', async (data) => {
      const { messageId, userId } = data;

      await query(
        `INSERT INTO message_read_receipts (message_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [messageId, userId]
      );

      io.to(`message_${messageId}`).emit('message_read', {
        messageId,
        userId,
      });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  return io;
}

export function getIO() {
  return io;
}
```

### 3.4 Chat API Endpoints

```typescript
// app/api/messages/conversations/route.ts

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getSession } from '@/lib/auth';

/**
 * GET /api/messages/conversations
 * Get all conversations for current user
 */
export async function GET(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  try {
    const result = await query(
      `SELECT c.*, COUNT(m.message_id) as message_count,
         (SELECT COUNT(*) FROM messages m2
          WHERE m2.conversation_id = c.conversation_id
          AND m2.created_at > cp.last_read_at) as unread_count,
         (SELECT message_text FROM messages
          WHERE conversation_id = c.conversation_id
          ORDER BY created_at DESC LIMIT 1) as last_message
       FROM conversations c
       JOIN conversation_participants cp ON c.conversation_id = cp.conversation_id
       LEFT JOIN messages m ON c.conversation_id = m.conversation_id
       WHERE cp.user_id = $1 AND cp.left_at IS NULL
       GROUP BY c.conversation_id, cp.user_id, cp.last_read_at
       ORDER BY c.updated_at DESC`,
      [session.id]
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch conversations', code: 'FETCH_ERROR', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST /api/messages/conversations
 * Create new conversation
 */
export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const {
    conversation_type, // direct, course, group
    course_id,
    title,
    participant_ids, // Array of user IDs (excluding creator)
  } = await request.json();

  try {
    // Create conversation
    const convResult = await query(
      `INSERT INTO conversations (conversation_type, course_id, title, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [conversation_type, course_id, title, session.id]
    );

    const conversation = convResult.rows[0];

    // Add creator as participant
    await query(
      `INSERT INTO conversation_participants (conversation_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [conversation.conversation_id, session.id]
    );

    // Add other participants
    if (participant_ids && participant_ids.length > 0) {
      for (const userId of participant_ids) {
        await query(
          `INSERT INTO conversation_participants (conversation_id, user_id, role)
           VALUES ($1, $2, 'member')`,
          [conversation.conversation_id, userId]
        );
      }
    }

    return NextResponse.json({
      success: true,
      data: conversation,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to create conversation', code: 'CREATE_ERROR', message: error.message },
      { status: 500 }
    );
  }
}
```

### 3.5 Chat UI Component

```typescript
// app/dashboard/student/messages/[conversationId]/page.tsx

'use client';

import { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { formatTimeAgo } from '@/lib/i18n/i18n';

export default function ChatPage({ params }: { params: { conversationId: string } }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    // Initialize Socket.IO
    const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000');
    setSocket(newSocket);

    // Fetch current session
    fetch('/api/auth/session')
      .then(res => res.json())
      .then(data => setSession(data));

    // Fetch conversation and messages
    fetchConversation();

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
      scrollToBottom();
    });

    socket.on('user_online', (data) => {
      // Update participant online status
    });

    return () => {
      socket.off('new_message');
      socket.off('user_online');
    };
  }, [socket]);

  async function fetchConversation() {
    try {
      const response = await fetch(`/api/messages/conversations/${params.conversationId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
        setParticipants(data.participants);
      }
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
    } finally {
      setLoading(false);
      scrollToBottom();
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !socket || !session) return;

    socket.emit('send_message', {
      conversationId: params.conversationId,
      senderId: session.id,
      messageText: newMessage,
    });

    setNewMessage('');
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <h2 className="font-bold text-lg">Conversation</h2>
        <div className="text-sm text-gray-600 mt-1">
          {participants.length} participant{participants.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.message_id}
            className={`flex ${message.sender_id === session?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                message.sender_id === session?.id
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-900'
              }`}
            >
              <p className="text-sm">{message.message_text}</p>
              <p className="text-xs opacity-70 mt-1">
                {formatTimeAgo(message.created_at)}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
```

### 3.6 Testing Checklist

- [ ] WebSocket connection and authentication
- [ ] Real-time message delivery
- [ ] Message persistence to database
- [ ] Unread count calculation
- [ ] Multiple user conversations
- [ ] Read receipts
- [ ] File attachment upload
- [ ] Message editing and deletion
- [ ] Conversation archiving
- [ ] Participant management (add/remove)

**Estimated LOC**: 1800-2200 lines
**Dependencies**: Socket.IO server, Redis for session management

---

## 🎥 Feature 4: Live Classes (Zoom Integration)

**Estimated Effort**: 3-4 weeks
**Complexity**: High
**Dependencies**: Zoom API account, JWT tokens
**Key Technology**: Zoom SDK, WebRTC

### 4.1 Overview

Complete live class system with Zoom integration, scheduled classes, recording, attendance tracking, and Q&A.

[Document continues with similar detailed structure...]

### 4.2 Database Schema

```sql
CREATE TABLE IF NOT EXISTS live_classes (
  class_id BIGSERIAL PRIMARY KEY,
  course_id BIGINT NOT NULL,
  class_name VARCHAR(255) NOT NULL,
  class_description TEXT,
  scheduled_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  zoom_meeting_id VARCHAR(255) UNIQUE,
  zoom_join_url VARCHAR(500),
  recording_id VARCHAR(255),
  recording_url VARCHAR(500),
  is_recorded BOOLEAN DEFAULT TRUE,
  max_participants INT,
  teacher_id BIGINT NOT NULL,
  status VARCHAR(20), -- scheduled, in_progress, completed, cancelled
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(course_id),
  FOREIGN KEY (teacher_id) REFERENCES profiles(id)
);

CREATE TABLE IF NOT EXISTS live_class_attendees (
  attendee_id BIGSERIAL PRIMARY KEY,
  class_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  joined_at TIMESTAMP,
  left_at TIMESTAMP,
  duration_minutes INT,
  participation_score INT,
  FOREIGN KEY (class_id) REFERENCES live_classes(class_id),
  FOREIGN KEY (student_id) REFERENCES students(student_id)
);

CREATE TABLE IF NOT EXISTS class_questions (
  question_id BIGSERIAL PRIMARY KEY,
  class_id BIGINT NOT NULL,
  asker_id BIGINT NOT NULL,
  question_text TEXT NOT NULL,
  answered_by BIGINT,
  answer_text TEXT,
  votes INT DEFAULT 0,
  is_answered BOOLEAN DEFAULT FALSE,
  answered_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES live_classes(class_id),
  FOREIGN KEY (asker_id) REFERENCES profiles(id),
  FOREIGN KEY (answered_by) REFERENCES profiles(id)
);
```

---

## 👨‍👩‍👧‍👦 Feature 5: Parent/Guardian Portal

**Estimated Effort**: 2-3 weeks
**Complexity**: Medium
**Dependencies**: Student-parent relationships, existing dashboards
**Key Technology**: Role-based views, data aggregation

### 5.1 Overview

Portal for parents/guardians to monitor their children's academic progress, attendance, grades, and communicate with teachers.

### 5.2 Database Schema

```sql
CREATE TABLE IF NOT EXISTS parent_relationships (
  relationship_id BIGSERIAL PRIMARY KEY,
  parent_user_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  relationship_type VARCHAR(50), -- parent, guardian, sibling
  is_approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_user_id) REFERENCES profiles(id),
  FOREIGN KEY (student_id) REFERENCES students(student_id),
  UNIQUE(parent_user_id, student_id)
);

CREATE TABLE IF NOT EXISTS parent_alerts (
  alert_id BIGSERIAL PRIMARY KEY,
  parent_id BIGINT NOT NULL,
  student_id BIGINT NOT NULL,
  alert_type VARCHAR(50), -- low_attendance, low_grades, missing_assignment
  alert_message TEXT,
  threshold_value VARCHAR(50),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES profiles(id),
  FOREIGN KEY (student_id) REFERENCES students(student_id)
);
```

---

## 📊 Feature Implementation Timeline

| Week | Feature | Tasks | Status |
|------|---------|-------|--------|
| 1-2 | Email System | Database, SendGrid, API, Dashboard | Pending |
| 2-3 | Attendance | Database, QR codes, UI, Reports | Pending |
| 3-4 | Chat | Database, WebSocket, UI, APIs | Pending |
| 5-6 | Live Classes | Database, Zoom API, UI, Recording | Pending |
| 6-7 | Parent Portal | Database, UI, Alerts, Reports | Pending |

---

## 🚀 Deployment Checklist

- [ ] All 5 features implemented
- [ ] Database migrations applied
- [ ] API endpoints tested
- [ ] UI pages created and styled
- [ ] Real-time features tested (chat, live classes)
- [ ] Email delivery tested
- [ ] Parent relationships verified
- [ ] Security audit completed
- [ ] Performance testing completed
- [ ] User documentation created
- [ ] Deployment to Vercel
- [ ] Production database migration
- [ ] Monitoring setup

---

## 📖 Documentation Structure

Each feature will include:
1. Database schema with indexes
2. API endpoint specifications
3. React/TypeScript components
4. Integration setup instructions
5. Testing checklists
6. User guides

---

**Status**: Ready for development
**Total Estimated Duration**: 6-7 weeks
**Start Date**: Upon user approval
**Target Completion**: Early December 2024

