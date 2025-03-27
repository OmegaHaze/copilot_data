import React, { useEffect, useState, Suspense } from 'react';

export default function UserPaneLoader() {
  const [panes, setPanes] = useState([]); // Each pane: { name, title, version, Component }

  useEffect(() => {
    async function loadPanes() {
      try {
        const res = await fetch('/api/panes');  // The registry API endpoint
        const paneList = await res.json();
        const loadedPanes = [];
        for (const pane of paneList) {
          try {
            // Dynamically import the compiled pane module from public/user-panes,
            // appending the version to bust cache if updated.
            const module = await import(
              /* @vite-ignore */ `/user-panes/${pane.name}.js?v=${pane.version}`
            );
            if (module && module.default) {
              loadedPanes.push({
                name: pane.name,
                title: pane.title,
                version: pane.version,
                Component: module.default
              });
            }
          } catch (err) {
            console.error(\`Failed to load pane "\${pane.name}":\`, err);
          }
        }
        setPanes(loadedPanes);
      } catch (err) {
        console.error('Error fetching pane registry:', err);
      }
    }
    loadPanes();
  }, []);

  return (
    <div className="user-panes-grid">
      {panes.map(pane => {
        const { name, title, Component } = pane;
        return (
          <div className="pane-item" key={name}>
            <h3>{title}</h3>
            <Suspense fallback={<div>Loading...</div>}>
              <Component />
            </Suspense>
          </div>
        );
      })}
    </div>
  );
}
