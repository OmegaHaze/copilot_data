import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import ServiceGrid from './ServiceGrid'
import SidePanelLeft from './SidePanelLeft'
import SidePanelRight from './SidePanelRight'
import ErrorEffects from '/workspace/dashboard/client/src/ErrorEffects'
import DefaultPane from './Panes/DefaultPane.jsx'
import * as StaticPanes from './Panes/_paneMap.js'
import { loadUserPanes } from '/src/utils/paneLoader.js'

const socket = io('http://localhost:1488')
const STORAGE_KEY = 'vaio_layout'

export default function ServiceMatrix() {
  const [services, setServices] = useState([])
  const [layout, setLayout] = useState([])
  const [paneMap, setPaneMap] = useState({})
  const [logoUrls, setLogoUrls] = useState({})
  const [showLeft, setShowLeft] = useState(true)
  const [showRight, setShowRight] = useState(true)
  const confDir = '/etc/supervisor/conf.d/user'

  const setupLayout = (fullList) => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const cols = 8
      const defaultLayout = fullList.map((svc, i) => {
        const key = svc.name.toLowerCase()
        const isFullWidth = key === 'supervisor'
        const isDoubleWidth = key === 'nvidia'

        return {
          i: svc.name,
          x: isFullWidth ? 0 : ((i - 1) % cols),
          y: isFullWidth ? 0 : Math.floor((i - 1) / cols) + 1,
          w: isFullWidth ? cols : isDoubleWidth ? 2 : 1,
          h: 2,
          static: false
        }
      })

      setLayout(defaultLayout)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultLayout))
    } else {
      try {
        const savedLayout = JSON.parse(localStorage.getItem(STORAGE_KEY))
        setLayout(savedLayout)
      } catch (err) {
        console.error('🛑 Layout parsing error:', err)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }

  useEffect(() => {
    socket.on('statusUpdate', async (svcList) => {
      const normalized = svcList.map(svc => {
        let name = svc.name.toLowerCase()
        if (name === 'openwebui_backend') name = 'openwebui'
        if (name === 'postgres') name = 'postgresql'
        return { ...svc, name }
      })

      try {
        const res = await fetch('http://localhost:1488/api/panes/registry')
        const registry = await res.json()
        const extra = []

        for (const [key, meta] of Object.entries(registry)) {
          const paneKey = key.toLowerCase()
          const alreadyListed = normalized.some(svc => svc.name === paneKey)
          if (!alreadyListed && meta.isUserPane === true) {
         extra.push({ name: paneKey, status: 'RUNNING', _isUserPane: true })
console.log(`🧩 Marking ${paneKey} as user pane`)

          }
        }

        const fullList = [
          { name: 'supervisor', status: 'RUNNING' },
          { name: 'nvidia', status: 'RUNNING' },
          ...extra,
          ...normalized
        ]

        setServices(fullList)
        setupLayout(fullList)

      } catch (err) {
        console.error('[ServiceMatrix] Failed to inject user panes:', err)
      }
    })

    return () => socket.off('statusUpdate')
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('http://localhost:1488/api/panes/registry')
        const registry = await response.json()

        const dynamicMap = {}
        const logoMap = {}
        const userPanes = await loadUserPanes()

      for (const [rawKey, meta] of Object.entries(registry)) {
  const paneKey = rawKey.toLowerCase()
  const componentKey = meta.component.replace('.jsx', '').toLowerCase()

  try {
    const loadedComponent = userPanes[componentKey] || DefaultPane

    // 🔥 THIS IS THE IMPORTANT FIX:
    if (meta.isUserPane === true) {
      Object.defineProperty(loadedComponent, '_isUserPane', {
        value: true,
        writable: false,
        configurable: true,
        enumerable: false
      })
    }

    dynamicMap[paneKey] = loadedComponent
    logoMap[paneKey] = meta.icon || ''
  } catch (err) {
    console.warn(`⚠️ Could not load user pane: ${paneKey}`, err)
    dynamicMap[paneKey] = DefaultPane
    logoMap[paneKey] = meta.icon || ''
  }
}


        setPaneMap({ ...StaticPanes.paneMap, ...dynamicMap })
        setLogoUrls({ ...StaticPanes.logoUrls, ...logoMap })
      } catch (err) {
        console.error('[paneRefresh] Error loading registry:', err)
      }
    }

    load()
    window.addEventListener('paneRefresh', load)
    return () => window.removeEventListener('paneRefresh', load)
  }, [])

  const onLayoutChange = (newLayout) => {
    setLayout(newLayout)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayout))
  }

  const resetLayout = () => {
    localStorage.removeItem(STORAGE_KEY)
    location.reload()
  }

  return (
    <div className={`w-screen h-screen flex flex-col bg-black text-green-300 font-mono ${services.length === 0 ? 'boot-glow' : ''}`}>
      <div className={`fixed inset-0 z-50 pointer-events-none ${services.length === 0 ? 'scanlines' : ''}`} />

      <div className="flex md:hidden justify-between px-4 py-2 bg-black border-b border-green-600">
        <button onClick={() => setShowLeft(!showLeft)} className="text-green-400 text-xs border px-2 py-1">☰ Menu</button>
        <button onClick={() => setShowRight(!showRight)} className="text-green-400 text-xs border px-2 py-1">☰ Panel</button>
      </div>

      <div className="flex flex-1 h-0">
        <SidePanelLeft show={showLeft} toggle={() => setShowLeft(!showLeft)} />
        <div className="flex-1 h-full overflow-y-auto p-4 scroll-panel">
          {services.length === 0 ? (
            <>
              <ErrorEffects isActive={true} />
              <div className="flex h-full w-full items-center justify-center">
                <div className="terminal-error error-glow animate-scanlines">
                  !!SUPERVISOR SOCKET NOT DETECTED!!
                </div>
              </div>
            </>
          ) : (
            <ServiceGrid
              layout={layout}
              onLayoutChange={onLayoutChange}
              services={services}
              paneMap={paneMap}
              logoUrls={logoUrls}
            />
          )}
        </div>
        <SidePanelRight show={showRight} toggle={() => setShowRight(!showRight)} onReset={resetLayout} />
      </div>
    </div>
  )
}
