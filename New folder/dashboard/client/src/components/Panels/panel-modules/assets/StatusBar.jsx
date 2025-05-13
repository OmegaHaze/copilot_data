import React from 'react'

/**
 * Status bar component for displaying terminal statistics
 */
const StatusBar = ({
  filteredLogLines,
  searchTerm,
  isAutoScroll,
  toggleAutoScroll,
  serviceFilter,
  logLevelFilter,
  timeRangeFilter,
  serviceOptions,
  logLevelOptions,
  timeRangeOptions,
  onChangeServiceFilter,
  onChangeLogLevelFilter,
  onChangeTimeRangeFilter
}) => {
  // Get service name from ID
  const getServiceName = (id) => {
    const service = serviceOptions.find(s => s.id === id)
    return service ? service.name : id
  }
  
  // Get log level name from ID
  const getLogLevelName = (id) => {
    const level = logLevelOptions.find(l => l.id === id)
    return level ? level.name : id
  }
  
  // Get time range name from ID
  const getTimeRangeName = (id) => {
    const timeRange = timeRangeOptions.find(t => t.id === id)
    return timeRange ? timeRange.name : id
  }
  
  // Handle clicking on service to cycle to next service
  const cycleNextService = () => {
    if (!serviceOptions || serviceOptions.length === 0) return
    
    const currentIndex = serviceOptions.findIndex(s => s.id === serviceFilter)
    const nextIndex = (currentIndex + 1) % serviceOptions.length
    onChangeServiceFilter(serviceOptions[nextIndex].id)
  }
  
  // Handle clicking on log level to cycle to next level
  const cycleNextLogLevel = () => {
    if (!logLevelOptions || logLevelOptions.length === 0) return
    
    const currentIndex = logLevelOptions.findIndex(l => l.id === logLevelFilter)
    const nextIndex = (currentIndex + 1) % logLevelOptions.length
    onChangeLogLevelFilter(logLevelOptions[nextIndex].id)
  }
  
  // Handle clicking on time range to cycle to next range
  const cycleNextTimeRange = () => {
    if (!timeRangeOptions || timeRangeOptions.length === 0) return
    
    const currentIndex = timeRangeOptions.findIndex(t => t.id === timeRangeFilter)
    const nextIndex = (currentIndex + 1) % timeRangeOptions.length
    onChangeTimeRangeFilter(timeRangeOptions[nextIndex].id)
  }
  
  return (
    <div className="text-[8px] crt-text3 mt-1 flex justify-between crt-border-inner7 p-1 rounded" style={{ maxWidth: '100%' }}>
      <span className="crt-text4">{filteredLogLines.length} lines</span>
      
      <div className="flex space-x-2">
        {searchTerm && (
          <span className="crt-text5">{filteredLogLines.length} matches for "<span className="crt-text4">{searchTerm}</span>"</span>
        )}
        
        {serviceFilter && serviceFilter !== 'all' && (
          <span 
            className="crt-text5 hover:bg-green-900/20 px-1 rounded cursor-pointer" 
            onClick={cycleNextService}
            title="Click to cycle to next service"
          >
            Service: <span className="crt-text4">{getServiceName(serviceFilter)}</span>
          </span>
        )}
        
        {logLevelFilter && logLevelFilter !== 'all' && (
          <span 
            className="crt-text5 hover:bg-green-900/20 px-1 rounded cursor-pointer" 
            onClick={cycleNextLogLevel}
            title="Click to cycle to next log level"
          >
            Level: <span className="crt-text4">{getLogLevelName(logLevelFilter)}</span>
          </span>
        )}
        
        {timeRangeFilter && timeRangeFilter !== 'all' && (
          <span 
            className="crt-text5 hover:bg-green-900/20 px-1 rounded cursor-pointer" 
            onClick={cycleNextTimeRange}
            title="Click to cycle to next time range"
          >
            Time: <span className="crt-text4">{getTimeRangeName(timeRangeFilter)}</span>
          </span>
        )}
      </div>
      
      <button
        onClick={toggleAutoScroll}
        className="crt-text5 hover:bg-green-900/20 px-1 rounded cursor-pointer"
      >
        {isAutoScroll ? (
          <>Auto-scroll: <span className="crt-text4">ON</span></>
        ) : (
          <>Auto-scroll: <span className="text-gray-500">OFF</span></>
        )}
      </button>
    </div>
  )
}

export default StatusBar