/**
 * API Error Handler Utility
 * Standardized error handling and responses for all API routes
 * Production-ready error management
 */

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, public field?: string) {
    super(400, message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ApiError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends ApiError {
  constructor(message: string = 'Forbidden') {
    super(403, message, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string = 'Resource not found') {
    super(404, message, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends ApiError {
  constructor(message: string = 'Resource conflict') {
    super(409, message, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends ApiError {
  constructor(message: string = 'Too many requests') {
    super(429, message, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export class InternalServerError extends ApiError {
  constructor(message: string = 'Internal server error') {
    super(500, message, 'INTERNAL_SERVER_ERROR');
    this.name = 'InternalServerError';
  }
}

export interface ApiErrorResponse {
  error: string;
  code: string;
  field?: string;
  timestamp: string;
  requestId?: string;
}

export interface ApiSuccessResponse<T> {
  data: T;
  error: null;
  timestamp?: string;
}

/**
 * Main error handler function
 * Use this in all API routes for consistent error responses
 */
export function handleApiError(
  error: unknown,
  requestId?: string
): Response {
  console.error('API Error:', error);

  // Handle ApiError and its subclasses
  if (error instanceof ApiError) {
    const response: ApiErrorResponse = {
      error: error.message,
      code: error.code || 'API_ERROR',
      timestamp: new Date().toISOString(),
      requestId,
    };

    if (error instanceof ValidationError && error.field) {
      response.field = error.field;
    }

    return Response.json(response, { status: error.statusCode });
  }

  // Handle database errors
  if (error instanceof Error && error.message.includes('UNIQUE')) {
    const response: ApiErrorResponse = {
      error: 'Resource already exists',
      code: 'CONFLICT_ERROR',
      timestamp: new Date().toISOString(),
      requestId,
    };
    return Response.json(response, { status: 409 });
  }

  // Handle JWT/Auth errors
  if (
    error instanceof Error &&
    (error.message.includes('JWT') || error.message.includes('token'))
  ) {
    const response: ApiErrorResponse = {
      error: 'Invalid authentication token',
      code: 'AUTHENTICATION_ERROR',
      timestamp: new Date().toISOString(),
      requestId,
    };
    return Response.json(response, { status: 401 });
  }

  // Default error response
  const message = error instanceof Error ? error.message : 'Unknown error';
  const response: ApiErrorResponse = {
    error: message,
    code: 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString(),
    requestId,
  };

  return Response.json(response, { status: 500 });
}

/**
 * Success response helper
 * Use this to ensure consistent response format
 */
export function successResponse<T>(
  data: T,
  statusCode: number = 200,
  timestamp: boolean = false
): Response {
  const response: any = {
    data,
    error: null,
  };

  if (timestamp) {
    response.timestamp = new Date().toISOString();
  }

  return Response.json(response, { status: statusCode });
}

/**
 * Error response helper
 */
export function errorResponse(
  message: string,
  code: string = 'API_ERROR',
  statusCode: number = 500,
  field?: string
): Response {
  const response: ApiErrorResponse = {
    error: message,
    code,
    timestamp: new Date().toISOString(),
  };

  if (field) {
    response.field = field;
  }

  return Response.json(response, { status: statusCode });
}

/**
 * Validation helper
 * Use in POST/PUT routes to validate required fields
 */
export function validateRequiredFields(
  data: Record<string, any>,
  requiredFields: string[]
): void {
  const missing = requiredFields.filter((field) => !data[field]);

  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      missing[0]
    );
  }
}

/**
 * Request ID generator for tracing
 */
export function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Middleware for adding request ID to requests
 */
export function withRequestId(handler: (request: Request, id: string) => Promise<Response>) {
  return async (request: Request) => {
    const requestId = generateRequestId();
    return handler(request, requestId);
  };
}

/**
 * LOGGING UTILITIES
 */

export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  message: string;
  context?: Record<string, any>;
  requestId?: string;
}

export function logInfo(message: string, context?: Record<string, any>, requestId?: string) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message,
    context,
    requestId,
  };
  console.log(JSON.stringify(entry));
}

export function logWarn(message: string, context?: Record<string, any>, requestId?: string) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'WARN',
    message,
    context,
    requestId,
  };
  console.warn(JSON.stringify(entry));
}

export function logError(message: string, context?: Record<string, any>, requestId?: string) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: 'ERROR',
    message,
    context,
    requestId,
  };
  console.error(JSON.stringify(entry));
}

export function logDebug(message: string, context?: Record<string, any>, requestId?: string) {
  if (process.env.NODE_ENV === 'development') {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: 'DEBUG',
      message,
      context,
      requestId,
    };
    console.debug(JSON.stringify(entry));
  }
}
