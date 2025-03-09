/**
 * Logger utility for consistent logging across the extension
 * Supports different log levels and environments
 */
class Logger {
  static LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
  };

  constructor(context, minLevel = 'INFO') {
    this.context = context;
    this.minLevel = Logger.LEVELS[minLevel] || Logger.LEVELS.INFO;
    this.isDebug = process.env.NODE_ENV === 'development';
  }

  formatMessage(level, message, data) {
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` | ${JSON.stringify(data)}` : '';
    return `[${timestamp}][${this.context}][${level}] ${message}${dataStr}`;
  }

  shouldLog(level) {
    return Logger.LEVELS[level] >= this.minLevel;
  }

  debug(message, data) {
    if (this.isDebug && this.shouldLog('DEBUG')) {
      console.debug(this.formatMessage('DEBUG', message, data));
    }
  }

  info(message, data) {
    if (this.shouldLog('INFO')) {
      console.info(this.formatMessage('INFO', message, data));
    }
  }

  warn(message, data) {
    if (this.shouldLog('WARN')) {
      console.warn(this.formatMessage('WARN', message, data));
    }
  }

  error(message, error, data) {
    if (this.shouldLog('ERROR')) {
      console.error(this.formatMessage('ERROR', message, data));
      if (error && error.stack) {
        console.error(error.stack);
      }
    }
  }

  /**
   * Log performance metrics
   * @param {string} operation - Name of the operation being measured
   * @param {number} duration - Duration in milliseconds
   * @param {Object} metadata - Additional metadata about the operation
   */
  metric(operation, duration, metadata = {}) {
    this.info(`Performance: ${operation}`, { duration, ...metadata });
  }
}

export default Logger;