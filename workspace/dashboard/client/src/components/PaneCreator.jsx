import { useState, useEffect } from 'react'

const RESERVED_WORDS = new Set([
  'break','case','catch','class','const','continue','debugger','default','delete','do','else','export','extends','finally','for','function','if','import','in','instanceof','let','new','return','super','switch','this','throw','try','typeof','var','void','while','with','yield'
])

export default function PaneCreator({ onClose }) {
  const [paneName, setPaneName] = useState('')
  const [paneTitle, setPaneTitle] = useState('')
  const [iconFile, setIconFile] = useState(null)
  const [supervisor, setSupervisor] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [existing, setExisting] = useState([])

  useEffect(() => {
    fetch('http://localhost:1488/api/panes/registry')
      .then(res => res.json())
      .then(json => setExisting(Object.keys(json)))
  }, [])

  const validateName = (name) => {
    const regex = /^[a-zA-Z][a-zA-Z0-9_-]+$/
    if (!regex.test(name)) return 'Invalid name format.'
    if (RESERVED_WORDS.has(name.toLowerCase())) return 'Reserved JS keyword.'
    if (existing.includes(name.toLowerCase())) return 'Pane already exists.'
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validation = validateName(paneName)
    if (validation) return setError(validation)

    const form = new FormData()
    form.append('paneName', paneName)
    form.append('paneTitle', paneTitle)
    form.append('supervisor', supervisor)
    if (iconFile) form.append('icon', iconFile)

    try {
      const res = await fetch('/api/panes/create', { method: 'POST', body: form })
      const text = await res.text()
      console.warn('[Raw Server Response]', text)

      let data
      try {
        data = JSON.parse(text)
      } catch {
        throw new Error('Server returned invalid response.')
      }

if (!res.ok || !data.success) throw new Error(data.error || 'Unknown error')
setSuccess(true)
window.dispatchEvent(new Event('paneRefresh')) // ← this is the key
setTimeout(() => onClose(true), 1000)

    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-black text-green-400 border border-green-700 p-6 rounded shadow-lg z-50 w-[400px]">
      <h2 className="text-lg font-bold mb-3">[+] CREATE PANE</h2>
      <form onSubmit={handleSubmit} className="space-y-2 text-xs">
        <input
          className="bg-black border border-green-600 w-full px-2 py-1"
          placeholder="Pane ID (e.g. docker)"
          value={paneName}
          onChange={e => {
            setPaneName(e.target.value)
            setError('')
          }}
        />
        <input
          className="bg-black border border-green-600 w-full px-2 py-1"
          placeholder="Display Title (optional)"
          value={paneTitle}
          onChange={e => setPaneTitle(e.target.value)}
        />
        <input
          type="file"
          accept="image/*"
          className="w-full text-green-300"
          onChange={e => setIconFile(e.target.files[0])}
        />
        <label className="flex items-center space-x-2">
          <input type="checkbox" checked={supervisor} onChange={() => setSupervisor(!supervisor)} />
          <span>Generate Supervisor conf.d</span>
        </label>

        {error && <div className="text-red-500 text-xs mt-2">{error}</div>}
        {success && <div className="text-green-300 text-xs mt-2">✓ Pane created. Reloading...</div>}

        <div className="flex justify-between mt-3">
          <button type="button" onClick={() => onClose(false)}>[CANCEL]</button>
          <button type="submit">[CREATE]</button>
        </div>
      </form>
    </div>
  )
}
