import React from 'react'
import TerminalIcons from './TerminalIcons'

const AdvancedSearchPanel = ({
  searchResults,
  searchHistory,
  searchFilters,
  applySearchFilter,
  setSearchTerm,
  setSelectedSearchResult,
  serviceOptions,
  logLevelOptions
}) => {
  return (
    <div className="mt-1 mb-1 crt-border-inner7 p-3 rounded crt-bg-blk overflow-hidden"
         style={{
           boxShadow: 'inset 0 0 10px #39ff141a, 0 0 15px #39ff1426',
           position: 'relative',
           zIndex: 5,
           transition: 'all 0.3s ease-in-out',
           maxWidth: '100%'
         }}>

      <div className="text-[10px] crt-text5 mb-2 pb-1 crt-border-b flex justify-between items-center">
        <span className="flex items-center gap-1">
          <TerminalIcons.Search /> ADVANCED SEARCH/DEBUG CONSOLE
        </span>
        <span className="text-[8px] crt-text3">{searchResults.length} results</span>
      </div>

      <div className="grid grid-cols-1 gap-3">

        {/* Services */}
        <div>
          <label className="flex items-center gap-1 text-[8px] crt-text4 mb-1">
            <TerminalIcons.Service.Supervisor /> Services
          </label>
          <div className="flex flex-wrap gap-1">
            {serviceOptions.map(service => (
              <button
                key={service.id}
                onClick={() => {
                  const current = [...searchFilters.services]
                  if (service.id === 'all') {
                    applySearchFilter(['all'], searchFilters.logLevels, searchFilters.timeRange)
                  } else {
                    const idxAll = current.indexOf('all')
                    if (idxAll > -1) current.splice(idxAll, 1)
                    const idx = current.indexOf(service.id)
                    idx > -1 ? current.splice(idx, 1) : current.push(service.id)
                    applySearchFilter(current.length ? current : ['all'], searchFilters.logLevels, searchFilters.timeRange)
                  }
                }}
                className={`px-2 py-0.5 rounded text-[8px] ${
                  searchFilters.services.includes(service.id) ||
                  (service.id === 'all' && searchFilters.services.length === 0)
                    ? 'crt-bg-blk hover:bg-green-900/30'
                    : 'crt-bg-blk opacity-70 hover:opacity-100 hover:bg-green-900/20'
                }`}
                style={{ color: service.color }}
              >
                {service.name}
              </button>
            ))}
          </div>
        </div>

        {/* Log Levels */}
        <div>
          <label className="flex items-center gap-1 text-[8px] crt-text4 mb-1">
            <TerminalIcons.Status.Info /> Log Levels
          </label>
          <div className="flex flex-wrap gap-1">
            {logLevelOptions.map(level => (
              <button
                key={level.id}
                onClick={() => {
                  const current = [...searchFilters.logLevels]
                  if (level.id === 'all') {
                    applySearchFilter(searchFilters.services, ['all'], searchFilters.timeRange)
                  } else {
                    const idxAll = current.indexOf('all')
                    if (idxAll > -1) current.splice(idxAll, 1)
                    const idx = current.indexOf(level.id)
                    idx > -1 ? current.splice(idx, 1) : current.push(level.id)
                    applySearchFilter(
                      searchFilters.services,
                      current.length ? current : ['all'],
                      searchFilters.timeRange
                    )
                  }
                }}
                className={`px-2 py-0.5 rounded text-[8px] ${
                  searchFilters.logLevels.includes(level.id) ||
                  (level.id === 'all' && searchFilters.logLevels.length === 0)
                    ? 'crt-bg-blk hover:bg-green-900/30'
                    : 'crt-bg-blk opacity-70 hover:opacity-100 hover:bg-green-900/20'
                }`}
                style={{ color: level.color }}
              >
                {level.name}
              </button>
            ))}
          </div>
        </div>

        {/* Time Range */}
        <div>
          <label className="flex items-center gap-1 text-[8px] crt-text4 mb-1">
            <TerminalIcons.Status.Running /> Time Range
          </label>
          <div className="flex flex-wrap gap-1">
            {[
              { id: 'all', name: 'All Time' },
              { id: '5min', name: 'Last 5 min' },
              { id: '15min', name: 'Last 15 min' },
              { id: '1hour', name: 'Last hour' },
              { id: '24hours', name: 'Last 24h' }
            ].map(range => (
              <button
                key={range.id}
                onClick={() =>
                  applySearchFilter(searchFilters.services, searchFilters.logLevels, range.id)
                }
                className={`px-2 py-0.5 rounded text-[8px] ${
                  searchFilters.timeRange === range.id
                    ? 'crt-bg-blk hover:bg-green-900/30'
                    : 'crt-bg-blk opacity-70 hover:opacity-100 hover:bg-green-900/20'
                }`}
              >
                {range.name}
              </button>
            ))}
          </div>
        </div>

        {/* Search History */}
        {searchHistory.length > 0 && (
          <div className="mt-1">
            <label className="flex items-center gap-1 text-[8px] crt-text4 mb-1">
              <TerminalIcons.History /> Recent Searches
            </label>
            <div className="flex flex-wrap gap-1">
              {searchHistory.map((term, index) => (
                <button
                  key={index}
                  onClick={() => setSearchTerm(term)}
                  className="px-2 py-0.5 rounded text-[8px] crt-bg-blk hover:bg-green-900/30 crt-text4"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        {searchResults.length > 0 && (
          <div className="mt-2">
            <label className="flex items-center gap-1 text-[8px] crt-text4 mb-1">
              <TerminalIcons.Status.Success /> Results ({searchResults.length})
            </label>
            <div className="max-h-48 overflow-y-auto crt-bg-blk p-1 rounded crt-border-inner7 scroll-panel">
              {searchResults.slice(0, 5).map((result, index) => (
                <div
                  key={index}
                  className="text-[8px] py-0.5 hover:bg-green-900/30 cursor-pointer crt-text3"
                  onClick={() => {
                    setSelectedSearchResult(result.id)
                    const el = document.getElementById(result.id)
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }}
                >
                  {result.text.length > 60 ? result.text.substring(0, 60) + '...' : result.text}
                </div>
              ))}
              {searchResults.length > 5 && (
                <div className="text-[8px] text-center crt-text5 mt-1">
                  + {searchResults.length - 5} more results
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdvancedSearchPanel
