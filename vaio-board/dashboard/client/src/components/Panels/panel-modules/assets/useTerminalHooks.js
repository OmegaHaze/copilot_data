import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useSocket } from '../../../Panes/Utility/SocketContext'
import { LOG_COLORS } from './log-parser/LogColors'
import { parseAnsiString, parseLogLine } from './log-parser/AnsiParser'

/**
 * Custom hook for terminal log processing - Uses centralized SocketContext
 */
export const useTerminalSocket = (serviceOptions) => {
  const [logs, setLogs] = useState('')
  const { logStreams } = useSocket() // Get logs from central SocketContext
  
  // Create a parser object with ANSI and service formatting
  const logParserRef = useRef({
    processLogContent: (content) => {
      if (!content) return '░░░ Awaiting output ░░░';
      
      // Basic HTML cleaning only - ANSI codes are preserved for line-by-line parsing
      return content
        .replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/&nbsp;/g, ' ') // Replace HTML entities
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
    },
    parseLine: (line) => {
      // Use the ANSI parser to handle terminal color codes and service formatting
      return parseLogLine(line);
    }
  })
  
  // Update logs from SocketContext when they change
  useEffect(() => {
    if (logStreams) {
      // Combine all service logs into a single string - look for serviceOptions to filter if needed
      let combinedLogs = '';
      
      // Define required service mappings
      const serviceMapping = {
        'vite': ['vite', 'dashboard-server'],
        'python': ['python', 'backend', 'vaio-backend']
      };
      
      // If we have "all" selected, include all logs
      if (serviceOptions.some(opt => opt.id === 'all')) {
        combinedLogs = Object.values(logStreams).join('\n');
      } else {
        // Otherwise, only include logs from selected services (with mappings)
        const serviceIds = serviceOptions.map(opt => opt.id);
        for (const [service, logs] of Object.entries(logStreams)) {
          const normalizedService = service.replace('.log', '');
          
          // Check if this service should be included based on the current filter
          const shouldInclude = serviceIds.some(id => {
            // Direct match
            if (normalizedService === id) return true;
            
            // Check through mappings
            const mappings = serviceMapping[id] || [];
            return mappings.includes(normalizedService);
          });
          
          if (shouldInclude) {
            combinedLogs += logs + '\n';
          }
        }
      }
      
      setLogs(combinedLogs);
    }
  }, [logStreams, serviceOptions]);
  
  // Clear logs function
  const clearLogs = useCallback(() => {
    setLogs('');
  }, [])
  
  return { logs, setLogs, clearLogs, logParserRef }
}

/**
 * Custom hook for log processing and filtering
 */
export const useLogProcessing = (logs, logParserRef) => {
  // Process logs - simplified without parser
  const processedLogs = useMemo(() => {
    // Basic HTML cleaning only
    return logParserRef.current.processLogContent(logs);
  }, [logs, logParserRef])
  
  // Split logs into lines with metadata
  const logLines = useMemo(() => {
    const lines = processedLogs.split('\n')
    
    // Enhance each line with metadata for filtering and analysis
    return lines.map((line, index) => {
      // Extract service information if present
      const serviceMatch = line.match(/\[(DASHBOARD|SERVER|COMFYUI|OPENWEBUI|OLLAMA|QDRANT|POSTGRES|N8N|NVIDIA|SUPERVISOR|PYTHON|VITE)\]/i)
      const service = serviceMatch ? serviceMatch[1].toLowerCase() : 'unknown'
      
      // Extract log level if present - enhanced pattern matching for various log formats
      const levelMatch = line.match(/\[(ERROR|WARNING|INFO|DEBUG)\]/i) 
      const pythonLevelMatch = line.match(/^(INFO|ERROR|WARNING|DEBUG):/)
      const errorMatch = line.match(/'.*?'.*?(Error|Exception|Forbidden)/)
      
      const logLevel = levelMatch ? levelMatch[1].toLowerCase() :
                      pythonLevelMatch ? pythonLevelMatch[1].toLowerCase() :
                      errorMatch ? 'error' :
                      line.includes('error') ? 'error' :
                      line.includes('Error ') ? 'error' :
                      line.includes('Exception:') ? 'error' :
                      line.includes('rejected') ? 'error' :
                      line.includes('403 Forbidden') ? 'error' :
                      line.includes('warn') ? 'warning' :
                      line.includes('info') ? 'info' : 'debug'
      
      // Extract timestamp if present
      const timestampMatch = line.match(/\[(\d{2}:\d{2}:\d{2})\]/)
      const timestamp = timestampMatch ? timestampMatch[1] : ''
      
      return {
        id: `log-${index}`,
        text: line,
        service,
        logLevel,
        timestamp,
        highlighted: false
      }
    })
  }, [processedLogs])
  
  return { processedLogs, logLines }
}

