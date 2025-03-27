import express from 'express'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const REGISTRY_PATH = path.join(__dirname, '../../modules/pane-creator/userPaneRegistry.json')
const CONF_DIR = '/etc/supervisor/conf.d'

const router = express.Router()

router.get('/registry', (req, res) => {
  try {
    if (!fs.existsSync(REGISTRY_PATH)) {
      return res.json({})
    }

    const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'))
    const result = {}

    for (const [paneId, meta] of Object.entries(registry)) {
      const hasConf = fs.existsSync(path.join(CONF_DIR, `${paneId}.conf`))
      result[paneId.toLowerCase()] = {
        ...meta,
        shouldInject: !hasConf
      }
    }

    res.json(result)
  } catch (err) {
    console.error('[registry route] Error:', err)
    res.status(500).json({ error: err.message })
  }
})

export default router
