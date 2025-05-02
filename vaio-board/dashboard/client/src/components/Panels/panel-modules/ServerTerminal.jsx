import React from 'react';
import TerminalHeader from './assets/TerminalHeader'
import { LOG_COLORS } from './assets/log-parser/LogColors'
import LogDisplay from './assets/log-parser/LogDisplay'
import StatusBar from './assets/StatusBar'
import SearchBar from './assets/search-module/SearchBar'
import AdvancedSearchModal from './assets/search-module/AdvancedSearchModal'
import {
  useTerminalSocket,
  useLogProcessing,
  useSearchAndFilter,
  useTerminalUI
} from './assets/useTerminalHooks'

/**
 * ServerTerminal - Advanced log visualization and analysis component
 *
 * Features:
 * - Enhanced log formatting with perfect visual presentation
 * - Advanced search capabilities with dedicated search interface
 * - Intelligent log filtering and categorization
 * - Optimized for future AI integration and analysis
 * - Streamlined settings and controls
 */
export default function ServerTerminal() {
  // Static service and log level options
  const serviceOptions = [
    { id: 'all', name: 'All Services', color: LOG_COLORS.DEFAULT },
    { id: 'supervisor', name: 'Supervisor', color: LOG_COLORS.SUPERVISOR },
    { id: 'vite', name: 'Vite Dev Server', color: LOG_COLORS.COMFYUI },
    { id: 'python', name: 'Python Backend', color: LOG_COLORS.OPENWEBUI },
    { id: 'comfyui', name: 'ComfyUI', color: LOG_COLORS.COMFYUI },
    { id: 'openwebui', name: 'OpenWebUI', color: LOG_COLORS.OPENWEBUI },
    { id: 'ollama', name: 'Ollama', color: LOG_COLORS.OLLAMA },
    { id: 'qdrant', name: 'Qdrant', color: LOG_COLORS.QDRANT },
    { id: 'postgres', name: 'Postgres', color: LOG_COLORS.POSTGRES },
    { id: 'n8n', name: 'N8N', color: LOG_COLORS.N8N },
    { id: 'nvidia', name: 'NVIDIA', color: LOG_COLORS.NVIDIA }
  ];

  const logLevelOptions = [
    { id: 'all', name: 'All Levels', color: LOG_COLORS.DEFAULT },
    { id: 'error', name: 'Errors', color: LOG_COLORS.ERROR },
    { id: 'warning', name: 'Warnings', color: LOG_COLORS.WARNING },
    { id: 'info', name: 'Info', color: LOG_COLORS.RUNNING },
    { id: 'debug', name: 'Debug', color: LOG_COLORS.DEFAULT }
  ];

  // Time range options matching the ones in AdvancedSearchPanel
  const timeRangeOptions = [
    { id: 'all', name: 'All Time' },
    { id: '5min', name: 'Last 5 min' },
    { id: '15min', name: 'Last 15 min' },
    { id: '1hour', name: 'Last hour' },
    { id: '24hours', name: 'Last 24h' }
  ];

  // Use custom hooks for terminal functionality
  const { logs, clearLogs, logParserRef } = useTerminalSocket(serviceOptions);
  const { processedLogs, logLines } = useLogProcessing(logs, logParserRef);
  const {
    searchTerm,
    setSearchTerm,
    showSearch,
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
  } = useSearchAndFilter(logLines);
  const {
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
  } = useTerminalUI();

  // Handler for changing the service filter by cycling to the next option
  const handleChangeServiceFilter = (newServiceId) => {
    // If the current filter is 'all', apply just the new service
    // If it's something else, switch to the new service
    applySearchFilter(
      [newServiceId], 
      searchFilters.logLevels,
      searchFilters.timeRange
    );
  };

  // Handler for changing the log level filter by cycling to the next option
  const handleChangeLogLevelFilter = (newLevelId) => {
    // Similar to service, apply just the new log level
    applySearchFilter(
      searchFilters.services,
      [newLevelId],
      searchFilters.timeRange
    );
  };

  // Handler for changing the time range filter by cycling to the next option
  const handleChangeTimeRangeFilter = (newTimeRange) => {
    // Apply the new time range
    applySearchFilter(
      searchFilters.services,
      searchFilters.logLevels,
      newTimeRange
    );
  };

  // Style for log display (no longer needs to adjust for advanced search panel)
  const logDisplayStyle = {
    height: '100%',
    overflow: 'auto',
    minHeight: '100px',
    display: 'flex',
    flexDirection: 'column',
    transition: 'all 0.3s ease-in-out'
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Terminal header with settings */}
      <TerminalHeader
        showSettings={showSettings}
        toggleSettings={toggleSettings}
        toggleSearch={toggleSearch}
        toggleAutoScroll={toggleAutoScroll}
        clearLogs={clearLogs}
        copyToClipboard={copyToClipboard}
        exportLogs={() => exportLogs(processedLogs)}
        isAutoScroll={isAutoScroll}
        showSearch={showSearch}
        showAdvancedSearch={showAdvancedSearch}
        toggleAdvancedSearch={toggleAdvancedSearch}
        fontSize={fontSize}
        setFontSize={setFontSize}
        terminalTheme={terminalTheme}
        setTerminalTheme={setTerminalTheme}
        processedLogs={processedLogs}
      />
      
      {/* Search bar */}
      {showSearch && (
        <SearchBar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          showAdvancedSearch={showAdvancedSearch}
          toggleAdvancedSearch={toggleAdvancedSearch}
          searchInputRef={searchInputRef}
        />
      )}
      
      {/* Status bar */}
      <StatusBar
        filteredLogLines={filteredLogLines}
        searchTerm={searchTerm}
        isAutoScroll={isAutoScroll}
        toggleAutoScroll={toggleAutoScroll}
        serviceFilter={searchFilters.services[0] || 'all'}
        logLevelFilter={searchFilters.logLevels[0] || 'all'}
        timeRangeFilter={searchFilters.timeRange || 'all'}
        serviceOptions={serviceOptions}
        logLevelOptions={logLevelOptions}
        timeRangeOptions={timeRangeOptions}
        onChangeServiceFilter={handleChangeServiceFilter}
        onChangeLogLevelFilter={handleChangeLogLevelFilter}
        onChangeTimeRangeFilter={handleChangeTimeRangeFilter}
      />
      
      {/* Advanced search modal */}
      <AdvancedSearchModal
        isOpen={showAdvancedSearch}
        onClose={toggleAdvancedSearch}
        searchResults={searchResults}
        searchHistory={searchHistory}
        searchFilters={searchFilters}
        applySearchFilter={applySearchFilter}
        setSearchTerm={setSearchTerm}
        setSelectedSearchResult={setSelectedSearchResult}
        serviceOptions={serviceOptions}
        logLevelOptions={logLevelOptions}
        timeRangeOptions={timeRangeOptions}
        filteredLogLines={filteredLogLines}
        isAutoScroll={isAutoScroll}
        toggleAutoScroll={toggleAutoScroll}
        searchTerm={searchTerm}
      />
      
      {/* Log display with dynamic height */}
      <div className="flex-grow overflow-auto" style={logDisplayStyle}>
        <LogDisplay
          filteredLogLines={filteredLogLines}
          terminalRef={terminalRef}
          searchTerm={searchTerm}
          fontSize={fontSize}
          terminalTheme={terminalTheme}
          logParserRef={logParserRef}
          selectedSearchResult={selectedSearchResult}
          clearLogs={clearLogs}
          copyToClipboard={copyToClipboard}
          exportLogs={exportLogs}
          processedLogs={processedLogs}
        />
      </div>
      
    </div>
  );
}