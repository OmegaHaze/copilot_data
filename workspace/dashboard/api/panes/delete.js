import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const REGISTRY_PATH = path.join(__dirname, '../../modules/pane-creator/userPaneRegistry.json')
const COMPONENTS_DIR = path.join(__dirname, '../../client/src/components/user')
const SERVICES_DIR = path.join(COMPONENTS_DIR, 'services')
const CONF_DIR = '/etc/supervisor/conf.d'
const SERVER_FILE = path.join(__dirname, '../../server.js')

export default async function deletePane(req, res) {
  try {
    const paneId = req.params.paneId.toLowerCase()

    console.log(`\n🧩 Deleting pane: ${paneId}`)
    console.log('📁 Registry path:', REGISTRY_PATH)

    if (!fs.existsSync(REGISTRY_PATH)) {
      return res.status(404).json({ error: 'Registry missing.' })
    }

    const registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'))
    const entry = registry[paneId]
    if (!entry || !entry.component) {
      return res.status(400).json({ error: 'Component path missing in registry.' })
    }

    const componentName = entry.component
    const baseName = entry.name // original casing like "Raven"

    // JSX component
    const filePath = path.join(COMPONENTS_DIR, componentName)
    console.log('🧪 JSX path:', filePath)
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath)
      console.log(`[🗑️] Deleted: ${filePath}`)
    }

    // Service script
    const servicePath = path.join(SERVICES_DIR, `${baseName}Service.js`)
    console.log('🧪 Service path:', servicePath)
    if (fs.existsSync(servicePath)) {
      fs.unlinkSync(servicePath)
      console.log(`[🗑️] Deleted service: ${servicePath}`)
    }

    // Icon
    if (entry.icon && entry.icon.includes('/uploads/icons/')) {
      const iconPath = path.join(__dirname, '../../', entry.icon)
      console.log('🧪 Icon path:', iconPath)
      if (fs.existsSync(iconPath)) {
        fs.unlinkSync(iconPath)
        console.log(`[🗑️] Deleted icon: ${iconPath}`)
      }
    }

    // Supervisor conf file delete
const confPath = path.join(CONF_DIR, `${paneId.toLowerCase()}.conf`)
console.log('🧪 Conf path:', confPath)
if (fs.existsSync(confPath)) {
  fs.unlinkSync(confPath)
  console.log(`[🗑️] Deleted conf: ${confPath}`)
} else {
  console.warn(`⚠️ Conf not found: ${confPath}`)
}

    // Remove server.js injection
    console.log('🧪 Cleaning server.js...')
    const tag = `// <${paneId}-pane>`
    const endTag = `// </${paneId}-pane>`
    const contents = fs.readFileSync(SERVER_FILE, 'utf-8')
    const regex = new RegExp(`${tag}[\\s\\S]*?${endTag}\\n?`, 'g')
    const cleaned = contents.replace(regex, '')
    fs.writeFileSync(SERVER_FILE, cleaned)

    // Registry cleanup
    delete registry[paneId]
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2))

    console.log(`[✖] Pane "${paneId}" fully deleted.\n`)
    res.json({ success: true })

  } catch (err) {
    console.error('[deletePane] Failed:', err)
    res.status(500).json({ error: err.message })
  }
}
