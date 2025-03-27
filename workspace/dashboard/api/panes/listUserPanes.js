import fs from 'fs/promises';
import path from 'path';

export default async function listUserPanes(req, res) {
  const dir = path.resolve('client/src/components/user');
  try {
    const files = await fs.readdir(dir);
    const panes = files.filter(f => f.endsWith('Pane.jsx'));
    res.json({ panes });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list panes' });
  }
}