/**
 * Custom hook for search and filtering functionality
 */
export const useSearchAndFilter = (logLines) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [searchResults, setSearchResults] = useState([])
  const [selectedSearchResult, setSelectedSearchResult] = useState(null)
  const [searchHistory, setSearchHistory] = useState([])
  const [searchFilters, setSearchFilters] = useState({
    services: [],
    logLevels: [],
    timeRange: 'all'
  })
  
  // Toggle search visibility
  const toggleSearch = useCallback(() => {
    setShowSearch(prev => !prev)
    if (showAdvancedSearch) {
      setShowAdvancedSearch(false)
    }
  }, [showAdvancedSearch])
  
  // Toggle advanced search visibility
  const toggleAdvancedSearch = useCallback(() => {
    setShowAdvancedSearch(prev => !prev)
    
    // Save search term to history when opening advanced search
    if (!showAdvancedSearch && searchTerm.trim()) {
      setSearchHistory(prev => {
        // Don't add duplicates
        if (!prev.includes(searchTerm.trim())) {
          return [searchTerm.trim(), ...prev].slice(0, 10)
        }
        return prev
      })
    }
  }, [showAdvancedSearch, searchTerm])
  
  // Apply search filters
  const applySearchFilter = useCallback((services = [], logLevels = [], timeRange = 'all') => {
    setSearchFilters({
      services: services.length ? services : [],
      logLevels: logLevels.length ? logLevels : [],
      timeRange
    })
  }, [])
  
  // Filter logs based on search term and filters
  const filteredLogLines = useMemo(() => {
    let filtered = logLines
    
    // Filter by search term if active
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(line => 
        line.text.toLowerCase().includes(searchLower)
      )
      
      // Highlight search matches for better visibility
      filtered = filtered.map(line => {
        if (line.text.toLowerCase().includes(searchLower)) {
          return { ...line, highlighted: true }
        }
        return line
      })
      
      // Update search results for advanced search panel
      setSearchResults(filtered)
    }
    
    // Apply service filters from advanced search
    if (searchFilters.services.length > 0) {
      filtered = filtered.filter(line => 
        searchFilters.services.includes('all') || 
        searchFilters.services.includes(line.service)
      )
    }
    
    // Apply log level filters from advanced search
    if (searchFilters.logLevels.length > 0) {
      filtered = filtered.filter(line => 
        searchFilters.logLevels.includes('all') || 
        searchFilters.logLevels.includes(line.logLevel)
      )
    }
    
    // Apply time range filter if not 'all'
    if (searchFilters.timeRange !== 'all' && searchFilters.timeRange) {
      const now = new Date()
      const timeLimit = new Date(now)
      
      // Set time limit based on selected range
      switch(searchFilters.timeRange) {
        case '5min':
          timeLimit.setMinutes(now.getMinutes() - 5)
          break
        case '15min':
          timeLimit.setMinutes(now.getMinutes() - 15)
          break
        case '1hour':
          timeLimit.setHours(now.getHours() - 1)
          break
        case '24hours':
          timeLimit.setDate(now.getDate() - 1)
          break
        default:
          // No time filtering
      }
      
      // Filter by timestamp if available
      if (searchFilters.timeRange !== 'all') {
        filtered = filtered.filter(line => {
          if (!line.timestamp) return true // Keep lines without timestamp
          
          const timeParts = line.timestamp.split(':')
          if (timeParts.length !== 3) return true
          
          const logTime = new Date(now)
          logTime.setHours(parseInt(timeParts[0], 10))
          logTime.setMinutes(parseInt(timeParts[1], 10))
          logTime.setSeconds(parseInt(timeParts[2], 10))
          
          return logTime >= timeLimit
        })
      }
    }
    
    return filtered
  }, [logLines, searchTerm, searchFilters])
  
  return {
    searchTerm,
    setSearchTerm,
    showSearch,
    setShowSearch,
    toggleSearch,
    showAdvancedSearch,
    toggleAdvancedSearch,
    searchResults,
    selectedSearchResult,
    setSelectedSearchResult,
    searchHistory,
    searchFilters,
    applySearchFilter,
    filteredLogLines
  }
}

