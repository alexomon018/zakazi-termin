import { Logger } from "@logtail/next";

// Shared logger instance for server-side use in packages
export const logger = new Logger();

// Re-export Logger class for creating new instances if needed
export { Logger };
