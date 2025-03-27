import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec, spawn } from 'child_process';
import bodyParser from 'body-parser';
import pty from 'node-pty';
import AnsiToHtml from 'ansi-to-html';
import fs from 'fs';
import readline from 'readline';
import paneCreatorRouter from './api/panes/create.js';
import deletePane from './api/panes/delete.js';
import paneRoutes from './modules/pane-creator/paneRoutes.js'; // New pane routes

// ─────────────────────────────────────────
// 📁 SETUP
// ─────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const ansiConvert = new AnsiToHtml({ fg: '#00FF00', bg: '#000', newline: true });

const distPath = path.join(__dirname, 'client', 'dist');
app.use(bodyParser.json());

// ─────────────────────────────────────────
// 🔧 Pane Management Routes (New)
// ─────────────────────────────────────────
// Mount our pane management routes at /api/panes
app.use('/api/panes', paneRoutes);

// (Optional) If you still use the create & delete routes separately:
app.use('/api/panes/create', paneCreatorRouter);
app.delete('/api/panes/:paneId', deletePane);

// ─────────────────────────────────────────
// Serve static files (compiled pane bundles and other assets)
// ─────────────────────────────────────────
app.use(express.static(distPath));

// ─────────────────────────────────────────
// REBUILD / RESET ROUTES
// ─────────────────────────────────────────
app.get('/run-dashboard-rebuild', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');
  const build = spawn('npm', ['run', 'build'], { cwd: '/workspace/dashboard/client', shell: true });
  const dev = spawn('/workspace/dashboard/reset-soft.sh', { shell: true });
  const streamLogs = (proc) => {
    proc.stdout.on('data', chunk => res.write(chunk));
    proc.stderr.on('data', chunk => res.write(chunk));
    proc.on('close', () => res.write(`\n--- [${proc.spawnargs.join(' ')}] complete ---\n`));
  };
  streamLogs(build);
  streamLogs(dev);
  dev.on('close', () => res.end());
});

app.get('/run-dev-script', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');
  const proc = spawn('/workspace/dashboard/reset-soft.sh', { shell: true });
  proc.stdout.on('data', chunk => res.write(chunk));
  proc.stderr.on('data', chunk => res.write(chunk));
  proc.on('close', () => res.end());
});

app.get('/run-soft-reset', (req, res) => {
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');
  spawn('bash', ['-c', 'nohup /workspace/dashboard/reset-soft.sh > /workspace/dashboard/reset.log 2>&1 &'], {
    detached: true, stdio: 'ignore', shell: true,
  });
  res.write('[🌀] Soft reset initiated... You must paste workspace/dashboard/reset-soft.sh and Enter in your main terminal of your root system.\n');
  res.end();
});

// ─────────────────────────────────────────
// COMMAND EXECUTION
// ─────────────────────────────────────────
app.post('/run-command', (req, res) => {
  const { cmd } = req.body;
  const proc = spawn(cmd, { shell: true });
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Transfer-Encoding', 'chunked');
  proc.stdout.on('data', chunk => res.write(chunk));
  proc.stderr.on('data', chunk => res.write(chunk));
  proc.on('close', () => res.end());
});

// ─────────────────────────────────────────
// Unified Log + Status Socket Handler
// ─────────────────────────────────────────
const sockets = new Set();
io.on('connection', (socket) => {
  console.log('[+] Dashboard client connected');
  sockets.add(socket);

  const sendStatus = () => {
    exec('supervisorctl status', (err, stdout) => {
      if (err) {
        console.error('[supervisorctl error]', err);
        return;
      }
      const services = stdout.trim().split('\n').map(line => {
        const [name, status] = line.split(/\s+/);
        return { name, status };
      });
      socket.emit('statusUpdate', services);
    });
  };
  sendStatus();
  const interval = setInterval(sendStatus, 3000);
  socket.on('disconnect', () => {
    clearInterval(interval);
    sockets.delete(socket);
  });
});

