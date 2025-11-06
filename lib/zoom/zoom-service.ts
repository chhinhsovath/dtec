/**
 * Zoom Integration Service
 * Handles all Zoom API interactions for live class management
 * Includes meeting creation, recording management, and webhook processing
 */

import axios, { AxiosInstance } from 'axios';
import { query } from '@/lib/db';

interface ZoomTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface MeetingSettings {
  auto_recording?: 'local' | 'cloud' | 'none';
  host_video?: boolean;
  participant_video?: boolean;
  waiting_room?: boolean;
  join_before_host?: boolean;
  jbh_time?: number;
}

interface CreateMeetingPayload {
  topic: string;
  type: number; // 1 = instant, 2 = scheduled
  start_time?: string; // ISO 8601 format
  duration?: number; // in minutes
  timezone?: string;
  password?: string;
  settings?: MeetingSettings;
}

interface ZoomMeeting {
  id: number;
  uuid: string;
  host_id: string;
  topic: string;
  type: number;
  start_time?: string;
  duration: number;
  timezone: string;
  created_at: string;
  join_url: string;
  start_url?: string;
}

class ZoomService {
  private client: AxiosInstance;
  private credentials: any;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.zoom.us/v2',
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Initialize service with Zoom credentials
   */
  async initialize(credentialId: number): Promise<void> {
    try {
      const result = await query(
        `SELECT zoom_account_id, client_id, client_secret, access_token,
                refresh_token, token_expires_at
         FROM zoom_credentials WHERE credential_id = $1`,
        [credentialId]
      );

      if (result.rowCount === 0) {
        throw new Error('Zoom credentials not found');
      }

      this.credentials = result.rows[0];

      // Check if token is expired
      if (new Date(this.credentials.token_expires_at) <= new Date()) {
        await this.refreshAccessToken(credentialId);
      }

      // Set auth header
      this.client.defaults.headers.common['Authorization'] = `Bearer ${this.credentials.access_token}`;
    } catch (error) {
      console.error('Error initializing Zoom service:', error);
      throw error;
    }
  }

