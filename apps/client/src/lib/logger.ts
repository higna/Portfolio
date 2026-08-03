type LogLevel = 'log' | 'warn' | 'error' | 'debug';

interface Logger {
  log: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, ...args: unknown[]) => void;
  debug: (message: string, ...args: unknown[]) => void;
}

/*
  Creates a namespaced logger with timestamp prefix.
  Usage: const logger = createLogger('Navbar');
         logger.log('Component mounted');
*/
export function createLogger(module: string): Logger {
  const formatMessage = (level: LogLevel, message: string) =>
    `[${new Date().toISOString()}] [${level.toUpperCase()}] [${module}] ${message}`;

  return {
    log: (message, ...args) => console.log(formatMessage('log', message), ...args),
    warn: (message, ...args) => console.warn(formatMessage('warn', message), ...args),
    error: (message, ...args) => console.error(formatMessage('error', message), ...args),
    debug: (message, ...args) => console.debug(formatMessage('debug', message), ...args),
  };
}