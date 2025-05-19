// filepath: /workspace/dashboard/client/src/components/Panes/Utility/PaneInternal.jsx
import TerminalPane from '../../Panels/panel-modules/TerminalPane.jsx';

export default function PaneInternal({ name }) {
  console.log('PaneInternal rendered with name:', name);
  
  if (name === 'terminal') {
    return <TerminalPane />
  }
  
  return (
    <div className="px-3 py-2 text-xs opacity-60 tracking-widest crt-border6">
      {/* {name && `${name.toUpperCase()} PANE CONTENT`} */}
    </div>
  )
}