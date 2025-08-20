/**
 * Secure Logging Utilities
 * Provides safe logging methods that protect sensitive medical data
 */

import { sanitizeForLogging, createAuditLogEntry } from './dataSanitization';

// Log levels
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  CRITICAL = 4
}

// Production log level (only WARN and above in production)
const PRODUCTION_LOG_LEVEL = LogLevel.WARN;

/**
 * Secure console logging that sanitizes sensitive data
 */
export class SecureLogger {
  private static instance: SecureLogger;
  private logLevel: LogLevel;

  private constructor() {
    this.logLevel = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
      ? PRODUCTION_LOG_LEVEL 
      : LogLevel.DEBUG;
  }

  public static getInstance(): SecureLogger {
    if (!SecureLogger.instance) {
      SecureLogger.instance = new SecureLogger();
    }
    return SecureLogger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const sanitizedData = data ? sanitizeForLogging(data) : '';
    return `[${timestamp}] [${level}] ${message} ${sanitizedData ? JSON.stringify(sanitizedData) : ''}`;
  }

  public debug(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.log(this.formatMessage('DEBUG', message, data));
    }
  }

  public info(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message, data));
    }
  }

  public warn(message: string, data?: any): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, data));
    }
  }

  public error(message: string, error?: any): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const sanitizedError = error instanceof Error 
        ? { message: error.message, stack: error.stack?.split('\n')[0] } 
        : sanitizeForLogging(error);
      console.error(this.formatMessage('ERROR', message, sanitizedError));
    }
  }

  public critical(message: string, error?: any): void {
    if (this.shouldLog(LogLevel.CRITICAL)) {
      const sanitizedError = error instanceof Error 
        ? { message: error.message, stack: error.stack?.split('\n')[0] } 
        : sanitizeForLogging(error);
      console.error(this.formatMessage('CRITICAL', message, sanitizedError));
    }
  }

  /**
   * Log medical events with proper sanitization
   */
  public medicalEvent(event: string, userId: string | null, data?: any): void {
    const auditEntry = createAuditLogEntry(event, userId, data);
    this.info(`Medical Event: ${event}`, auditEntry);
  }

  /**
   * Log authentication events
   */
  public authEvent(event: string, userId: string | null, success: boolean): void {
    this.info(`Auth Event: ${event}`, {
      userId: userId || 'anonymous',
      success,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log security events
   */
  public securityEvent(event: string, details: any): void {
    this.warn(`Security Event: ${event}`, sanitizeForLogging(details));
  }
}

// Export singleton instance
export const secureLogger = SecureLogger.getInstance();

/**
 * Replacement for console.log in edge functions
 */
export const secureLog = {
  debug: (message: string, data?: any) => secureLogger.debug(message, data),
  info: (message: string, data?: any) => secureLogger.info(message, data),
  warn: (message: string, data?: any) => secureLogger.warn(message, data),
  error: (message: string, error?: any) => secureLogger.error(message, error),
  critical: (message: string, error?: any) => secureLogger.critical(message, error),
  medical: (event: string, userId: string | null, data?: any) => secureLogger.medicalEvent(event, userId, data),
  auth: (event: string, userId: string | null, success: boolean) => secureLogger.authEvent(event, userId, success),
  security: (event: string, details: any) => secureLogger.securityEvent(event, details)
};