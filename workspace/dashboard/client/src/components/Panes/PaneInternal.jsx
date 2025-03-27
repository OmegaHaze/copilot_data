import TerminalPane from './TerminalPane'

export default function PaneInternal({ name }) {
  if (name === 'terminal') {
    return <TerminalPane />
  }

  return (
    <div className="px-3 py-2 text-xs opacity-60 tracking-widest">
    </div>
  )
}