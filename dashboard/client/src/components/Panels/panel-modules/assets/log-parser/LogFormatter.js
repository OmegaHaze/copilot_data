/**
 * Log formatter utility for vAio Board
 * This handles formatting logs for display in the terminal
 */

/**
 * Format a log message with proper service, level, and timestamp tags
 * @param {Object} data - Log data object from unified_log event
 * @returns {string} - Formatted log line
 */
export const formatLogLine = (data) => {
  if (!data || !data.message) return '';
  
  // Map service names if needed
  const serviceMapping = {
    'dashboard-server': 'vite',
    'vaio-backend': 'python'
  };
  
  let serviceName = data.service;
  if (serviceMapping[serviceName]) {
    serviceName = serviceMapping[serviceName];
  }
  
  // Format the timestamp in 12-hour format
  const timestamp = new Date(data.timestamp || Date.now()).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
  
  // Determine log level and capitalize it
  const level = (data.level || 'info').toUpperCase();
  
  // Create a formatted line with service tag and timestamp (preserve ANSI codes)
  return `[${timestamp}] [${serviceName.toUpperCase()}] [${level}] ${data.message}`;
};
