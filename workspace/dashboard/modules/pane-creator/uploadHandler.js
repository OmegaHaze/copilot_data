// workspace/pane-creator/uploadHandler.js This utility handles saving uploaded icon files to
// /workspace/uploads/icons/, ensuring filenames are unique and accessible by the front-end.

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 🔧 Updated path to correct uploads folder
const ICONS_DIR = path.join(__dirname, '../../uploads/icons')
if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR, { recursive: true })

export default function uploadHandler(file, paneName = '') {
  if (!file || !file.originalname || !file.buffer) {
    throw new Error('Invalid file upload')
  }

  const ext = path.extname(file.originalname).toLowerCase()
  if (!['.png', '.jpg', '.jpeg', '.svg', '.webp'].includes(ext)) {
    throw new Error('Unsupported icon file type')
  }

  const hash = crypto.createHash('md5').update(file.buffer).digest('hex').slice(0, 8)
  const safeName = `${paneName || 'pane'}-${Date.now()}-${hash}${ext}`
  const savePath = path.join(ICONS_DIR, safeName)

  fs.writeFileSync(savePath, file.buffer)

  const publicPath = `/uploads/icons/${safeName}`
  console.log(`[✓] Icon saved: ${publicPath}`)

  return publicPath
}
