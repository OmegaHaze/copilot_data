import { useEffect, useState } from 'react'

export default function HeaderAscii() {
  const [cycle, setCycle] = useState(0)
  const [mode, setMode] = useState('random') // first: randomized implode

  useEffect(() => {
    const timeout = setTimeout(() => setMode('clean'), 3000) // switch to clean after 3s

    const interval = setInterval(() => {
      setCycle(prev => prev + 1) // force re-render
    }, 60000)

    return () => {
      clearTimeout(timeout)
      clearInterval(interval)
    }
  }, [])

  return (
    <div
      key={cycle} // ← forces full remount = restarts animation
      className="crt-link5 text-sm m-3"
      style={{ whiteSpace: 'pre' }}
    >
      {[
           "   ██╗   ██╗  █████╗  ██╗  ██████╗   ",
           "   ██║   ██║ ██╔══██╗ ██║ ██╔═══██╗ ",
           "   ██║   ██║ ███████║ ██║ ██║   ██║ ",
           "   ╚██╗ ██╔╝ ██╔══██║ ██║ ██║   ██║ ",
           "    ╚████╔╝  ██║  ██║ ██║ ╚██████╔╝  ",
           "     ╚═══╝   ╚═╝  ╚═╝ ╚═╝  ╚═════╝   ",
      ].map((line, i) => (
        <div
          key={i}
          className="reverse-crt-line"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          {line.split('').map((char, j) => {
            if (mode === 'random' && cycle === 0) {
              // initial: random implode
              const randX = Math.random().toFixed(2)
              const randY = Math.random().toFixed(2)
              const randRot = Math.random().toFixed(2)
              const randDelay = (Math.random() * 0.5).toFixed(2) + 's'
              return (
                <span
                  key={j}
                  className="implode-char"
                  style={{
                    '--rand-x': randX,
                    '--rand-y': randY,
                    '--rand-rot': randRot,
                    '--delay': randDelay,
                  }}
                >
                  {char}
                </span>
              )
            } else {
              // looped: clean implode
              return (
                <span key={j} className="implode-char">
                  {char}
                </span>
              )
            }
          })}
        </div>
      ))}
    </div>
  )
}
