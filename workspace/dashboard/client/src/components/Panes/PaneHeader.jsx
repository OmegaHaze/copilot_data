// components/PaneHeader.jsx
import { useContext } from 'react'
import { SettingsContext } from '../SettingsContext'

export default function PaneHeader({ name, status, logo, isUserPane }) {
  const { open } = useContext(SettingsContext)

  return (
    <div className="flex items-center justify-between px-3 py-2 text-xs font-bold border-b border-green-700 bg-green-400/10 cursor-move">
      <div className="flex items-center space-x-2 pointer-events-none">
        {logo && <img src={logo} alt={name} className="h-5 w-5" />}
        <span className="text-green-200 tracking-wide">{name.toUpperCase()}</span>
      </div>

      <div className="flex items-center space-x-2 pointer-events-auto">
        {isUserPane && (
          <button
  onMouseDown={(e) => e.stopPropagation()} // ⛔ Prevent drag start
  onClick={(e) => {
    e.stopPropagation() // ⛔ Prevent drag trigger
    if (confirm('Delete this pane?')) {
      fetch(`/api/panes/${name.toLowerCase()}`, { method: 'DELETE' })
        .then(() => window.dispatchEvent(new Event('paneRefresh')))
    }
  }}
  className="text-red-500 hover:text-red-300 text-xs font-bold mr-2"
>
  ✖ Delete
</button>

        )}

        <span className={`${status === 'RUNNING' ? 'text-green-400' : 'text-red-400'}`}>
          {status}
        </span>

        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation()
            open(name.toLowerCase())
          }}
          className="text-green-400 hover:text-green-200 cursor-pointer"
        >
          ⚙
        </button>
      </div>
    </div>
  )
}
