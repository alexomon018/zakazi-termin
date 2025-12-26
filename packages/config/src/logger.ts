import * as Sentry from "@sentry/nextjs";

// Logger interface matching the previous Better Stack API
interface LoggerContext {
  [key: string]: unknown;
}

class Logger {
  /**
   * Log an error to Sentry
   * @param message - Error message
   * @param context - Additional context/extra data
   */
  error(message: string, context?: LoggerContext): void {
    // If context contains an error object, capture it as an exception
    if (context?.error instanceof Error) {
      Sentry.captureException(context.error, {
        tags: {
          source: "logger",
        },
        extra: {
          message,
          ...this.sanitizeContext(context),
        },
      });
    } else {
      // Otherwise, capture as a message with context
      Sentry.captureMessage(message, {
        level: "error",
        tags: {
          source: "logger",
        },
        extra: context ? this.sanitizeContext(context) : undefined,
      });
    }
  }

  /**
   * Log an info message to Sentry
   * @param message - Info message
   * @param context - Additional context/extra data
   */
  info(message: string, context?: LoggerContext): void {
    Sentry.captureMessage(message, {
      level: "info",
      tags: {
        source: "logger",
      },
      extra: context ? this.sanitizeContext(context) : undefined,
    });
  }

  /**
   * Log a warning to Sentry
   * @param message - Warning message
   * @param context - Additional context/extra data
   */
  warn(message: string, context?: LoggerContext): void {
    Sentry.captureMessage(message, {
      level: "warning",
      tags: {
        source: "logger",
      },
      extra: context ? this.sanitizeContext(context) : undefined,
    });
  }

  /**
   * Sanitize context to remove circular references and ensure it's serializable
   */
  private sanitizeContext(context: LoggerContext): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(context)) {
      // Skip the error key if it's an Error (we handle it separately)
      if (key === "error" && value instanceof Error) {
        continue;
      }

      // Convert non-serializable values to strings
      try {
        JSON.stringify(value);
        sanitized[key] = value;
      } catch {
        sanitized[key] = String(value);
      }
    }

    return sanitized;
  }
}

// Shared logger instance for server-side use in packages
export const logger = new Logger();

// Re-export Logger class for creating new instances if needed
export { Logger };
