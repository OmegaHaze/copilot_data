//  /workspace/dashboard/modules/pane-creator/mappingHandler.js


import DefaultPane from '../../client/src/components/DefaultPane.jsx'
import NvidiaPane from '../../client/src/components/NvidiaPane.jsx'
import ComfyUIPane from '../../client/src/components/ComfyUIPane.jsx'
import N8nPane from '../../client/src/components/N8nPane.jsx'

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REGISTRY_PATH = path.join(__dirname, './userPaneRegistry.json')

export function getPaneMappings() {
  const defaultPaneMap = {
    nvidia: NvidiaPane,
    comfyui: ComfyUIPane,
    n8n: N8nPane
  }

  const defaultLogoMap = {
    nvidia: '/uploads/icons/nvidia.png',
    comfyui: '/uploads/icons/comfyui.png',
    n8n: '/uploads/icons/n8n.png'
  }

  const userPaneMap = {}
  const userLogoMap = {}

  if (fs.existsSync(REGISTRY_PATH)) {
    const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'))
    for (const [key, meta] of Object.entries(registry)) {
      try {
        const mod = require(`../../client/src/components/${meta.component}`)
        userPaneMap[key] = mod.default || DefaultPane
        userLogoMap[key] = meta.icon || ''
      } catch (err) {
        console.warn(`⚠ Failed to load user pane "${key}". Defaulting.`)
        userPaneMap[key] = DefaultPane
        userLogoMap[key] = ''
      }
    }
  }

  return {
    paneMap: { ...defaultPaneMap, ...userPaneMap },
    logoUrls: { ...defaultLogoMap, ...userLogoMap }
  }
}
