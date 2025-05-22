import React, { useState, useEffect } from 'react';

/**
 * LayoutDebugger Component
 * 
 * Utility component for validating and debugging layout issues in the debug overlay
 */
const LayoutDebugger = ({ currentLayout }) => {
  const [layoutData, setLayoutData] = useState(null);
  const [issues, setIssues] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Development environment detection
  const isDev = window.location.hostname === 'localhost' || 
               window.location.hostname === '127.0.0.1';
               
  // Force reload layout data from storage and context
  const reloadLayoutData = () => {
    setRefreshing(true);
    try {
      // Dispatch event to notify system of layout update
      window.dispatchEvent(new CustomEvent('vaio:layouts-updated', {
        detail: { source: 'layout-debugger', forceRefresh: true }
      }));
      
      // Try to reload the settings from session API
      if (window.location.pathname !== '/login') {
        fetch('/api/user/session/grid', { 
          credentials: 'include',
          headers: { 'Accept': 'application/json' }
        })
          .then(res => res.json())
          .then(data => {
            console.log('Reloaded layout data from API');
          })
          .catch(err => {
            console.warn('Failed to reload layout data from API:', err);
          })
          .finally(() => {
            setTimeout(() => setRefreshing(false), 800);
          });
      } else {
        setTimeout(() => setRefreshing(false), 800);
      }
    } catch (error) {
      console.error('Error reloading layout data:', error);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentLayout) {
      setLayoutData(currentLayout);
      const validationResults = validateGridFormat(currentLayout, undefined, true);
      if (!validationResults.isValid) {
        setIssues(validationResults.issues);
      } else {
        setIssues([]);
      }
    }
  }, [currentLayout]);

  /**
   * Validates grid layout format and collects any issues
   * @param {Object} gridLayout - The grid layout object to validate
   * @param {boolean} verbose - Whether to collect detailed information
   * @returns {Object} Validation results with issues array
   */
  function validateGridFormat(gridLayout, _unused = 'unknown', verbose = false) {
    // Skip validation in production environments unless specifically requested
    if (!isDev && !verbose) {
      return { isValid: true, issues: [] };
    }

    if (!gridLayout || typeof gridLayout !== 'object') {
      return { 
        isValid: false, 
        issues: [`Invalid grid layout: ${gridLayout === null ? 'null' : typeof gridLayout}`]
      };
    }

    let isValid = true;
    const issues = [];
    const breakpoints = ['lg', 'md', 'sm', 'xs', 'xxs'];

    // Check if all expected breakpoints exist
    const missingBreakpoints = breakpoints.filter(bp => !gridLayout[bp]);
    if (missingBreakpoints.length > 0) {
      issues.push(`Missing breakpoints: ${missingBreakpoints.join(', ')}`);
      isValid = false;
    }

    // Check if all breakpoints are arrays
    const nonArrayBreakpoints = Object.entries(gridLayout)
      .filter(([bp, value]) => breakpoints.includes(bp) && !Array.isArray(value))
      .map(([bp]) => bp);

    if (nonArrayBreakpoints.length > 0) {
      issues.push(`Non-array breakpoints: ${nonArrayBreakpoints.join(', ')}`);
      isValid = false;
    }

    // Check for invalid items in arrays
    breakpoints.forEach(bp => {
      if (gridLayout[bp] && Array.isArray(gridLayout[bp])) {
        const invalidItems = gridLayout[bp].filter(
          item => !item || !item.i || typeof item !== 'object'
        );
        if (invalidItems.length > 0) {
          issues.push(`Breakpoint ${bp} has ${invalidItems.length} invalid items`);
          isValid = false;
        }
      }
    });

    return { isValid, issues };
  }



  /**
   * Stringify layout for display
   */
  function stringifyLayout(layout, maxBreakpoints = 5, maxItems = 5) {
    if (!layout) return 'null';
    
    try {
      const result = {};
      const breakpoints = Object.keys(layout);
      
      breakpoints.forEach(bp => {
        if (Array.isArray(layout[bp])) {
          result[bp] = `Array(${layout[bp].length})`;
          
          // Add sample items
          if (layout[bp].length > 0) {
            result[`${bp}_items`] = layout[bp]
              .slice(0, maxItems)
              .map(item => 
                item && item.i ? 
                  { i: item.i, size: `${item.w}x${item.h}`, pos: `(${item.x},${item.y})` } : 
                  'invalid item'
              );
            
            // Add indicator if more items are available
            if (layout[bp].length > maxItems) {
              result[`${bp}_more`] = `...and ${layout[bp].length - maxItems} more items`;
            }
          }
        } else {
          result[bp] = typeof layout[bp];
        }
      });
      
      if (Object.keys(layout).length > maxBreakpoints) {
        result['...'] = `${Object.keys(layout).length - maxBreakpoints} more breakpoints`;
      }
      
      return JSON.stringify(result, null, 2);
    } catch (err) {
      return `Error stringifying: ${err.message}`;
    }
  }

  return (
    <div className="layout-debugger">
      {/* Controls */}
      <div className="mb-4 flex items-center justify-between">
        <h4 className="text-green-400 font-medium">Layout Debugging Tool</h4>
        <button
          onClick={reloadLayoutData}
          disabled={refreshing}
          className={`text-xs ${refreshing ? 'bg-blue-900 text-blue-300' : 'bg-blue-800 hover:bg-blue-700 text-blue-100'} px-3 py-1 rounded transition-colors flex items-center`}
        >
          {refreshing ? (
            <>
              <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5 animate-pulse"></span>
              Reloading...
            </>
          ) : (
            'Force Reload Layout Data'
          )}
        </button>
      </div>
      
      {layoutData ? (
        <div className="grid grid-cols-1 gap-4">
          <div className="glass-notification p-4 rounded-md border border-green-600/20 debug-border-glow">
            <h4 className="text-green-400 text-xs font-bold mb-2 debug-header border-b border-green-500/20 pb-1">Current Layout</h4>
            <div className="text-xs overflow-auto max-h-60 scanlines bg-green-900/10 p-2 rounded">
              <pre className="text-green-200">{stringifyLayout(layoutData)}</pre>
            </div>
          </div>
          
          {issues.length > 0 && (
            <div className="glass-notification p-4 rounded-md border border-red-600/20 debug-border-glow">
              <h4 className="text-red-400 text-xs font-bold mb-2 debug-header border-b border-red-500/20 pb-1">Layout Issues ({issues.length})</h4>
              <div className="scanlines bg-red-900/10 p-2 rounded overflow-auto max-h-40 text-xs">
                <ul className="list-disc pl-4">
                  {issues.map((issue, idx) => (
                    <li key={idx} className="mb-1 text-red-300">{issue}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          <div className="glass-notification p-4 rounded-md border border-green-600/20 debug-border-glow">
            <h4 className="text-green-400 text-xs font-bold mb-2 debug-header border-b border-green-500/20 pb-1">Layout Statistics</h4>
            <div className="scanlines bg-green-900/10 p-2 rounded overflow-auto text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {layoutData && Object.entries(layoutData).map(([bp, items]) => (
                  <div key={bp} className="flex justify-between border-b border-green-700/30 py-1">
                    <span className="font-mono text-green-300">{bp}:</span>
                    <span className="text-green-200">
                      {Array.isArray(items) ? `${items.length} items` : 'Invalid format'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-notification p-4 rounded-md border border-yellow-600/20 debug-border-glow">
          <div className="text-yellow-400 text-sm">
            No layout data available. Select a module to debug its layout.
          </div>
        </div>
      )}
    </div>
  );
};

export default LayoutDebugger;
