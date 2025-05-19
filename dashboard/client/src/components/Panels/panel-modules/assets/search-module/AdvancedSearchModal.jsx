import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import SearchIcons from './SearchIcons';
import CRTEffects from '../../../../Services/CRT-Effects';
import StatusBar from '../StatusBar';

const AdvancedSearchModal = ({
  isOpen,
  onClose,
  searchResults,
  searchHistory,
  searchFilters,
  applySearchFilter,
  setSearchTerm,
  setSelectedSearchResult,
  serviceOptions,
  logLevelOptions,
  filteredLogLines,
  isAutoScroll,
  toggleAutoScroll,
  searchTerm // Add searchTerm prop
}) => {
  // State
  const [isClosing, setIsClosing] = useState(false);
  const [currentFilterValues, setCurrentFilterValues] = useState({
    services: searchFilters.services[0] || 'all',
    logLevels: searchFilters.logLevels[0] || 'all',
    timeRange: searchFilters.timeRange || 'all'
  });
  
  // Time range options
  const timeRangeOptions = [
    { id: 'all', name: 'All Time', color: '#39FF14B3' },
    { id: '5min', name: 'Last 5 min', color: '#39FF14B3' },
    { id: '15min', name: 'Last 15 min', color: '#39FF14B3' },
    { id: '1hour', name: 'Last hour', color: '#39FF14B3' },
    { id: '24hours', name: 'Last 24h', color: '#39FF14B3' }
  ];
  
  // Update filter values when filters change
  useEffect(() => {
    setCurrentFilterValues({
      services: searchFilters.services[0] || 'all',
      logLevels: searchFilters.logLevels[0] || 'all',
      timeRange: searchFilters.timeRange || 'all'
    });
  }, [searchFilters]);
  
  // Handle closing animation
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300);
  }, [onClose]);
  
  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (e) => {
      if (isOpen && e.key === 'Escape') handleClose();
    };
    
    window.addEventListener('keydown', handleEscKey);
    return () => window.removeEventListener('keydown', handleEscKey);
  }, [isOpen, handleClose]);
  
  // Handle background click to close modal
  const handleBackgroundClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);
  
  // Format current filters for display
  const displayCurrentFilters = useCallback(() => {
    const service = serviceOptions.find(s => s.id === currentFilterValues.services)?.name || 'All Services';
    const logLevel = logLevelOptions.find(l => l.id === currentFilterValues.logLevels)?.name || 'All Levels';
    const timeRange = timeRangeOptions.find(t => t.id === currentFilterValues.timeRange)?.name || 'All Time';
    
    return `${service}, ${logLevel}, ${timeRange}`;
  }, [currentFilterValues, serviceOptions, logLevelOptions, timeRangeOptions]);
  
  // Handle filter changes
  const handleServiceChange = useCallback((value) => {
    setCurrentFilterValues(prev => ({ ...prev, services: value }));
    applySearchFilter(
      value === 'all' ? ['all'] : [value], 
      searchFilters.logLevels, 
      searchFilters.timeRange
    );
  }, [applySearchFilter, searchFilters]);
  
  const handleLogLevelChange = useCallback((value) => {
    setCurrentFilterValues(prev => ({ ...prev, logLevels: value }));
    applySearchFilter(
      searchFilters.services, 
      value === 'all' ? ['all'] : [value], 
      searchFilters.timeRange
    );
  }, [applySearchFilter, searchFilters]);
  
  const handleTimeRangeChange = useCallback((value) => {
    setCurrentFilterValues(prev => ({ ...prev, timeRange: value }));
    applySearchFilter(
      searchFilters.services, 
      searchFilters.logLevels, 
      value
    );
  }, [applySearchFilter, searchFilters]);
  
  // If modal is not open, return null
  if (!isOpen) return null;
  
  // Create modal content
  const modalContent = (
    <div>
      {/* Overlay with CRT effect and blur */}
      <div
        className="fixed inset-0 z-[998] bg-black/30 backdrop-blur-[1.5px]"
        onClick={handleBackgroundClick}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh'
        }}
      >
        <CRTEffects isActive={true} />
      </div>
    
      {/* Modal container - positioned fixed in the center of the window */}
      <div
        className={`fixed top-1/2 left-1/2
                  md:w-[600px] w-[95%] max-h-[80vh] md:max-h-[600px]
                  bg-black/95 overflow-hidden border border-green-700
                  rounded-lg shadow-2xl shadow-green-900/40
                  transform -translate-x-1/2 -translate-y-1/2 z-[999]
                  transition-all duration-300 ease-out
                  ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) ${isClosing ? 'scale(0.95)' : 'scale(1)'}`,
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header with selected combination */}
        <div className="flex justify-between items-center p-3 border-b border-green-800/50 bg-black/70">
          <div>
            <h2 className="text-green-300 font-medium text-lg flex items-center gap-2">
              <SearchIcons.Search /> ADVANCED SEARCH
            </h2>
            <div className="crt-bg-blk p-1 mt-1 rounded crt-border7 text-green-500/90 text-xs">
              <span className="crt-text4">FILTERS:</span> {displayCurrentFilters()}
            </div>
          </div>
          
          {/* Close button */}
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full bg-green-900/20 hover:bg-green-900/40 text-green-400
                    transition-colors duration-200"
            aria-label="Close advanced search"
          >
            <SearchIcons.Close />
          </button>
        </div>
        
        {/* Futuristic Control Panel with Neon Glow */}
        <div className="p-4 bg-black/80 m-2 rounded-lg" style={{ 
          boxShadow: 'inset 0 0 15px rgba(57, 255, 20, 0.2)',
          background: 'linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(10,20,10,0.9) 100%)'
        }}>
          {/* Holographic UI Container */}
          <div className="relative flex flex-col space-y-6 py-4">
            {/* Horizontal Filter Controls - Positioned at top */}
            <div className="flex flex-row gap-2 justify-between">
              {/* Log Levels Dropdown */}
              <div className="relative group">
                <button
                  className="flex items-center gap-1 px-3 py-1.5 bg-black border border-green-600/40 rounded text-green-400 text-[10px] font-bold
                           hover:bg-green-900/20 transition-all duration-300 justify-between min-w-[110px]"
                  style={{ boxShadow: '0 0 10px rgba(0,0,0,0.8), 0 0 5px rgba(57, 255, 20, 0.2)' }}
                >
                  <span>LOG LEVEL:</span>
                  <span className="text-green-300 ml-1">
                    {logLevelOptions.find(o => o.id === currentFilterValues.logLevels)?.name || 'All Levels'}
                  </span>
                  <span className="text-[8px] ml-1">▼</span>
                </button>
                
                {/* Dropdown Content */}
                <div className="absolute left-0 top-full mt-1 bg-black/90 border border-green-600/30 rounded overflow-hidden shadow-xl z-20
                              transition-all duration-300 origin-top scale-y-0 opacity-0 group-hover:scale-y-100 group-hover:opacity-100
                              w-[130px] max-h-[200px] overflow-y-auto"
                     style={{ boxShadow: '0 5px 15px rgba(0,0,0,0.8), 0 0 5px rgba(57, 255, 20, 0.3)' }}>
                  {logLevelOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleLogLevelChange(option.id)}
                      className={`w-full text-left px-3 py-1.5 text-[10px] transition-all duration-200
                                  ${currentFilterValues.logLevels === option.id
                                    ? 'bg-green-900/30 text-green-300'
                                    : 'text-green-400/80 hover:bg-green-900/20 hover:text-green-300'}`}
                      style={{
                        textShadow: '0 0 5px rgba(57, 255, 20, 0.3)'
                      }}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Services Dropdown */}
              <div className="relative group">
                <button
                  className="flex items-center gap-1 px-3 py-1.5 bg-black border border-green-600/40 rounded text-green-400 text-[10px] font-bold
                           hover:bg-green-900/20 transition-all duration-300 justify-between min-w-[110px]"
                  style={{ boxShadow: '0 0 10px rgba(0,0,0,0.8), 0 0 5px rgba(57, 255, 20, 0.2)' }}
                >
                  <span>SERVICE:</span>
                  <span className="text-green-300 ml-1">
                    {serviceOptions.find(o => o.id === currentFilterValues.services)?.name || 'All Services'}
                  </span>
                  <span className="text-[8px] ml-1">▼</span>
                </button>
                
                {/* Dropdown Content */}
                <div className="absolute left-0 top-full mt-1 bg-black/90 border border-green-600/30 rounded overflow-hidden shadow-xl z-20
                              transition-all duration-300 origin-top scale-y-0 opacity-0 group-hover:scale-y-100 group-hover:opacity-100
                              w-[130px] max-h-[200px] overflow-y-auto"
                     style={{ boxShadow: '0 5px 15px rgba(0,0,0,0.8), 0 0 5px rgba(57, 255, 20, 0.3)' }}>
                  {serviceOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleServiceChange(option.id)}
                      className={`w-full text-left px-3 py-1.5 text-[10px] transition-all duration-200
                                  ${currentFilterValues.services === option.id
                                    ? 'bg-green-900/30 text-green-300'
                                    : 'text-green-400/80 hover:bg-green-900/20 hover:text-green-300'}`}
                      style={{
                        textShadow: '0 0 5px rgba(57, 255, 20, 0.3)'
                      }}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Time Range Dropdown */}
              <div className="relative group">
                <button
                  className="flex items-center gap-1 px-3 py-1.5 bg-black border border-green-600/40 rounded text-green-400 text-[10px] font-bold
                           hover:bg-green-900/20 transition-all duration-300 justify-between min-w-[110px]"
                  style={{ boxShadow: '0 0 10px rgba(0,0,0,0.8), 0 0 5px rgba(57, 255, 20, 0.2)' }}
                >
                  <span>TIME RANGE:</span>
                  <span className="text-green-300 ml-1">
                    {timeRangeOptions.find(o => o.id === currentFilterValues.timeRange)?.name || 'All Time'}
                  </span>
                  <span className="text-[8px] ml-1">▼</span>
                </button>
                
                {/* Dropdown Content */}
                <div className="absolute left-0 top-full mt-1 bg-black/90 border border-green-600/30 rounded overflow-hidden shadow-xl z-20
                              transition-all duration-300 origin-top scale-y-0 opacity-0 group-hover:scale-y-100 group-hover:opacity-100
                              w-[130px] max-h-[200px] overflow-y-auto"
                     style={{ boxShadow: '0 5px 15px rgba(0,0,0,0.8), 0 0 5px rgba(57, 255, 20, 0.3)' }}>
                  {timeRangeOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => handleTimeRangeChange(option.id)}
                      className={`w-full text-left px-3 py-1.5 text-[10px] transition-all duration-200
                                  ${currentFilterValues.timeRange === option.id
                                    ? 'bg-green-900/30 text-green-300'
                                    : 'text-green-400/80 hover:bg-green-900/20 hover:text-green-300'}`}
                      style={{
                        textShadow: '0 0 5px rgba(57, 255, 20, 0.3)'
                      }}
                    >
                      {option.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Search input - cleaner, more prominent */}
            <div className="w-full mt-4">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-green-500">
                    <SearchIcons.Search />
                  </span>
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search logs..."
                  className="w-full pl-10 pr-10 py-2 bg-black/80 border border-green-600/40 rounded text-[12px] text-green-400 focus:ring-2 focus:ring-green-500/30 focus:outline-none transition-all"
                  style={{
                    caretColor: '#39ff14',
                    boxShadow: 'inset 0 0 15px rgba(0,0,0,0.8)'
                  }}
                />
                {searchTerm && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-green-500 hover:text-green-300 transition-colors p-1 rounded-full hover:bg-green-900/20"
                      title="Clear search"
                    >
                      <SearchIcons.Close />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Results Display - Focused, Full Width Layout */}
        <div className="flex-grow overflow-y-auto flex flex-col" style={{
          background: 'linear-gradient(180deg, rgba(0,20,0,0.3) 0%, rgba(0,10,0,0.6) 100%)',
          maxHeight: '300px',
          boxShadow: 'inset 0 5px 15px rgba(0,0,0,0.5)'
        }}>
          {/* Improved Layout: History on top, results below */}
          <div className="flex flex-col px-4 pt-3">
            {/* Search history row */}
            {searchHistory.length > 0 && (
              <div className="flex items-center gap-1 mb-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-green-700 scrollbar-track-transparent">
                <span className="text-[10px] text-green-500 font-mono whitespace-nowrap flex items-center">
                  <SearchIcons.History className="mr-1" /> Recent:
                </span>
                {searchHistory.map((term, index) => (
                  <button
                    key={index}
                    onClick={() => setSearchTerm(term)}
                    className="px-2 py-0.5 rounded-sm text-[10px] whitespace-nowrap font-mono bg-green-900/20 text-green-400/90
                              border border-green-900/30 hover:bg-green-800/30 hover:text-green-300"
                    style={{
                      textShadow: '0 0 3px rgba(57, 255, 20, 0.4)'
                    }}
                  >
                    {term}
                  </button>
                ))}
              </div>
            )}
            
            {/* Results panel - Full width with better spacing */}
            <div className="relative flex-grow rounded-md pb-2">
              <div className="flex justify-between items-center mb-2">
                <div className="text-[11px] text-green-400 font-mono font-bold flex items-center">
                  <SearchIcons.Status.Success className="mr-1" /> SEARCH RESULTS ({searchResults.length})
                </div>
                
                {searchResults.length > 0 && (
                  <button
                    className="text-[10px] text-green-500 hover:text-green-300 flex items-center"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear results <SearchIcons.Close className="ml-1" />
                  </button>
                )}
              </div>
              
              {/* Results list with improved UI */}
              <div className="relative overflow-hidden rounded-md border border-green-900/30"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(0,20,0,0.3), rgba(0,10,0,0.5))',
                    boxShadow: 'inset 0 0 10px rgba(0,0,0,0.8)'
                  }}>
                
                {/* Grid lines effect */}
                <div className="absolute inset-0 pointer-events-none opacity-10"
                    style={{
                      backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(57, 255, 20, 0.5) 25%, rgba(57, 255, 20, 0.5) 26%, transparent 27%, transparent 74%, rgba(57, 255, 20, 0.5) 75%, rgba(57, 255, 20, 0.5) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(57, 255, 20, 0.5) 25%, rgba(57, 255, 20, 0.5) 26%, transparent 27%, transparent 74%, rgba(57, 255, 20, 0.5) 75%, rgba(57, 255, 20, 0.5) 76%, transparent 77%, transparent)',
                      backgroundSize: '30px 30px'
                    }}></div>
                
                {searchResults.length > 0 ? (
                  <div className="max-h-[200px] overflow-y-auto p-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#22955b #111' }}>
                    {searchResults.map((result, index) => (
                      <div
                        key={index}
                        className="text-[11px] py-2 px-3 my-1 cursor-pointer font-mono relative
                                  bg-black/40 hover:bg-green-900/30 rounded group flex items-center
                                  transition-all duration-300 border-l-2 border-green-500/30 hover:border-green-500/70"
                        onClick={() => {
                          setSelectedSearchResult(result.id);
                          handleClose();
                          const el = document.getElementById(result.id);
                          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }}
                        style={{
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          textShadow: '0 0 3px rgba(57, 255, 20, 0.3)'
                        }}
                      >
                        {/* Line indicator with better visibility */}
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-black/60 text-green-400 text-[9px] font-bold mr-2 flex-shrink-0"
                             style={{ boxShadow: 'inset 0 0 5px rgba(57, 255, 20, 0.2)' }}>
                          {index + 1}
                        </div>
                        
                        <div className="flex-grow text-green-300/90 overflow-hidden text-ellipsis">
                          {result.text}
                        </div>
                        
                        {/* Go to indicator */}
                        <div className="ml-2 text-green-500/70 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <span className="text-[8px]">GO TO</span> →
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  searchTerm ? (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="text-green-500/50 mb-1">
                        <SearchIcons.Search className="w-6 h-6" />
                      </div>
                      <div className="text-[12px] text-green-400/80 mb-1">No matches found</div>
                      <div className="text-[10px] text-green-500/60">Try adjusting your search terms or filters</div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center p-6 text-center">
                      <div className="text-green-500/50 mb-1">
                        <SearchIcons.Status.Info className="w-6 h-6" />
                      </div>
                      <div className="text-[12px] text-green-400/80 mb-1">Enter a search term above</div>
                      <div className="text-[10px] text-green-500/60">Results will appear here</div>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
          
          {/* No results message */}
          {searchTerm && searchResults.length === 0 && (
            <div className="text-center py-4 crt-text5">
              <div className="text-[12px] mb-1">No results found for "{searchTerm}"</div>
              <div className="text-[10px]">Try adjusting your search or filter settings</div>
            </div>
          )}
        </div>
        
        {/* Status bar at the bottom of the modal */}
        <div className="mt-auto border-t border-green-800/50 bg-black/70">
          <div className="p-2">
            <StatusBar
              filteredLogLines={filteredLogLines}
              searchTerm={searchTerm}
              isAutoScroll={isAutoScroll}
              toggleAutoScroll={toggleAutoScroll}
              serviceFilter={currentFilterValues.services}
              logLevelFilter={currentFilterValues.logLevels}
              timeRangeFilter={currentFilterValues.timeRange}
              serviceOptions={serviceOptions}
              logLevelOptions={logLevelOptions}
              timeRangeOptions={timeRangeOptions}
              onChangeServiceFilter={handleServiceChange}
              onChangeLogLevelFilter={handleLogLevelChange}
              onChangeTimeRangeFilter={handleTimeRangeChange}
            />
          </div>
          <div className="text-[8px] crt-text5 px-2 pb-1 text-center">
            Use keyboard arrows to navigate dials • Press 1-9 for quick selection • ESC to close
          </div>
        </div>
      </div>
    </div>
  );
  
  // Use ReactDOM.createPortal to render the modal at the document body level
  // This ensures it's positioned relative to the viewport, not its parent container
  try {
    return ReactDOM.createPortal(modalContent, document.body);
  } catch (error) {
    console.error("Error creating portal:", error);
    // Fallback to regular rendering if portal fails
    return modalContent;
  }
};

export default AdvancedSearchModal;