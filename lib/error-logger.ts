import { createErrorLog } from './github-db'
import type { ErrorLog } from '@/types'

type ErrorLogInput = {
  userId?: string
  userName?: string
  userEmail?: string
  type: ErrorLog['type']
  severity: ErrorLog['severity']
  source: string
  message: string
  stackTrace?: string
  metadata?: Record<string, unknown>
  isSensitive?: boolean
}

/**
 * Log an error to the database
 * Use this function to log errors from anywhere in the application
 */
export async function logError(input: ErrorLogInput): Promise<ErrorLog | null> {
  try {
    return await createErrorLog({
      ...input,
      isSensitive: input.isSensitive ?? false,
    })
  } catch (error) {
    // If we can't log the error, at least log to console
    console.error('[ErrorLogger] Failed to log error:', error)
    console.error('[ErrorLogger] Original error:', input)
    return null
  }
}

/**
 * Log a system error (no user context)
 */
export async function logSystemError(
  source: string,
  message: string,
  options: {
    severity?: ErrorLog['severity']
    stackTrace?: string
    metadata?: Record<string, unknown>
    isSensitive?: boolean
  } = {}
): Promise<ErrorLog | null> {
  return logError({
    type: 'system',
    source,
    message,
    severity: options.severity ?? 'error',
    stackTrace: options.stackTrace,
    metadata: options.metadata,
    isSensitive: options.isSensitive ?? true, // System errors are sensitive by default
  })
}

/**
 * Log a user feature error
 */
export async function logUserError(
  userId: string,
  userName: string,
  userEmail: string,
  source: string,
  message: string,
  options: {
    severity?: ErrorLog['severity']
    stackTrace?: string
    metadata?: Record<string, unknown>
    isSensitive?: boolean
  } = {}
): Promise<ErrorLog | null> {
  return logError({
    userId,
    userName,
    userEmail,
    type: 'user_feature',
    source,
    message,
    severity: options.severity ?? 'error',
    stackTrace: options.stackTrace,
    metadata: options.metadata,
    isSensitive: options.isSensitive ?? false, // User feature errors are not sensitive by default
  })
}

/**
 * Log a bot error
 */
export async function logBotError(
  userId: string,
  userName: string,
  source: string,
  message: string,
  options: {
    severity?: ErrorLog['severity']
    stackTrace?: string
    metadata?: Record<string, unknown>
    isSensitive?: boolean
    userEmail?: string
  } = {}
): Promise<ErrorLog | null> {
  return logError({
    userId,
    userName,
    userEmail: options.userEmail,
    type: 'bot',
    source,
    message,
    severity: options.severity ?? 'error',
    stackTrace: options.stackTrace,
    metadata: options.metadata,
    isSensitive: options.isSensitive ?? false,
  })
}

/**
 * Log a payment error
 */
export async function logPaymentError(
  source: string,
  message: string,
  options: {
    userId?: string
    userName?: string
    userEmail?: string
    severity?: ErrorLog['severity']
    stackTrace?: string
    metadata?: Record<string, unknown>
    isSensitive?: boolean
  } = {}
): Promise<ErrorLog | null> {
  return logError({
    userId: options.userId,
    userName: options.userName,
    userEmail: options.userEmail,
    type: 'payment',
    source,
    message,
    severity: options.severity ?? 'error',
    stackTrace: options.stackTrace,
    metadata: options.metadata,
    isSensitive: options.isSensitive ?? true, // Payment errors are sensitive by default
  })
}

/**
 * Log an API error
 */
export async function logApiError(
  source: string,
  message: string,
  options: {
    userId?: string
    userName?: string
    userEmail?: string
    severity?: ErrorLog['severity']
    stackTrace?: string
    metadata?: Record<string, unknown>
    isSensitive?: boolean
  } = {}
): Promise<ErrorLog | null> {
  return logError({
    userId: options.userId,
    userName: options.userName,
    userEmail: options.userEmail,
    type: 'api',
    source,
    message,
    severity: options.severity ?? 'error',
    stackTrace: options.stackTrace,
    metadata: options.metadata,
    isSensitive: options.isSensitive ?? true, // API errors are sensitive by default
  })
}

/**
 * Log a webhook error
 */
export async function logWebhookError(
  source: string,
  message: string,
  options: {
    userId?: string
    userName?: string
    severity?: ErrorLog['severity']
    stackTrace?: string
    metadata?: Record<string, unknown>
    isSensitive?: boolean
  } = {}
): Promise<ErrorLog | null> {
  return logError({
    userId: options.userId,
    userName: options.userName,
    type: 'webhook',
    source,
    message,
    severity: options.severity ?? 'error',
    stackTrace: options.stackTrace,
    metadata: options.metadata,
    isSensitive: options.isSensitive ?? true, // Webhook errors are sensitive by default
  })
}

/**
 * Log a database error
 */
export async function logDatabaseError(
  source: string,
  message: string,
  options: {
    severity?: ErrorLog['severity']
    stackTrace?: string
    metadata?: Record<string, unknown>
  } = {}
): Promise<ErrorLog | null> {
  return logError({
    type: 'database',
    source,
    message,
    severity: options.severity ?? 'critical',
    stackTrace: options.stackTrace,
    metadata: options.metadata,
    isSensitive: true, // Database errors are always sensitive
  })
}

/**
 * Wrap a function with error logging
 */
export function withErrorLogging<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  source: string,
  options: {
    type?: ErrorLog['type']
    severity?: ErrorLog['severity']
    isSensitive?: boolean
    getUserContext?: (...args: Parameters<T>) => { userId?: string; userName?: string; userEmail?: string }
  } = {}
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args)
    } catch (error) {
      const userContext = options.getUserContext?.(...args) || {}
      
      await logError({
        ...userContext,
        type: options.type ?? 'system',
        source,
        message: error instanceof Error ? error.message : String(error),
        stackTrace: error instanceof Error ? error.stack : undefined,
        severity: options.severity ?? 'error',
        isSensitive: options.isSensitive ?? true,
      })
      
      throw error // Re-throw to maintain original behavior
    }
  }) as T
}