// ─────────────────────────────────────────
// Log Watchers (GLOBAL, one-time setup)
// ─────────────────────────────────────────
const streamLog = (logPath, event) => {
  if (!fs.existsSync(logPath)) {
    console.warn(`[logstream] Log file not found: ${logPath}`);
    return;
  }
  fs.watchFile(logPath, { interval: 500 }, () => {
    const start = Math.max(fs.statSync(logPath).size - 2000, 0);
    fs.createReadStream(logPath, { encoding: 'utf-8', start }).on('data', chunk => {
      for (const socket of sockets) {
        socket.emit(event, chunk.toString());
      }
    });
  });
};

streamLog('/workspace/logs/supervisord.log', 'supervisorLogStream');
streamLog('/workspace/logs/comfyui.log', 'comfyuiLogStream');
streamLog('/workspace/logs/ollama.log', 'ollamaLogStream');
streamLog('/workspace/logs/qdrant.log', 'qdrantLogStream');
streamLog('/workspace/logs/n8n.log', 'n8nLogStream');
streamLog('/workspace/logs/qdrant_dashboard.log', 'qdrantDashboardLogStream');
streamLog('/workspace/logs/postgres.log', 'postgresLogStream');
streamLog('/workspace/logs/openwebui_backend.log', 'openwebuiLogStream');
streamLog('/workspace/logs/nvidia.log', 'nvidiaLogStream');

// ─────────────────────────────────────────
// TERMINAL EMULATOR (/pty via xterm.js)
// ─────────────────────────────────────────
io.of('/pty').on('connection', socket => {
  console.log('[🖥️] Terminal session started');
  const shell = process.env.SHELL || 'bash';
  const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color', cols: 80, rows: 24, cwd: process.cwd(), env: process.env,
  });
  const sanitize = (data) => ansiConvert.toHtml(
    data.replace(/\x1b\][0-9];.*?\x07/g, '')
        .replace(/\x1b=\x1b>/g, '')
        .replace(/\x1b\[\?2004[hl]/g, '')
        .replace(/\x07/g, '')
  );
  ptyProcess.on('data', data => {
    socket.emit('output', data);
    io.emit('dashboardLogStream', sanitize(data));
  });
  socket.on('input', data => ptyProcess.write(data));
  socket.on('resize', ({ cols, rows }) => ptyProcess.resize(cols, rows));
  socket.on('disconnect', () => {
    console.log('[✖] Terminal session closed');
    ptyProcess.kill();
  });
});

// ─────────────────────────────────────────
// Registry API route for user panes
// ─────────────────────────────────────────
app.get('/api/panes/registry', (req, res) => {
  const registryPath = path.join(__dirname, 'modules', 'pane-creator', 'userPaneRegistry.json');
  try {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
    res.json(registry);
  } catch (err) {
    console.error('[registry] Failed to read userPaneRegistry.json:', err);
    res.status(500).json({ error: 'Failed to load registry' });
  }
});

// ─────────────────────────────────────────
// SPA Fallback Routing
// ─────────────────────────────────────────
app.get('*', (_, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ─────────────────────────────────────────
// Server Boot
// ─────────────────────────────────────────
httpServer.listen(1488, () =>
  console.log('[📊] Dashboard live on http://localhost:1488')
);
console.log('[⚡] Server successfully restarted');

// Adding NVIDIA SMI fetching into the server's event loop
setInterval(() => {
    exec("nvidia-smi --query-gpu=temperature.gpu,utilization.gpu,utilization.memory --format=csv,noheader,nounits", (error, stdout, stderr) => {
        if (error) {
console.error(`NVIDIA SMI exec error: ${error}`);
            return;
        }
        if(stderr){
console.error(`NVIDIA SMI stderr: ${stderr}`);
            return;
        }
        io.emit('nvidiaSmiStream', stdout.trim());
    });
}, 5000); // Update every 5 seconds