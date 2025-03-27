import PaneHeader from './PaneHeader'
import PaneInternal from './PaneInternal'
import { useEffect, useState } from 'react'
import { io } from 'socket.io-client'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Legend, Area, AreaChart
} from 'recharts'

export default function NvidiaPane({ name = "NVIDIA GPU", status = "Active", logo }) {
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    const socket = io()
    socket.on('nvidiaSmiStream', (raw) => {
      const [temp, gpuUtil, memUtil] = raw.trim().split(',').map(v => parseInt(v))
      const time = new Date().toLocaleTimeString()

      setChartData(prev => {
        const updated = [...prev, { time, temp, gpuUtil, memUtil }]
        return updated.slice(-30)
      })
    })

    return () => socket.disconnect()
  }, [])

  return (
    <div className="bg-[#08170D] rounded border border-green-600 shadow-inner overflow-hidden w-full h-full flex flex-col">
      <PaneHeader name={name} status={status} logo={logo} />
      <PaneInternal name={name} />
      <div className="flex-grow p-2 text-green-300 font-mono text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00FF00" stopOpacity={0.4}/>
                <stop offset="95%" stopColor="#00FF00" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid stroke="#0f0" strokeDasharray="2 2" />
            <XAxis dataKey="time" stroke="#0f0" tick={{ fontSize: 10 }} />
            <YAxis stroke="#0f0" tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#0f0', color: '#0f0' }} />
            <Legend wrapperStyle={{ color: '#0f0', fontSize: 10 }} />
            <Area
              type="monotone"
              dataKey="temp"
              stroke="#00FF00"
              fill="url(#tempFill)"
              name="Temp (°C)"
              animationDuration={300}
              dot={false}
            />
            <Line type="monotone" dataKey="gpuUtil" stroke="#00FF00" strokeDasharray="5 2" dot={false} name="GPU Util (%)" animationDuration={300} />
            <Line type="monotone" dataKey="memUtil" stroke="#00FF00" strokeDasharray="3 3" dot={false} name="VRAM Util (%)" animationDuration={300} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