/**
 * Custom hook for terminal UI state
 */
export const useTerminalUI = () => {
  const [isAutoScroll, setIsAutoScroll] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [fontSize, setFontSize] = useState(10)
  const [terminalTheme, setTerminalTheme] = useState('default')
  const terminalRef = useRef(null)
  const searchInputRef = useRef(null)
  
  // Toggle auto-scroll
  const toggleAutoScroll = useCallback(() => {
    setIsAutoScroll(prev => !prev)
  }, [])
  
  // Toggle settings menu
  const toggleSettings = useCallback(() => {
    setShowSettings(prev => !prev)
  }, [])
  
  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (isAutoScroll && terminalRef.current) {
      // Use requestAnimationFrame to ensure the scroll happens after the DOM is updated
      requestAnimationFrame(() => {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight
      })
    }
  }, [isAutoScroll])
  
  // Add a separate effect to handle scrolling when logs change
  useEffect(() => {
    const scrollToBottom = () => {
      if (isAutoScroll && terminalRef.current) {
        terminalRef.current.scrollTop = terminalRef.current.scrollHeight
      }
    }
    
    // Use MutationObserver to detect when log content changes
    if (terminalRef.current) {
      const observer = new MutationObserver(scrollToBottom)
      observer.observe(terminalRef.current, { childList: true, subtree: true })
      
      return () => {
        observer.disconnect()
      }
    }
  }, [isAutoScroll])
  
  // Copy logs to clipboard with user feedback
  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        // Create a temporary notification element
        const notification = document.createElement('div')
        notification.className = 'fixed top-4 right-4 crt-bg-blk crt-border-inner7 p-2 rounded z-50 crt-text4 text-sm backdrop-blur-sm opacity-60'
        notification.textContent = '✓ Logs copied to clipboard'
        notification.style.boxShadow = 'inset 0 0 10px #39ff141a, 0 0 15px #39ff1426'
        document.body.appendChild(notification)
        
        // Remove the notification after 2 seconds
        setTimeout(() => {
          notification.style.opacity = '0'
          notification.style.transition = 'opacity 0.5s'
          setTimeout(() => {
            document.body.removeChild(notification)
          }, 500)
        }, 2000)
      })
      .catch(err => {
        console.error('Failed to copy: ', err)
        alert('Failed to copy logs: ' + err.message)
      })
  }, [])
  
  // Export logs to file with user feedback
  const exportLogs = useCallback((processedLogs) => {
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
      const filename = `vaio-server-logs-${timestamp}.txt`
      
      const blob = new Blob([processedLogs], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      // Create a temporary notification element
      const notification = document.createElement('div')
      notification.className = 'fixed top-4 right-4 crt-bg-blk crt-border-inner7 p-2 rounded z-50 crt-text4 text-sm backdrop-blur-sm opacity-60'
      notification.textContent = `✓ Logs exported to ${filename}`
      notification.style.boxShadow = 'inset 0 0 10px #39ff141a, 0 0 15px #39ff1426'
      document.body.appendChild(notification)
      
      // Remove the notification after 2 seconds
      setTimeout(() => {
        notification.style.opacity = '0'
        notification.style.transition = 'opacity 0.5s'
        setTimeout(() => {
          document.body.removeChild(notification)
        }, 500)
      }, 2000)
    } catch (err) {
      console.error('Failed to export logs: ', err)
      alert('Failed to export logs: ' + err.message)
    }
  }, [])
  
  return {
    isAutoScroll,
    toggleAutoScroll,
    showSettings,
    toggleSettings,
    fontSize,
    setFontSize,
    terminalTheme,
    setTerminalTheme,
    terminalRef,
    searchInputRef,
    copyToClipboard,
    exportLogs
  }
}