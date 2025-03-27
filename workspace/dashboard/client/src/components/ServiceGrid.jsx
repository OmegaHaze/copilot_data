import { Responsive, WidthProvider } from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import { useEffect } from 'react'

// PANE imports
import SupervisorPane from './Panes/SupervisorPane.jsx'
import PostgresPane from './Panes/PostgresPane.jsx'
import QdrantDashboardPane from './Panes/QdrantDashboardPane.jsx'
import OpenWebUIPane from './Panes/OpenWebUIPane.jsx'
import OllamaPane from './Panes/OllamaPane.jsx'
import ComfyUIPane from './Panes/ComfyUIPane.jsx'
import QdrantPane from './Panes/QdrantPane.jsx'
import N8nPane from './Panes/N8nPane.jsx'
import DefaultPane from './Panes/DefaultPane.jsx'
import NvidiaPane from './Panes/NvidiaPane.jsx'

const ResponsiveGridLayout = WidthProvider(Responsive)

const logoUrls = {
  supervisor: null,
  comfyui: null,
  openwebui: 'https://docs.openwebui.com/images/logo.png',
  openwebui_backend: 'https://docs.openwebui.com/images/logo.png',
  ollama: 'https://ollama.com/public/ollama.png',
  qdrant: 'https://qdrant.tech/img/qdrant-logo.svg',
  qdrant_dashboard: 'https://qdrant.tech/img/qdrant-logo.svg',
  postgresql: 'https://www.postgresql.org/media/img/about/press/elephant.png',
  postgres: 'https://www.postgresql.org/media/img/about/press/elephant.png',
  n8n: null,
  nvidia: 'https://logospng.org/download/nvidia/nvidia-256.png',
}

const paneMap = {
  supervisor: SupervisorPane,
  comfyui: ComfyUIPane,
  openwebui: OpenWebUIPane,
  openwebui_backend: OpenWebUIPane,
  ollama: OllamaPane,
  qdrant: QdrantPane,
  qdrant_dashboard: QdrantDashboardPane,
  postgresql: PostgresPane,
  postgres: PostgresPane,
  n8n: N8nPane,
  nvidia: NvidiaPane,
}

function generateLayoutForBreakpoint(services, cols) {
  const layout = []
  const supervisorKey = 'supervisor'
  const supervisorHeight = 5
  const paneHeight = 4
  let x = 0
  let y = supervisorHeight

  let paneWidth
  if (cols >= 24) {
    paneWidth = Math.floor(cols * 0.25)
  } else if (cols >= 12) {
    paneWidth = Math.floor(cols * 0.5)
  } else {
    paneWidth = cols
  }

  services.forEach((svc) => {
    const key = svc.name.toLowerCase()
    const isSupervisor = key === supervisorKey
    const isDoubleWidth = key === 'nvidia'

    const w = isSupervisor ? cols : isDoubleWidth ? paneWidth * 2 : paneWidth
    const h = isSupervisor ? supervisorHeight : paneHeight
    const currentX = isSupervisor ? 0 : x
    const currentY = isSupervisor ? 0 : y

    layout.push({
      i: key,
      x: currentX,
      y: currentY,
      w,
      h,
      static: false,
    })

    if (!isSupervisor) {
      x += w
      if (x + paneWidth > cols) {
        x = 0
        y += paneHeight
      }
    }
  })

  return layout
}

export default function ServiceGrid({ services = [], paneMap = {}, logoUrls = {}, onLayoutChange }) {
  const breakpoints = { lg: 1600, md: 1200, sm: 768, xs: 480, xxs: 0 }
  const cols = { lg: 48, md: 36, sm: 24, xs: 6, xxs: 2 }

  const layouts = {
    lg: generateLayoutForBreakpoint(services, cols.lg),
    md: generateLayoutForBreakpoint(services, cols.md),
    sm: generateLayoutForBreakpoint(services, cols.sm),
    xs: generateLayoutForBreakpoint(services, cols.xs),
    xxs: generateLayoutForBreakpoint(services, cols.xxs),
  }

  const handleLayoutChange = (currentLayout, allLayouts) => {
    if (onLayoutChange) onLayoutChange(allLayouts)
  }

  return (
    <div className="w-full max-w-screen-xl mx-auto relative" style={{ minHeight: '100vh' }}>
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        breakpoints={breakpoints}
        cols={cols}
        rowHeight={60}
        margin={[10, 10]}
        containerPadding={[10, 10]}
        onLayoutChange={handleLayoutChange}
        compactType={null}
        preventCollision={true}
        isDraggable={true}
        isResizable={true}
      >
        {services.map((svc) => {
          const key = svc.name.toLowerCase()
          const logo = logoUrls[key]
          const PaneComponent = paneMap[key] || DefaultPane
          const isUserPane = svc._isUserPane === true

          if (!PaneComponent) {
            console.warn(`⚠️ Missing pane for service "${key}"`)
            return null
          }

          return (
            <div key={key} className="bg-green-800/10">
              <PaneComponent
                name={svc.name}
                status={svc.status}
                logo={logo}
                isUserPane={isUserPane}
              />
            </div>
          )
        })}
      </ResponsiveGridLayout>
    </div>
  )
}
