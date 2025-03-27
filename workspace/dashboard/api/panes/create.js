import express from 'express'
import multer from 'multer'
import generatePane from '../../modules/pane-creator/generatePane.js'

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage() })

router.post('/create', upload.single('icon'), async (req, res) => {
  const { paneName, paneTitle, supervisor } = req.body

  const iconFile = req.file ? {
    originalname: req.file.originalname,
    buffer: req.file.buffer
  } : null

  try {
    const result = await generatePane({
      paneName,
      paneTitle,
      iconFile,
      withSupervisor: supervisor === 'true'
    })

    if (result?.success) return res.json({ success: true, name: result.name })
    return res.status(400).json({ success: false, error: result?.error || 'Unknown error' })

  } catch (err) {
    console.error('[POST /create] Crash:', err)
    res.status(500).json({ success: false, error: 'Internal server error.' })
  }
})

export default router
