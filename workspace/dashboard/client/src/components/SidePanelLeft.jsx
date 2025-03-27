import { useState, useEffect, useRef } from 'react'
import HeaderAscii from './HeaderAscii'
import PaneCreator from './PaneCreator.jsx'
import Draggable from 'react-draggable'



export default function SidePanelLeft({ show, toggle }) {
  const panelRef = useRef(null)
  const [width, setWidth] = useState(290)

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const panelWidth = isMobile ? '100vw' : `${width}px`
  const [showPaneCreator, setShowPaneCreator] = useState(false)

  const handleDrag = (e) => {
    const newWidth = e.clientX
    if (newWidth >= 240 && newWidth <= window.innerWidth * 0.8) {
      if (panelRef.current) {
        panelRef.current.style.width = `${newWidth}px`
      }
    }
  }

  const stopDrag = (e) => {
    const finalWidth = e.clientX
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

  const handleDouble = () => {
    if (isMobile) toggle()
  }

  return (
    <div
      id="left-panel"
      ref={panelRef}
      className={`
        fixed top-0 left-0 h-full bg-black border-r border-green-600 p-4 shadow-inner z-40
        transition-all duration-300 ease-in-out
        ${show ? 'translate-x-0' : '-translate-x-full'}
      `}
      style={{ width: panelWidth }}
    >
      {/* Drag Handle */}
      {!isMobile && (
        <div
          className="absolute top-0 right-0 h-full w-1 cursor-ew-resize z-50"
          onMouseDown={startDrag}
        />
      )}

      {/* Toggle Tab */}
      <div
        className="hidden md:flex items-center justify-center absolute top-4 right-[-32px] bg-green-800 text-black text-xs font-bold px-2 py-1 rounded-r cursor-pointer shadow-lg z-50"
        onClick={toggle}
      >
        ☰
      </div>

    {!isMobile && (
  <div
    className="text-green-400 text-sm cursor-pointer hover:text-green-200 absolute top-2 left-2"
    title={width > 290 ? 'Contract panel' : 'Expand to 1/3 screen'}
    onClick={() => {
      const expanded = Math.floor(window.innerWidth / 3)
      const defaultWidth = 290
      const newWidth = width > defaultWidth ? defaultWidth : expanded
      setWidth(newWidth)
      if (panelRef.current) panelRef.current.style.width = `${newWidth}px`
    }}
  >
    {width > 290 ? '⇤' : '⇥'}
  </div>
)}



      {/* Header ASCII + Double Tap */}
      <div onDoubleClick={handleDouble} onTouchEnd={handleDouble}>
        <HeaderAscii />
      </div>

      <div className="text-green-400 text-xs border-b border-green-700 pb-2 mb-2">▒▒ RAG SYSTEM PANEL ▒▒</div>

      <div className="text-green-500 text-[10px] leading-tight">
        - CPU: 03%<br />
        - GPU: 11%<br />
        - MEM: 28%<br />
        - ⚡ ALL SYSTEMS NOMINAL<br />
        - LAUNCH OPENWEBUI WINDOW<br />
        - LAUNCH COMFYUI WINDOW<br />
        - LAUNCH N8N WINDOW<br />
        - LAUNCH QDRANT WINDOW
      </div>
<div
  className="text-green-400 text-xs mt-4 border-t border-green-700 pt-2 cursor-pointer"
  onClick={() => setShowPaneCreator(true)}
>
  [+] PANE
</div>

{showPaneCreator && (
  <Draggable handle=".pane-drag-header" defaultPosition={{ x: 600, y: 120 }}>
    <div className="fixed z-[999] bg-black border border-green-600 shadow-xl rounded-lg w-[500px]">
      <div className="pane-drag-header cursor-move bg-green-800 text-black text-xs px-3 py-2 border-b border-green-600 rounded-t">
        [+] PANE
        <span
          className="float-right text-green-300 hover:text-green-100 cursor-pointer"
          onClick={() => setShowPaneCreator(false)}
        >
          ✕
        </span>
      </div>
      <div className="p-4">
        <PaneCreator onClose={(shouldReload) => {
          setShowPaneCreator(false)
          if (shouldReload) {
            window.dispatchEvent(new Event('paneRefresh'))
          }
        }} />
      </div>
    </div>
  </Draggable>
)}

    </div>
  )
}
