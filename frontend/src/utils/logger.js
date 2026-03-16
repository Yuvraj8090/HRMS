// src/utils/logger.js

/**
 * Core logging utility.
 * In a production environment, this should route to an observability platform 
 * (e.g., Sentry, Datadog) rather than the browser console.
 */
const isDevelopment = import.meta.env.MODE === 'development';

export const logger = {
  info: (message, ...args) => {
    if (isDevelopment) {
      console.info(`[INFO]: ${message}`, ...args);
    }
    // Production: Send info telemetry if required
  },
  
  warn: (message, ...args) => {
    if (isDevelopment) {
      console.warn(`[WARN]: ${message}`, ...args);
    }
    // Production: Send warning telemetry
  },
  
  error: (message, error, ...args) => {
    if (isDevelopment) {
      console.error(`[ERROR]: ${message}`, error, ...args);
    } else {
      // Production: Route to Error Tracking Service
      // e.g., Sentry.captureException(error, { extra: { message, args } });
    }
  },
  
  debug: (message, ...args) => {
    if (isDevelopment) {
      console.debug(`[DEBUG]: ${message}`, ...args);
    }
  }
};