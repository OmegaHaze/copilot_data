import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

import uploadHandler from './uploadHandler.js'
import injectToServer from './injectToServer.js'
import supervisorConfGen from './supervisorConfGen.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const COMPONENTS_DIR = path.join(__dirname, '../../client/src/components/user')
const SERVICES_DIR = path.join(COMPONENTS_DIR, 'services')
const REGISTRY_PATH = path.join(__dirname, './userPaneRegistry.json')
const TEMPLATE_PATH = path.join(__dirname, './templatePane.jsx')
const SERVICE_TEMPLATE = `// Auto-generated service file for %%PANE_NAME%%
console.log("Service %%PANE_NAME%% started.");
setInterval(() => {
  console.log("%%PANE_NAME%% is alive at", new Date().toISOString());
}, 5000);`

export default async function generatePane({ paneName, paneTitle, iconFile, withSupervisor }) {
  try {
    if (!paneName || !/^[a-zA-Z][a-zA-Z0-9_-]+$/.test(paneName)) {
      throw new Error('Invalid pane name format.')
    }

    const safeName = paneName.replace(/\s+/g, '')
    const className = `${safeName}Pane`
    const filename = `${className}.jsx`
    const filePath = path.join(COMPONENTS_DIR, filename)

    // Ensure folders exist
    if (!fs.existsSync(COMPONENTS_DIR)) fs.mkdirSync(COMPONENTS_DIR, { recursive: true })
    if (!fs.existsSync(SERVICES_DIR)) fs.mkdirSync(SERVICES_DIR, { recursive: true })

    if (!fs.existsSync(TEMPLATE_PATH)) {
      throw new Error('Template pane file is missing.')
    }

    if (fs.existsSync(filePath)) {
      throw new Error(`Pane "${className}" already exists.`)
    }

    // Step 1: Render pane template
    const template = fs.readFileSync(TEMPLATE_PATH, 'utf-8')
    const rendered = template
      .replace(/%%PANE_NAME%%/g, safeName)
      .replace(/%%PANE_TITLE%%/g, paneTitle || safeName)

    fs.writeFileSync(filePath, rendered)
    console.log(`[+] Created component: ${filePath}`)

    // Step 2: Upload icon if provided
    const iconPath = iconFile ? uploadHandler(iconFile, safeName) : ''

    // Step 3: Load or init registry
    let registry = {}
    if (fs.existsSync(REGISTRY_PATH)) {
      try {
        registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'))
      } catch (err) {
        throw new Error('Malformed registry. Fix JSON manually.')
      }
    }

    // Step 4: Insert into registry
    const registryEntry = {
      name: safeName,
      component: filename,
      icon: iconPath,
      supervisor: !!withSupervisor,
      path: `src/components/user/${filename}`,
      isUserPane: true
    }

    registry[safeName.toLowerCase()] = registryEntry
    fs.writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2))
    console.log(`[✓] Registry updated: ${safeName}`)

    // Step 5: Inject into server + conf.d
    injectToServer(safeName)
    if (withSupervisor) supervisorConfGen(safeName)

    // Step 6: Generate optional service script
    if (withSupervisor) {
      const servicePath = path.join(SERVICES_DIR, `${safeName}Service.js`)
      const serviceCode = SERVICE_TEMPLATE.replace(/%%PANE_NAME%%/g, safeName)
      fs.writeFileSync(servicePath, serviceCode)
      console.log(`[⚙] Service created: ${servicePath}`)
    }

    return { success: true, name: safeName }

  } catch (err) {
    console.error(`[✖] Pane generation failed: ${err.message}`)
    return { success: false, error: err.message }
  }
}
