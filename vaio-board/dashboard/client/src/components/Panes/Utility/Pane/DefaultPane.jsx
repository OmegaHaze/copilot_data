import PaneHeader from '../PaneHeader'


export default function DefaultPane({ name, status, logo, moduleType, slug }) {
  return (
    <div className="w-full h-full bg-black rounded border border-green-600 shadow-inner overflow-hidden">
      <PaneHeader name={name} status={status} logo={logo} moduleType={moduleType} />
      <div className="p-4 text-xs text-green-400">
        <p>⚠️ No pane component found for <strong>{slug}</strong></p>
        <p>This is the default placeholder pane.</p>
      </div>
    </div>
  )
}
