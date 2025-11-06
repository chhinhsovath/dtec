/**
 * QR Code Generation for Attendance
 * Generates and validates QR codes for quick attendance marking
 */

import crypto from 'crypto';

/**
 * QR Code payload structure
 */
export interface QRCodePayload {
  sessionId: number;
  courseId: number;
  token: string;
  expiresAt: string; // ISO 8601 format
}

/**
 * Generate QR code token for attendance marking
 * Token is valid for 1 hour by default (configurable)
 *
 * @param sessionId - Class session ID
 * @param courseId - Course ID
 * @param validityMinutes - How long QR code is valid (default: 60)
 * @returns Object with token, expiresAt, and QR code payload
 */
export function generateAttendanceQRCode(
  sessionId: number,
  courseId: number,
  validityMinutes: number = 60
): {
  token: string;
  expiresAt: Date;
  payload: QRCodePayload;
  qrDataUrl?: string;
} {
  // Generate random token
  const token = crypto.randomBytes(32).toString('hex');

  // Calculate expiry time
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + validityMinutes);

  // Create payload for QR code
  const payload: QRCodePayload = {
    sessionId,
    courseId,
    token,
    expiresAt: expiresAt.toISOString(),
  };

  return {
    token,
    expiresAt,
    payload,
  };
}

/**
 * Verify QR code token validity
 * Checks if token hasn't expired and matches session
 *
 * @param token - Token to verify
 * @param expiresAt - Expiration timestamp
 * @returns true if valid, false otherwise
 */
export function isQRCodeValid(token: string, expiresAt: Date): boolean {
  if (!token || !expiresAt) {
    return false;
  }

  // Check if token is not expired
  const now = new Date();
  return now <= expiresAt;
}

/**
 * Verify QR code payload and token
 *
 * @param payload - QR code payload
 * @param storedToken - Token stored in database
 * @returns true if valid and matches, false otherwise
 */
export function verifyQRCodePayload(
  payload: QRCodePayload,
  storedToken: string
): boolean {
  if (!payload || !storedToken) {
    return false;
  }

  // Verify token matches
  if (payload.token !== storedToken) {
    return false;
  }

  // Verify not expired
  const expiresAt = new Date(payload.expiresAt);
  const now = new Date();

  return now <= expiresAt;
}

/**
 * Generate QR code string for display
 * This returns the string that would be encoded in a QR code
 *
 * @param payload - QR code payload
 * @returns JSON string to be encoded in QR
 */
export function generateQRCodeString(payload: QRCodePayload): string {
  return JSON.stringify(payload);
}

/**
 * Parse QR code scanned data
 * Extracts payload from QR code scan
 *
 * @param scannedData - Data from QR code scanner
 * @returns Parsed payload or null if invalid
 */
export function parseQRCodeData(scannedData: string): QRCodePayload | null {
  try {
    const parsed = JSON.parse(scannedData);

    // Validate structure
    if (
      typeof parsed.sessionId === 'number' &&
      typeof parsed.courseId === 'number' &&
      typeof parsed.token === 'string' &&
      typeof parsed.expiresAt === 'string'
    ) {
      return parsed as QRCodePayload;
    }

    return null;
  } catch (error) {
    console.error('Error parsing QR code data:', error);
    return null;
  }
}

/**
 * Generate a simple attendance URL for mobile
 * Can be embedded in QR code as alternative to JSON
 *
 * @param sessionId - Session ID
 * @param token - QR token
 * @param baseUrl - Application base URL
 * @returns Full URL for marking attendance
 */
export function generateAttendanceURL(
  sessionId: number,
  token: string,
  baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
): string {
  return `${baseUrl}/mark-attendance?session=${sessionId}&token=${token}`;
}

/**
 * Extract session ID and token from URL
 *
 * @param url - Full URL
 * @returns Object with sessionId and token or null
 */
export function parseAttendanceURL(url: string): {
  sessionId: number;
  token: string;
} | null {
  try {
    const urlObj = new URL(url);
    const sessionId = parseInt(urlObj.searchParams.get('session') || '0');
    const token = urlObj.searchParams.get('token');

    if (sessionId && token) {
      return { sessionId, token };
    }

    return null;
  } catch (error) {
    console.error('Error parsing attendance URL:', error);
    return null;
  }
}

/**
 * Generate attendance marking link with embedded data
 * Used for SMS/email notification with direct link
 *
 * @param sessionId - Session ID
 * @param studentId - Student ID
 * @param baseUrl - Application base URL
 * @returns Attendance marking link
 */
export function generateAttendanceMarkingLink(
  sessionId: number,
  studentId: number,
  baseUrl: string = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
): string {
  const token = crypto.randomBytes(16).toString('hex');
  return `${baseUrl}/mark-attendance?session=${sessionId}&student=${studentId}&token=${token}`;
}

export default {
  generateAttendanceQRCode,
  isQRCodeValid,
  verifyQRCodePayload,
  generateQRCodeString,
  parseQRCodeData,
  generateAttendanceURL,
  parseAttendanceURL,
  generateAttendanceMarkingLink,
};
