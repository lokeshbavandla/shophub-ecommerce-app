import pino from 'pino';

const isDevelopment = process.env.NODE_ENV !== 'production';
const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info');

// Logger configuration for production and development environments
// Production: Structured JSON logs for log aggregation systems (ELK, CloudWatch, etc.)
// Development: Pretty-printed logs for better readability
const loggerConfig = {
  level: logLevel,
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  // Security: Automatically redact sensitive data from logs to prevent credential leaks
  redact: {
    paths: [
      'password',
      '*.password',
      'accessToken',
      '*.accessToken',
      'refreshToken',
      '*.refreshToken',
      'authorization',
      '*.authorization',
      'cookie',
      '*.cookie',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    remove: true,
  },
};

if (isDevelopment) {
  loggerConfig.transport = {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      singleLine: false,
      hideObject: false,
      messageFormat: '{msg}',
      errorLikeObjectKeys: ['err', 'error'],
    },
  };
} else {
  loggerConfig.base = {
    env: process.env.NODE_ENV,
    service: 'ecommerce-backend',
  };
}

const logger = pino(loggerConfig);

// Factory function for creating context-aware loggers
// Useful for tracking requests across multiple services in distributed systems
export const createChildLogger = (context = {}) => {
  return logger.child(context);
};

// Export the main logger
export default logger;
