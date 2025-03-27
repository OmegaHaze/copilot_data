import SupervisorPane from './SupervisorPane.jsx'
import PostgresPane from './PostgresPane.jsx'
import QdrantDashboardPane from './QdrantDashboardPane.jsx'
import OpenWebUIPane from './OpenWebUIPane.jsx'
import OllamaPane from './OllamaPane.jsx'
import ComfyUIPane from './ComfyUIPane.jsx'
import QdrantPane from './QdrantPane.jsx'
import N8nPane from './N8nPane.jsx'
import NvidiaPane from './NvidiaPane.jsx'

import { loadUserPanes } from '../../utils/paneLoader.js'


export const paneMap = {
  supervisor: SupervisorPane,
  postgres: PostgresPane,
  postgresql: PostgresPane,
  qdrant_dashboard: QdrantDashboardPane,
  openwebui: OpenWebUIPane,
  openwebui_backend: OpenWebUIPane,
  ollama: OllamaPane,
  comfyui: ComfyUIPane,
  qdrant: QdrantPane,
  n8n: N8nPane,
  nvidia: NvidiaPane
}

export const logoUrls = {
  postgres: 'https://www.postgresql.org/media/img/about/press/elephant.png',
  postgresql: 'https://www.postgresql.org/media/img/about/press/elephant.png',
  qdrant_dashboard: 'https://qdrant.tech/img/qdrant-logo.svg',
  openwebui: 'https://docs.openwebui.com/images/logo.png',
  openwebui_backend: 'https://docs.openwebui.com/images/logo.png',
  ollama: 'https://ollama.com/public/ollama.png',
  qdrant: 'https://qdrant.tech/img/qdrant-logo.svg',
  comfyui: null,
  n8n: null,
  nvidia: 'https://logospng.org/download/nvidia/nvidia-256.png',
  supervisor: null
}
