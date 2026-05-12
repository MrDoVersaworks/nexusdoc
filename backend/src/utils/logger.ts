import { config } from '../config';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function formatMessage(level: LogLevel, tag: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level.toUpperCase()}] [${tag}] ${message}`;
}

export const logger = {
  info(tag: string, message: string): void {
    if (config.NODE_ENV === 'development') {
      console.log(formatMessage('info', tag, message));
    }
  },

  warn(tag: string, message: string): void {
    if (config.NODE_ENV === 'development') {
      console.warn(formatMessage('warn', tag, message));
    }
  },

  error(tag: string, message: string, error?: unknown): void {
    // Errors are always logged regardless of environment
    const baseMessage = formatMessage('error', tag, message);
    if (error instanceof Error) {
      console.error(`${baseMessage} | ${error.message}`);
    } else {
      console.error(baseMessage);
    }
  },

  debug(tag: string, message: string): void {
    if (config.NODE_ENV === 'development') {
      console.debug(formatMessage('debug', tag, message));
    }
  },
};
