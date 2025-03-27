//   /workspace/dashboard/modules/pane-creator/
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ✅ Corrected relative path to server.js
const SERVER_FILE = path.join(__dirname, '../../server.js')

const START_TAG = '// ⬇ USER PANE ROUTES'
const END_TAG = '// ⬆ END USER ROUTES'

export default function injectToServer(paneName) {
  if (!fs.existsSync(SERVER_FILE)) throw new Error('server.js not found.')

  const tag = paneName.toLowerCase()
  const existing = fs.readFileSync(SERVER_FILE, 'utf-8')
  if (existing.includes(`// <${tag}-pane>`)) {
    console.log(`[-] Pane "${paneName}" already injected.`)
    return
  }

  const injection = [
    `// <${tag}-pane>`,
    `  socket.on('${tag}LogStreamRequest', () => {`,
    `    const stream = spawn('tail', ['-f', '/workspace/logs/${tag}.log'])`,
    `    stream.stdout.on('data', data => socket.emit('${tag}LogStream', data.toString()))`,
    `  })`,
    `// </${tag}-pane>`
  ].join('\n')

  const newContent = existing.replace(
    END_TAG,
    `${injection}\n  ${END_TAG}`
  )

  fs.writeFileSync(SERVER_FILE, newContent)
  console.log(`[+] Backend injected for pane: ${paneName}`)
}
