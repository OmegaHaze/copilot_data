import React from 'react'
import TerminalIcons from '../TerminalIcons'
import { LOG_COLORS } from './LogColors'

/**
 * Log display component with basic styling and formatting
 */
const LogDisplay = ({ 
  filteredLogLines, 
  terminalRef, 
  searchTerm,
  fontSize,
  terminalTheme,
  logParserRef,
  selectedSearchResult,
  clearLogs,
  copyToClipboard,
  exportLogs,
  processedLogs
}) => {
  
  // Add keyboard shortcuts for common actions
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+K to clear logs
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault()
        clearLogs()
      }
      
      // Ctrl+C to copy selected text
      if (e.ctrlKey && e.key === 'c' && window.getSelection().toString()) {
        const selectedText = window.getSelection().toString()
        if (selectedText) {
          copyToClipboard(selectedText)
        }
      }
      
      // Ctrl+S to save logs
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        exportLogs(processedLogs)
      }
    }
    
    // Add event listener
    terminalRef.current?.addEventListener('keydown', handleKeyDown)
    
    // Clean up
    return () => {
      terminalRef.current?.removeEventListener('keydown', handleKeyDown)
    }
  }, [clearLogs, copyToClipboard, terminalRef, exportLogs, processedLogs])
  
  // Get theme-specific styles
  const getThemeStyles = () => {
    switch (terminalTheme) {
      case 'matrix':
        return {
          background: '#000',
          color: '#22c55e',
          fontFamily: "'Courier New', monospace"
        }
      case 'midnight':
        return {
          background: '#0A1929',
          color: '#66B2FF',
          fontFamily: "'Consolas', monospace"
        }
      case 'amber':
        return {
          background: '#000',
          color: '#FFB000',
          fontFamily: "'Lucida Console', monospace"
        }
      default:
        return {}
    }
  }

  // Check if a line is part of a table structure
  const isTableLine = (text) => {
    return text.includes('┌─') || text.includes('├─') || text.includes('│ ') || text.includes('└─') ||
           text.includes('┌──') || text.includes('├──') || text.includes('└──');
  }
  
  // Check if a line is a Python log line
  const isPythonLogLine = (text) => {
    return text.match(/^INFO:/) || text.match(/^ERROR:/) || 
           text.match(/^WARNING:/) || text.match(/^DEBUG:/);
  }

  // Add context menu for right-click actions
  const handleContextMenu = React.useCallback((e) => {
    e.preventDefault()
    
    // Get selected text
    const selectedText = window.getSelection().toString()
    
    // Create context menu
    const menu = document.createElement('div')
    menu.className = 'absolute crt-bg-blk crt-border-inner7 rounded shadow-lg z-50'
    menu.style.left = `${e.clientX}px`
    menu.style.top = `${e.clientY}px`
    menu.style.boxShadow = 'inset 0 0 10px #22c55e1a, 0 0 15px #22c55e26'
    
    // Add menu items
    const createMenuItem = (text, onClick) => {
      const item = document.createElement('div')
      item.className = 'crt-link5 p-2 text-[10px] cursor-pointer'
      item.textContent = text
      item.onclick = () => {
        onClick()
        document.body.removeChild(menu)
      }
      return item
    }
    
    // Copy selected text
    if (selectedText) {
      menu.appendChild(createMenuItem('Copy Selected', () => copyToClipboard(selectedText)))
    }
    
    // Copy all logs
    menu.appendChild(createMenuItem('Copy All Logs', () => copyToClipboard(processedLogs)))
    
    // Download logs
    menu.appendChild(createMenuItem('Download Logs', () => exportLogs(processedLogs)))
    
    // Clear logs
    menu.appendChild(createMenuItem('Clear Logs', clearLogs))
    
    // Add menu to body
    document.body.appendChild(menu)
    
    // Remove menu when clicking outside
    const removeMenu = () => {
      if (document.body.contains(menu)) {
        document.body.removeChild(menu)
      }
      document.removeEventListener('click', removeMenu)
    }
    
    // Add timeout to prevent immediate removal
    setTimeout(() => {
      document.addEventListener('click', removeMenu)
    }, 100)
  }, [clearLogs, copyToClipboard, processedLogs, exportLogs])

  const themeStyles = getThemeStyles()
  
  // Simple scan line effect
  const ScanLine = () => (
    <div
      className="absolute top-0 left-0 w-full h-full pointer-events-none"
      style={{
        backgroundImage: 'linear-gradient(to bottom, transparent, transparent 50%, rgba(0, 0, 0, 0.09) 50%, rgba(0, 0, 0, 0.05))',
        backgroundSize: '100% 4px',
        zIndex: 20,
      }}
    />
  );

  // Render a single log line with appropriate styling
  const renderLogLine = (line, index) => {
    if (!line || !line.text) return null;
    
    const lineText = line.text;
    const isHighlighted = line.highlighted || line.id === selectedSearchResult;
    const lineId = line.id || `log-${index}`;
    
    // Check for table lines
    if (isTableLine(lineText)) {
      return (
        <div
          id={lineId}
          key={lineId}
          className={`log-line ${isHighlighted ? 'crt-bg-blk' : ''}`}
          style={{
            fontFamily: 'monospace',
            whiteSpace: 'pre',
            fontSize: `${fontSize}px`,
            padding: isHighlighted ? '1px 4px' : '0',
            margin: isHighlighted ? '2px 0' : '0',
            borderRadius: isHighlighted ? '2px' : '0',
            boxShadow: isHighlighted ? 'inset 0 0 5px #22c55e1a' : 'none'
          }}
        >
          <span className="crt-text5" style={{ fontFamily: 'monospace' }}>
            {lineText}
          </span>
        </div>
      );
    }
    
    // Look for service tags
    const serviceMatch = lineText.match(/\[(DASHBOARD|SERVER|N8N|SUPERVISOR|OPENWEBUI|OLLAMA|QDRANT|COMFYUI|POSTGRES)\]/i);
    const statusMatch = lineText.match(/\[(ERROR|WARNING|INFO|SUCCESS|TERMINAL|SEARCH)\]/i);
    
    if (serviceMatch || statusMatch) {
      // Determine icon and color
      let icon = <TerminalIcons.Terminal />;
      let tagToReplace = '';
      
      if (serviceMatch) {
        const serviceType = serviceMatch[1].toUpperCase();
        switch (serviceType) {
          case 'DASHBOARD': icon = <TerminalIcons.Service.Supervisor />; break;
          case 'SERVER': icon = <TerminalIcons.Status.Running />; break;
          case 'N8N': icon = <TerminalIcons.Service.N8N />; break;
          case 'SUPERVISOR': icon = <TerminalIcons.Service.Supervisor />; break;
          case 'OPENWEBUI': icon = <TerminalIcons.Service.OpenWebUI />; break;
          case 'OLLAMA': icon = <TerminalIcons.Service.Ollama />; break;
          case 'QDRANT': icon = <TerminalIcons.Service.Qdrant />; break;
          case 'COMFYUI': icon = <TerminalIcons.Service.ComfyUI />; break;
          case 'POSTGRES': icon = <TerminalIcons.Service.Postgres />; break;
        }
        tagToReplace = `[${serviceMatch[1]}] `;
      } else if (statusMatch) {
        const statusType = statusMatch[1].toUpperCase();
        switch (statusType) {
          case 'ERROR': icon = <TerminalIcons.Status.Error />; break;
          case 'WARNING': icon = <TerminalIcons.Status.Warning />; break;
          case 'INFO': icon = <TerminalIcons.Status.Info />; break;
          case 'SUCCESS': icon = <TerminalIcons.Status.Success />; break;
          case 'SEARCH': icon = <TerminalIcons.Search />; break;
          case 'TERMINAL': icon = <TerminalIcons.Terminal />; break;
        }
        tagToReplace = `[${statusMatch[1]}] `;
      }
      
      return (
        <div 
          id={lineId}
          key={lineId} 
          className={`log-line ${isHighlighted ? 'crt-bg-blk' : ''}`} 
          style={{ 
            display: 'flex', 
            alignItems: 'flex-start', 
            fontFamily: 'monospace', 
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            fontSize: `${fontSize}px`,
            padding: isHighlighted ? '1px 4px' : '0',
            margin: isHighlighted ? '2px 0' : '0',
            borderRadius: isHighlighted ? '2px' : '0',
            boxShadow: isHighlighted ? 'inset 0 0 5px #22c55e1a' : 'none'
          }}
        >
          <span className="crt-text3 mr-1">{icon}</span>
          <span className="crt-text4" style={{ fontFamily: 'monospace' }}>{lineText.replace(tagToReplace, '')}</span>
        </div>
      );
    }
    
    // Direct rendering of the line text without parsing
    return (
      <div
        id={lineId}
        key={lineId}
        className={`log-line ${isHighlighted ? 'crt-bg-blk' : ''} crt-text4`}
        style={{
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontSize: `${fontSize}px`,
          padding: isHighlighted ? '1px 4px' : '0',
          margin: isHighlighted ? '2px 0' : '0',
          borderRadius: isHighlighted ? '2px' : '0',
          boxShadow: isHighlighted ? 'inset 0 0 5px #22c55e1a' : 'none'
        }}
      >
        {lineText}
      </div>
    );
  };

  return (
    <div
      ref={terminalRef}
      className="mt-2 rounded crt-border-inner7 p-2 leading-tight font-mono shadow-inner"
      style={{
        height: 'auto',
        minHeight: '10vh',
        maxHeight: '20vh',
        flex: '1 1 auto',
        backgroundColor: themeStyles.background || 'rgba(0, 0, 0, 0.5)',
        color: themeStyles.color || '#22c55e',
        fontFamily: themeStyles.fontFamily || 'monospace',
        boxShadow: 'inset 0 0 10px #22c55e1a, inset 0 0 20px #22c55e14',
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        boxSizing: 'border-box',
        overflowX: 'hidden',
        overflowY: 'auto'
      }}
      onContextMenu={handleContextMenu}
      tabIndex={0} // Make the div focusable for keyboard events
    >
      {/* CRT effect */}
      <ScanLine />
      
      {filteredLogLines.length === 0 ? (
        <div className="text-center crt-text3" style={{ fontSize: `${fontSize}px` }}>
          {searchTerm ? 'No matching logs found' : '░░░ Awaiting output ░░░'}
        </div>
      ) : (
        <div className="relative">
          {/* Search result count indicator */}
          {searchTerm && filteredLogLines.length > 0 && (
            <div className="absolute top-0 right-0 crt-bg-blk crt-border-inner7 px-2 py-1 rounded-bl text-[8px] crt-text5 z-20">
              {filteredLogLines.length} matches
            </div>
          )}
          {filteredLogLines.map(renderLogLine)}
        </div>
      )}
    </div>
  );
};

export default LogDisplay;