  /**
   * Get Zoom OAuth authorization URL
   */
  getAuthorizationUrl(state: string): string {
    const clientId = process.env.ZOOM_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/zoom/callback`;

    return `https://zoom.us/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&state=${state}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<ZoomTokens> {
    try {
      const response = await axios.post('https://zoom.us/oauth/token', null, {
        params: {
          grant_type: 'authorization_code',
          code,
          redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/zoom/callback`,
        },
        auth: {
          username: process.env.ZOOM_CLIENT_ID!,
          password: process.env.ZOOM_CLIENT_SECRET!,
        },
      });

      return {
        access_token: response.data.access_token,
        refresh_token: response.data.refresh_token,
        expires_in: response.data.expires_in,
      };
    } catch (error) {
      console.error('Error exchanging code for tokens:', error);
      throw error;
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(credentialId: number): Promise<void> {
    try {
      const response = await axios.post('https://zoom.us/oauth/token', null, {
        params: {
          grant_type: 'refresh_token',
          refresh_token: this.credentials.refresh_token,
        },
        auth: {
          username: process.env.ZOOM_CLIENT_ID!,
          password: process.env.ZOOM_CLIENT_SECRET!,
        },
      });

      const newAccessToken = response.data.access_token;
      const expiresAt = new Date(Date.now() + response.data.expires_in * 1000);

      // Update credentials in database
      await query(
        `UPDATE zoom_credentials
         SET access_token = $1, token_expires_at = $2, updated_at = NOW()
         WHERE credential_id = $3`,
        [newAccessToken, expiresAt, credentialId]
      );

      this.credentials.access_token = newAccessToken;
      this.credentials.token_expires_at = expiresAt;
      this.client.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
    } catch (error) {
      console.error('Error refreshing access token:', error);
      throw error;
    }
  }

  /**
   * Get user ID from Zoom account
   */
  async getUserId(): Promise<string> {
    try {
      const response = await this.client.get('/users/me');
      return response.data.id;
    } catch (error) {
      console.error('Error getting Zoom user ID:', error);
      throw error;
    }
  }

  /**
   * Create a Zoom meeting
   */
  async createMeeting(userId: string, payload: CreateMeetingPayload): Promise<ZoomMeeting> {
    try {
      const response = await this.client.post(`/users/${userId}/meetings`, {
        topic: payload.topic,
        type: payload.type,
        start_time: payload.start_time,
        duration: payload.duration || 60,
        timezone: payload.timezone || 'UTC',
        password: payload.password || this.generatePassword(),
        settings: {
          host_video: true,
          participant_video: true,
          waiting_room: true,
          join_before_host: false,
          auto_recording: 'cloud',
          ...payload.settings,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error creating Zoom meeting:', error);
      throw error;
    }
  }

  /**
   * Get meeting details
   */
  async getMeeting(meetingId: string): Promise<ZoomMeeting> {
    try {
      const response = await this.client.get(`/meetings/${meetingId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting meeting details:', error);
      throw error;
    }
  }

  /**
   * Update meeting settings
   */
  async updateMeeting(meetingId: string, payload: Partial<CreateMeetingPayload>): Promise<void> {
    try {
      await this.client.patch(`/meetings/${meetingId}`, payload);
    } catch (error) {
      console.error('Error updating meeting:', error);
      throw error;
    }
  }

  /**
   * Delete a Zoom meeting
   */
  async deleteMeeting(meetingId: string): Promise<void> {
    try {
      await this.client.delete(`/meetings/${meetingId}`);
    } catch (error) {
      console.error('Error deleting meeting:', error);
      throw error;
    }
  }

  /**
   * Get meeting participants
   */
  async getMeetingParticipants(meetingId: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/meetings/${meetingId}/participants`);
      return response.data.participants || [];
    } catch (error) {
      console.error('Error getting meeting participants:', error);
      throw error;
    }
  }

  /**
   * Get meeting recordings
   */
  async getMeetingRecordings(meetingId: string): Promise<any[]> {
    try {
      const response = await this.client.get(`/meetings/${meetingId}/recordings`);
      return response.data.recording_files || [];
    } catch (error) {
      console.error('Error getting meeting recordings:', error);
      throw error;
    }
  }

  /**
   * Get recording details
   */
  async getRecording(recordingId: string): Promise<any> {
    try {
      const response = await this.client.get(`/recordings/${recordingId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting recording details:', error);
      throw error;
    }
  }

  /**
   * Delete a recording
   */
  async deleteRecording(recordingId: string): Promise<void> {
    try {
      await this.client.delete(`/recordings/${recordingId}`);
    } catch (error) {
      console.error('Error deleting recording:', error);
      throw error;
    }
  }

  /**
   * Update recording settings (e.g., sharing settings)
   */
  async updateRecordingSettings(recordingId: string, settings: any): Promise<void> {
    try {
      await this.client.patch(`/recordings/${recordingId}`, settings);
    } catch (error) {
      console.error('Error updating recording settings:', error);
      throw error;
    }
  }

  /**
   * Verify Zoom webhook signature
   */
  verifyWebhookSignature(
    authHeader: string,
    requestBody: string,
    timestamp: string
  ): boolean {
    try {
      const crypto = require('crypto');
      const message = `v0:${timestamp}:${requestBody}`;
      const hash = crypto
        .createHmac('sha256', process.env.ZOOM_WEBHOOK_SECRET!)
        .update(message)
        .digest('hex');

      return authHeader === `v0=${hash}`;
    } catch (error) {
      console.error('Error verifying webhook signature:', error);
      return false;
    }
  }

  /**
   * Handle Zoom webhook event
   */
  async handleWebhookEvent(eventType: string, data: any): Promise<void> {
    try {
      switch (eventType) {
        case 'meeting.started':
          await this.handleMeetingStarted(data);
          break;
        case 'meeting.ended':
          await this.handleMeetingEnded(data);
          break;
        case 'recording.completed':
          await this.handleRecordingCompleted(data);
          break;
        case 'recording.deleted':
          await this.handleRecordingDeleted(data);
          break;
        default:
          console.log(`Unhandled webhook event: ${eventType}`);
      }
    } catch (error) {
      console.error('Error handling webhook event:', error);
      throw error;
    }
  }

  /**
   * Handle meeting started event
   */
  private async handleMeetingStarted(data: any): Promise<void> {
    const meetingId = data.object.id;

    await query(
      `UPDATE live_classes
       SET status = 'in_progress', actual_start = NOW()
       WHERE zoom_meeting_id = $1`,
      [meetingId]
    );

    // Store webhook event for audit
    const result = await query(
      `SELECT class_id FROM live_classes WHERE zoom_meeting_id = $1`,
      [meetingId]
    );

    if (result.rowCount > 0) {
      await query(
        `INSERT INTO zoom_webhook_events
         (class_id, zoom_meeting_id, event_type, event_data, processed)
         VALUES ($1, $2, $3, $4, true)`,
        [result.rows[0].class_id, meetingId, 'meeting.started', JSON.stringify(data)]
      );
    }
  }

  /**
   * Handle meeting ended event
   */
  private async handleMeetingEnded(data: any): Promise<void> {
    const meetingId = data.object.id;

    await query(
      `UPDATE live_classes
       SET status = 'ended', actual_end = NOW()
       WHERE zoom_meeting_id = $1`,
      [meetingId]
    );

    const result = await query(
      `SELECT class_id FROM live_classes WHERE zoom_meeting_id = $1`,
      [meetingId]
    );

    if (result.rowCount > 0) {
      await query(
        `INSERT INTO zoom_webhook_events
         (class_id, zoom_meeting_id, event_type, event_data, processed)
         VALUES ($1, $2, $3, $4, true)`,
        [result.rows[0].class_id, meetingId, 'meeting.ended', JSON.stringify(data)]
      );
    }
  }

  /**
   * Handle recording completed event
   */
  private async handleRecordingCompleted(data: any): Promise<void> {
    const meetingId = data.object.id;
    const recordingId = data.object.uuid;

    const result = await query(
      `SELECT class_id FROM live_classes WHERE zoom_meeting_id = $1`,
      [meetingId]
    );

    if (result.rowCount > 0) {
      const classId = result.rows[0].class_id;

      // Get recording details
      const recordingDetails = data.object.recording_files || [];

      for (const file of recordingDetails) {
        await query(
          `INSERT INTO live_class_recordings
           (class_id, zoom_recording_id, file_name, file_url, file_type, recording_start, recording_end)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            classId,
            file.id,
            file.file_name,
            file.download_url,
            file.file_type,
            data.object.start_time,
            data.object.end_time,
          ]
        );
      }

      // Update live class recording status
      await query(
        `UPDATE live_classes
         SET is_recorded = true, recording_id = $1
         WHERE class_id = $2`,
        [recordingId, classId]
      );

      await query(
        `INSERT INTO zoom_webhook_events
         (class_id, zoom_meeting_id, event_type, event_data, processed)
         VALUES ($1, $2, $3, $4, true)`,
        [classId, meetingId, 'recording.completed', JSON.stringify(data)]
      );
    }
  }

  /**
   * Handle recording deleted event
   */
  private async handleRecordingDeleted(data: any): Promise<void> {
    const recordingId = data.object.id;

    await query(
      `DELETE FROM live_class_recordings WHERE zoom_recording_id = $1`,
      [recordingId]
    );
  }

  /**
   * Generate secure random password
   */
  private generatePassword(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  }

  /**
   * Format start time for Zoom API
   */
  static formatStartTime(date: Date): string {
    return date.toISOString().replace('Z', '') + 'Z';
  }

  /**
   * Calculate meeting duration
   */
  static calculateDuration(startTime: Date, endTime: Date): number {
    return Math.round((endTime.getTime() - startTime.getTime()) / 60000); // in minutes
  }
}

export default ZoomService;
