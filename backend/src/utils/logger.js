const fs = require('fs');
const path = require('path');

const logsDir = process.env.LOG_DIR || './logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFile = path.join(logsDir, 'app.log');
const errorFile = path.join(logsDir, 'error.log');

const logger = {
  info: (message, data = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] INFO: ${message} ${JSON.stringify(data)}\n`;
    console.log(logEntry);
    fs.appendFileSync(logFile, logEntry);
  },
  
  error: (message, error = {}) => {
    const timestamp = new Date().toISOString();
    const stack = error.stack || '';
    const logEntry = `[${timestamp}] ERROR: ${message} ${JSON.stringify(error)} ${stack}\n`;
    console.error(logEntry);
    fs.appendFileSync(errorFile, logEntry);
  },
  
  warn: (message, data = {}) => {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] WARN: ${message} ${JSON.stringify(data)}\n`;
    console.warn(logEntry);
    fs.appendFileSync(logFile, logEntry);
  },
  
  debug: (message, data = {}) => {
    if (process.env.LOG_LEVEL === 'debug') {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] DEBUG: ${message} ${JSON.stringify(data)}\n`;
      console.log(logEntry);
      fs.appendFileSync(logFile, logEntry);
    }
  }
};

module.exports = logger;
