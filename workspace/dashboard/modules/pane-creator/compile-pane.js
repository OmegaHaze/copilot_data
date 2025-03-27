const esbuild = require('esbuild');
const path = require('path');

async function compilePane(paneName) {
  const projectRoot = path.join(__dirname, '../..');  // Adjust if needed
  const srcFile = path.join(projectRoot, 'client/src/components/user', \`\${paneName}.jsx\`);
  const outFile = path.join(projectRoot, 'client/public/user-panes', \`\${paneName}.js\`);

  await esbuild.build({
    entryPoints: [srcFile],
    outfile: outFile,
    bundle: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2017', // adjust as needed for browser support
    loader: { '.jsx': 'jsx', '.tsx': 'tsx' },
    define: { 'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development') }
  });
  console.log(\`✅ Compiled pane "\${paneName}" to \${path.relative(projectRoot, outFile)}\`);
}

module.exports = { compilePane };
