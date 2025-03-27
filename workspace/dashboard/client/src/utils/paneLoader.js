// Dynamically import all user panes at build time (Vite only)
const userPanes = import.meta.glob('/src/components/user/*.jsx', { eager: true });

export const loadUserPanes = async () => {
  const loaded = {};

  try {
    const res = await fetch('/api/panes/listUserPanes');
    const { panes } = await res.json();

    for (const file of panes) {
      const name = file.replace('Pane.jsx', '').toLowerCase();
      // Use dynamic import to code-split the module
const module = await import(`../components/user/${file}`);
      loaded[name] = module.default;
    }
  } catch (err) {
    console.error('[loadUserPanes] Failed to load user panes:', err);
  }

  return loaded;
};
