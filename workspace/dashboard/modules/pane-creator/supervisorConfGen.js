import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const OUTPUT_DIR = '/etc/supervisor/conf.d/user'
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true })

export default function supervisorConfGen(paneName) {
  const tag = paneName.toLowerCase()
  const confFile = path.join(OUTPUT_DIR, `${tag}.conf`)

  const content = `
[program:${tag}]
command=node /workspace/dashboard/client/src/components/user/${tag}Service.js
directory=/workspace
autostart=true
autorestart=true
stdout_logfile=/workspace/logs/${tag}.out.log
stderr_logfile=/workspace/logs/${tag}.out.log
`.trim()

  fs.writeFileSync(confFile, content)
  console.log(`[+] Supervisor config created: ${confFile}`)
}
