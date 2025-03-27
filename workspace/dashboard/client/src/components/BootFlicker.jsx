import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'

const postLines = [
  '[OK] Initializing terminal interfaces...',
  '[OK] Loading supervisor service...',
  '[OK] Spawning OpenWebUI backend...',
  '[OK] Mounting ComfyUI pipeline...',
  '[OK] Qdrant vector engine online...',
  '[OK] Engaging n8n automations...',
  '[OK] Terminal bridge established',
  '[OK] Socket connection stable',
  '[OK] Boot sequence complete'
]

export default function BootFlicker({ onComplete }) {
  const [step, setStep] = useState(0)
  const [connected, setConnected] = useState(false)
  const [flickered, setFlickered] = useState(false)

  const [asciiVisible, setAsciiVisible] = useState(false)
  const [glitch, setGlitch] = useState(false)
  const [glow, setGlow] = useState(false)
  const [burnIn, setBurnIn] = useState(false)
  const [crtReveal, setCrtReveal] = useState(false)
  const [flash, setFlash] = useState(false)
  const [scanPulse, setScanPulse] = useState(false)
  const [explode, setExplode] = useState(false)

useEffect(() => {
  const socket = io();
  socket.on('connect', () => {
    setConnected(true);
    const audio = new Audio('https://www.101soundboards.com/sounds/12905733-riddles-of-the-grid-grid-grid');
    audio.volume = 1.0; // Corrected volume setting (full volume)
    audio.play().catch(() => console.warn('Autoplay blocked.'));
    setFlickered(false);
    setTimeout(() => setFlickered(true), 200);
  });
  return () => socket.disconnect();
}, []);


  useEffect(() => {
    if (!connected || !flickered) return
    if (step < postLines.length) {
      const timeout = setTimeout(() => setStep(step + 1), 120)
      return () => clearTimeout(timeout)
    } else {
      setAsciiVisible(true)
      setGlow(true)
      setTimeout(() => setBurnIn(true), 1000)
      setTimeout(() => setCrtReveal(true), 2000)
      setTimeout(() => setFlash(true), 3000)
      setTimeout(() => {
        setGlitch(true)
        setScanPulse(true)
        setTimeout(() => setScanPulse(false), 400)
      }, 4000)
      setTimeout(() => {
  setGlitch(false)
  setExplode(true)
}, 5000)

setTimeout(onComplete, 6500) // give explode a moment to breathe

    }
  }, [step, connected, flickered])

  return (
    <div className={`fixed inset-0 text-green-400 font-mono text-sm z-50 flex flex-col items-center justify-center p-6 boot-glow ${flickered ? '' : 'flash-flicker'}`}>
      
      {/* Base CRT scanlines */}
      <div className="fixed inset-0 z-50 pointer-events-none scanlines" />

      {/* Pulse distortion scanline */}
      {scanPulse && <div className="fixed inset-0 z-50 pointer-events-none scan-pulse" />}

      {/* Boot log */}
      {!asciiVisible && (
        <div className="w-full max-w-xl min-h-64 z-40 bg-black p-4 border border-green-700 shadow-inner animate-flicker">
          {postLines.slice(0, step).map((line, i) => (
            <div key={i} className="tracking-wider typing-line" style={{ animationDelay: `${i * 150}ms` }}>
              {line}
            </div>
          ))}
        </div>
      )}

      {/* VAIO logo */}
      {asciiVisible && (
<div className={`absolute inset-0 flex items-center justify-center ${flash ? 'reverse-flash' : ''} z-40`}>
    <pre
  className={`text-center text-green-400 text-base tracking-widest 
    ${glow ? 'glow-pulse' : ''} 
    ${burnIn ? 'burn-in' : ''} 
    ${crtReveal ? 'glitch-flicker' : ''}`}  // ← this toggles glitch effect
>
  {[
    "  ██╗   ██╗  █████╗  ██╗  ██████╗   ",
    " ██║   ██║ ██╔══██╗ ██║ ██╔═══██╗ ",
    " ██║   ██║ ███████║ ██║ ██║   ██║ ",
    " ╚██╗ ██╔╝ ██╔══██║ ██║ ██║   ██║ ",
    "   ╚████╔╝  ██║  ██║ ██║ ╚██████╔╝  ",
    "    ╚═══╝   ╚═╝  ╚═╝ ╚═╝  ╚═════╝   ",
  ].map((line, i) => (
    <div
      key={i}
      className={crtReveal ? 'crt-line' : ''}
      style={crtReveal ? { animationDelay: `${i * 100}ms` } : {}}
    >
      {line.split('').map((char, j) => (
        <span
          key={j}
          className={explode ? 'explode-char' : ''}
          style={
            explode
              ? {
                  transform: `translate(${Math.random() * 600 - 300}px, ${Math.random() * 600 - 300}px) rotate(${Math.random() * 1440 - 720}deg) scale(${1 + Math.random() * 2.5})`,
                  opacity: 0,
                  display: 'inline-block',
                  transition: 'all 1s ease-out',
                }
              : {}
          }
        >
          {char}
        </span>
      ))}
    </div>
  ))}
</pre>

                {/* closes the asciiVisible wrapper */}
</div>

      )}
    {/* closes the entire BootFlicker return */}
</div>

  )
}
