const express = require('express');
const fs = require('fs');
const path = require('path');
const { compilePane } = require('./compile-pane');

const router = express.Router();
const projectRoot = path.join(__dirname, '../..');
const componentsDir = path.join(projectRoot, 'client/src/components/user');
const servicesDir = path.join(componentsDir, 'services');
const registryFile = path.join(__dirname, 'userPaneRegistry.json');

// Helper to load registry JSON (an array of pane objects)
function loadRegistry() {
  try {
    const data = fs.readFileSync(registryFile, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

// Helper to save the registry JSON (pretty-print with 2-space indentation)
function saveRegistry(registry) {
  fs.writeFileSync(registryFile, JSON.stringify(registry, null, 2), 'utf-8');
}

// GET /api/panes - list all user panes
router.get('/', (req, res) => {
  const registry = loadRegistry();
  return res.json(registry);
});

// POST /api/panes/create - create a new user pane
router.post('/create', async (req, res) => {
  try {
    const { name, title, componentCode, serviceCode } = req.body;
    if (!name || !componentCode) {
      return res.status(400).json({ error: 'Pane name and component code are required.' });
    }
    const safeName = name.replace(/[^a-zA-Z0-9_-]/g, '');
    const registry = loadRegistry();
    if (registry.find(p => p.name === name)) {
      return res.status(409).json({ error: 'Pane name already exists.' });
    }

    // Write the React component file
    const componentPath = path.join(componentsDir, \`\${name}.jsx\`);
    await fs.promises.writeFile(componentPath, componentCode, 'utf-8');
    // Write the service file if provided
    if (serviceCode) {
      await fs.promises.writeFile(path.join(servicesDir, \`\${name}Service.js\`), serviceCode, 'utf-8');
    }

    // Compile the component into a bundle in public/user-panes
    await compilePane(name);

    // Update registry (version starts at 1)
    const newEntry = { name: name, title: title || name, version: 1 };
    registry.push(newEntry);
    saveRegistry(registry);

    // Optionally, load the service if needed (e.g. mount its router)
    if (serviceCode) {
      const serviceModulePath = path.join(servicesDir, \`\${name}Service.js\`);
      try {
        const serviceModule = require(serviceModulePath);
        if (serviceModule.router && typeof serviceModule.router === 'function') {
          req.app.use(\`/api/\${name}\`, serviceModule.router);
        } else if (typeof serviceModule.init === 'function') {
          serviceModule.init(req.app);
        }
        console.log(\`✅ Loaded service for pane "\${name}"\`);
      } catch (err) {
        console.error(\`Error loading service for \${name}:\`, err);
      }
    }

    return res.json({ success: true, pane: newEntry });
  } catch (err) {
    console.error('Error creating pane:', err);
    return res.status(500).json({ error: err.message });
  }
});

// DELETE /api/panes/:name - delete a user pane
router.delete('/:name', async (req, res) => {
  const paneName = req.params.name;
  try {
    const compPath = path.join(componentsDir, \`\${paneName}.jsx\`);
    await fs.promises.unlink(compPath).catch(() => {});
    const servPath = path.join(servicesDir, \`\${paneName}Service.js\`);
    await fs.promises.unlink(servPath).catch(() => {});
    const bundlePath = path.join(projectRoot, 'client/public/user-panes', \`\${paneName}.js\`);
    await fs.promises.unlink(bundlePath).catch(() => {});

    let registry = loadRegistry();
    registry = registry.filter(p => p.name !== paneName);
    saveRegistry(registry);

    // Optional: remove service routes if they were mounted (requires additional logic)
    console.log(\`❌ Removed pane "\${paneName}" (files and registry entry deleted)\`);
    return res.json({ success: true });
  } catch (err) {
    console.error('Error deleting pane:', err);
    return res.status(500).json({ error: err.message });
  }
});

module.exports = router;
