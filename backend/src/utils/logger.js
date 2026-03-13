const winston = require('winston');
const { format } = winston;

// Define log format
const logFormat = format.combine(
  format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  format.errors({ stack: true }),
  format.json()
);

// Check if running in serverless environment
const isServerless = process.env.VERCEL || process.env.NETLIFY === 'true';

// Build transports array based on environment
const transports = [];

// Only use file transports in non-serverless environments
if (!isServerless) {
  transports.push(
    // Write all logs with importance level of `error` or less to `error.log`
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      format: format.combine(
        format.timestamp(),
        format.json()
      )
    }),
    // Write all logs with importance level of `info` or less to `combined.log`
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      format: format.combine(
        format.timestamp(),
        format.json()
      )
    })
  );
}

// Always add console transport for serverless or development
transports.push(
  new winston.transports.Console({
    format: format.combine(
      format.colorize(),
      format.simple(),
      format.printf(({ level, message, timestamp, stack, ...meta }) => {
        let log = `${timestamp} [${level}]: ${message}`;
        
        if (stack) {
          log += `\n${stack}`;
        }
        
        if (Object.keys(meta).length > 0) {
          log += `\n${JSON.stringify(meta, null, 2)}`;
        }
        
        return log;
      })
    )
  })
);

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { 
    service: 'netistrackgh-backend',
    environment: process.env.NODE_ENV || 'development',
    deployment: isServerless ? (process.env.VERCEL ? 'vercel' : 'netlify') : 'local'
  },
  transports: transports
});

// Create a stream object for Morgan integration
logger.stream = {
  write: (message) => {
    logger.info(message.trim());
  }
};

module.exports = logger;