// filepath: /workspace/dashboard/client/src/components/Panels/panel-modules/NetworkGraph/NetSelector.jsx
import React, { useState } from 'react'

export default function NetSelector({ 
  selectedInterface, 
  setSelectedInterface, 
  interfaces
}) {
  const [showInterfaceMenu, setShowInterfaceMenu] = useState(false)
  
  return (
    <div className="absolute top-2 right-4 z-30">
      <div className="relative">
        <button 
          className="px-2 py-0.5 rounded text-[10px] crt-bg-blk flex items-center gap-1"
          onClick={() => setShowInterfaceMenu(prev => !prev)}
        >
          <span className="text-green-400">
            {selectedInterface === 'all' ? 'All Interfaces' : selectedInterface}
          </span>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-2 w-2 text-green-400/70" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {showInterfaceMenu && (
          <div className="absolute text-[10px] right-0 mt-1 p-2 bg-black/60 backdrop-blur-sm rounded border border-green-500/40 shadow-lg z-40"
            style={{
              boxShadow: '0 0 10px rgba(67, 200, 110, 0.15)',
            }}
          >
            <div className="text-[10px] crt-text5 mb-1 pb-1 border-b border-green-500/30 flex justify-between items-center">
              <span className="flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-2.5 w-2.5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                I/O
              </span>
            </div>
            
            <div className="flex flex-col gap-1 pt-1">
              {interfaces.map(iface => (
                <button
                  key={iface}
                  onClick={() => {
                    setSelectedInterface(iface);
                    setShowInterfaceMenu(false);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] text-left ${
                    selectedInterface === iface
                      ? 'bg-black/20 hover:bg-green-900/30'
                      : 'bg-black/20 opacity-70 hover:opacity-100 hover:bg-green-900/20'
                  }`}
                  style={{ 
                    color: iface === 'eth0' ? '#43C86E' : 
                           iface === 'wlan0' ? '#43A0C8' : '#C89B43'
                  }}
                >
                  {iface}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
