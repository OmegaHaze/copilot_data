import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import GridLayout from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'

const socket = io()

const logoUrls = {
  openwebui_backend: 'https://docs.openwebui.com/images/logo.png',
  ollama: 'https://ollama.com/public/ollama.png',
  comfyui: null,
  qdrant: 'https://qdrant.tech/img/qdrant-logo.svg',
  qdrant_dashboard: 'https://qdrant.tech/img/qdrant-logo.svg',
  postgresql: 'https://www.postgresql.org/media/img/about/press/elephant.png',
  n8n: null
}

const STORAGE_KEY = 'vaio_layout'

export default function ServiceMatrix() {
  const [services, setServices] = useState([])
  const [layout, setLayout] = useState([])
  const [showLeft, setShowLeft] = useState(true)
  const [showRight, setShowRight] = useState(true)

  useEffect(() => {
    socket.on('statusUpdate', (svcList) => {
      const sorted = [
        ...svcList.filter(s => s.name.toLowerCase() === 'openwebui_backend'),
        ...svcList.filter(s => s.name.toLowerCase() !== 'openwebui_backend')
      ]
      setServices(sorted)

      if (!localStorage.getItem(STORAGE_KEY)) {
        const cols = 4
        const defaultLayout = sorted.map((svc, i) => {
          const isMain = svc.name.toLowerCase() === 'openwebui_backend'
          return {
            i: svc.name,
            x: isMain ? 0 : ((i - 1) % cols),
            y: isMain ? 0 : Math.floor((i - 1) / cols) + 1,
            w: isMain ? cols : 1,
            h: 2,
            static: false
          }
        })
        setLayout(defaultLayout)
      } else {
        setLayout(JSON.parse(localStorage.getItem(STORAGE_KEY)))
      }
    })
    return () => socket.off('statusUpdate')
  }, [])

  const onLayoutChange = (newLayout) => {
    setLayout(newLayout)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayout))
  }

  const resetLayout = () => {
    localStorage.removeItem(STORAGE_KEY)
    location.reload()
  }

  const cols = 4
  const rowHeight = 150
  const containerWidth = 1280

  return (
    <div className="w-full h-screen flex flex-col bg-black text-green-300 font-mono">

      {/* Topbar toggles (only shows on mobile) */}
      <div className="flex md:hidden justify-between px-4 py-2 bg-black border-b border-green-600">
        <button onClick={() => setShowLeft(!showLeft)} className="text-green-400 text-xs border px-2 py-1">☰ Menu</button>
        <button onClick={() => setShowRight(!showRight)} className="text-green-400 text-xs border px-2 py-1">☰ Panel</button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        {showLeft && (
          <div className="hidden md:block w-64 bg-black border-r border-green-600 p-4 shadow-inner">
            <div className="text-green-500 text-sm mb-3" style={{ whiteSpace: 'pre' }}>
{`
 ██╗   ██╗  █████╗  ██╗  ██████╗   
 ██║   ██║ ██╔══██╗ ██║ ██╔═══██╗ 
 ██║   ██║ ███████║ ██║ ██║   ██║ 
 ╚██╗ ██╔╝ ██╔══██║ ██║ ██║   ██║ 
  ╚████╔╝  ██║  ██║ ██ ║╚██████╔╝  
   ╚═══╝   ╚═╝  ╚═╝╚═╝  ╚═════╝   
`}
            </div>
            <div className="text-green-400 text-xs border-b border-green-700 pb-2 mb-2">
              ▒▒ SYSTEM PANEL ▒▒
            </div>
            <div className="text-green-500 text-[10px] leading-tight">
              - CPU: 03%<br />
              - GPU: 11%<br />
              - MEM: 28%<br />
              - ⚡ ALL SYSTEMS NOMINAL
            </div>
          </div>
        )}

        {/* Main Grid Area */}
        <div className="flex-1 overflow-auto p-4">
          <div className="w-full max-w-[1280px] mx-auto">
            <GridLayout
              className="layout"
              layout={layout}
              cols={cols}
              rowHeight={rowHeight}
              width={containerWidth}
              onLayoutChange={onLayoutChange}
              compactType={null}
              preventCollision={true}
            >
              {services.map(({ name, status }) => {
                const logo = logoUrls[name.toLowerCase()]
                return (
                  <div key={name} className="bg-black rounded border border-green-600 shadow-inner w-full h-full overflow-hidden">
                    <div className="flex items-center justify-between px-3 py-2 text-xs font-bold border-b border-green-700 bg-green-400/10 cursor-move">
                      {logo ? (
                        <img src={logo} alt={name} className="h-6 w-6 mr-2" />
                      ) : (
                        <span className="text-xs mr-2">{name}</span>
                      )}
                      <span className={`${status === 'RUNNING' ? 'text-green-400' : 'text-red-400'}`}>
                        {status}
                      </span>
                    </div>
                    <div className="px-3 py-2 text-xs opacity-60 tracking-widest">
                      ░░░ Awaiting data ░░░
                    </div>
                  </div>
                )
              })}
            </GridLayout>
          </div>
        </div>

        {/* Right Panel */}
        {showRight && (
          <div className="hidden md:flex flex-col w-48 bg-black border-l border-green-600 p-4 shadow-inner text-xs space-y-2">
            <div className="text-green-400 border-b border-green-700 pb-1 mb-2">▒▒ CONTROLS ▒▒</div>
            <button
              onClick={resetLayout}
              className="bg-green-700 text-black text-xs font-bold px-3 py-1 rounded hover:bg-green-500 border border-green-400 shadow"
            >
              Reset Layout
            </button>
            <div className="text-green-500 text-[10px]">
              - Auto logs: OFF<br />
              - Boot FX: READY<br />
              - CRT: ACTIVE<br />
              - ⌨ Terminal: ON
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
