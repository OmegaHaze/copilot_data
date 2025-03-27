import { useEffect, useState, useRef } from 'react'
import TerminalPane from './Panes/TerminalPane.jsx'
import { io } from 'socket.io-client'

export default function SidePanelRight({ show, toggle, onReset }) {
  const panelRef = useRef(null)
  const [width, setWidth] = useState(300)
  const [logs, setLogs] = useState('')

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const panelWidth = isMobile ? '100vw' : `${width}px`

  useEffect(() => {
    const socket = io()
    socket.on('dashboardLogStream', (html) => {
      setLogs(prev => prev + html)
    })
    return () => socket.disconnect()
  }, [])

  const handleDouble = () => {
    if (isMobile) toggle()
  }

  const handleSoftReset = async () => {
    setLogs('')
    const res = await fetch('http://localhost:1488/run-soft-reset')
    const reader = res.body.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      setLogs(prev => prev + decoder.decode(value, { stream: true }))
    }
  }

  const handleDrag = (e) => {
    const newWidth = window.innerWidth - e.clientX
    if (newWidth >= 240 && newWidth <= window.innerWidth * 0.8) {
      if (panelRef.current) {
        panelRef.current.style.width = `${newWidth}px`
      }
    }
  }

  const stopDrag = (e) => {
    const finalWidth = window.innerWidth - e.clientX
    if (finalWidth >= 240 && finalWidth <= window.innerWidth * 0.8) {
      setWidth(finalWidth)
    }
    document.removeEventListener('mousemove', handleDrag)
    document.removeEventListener('mouseup', stopDrag)
  }

  const startDrag = () => {
    document.addEventListener('mousemove', handleDrag)
    document.addEventListener('mouseup', stopDrag)
  }

  const expandPanel = () => {
    const newWidth = window.innerWidth / 3
    setWidth(newWidth)
    if (panelRef.current) {
      panelRef.current.style.width = `${newWidth}px`
    }
  }

  return (
    <div
      id="right-panel"
      ref={panelRef}
      className={`
        fixed top-0 right-0 h-full bg-black border-l border-green-600 p-4 shadow-inner z-40
        transition-all duration-300 ease-in-out
        ${show ? 'translate-x-0' : 'translate-x-full'}
      `}
      style={{ width: panelWidth }}
    >
      {/* Drag Handle */}
      {!isMobile && (
        <div
          className="absolute top-0 left-0 h-full w-1 cursor-ew-resize z-50"
          onMouseDown={startDrag}
        />
      )}

      {/* Toggle Tab */}
      <div
        className="hidden md:flex items-center justify-center absolute top-4 left-[-32px] bg-green-800 text-black text-xs font-bold px-2 py-1 rounded-l cursor-pointer shadow-lg z-50"
        onClick={toggle}
      >
        ☰
      </div>


      {/* Expand Button */}
      {!isMobile && (
    <div
  className="text-green-400 text-sm cursor-pointer hover:text-green-200 absolute top-2 right-2"
  title={width > 300 ? 'Contract panel' : 'Expand to 1/3 screen'}
  onClick={() => {
    const expanded = Math.floor(window.innerWidth / 3)
    const defaultWidth = 300
    const newWidth = width > defaultWidth ? defaultWidth : expanded
    setWidth(newWidth)
    if (panelRef.current) panelRef.current.style.width = `${newWidth}px`
  }}
>
  {width > 300 ? '⇤' : '⇥'}
</div>

)}

      {/* Header + Double Tap Close */}
      <div onDoubleClick={handleDouble} onTouchEnd={handleDouble}>
        <div className="text-green-400 text-xs border-b border-green-700 pb-2 mb-2">
          ▒▒ DASHBOARD CONTROL PANEL ▒▒
        </div>
      </div>

      {/* Panel Contents */}
      <div className="flex flex-col space-y-2 text-xs text-green-300">
        <button onClick={handleSoftReset} className="border border-green-500 px-2 py-1">
          ☢ RESET DASH SERVER
        </button>
        <button onClick={onReset} className="border border-green-500 px-2 py-1">
          ⊞ RESET LAYOUT
        </button>
        <div className="text-green-500 text-[10px] leading-tight pt-2 border-t border-green-700 mt-2">
          - ADMIN LOG: ACTIVE<br />
          - Boot FX: READY<br />
          - CRT: ACTIVE<br />
          - TERMINAL: ACTIVE
        </div>

        <div
          className="mt-2 text-green-200 bg-black border border-green-700 p-2 h-40 overflow-y-auto scroll-panel text-[10px] leading-tight font-mono whitespace-pre-wrap shadow-inner"
          dangerouslySetInnerHTML={{ __html: logs || '░░░ Awaiting output ░░░' }}
        ></div>

        <div className="mt-4 w-full overflow-hidden border border-green-700">
          <TerminalPane />
        </div>
      </div>
    </div>
  )
}
