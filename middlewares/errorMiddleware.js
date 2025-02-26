// /middlewares/errorMiddleware.js

const winston = require('winston');

// Setup logger for centralized error logging
const logger = winston.createLogger({
  level: 'error',
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
          return `[${timestamp}] ${level}: ${message}`;
        })
      ),
    }),
    new winston.transports.File({ filename: 'logs/error.log' })
  ],
});

// Error handling middleware
const errorMiddleware = (err, req, res, next) => {
    // Log error to both console and file
    logger.error(`${err.message}\n${err.stack}`);

    // Send response to the client
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : {} // Show stack trace in development mode only
    });
};

module.exports = errorMiddleware;
