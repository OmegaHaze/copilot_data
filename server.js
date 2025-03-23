import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import path from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer)

const distPath = path.join(__dirname, 'client', 'dist')
app.use(express.static(distPath))

app.get('*', (_, res) => {
  res.sendFile(path.join(distPath, 'index.html'))
})

io.on('connection', socket => {
  console.log('[+] Dashboard client connected')

  const sendStatus = () => {
    exec('supervisorctl status', (err, stdout) => {
      if (err) return
      const services = stdout
        .trim()
        .split('\n')
        .map(line => {
          const [name, status] = line.split(/\s+/)
          return { name, status }
        })
      socket.emit('statusUpdate', services)
    })
  }

  sendStatus()
  const interval = setInterval(sendStatus, 3000)

  socket.on('disconnect', () => clearInterval(interval))
})

httpServer.listen(1488, () =>
  console.log('[📊] Dashboard live on http://localhost:1488')
)
