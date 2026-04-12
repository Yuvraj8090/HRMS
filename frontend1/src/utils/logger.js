// src/utils/logger.js
const isDev = import.meta.env.DEV;
export const logger = {
  log:   (...a) => isDev && console.log('[HRMS]', ...a),
  warn:  (...a) => isDev && console.warn('[HRMS]', ...a),
  error: (...a) => console.error('[HRMS]', ...a),
};
