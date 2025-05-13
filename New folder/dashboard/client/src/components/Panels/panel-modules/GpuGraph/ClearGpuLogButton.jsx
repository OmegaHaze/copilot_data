import { useState } from 'react'
import DeleteConfirmationDialog from '../../../Error-Handling/DeleteConfirmationDialog'
import ErrorEffects from '../../../Error-Handling/ErrorEffects'

export default function ClearGpuLogButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showEffect, setShowEffect] = useState(false)

  const handleConfirm = async () => {
    setDeleting(true)
    setShowEffect(true)

    try {
      await fetch('/api/clear-gpu-log', { method: 'DELETE' })
    } catch (err) {
      console.error('Failed to clear GPU log:', err)
    } finally {
      setTimeout(() => setShowEffect(false), 1500)
      setDeleting(false)
      setIsOpen(false)
    }
  }

  return (
    <>
      {/* Override drag behavior + icon */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(true)
        }}
        onMouseDown={(e) => e.stopPropagation()}
        title="Clear GPU Stream Logs"
        className="inline-flex items-center justify-center p-1.5 mx-1 rounded text-green-400 hover:text-green-200 z-[1001]"
      >
        {/* Custom SVG Trash Icon (retro sharp lines) */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-4 h-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
          strokeLinejoin="miter"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
          <line x1="10" y1="11" x2="10" y2="17" />
          <line x1="14" y1="11" x2="14" y2="17" />
        </svg>
      </button>

      {showEffect && <ErrorEffects isActive />}

      <DeleteConfirmationDialog
        isOpen={isOpen}
        paneName="NVIDIA Logs"
        onClose={() => setIsOpen(false)}
        onConfirm={handleConfirm}
        customLabels={{
          title: 'CLEAR NVIDIA STREAM LOGS?',
          cancel: '[CANCEL]',
          confirm: '[CONFIRM]',
          processing: '[DELETING...]'
        }}
        isRestarting={deleting}
      />
    </>
  )
}
