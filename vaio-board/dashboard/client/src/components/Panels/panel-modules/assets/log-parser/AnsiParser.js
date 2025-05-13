/**
 * ANSI code parser - converts ANSI escape sequences to styled text segments
 * This handles the color codes found in terminal output like [32mINFO[0m
 */

import { LOG_COLORS } from './LogColors';

// ANSI color code mapping
const ANSI_COLOR_MAP = {
  '30': 'black',
  '31': 'red',
  '32': 'green',
  '33': 'yellow',
  '34': 'blue',
  '35': 'magenta',
  '36': 'cyan',
  '37': 'white',
  '90': 'gray',
  '91': 'brightRed',
  '92': 'brightGreen',
  '93': 'brightYellow',
  '94': 'brightBlue',
  '95': 'brightMagenta',
  '96': 'brightCyan',
  '97': 'brightWhite',
};

/**
 * Parse ANSI color codes from a text string
 * @param {string} text - Text with ANSI color codes
 * @returns {Array} - Array of text segments with style information
 */
export const parseAnsiString = (text) => {
  if (!text) return [{ text: '', style: {} }];

  // Parse standard ANSI color codes - handles both escaped and non-escaped format
  // \x1b[32m (escaped format) or [32m (non-escaped format)
  const regex = /(\x1b\[|\[)(\d+)m/g;
  let match;
  let lastIndex = 0;
  const segments = [];
  let currentStyle = {};

  // Use a loop to find all ANSI codes in the string
  while ((match = regex.exec(text)) !== null) {
    // Add text segment before the ANSI code if there is any
    if (match.index > lastIndex) {
      segments.push({
        text: text.substring(lastIndex, match.index),
        style: { ...currentStyle },
      });
    }

    // Get the color code from capture group 2
    const colorCode = match[2];

    // Reset style or apply new style
    if (colorCode === '0') {
      currentStyle = {};
    } else if (ANSI_COLOR_MAP[colorCode]) {
      // Set text color based on ANSI code
      currentStyle = {
        color: getColorFromAnsi(colorCode),
      };
    }

    // Update last index to after this ANSI code
    lastIndex = match.index + match[0].length;
  }

  // Add the remaining text with current style
  if (lastIndex < text.length) {
    segments.push({
      text: text.substring(lastIndex),
      style: { ...currentStyle },
    });
  }

  // If no segments were created (no ANSI codes), return the whole text as one segment
  if (segments.length === 0) {
    return [{ text, style: {} }];
  }

  return segments;
};

/**
 * Get CSS color from ANSI color code
 * @param {string} code - ANSI color code
 * @returns {string} - CSS color value
 */
function getColorFromAnsi(code) {
  // Map ANSI codes to our theme colors
  switch (code) {
    case '31': return LOG_COLORS.ERROR;
    case '32': return LOG_COLORS.RUNNING;
    case '33': return LOG_COLORS.WARNING;
    case '34': return LOG_COLORS.PYTHON;
    case '35': return LOG_COLORS.COMFYUI;
    case '36': return LOG_COLORS.OLLAMA;
    case '37': return LOG_COLORS.DEFAULT;
    default: return ANSI_COLOR_MAP[code] ? `var(--color-${ANSI_COLOR_MAP[code]})` : LOG_COLORS.DEFAULT;
  }
}

/**
 * Parse a log line and extract service, level information while processing ANSI codes
 * @param {string} line - Raw log line
 * @returns {object} - Processed line with style information
 */
export const parseLogLine = (line) => {
  if (!line || line.trim() === '') {
    return [{ text: line, style: {} }];
  }

  // Check for service tags with timestamp like [3:31:33 PM] [PYTHON] [INFO]
  const serviceTagMatch = line.match(/\[(\d+:\d+:\d+\s+[AP]M|\d{2}:\d{2}:\d{2}(?:\.\d+)?)\]\s+\[([A-Z]+)\]\s+\[([A-Z]+)\]/i);
  if (serviceTagMatch) {
    const [fullMatch, timestamp, service, level] = serviceTagMatch;
    const serviceColor = getServiceColor(service);
    const levelColor = getLevelColor(level);
    
    // Split the line into segments
    const beforeTag = line.substring(0, line.indexOf(fullMatch));
    const afterTag = line.substring(line.indexOf(fullMatch) + fullMatch.length);
    
    // Parse the part after the tags for ANSI codes
    const ansiSegments = parseAnsiString(afterTag);
    
    // Create the final segments
    return [
      ...(beforeTag ? [{ text: beforeTag, style: {} }] : []),
      { text: `[${timestamp}] `, style: { color: LOG_COLORS.TIMESTAMP } },
      { text: `[${service}] `, style: { color: serviceColor, fontWeight: 'bold' } },
      { text: `[${level}] `, style: { color: levelColor } },
      ...ansiSegments
    ];
  }
  
  // Check for level tags like [INFO]
  const levelTagMatch = line.match(/\[([A-Z]+)\]/i);
  if (levelTagMatch) {
    const [fullMatch, level] = levelTagMatch;
    const levelColor = getLevelColor(level);
    
    // Split the line into parts
    const beforeTag = line.substring(0, line.indexOf(fullMatch));
    const afterTag = line.substring(line.indexOf(fullMatch) + fullMatch.length);
    
    // Find possible timestamp in the remaining text
    const timestampMatch = afterTag.match(/^\s*(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}(?:,\d+)?)/);
    
    if (timestampMatch) {
      const timestamp = timestampMatch[1];
      const remainingText = afterTag.substring(afterTag.indexOf(timestamp) + timestamp.length);
      
      return [
        ...(beforeTag ? [{ text: beforeTag, style: {} }] : []),
        { text: `[${level}] `, style: { color: levelColor, fontWeight: 'bold' } },
        { text: `[${timestamp}] `, style: { color: LOG_COLORS.TIMESTAMP } },
        ...parseAnsiString(remainingText)
      ];
    }
  }
  
  // If no special formatting detected, just parse ANSI codes
  return parseAnsiString(line);
};

/**
 * Get color for a log service
 */
function getServiceColor(service) {
  const serviceLower = service.toLowerCase();
  switch (serviceLower) {
    case 'python': return LOG_COLORS.PYTHON;
    case 'vite': return LOG_COLORS.VITE;
    case 'supervisor': return LOG_COLORS.SUPERVISOR;
    case 'comfyui': return LOG_COLORS.COMFYUI;
    case 'openwebui': return LOG_COLORS.OPENWEBUI;
    case 'ollama': return LOG_COLORS.OLLAMA;
    case 'qdrant': return LOG_COLORS.QDRANT;
    case 'postgres': return LOG_COLORS.POSTGRES;
    case 'n8n': return LOG_COLORS.N8N;
    case 'nvidia': return LOG_COLORS.NVIDIA;
    default: return LOG_COLORS.DEFAULT;
  }
}

/**
 * Get color for a log level
 */
function getLevelColor(level) {
  const levelLower = level.toLowerCase();
  switch (levelLower) {
    case 'error': return LOG_COLORS.ERROR;
    case 'warning': return LOG_COLORS.WARNING;
    case 'info': return LOG_COLORS.RUNNING;
    case 'debug': return LOG_COLORS.DEFAULT;
    default: return LOG_COLORS.DEFAULT;
  }
}
