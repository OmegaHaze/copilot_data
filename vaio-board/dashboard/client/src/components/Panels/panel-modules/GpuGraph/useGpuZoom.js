import { useState } from 'react'

export function useGpuZoom(chartData) {
  const [zoomState, setZoomState] = useState({
    left: null,
    right: null,
    refAreaLeft: '',
    refAreaRight: '',
    top: null,
    bottom: null,
    isZoomed: false
  })

  const getAxisYDomain = (from, to) => {
    if (!chartData?.length) return [0, 100]
    const filtered = chartData.filter(d => d.timestamp >= from && d.timestamp <= to)
    if (!filtered.length) return [0, 100]

    let tempMin = Infinity, tempMax = -Infinity
    let gpuMin = Infinity, gpuMax = -Infinity
    let memMin = Infinity, memMax = -Infinity

    for (const d of filtered) {
      if (d.temp < tempMin) tempMin = d.temp
      if (d.temp > tempMax) tempMax = d.temp
      if (d.gpuUtil < gpuMin) gpuMin = d.gpuUtil
      if (d.gpuUtil > gpuMax) gpuMax = d.gpuUtil
      if (d.memUtil < memMin) memMin = d.memUtil
      if (d.memUtil > memMax) memMax = d.memUtil
    }

    const min = Math.min(tempMin, gpuMin, memMin)
    const max = Math.max(tempMax, gpuMax, memMax)
    return [Math.max(0, min - 5), max + 5]
  }

  const start = (e) => {
    if (e?.activeLabel) {
      setZoomState(prev => ({ ...prev, refAreaLeft: e.activeLabel }))
    }
  }

  const move = (e) => {
    if (e?.activeLabel && zoomState.refAreaLeft) {
      setZoomState(prev => ({ ...prev, refAreaRight: e.activeLabel }))
    }
  }

  const end = () => {
    let { refAreaLeft, refAreaRight } = zoomState
    if (!refAreaLeft || !refAreaRight) {
      setZoomState(prev => ({ ...prev, refAreaLeft: '', refAreaRight: '' }))
      return
    }
    if (refAreaLeft > refAreaRight) [refAreaLeft, refAreaRight] = [refAreaRight, refAreaLeft]
    const [bottom, top] = getAxisYDomain(refAreaLeft, refAreaRight)
    setZoomState({
      refAreaLeft: '',
      refAreaRight: '',
      left: refAreaLeft,
      right: refAreaRight,
      top,
      bottom,
      isZoomed: true
    })
  }

  const reset = () => {
    setZoomState({
      left: 'dataMin',
      right: 'dataMax',
      refAreaLeft: '',
      refAreaRight: '',
      top: 'dataMax+5',
      bottom: 0,
      isZoomed: false
    })
  }

  return {
    zoomState,
    zoomHandlers: { start, move, end },
    handleZoomReset: reset
  }
}
