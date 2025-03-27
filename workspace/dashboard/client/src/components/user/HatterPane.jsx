// 🧱 This file was generated from templatePane.jsx  /workspace/pane-creator/templatePane.jsx
// DO NOT EDIT this template directly – it's used for dynamic pane creation.

import PaneInternal from '../Panes/PaneInternal.jsx'
import PaneHeader from '../Panes/PaneHeader.jsx'

import { useEffect, useState, useRef } from 'react'
import { io } from 'socket.io-client'

export default function HatterPane({ name, status, logo, isUserPane }) {
  const [logs, setLogs] = useState('')
  const terminalRef = useRef(null)

  useEffect(() => {
    const socket = io()
    socket.on('HatterLogStream', (line) => {
      setLogs(prev => prev + line)
    })
    return () => socket.disconnect()
  }, [])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="bg-black rounded border border-green-600 shadow-inner overflow-hidden w-full h-full flex flex-col">
<PaneHeader name={name} status={status} logo={logo} isUserPane={isUserPane} />
      <PaneInternal name={name} />
      <div
        ref={terminalRef}
        className="flex-grow overflow-y-auto mt-1 text-green-200 bg-black border-t border-green-700 p-2 scroll-panel text-[10px] leading-tight font-mono whitespace-pre-wrap shadow-inner"
      >
        {logs.length > 0
          ? <div dangerouslySetInnerHTML={{ __html: logs }} />
          : '░░░ Awaiting output ░░░'}
      </div>
    </div>
  )
}