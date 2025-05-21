/**
 * dependency-check.js
 * 
 * This utility helps identify potential circular dependencies in the
 * Module/Component system. It can be run in the browser console to
 * check for import cycles that might cause issues.
 * 
 * HOW TO USE:
 * 1. Open the browser console
 * 2. Copy and paste this entire file
 * 3. Call checkDependencies() to run the analysis
 * 4. Review the results to identify circular dependencies
 */

// Files to check for circular dependencies
const filesToCheck = [
  '../Component/component-constants.js',
  '../Component/component-core.jsx',
  '../Component/component-registry.js',
  '../Component/component-loader.js',
  '../Module/module-constants.js',
  '../Module/module-core.js',
  '../Module/module-operations.js',
  '../Module/module-shared.js',
  '../Module/module-storage.js',
  '../Module/module-index.js',
  './shared-utilities.js'
];

// Mock import analyzer that looks for import statements
function analyzeImports(code) {
  const imports = [];
  
  // Match import statements
  const importRegex = /import\s+(?:{[\s\w,]+}|\w+|\*\s+as\s+\w+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(code)) !== null) {
    imports.push(match[1]);
  }
  
  // Match dynamic imports
  const dynamicImportRegex = /import\(['"]([^'"]+)['"]\)/g;
  while ((match = dynamicImportRegex.exec(code)) !== null) {
    imports.push(match[1]);
  }
  
  // Match require statements
  const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
  while ((match = requireRegex.exec(code)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

// Check for circular dependencies
async function checkDependencies() {
  const dependencyMap = {};
  const circularDependencies = [];
  
  console.log('Checking for circular dependencies...');
  
  // First, fetch all files and build dependency map
  for (const file of filesToCheck) {
    try {
      const response = await fetch(file);
      const code = await response.text();
      dependencyMap[file] = analyzeImports(code);
      console.log(`Analyzed ${file}: ${dependencyMap[file].length} imports`);
    } catch (error) {
      console.error(`Failed to analyze ${file}:`, error);
      dependencyMap[file] = [];
    }
  }
  
  // Now check for circular dependencies
  for (const file of filesToCheck) {
    const visited = new Set();
    const path = [file];
    
    function dfs(currentFile) {
      if (visited.has(currentFile)) {
        // If we've already visited this file in this path, we have a cycle
        const cycleStart = path.indexOf(currentFile);
        if (cycleStart !== -1) {
          const cycle = path.slice(cycleStart).concat(currentFile);
          circularDependencies.push(cycle);
          return true;
        }
        return false;
      }
      
      visited.add(currentFile);
      path.push(currentFile);
      
      // Check all dependencies
      const deps = dependencyMap[currentFile] || [];
      for (const dep of deps) {
        // Only check dependencies that are in our list
        const resolvedDep = resolvePath(currentFile, dep);
        if (dependencyMap[resolvedDep] && dfs(resolvedDep)) {
          return true;
        }
      }
      
      path.pop();
      return false;
    }
    
    dfs(file);
  }
  
  // Report findings
  if (circularDependencies.length === 0) {
    console.log('✅ No circular dependencies found!');
  } else {
    console.log(`⚠️ Found ${circularDependencies.length} circular dependencies:`);
    circularDependencies.forEach((cycle, i) => {
      console.log(`Cycle ${i + 1}: ${cycle.join(' → ')} → ${cycle[0]}`);
    });
  }
  
  return {
    dependencyMap,
    circularDependencies
  };
}

// Helper function to resolve relative paths
function resolvePath(base, relative) {
  // Handle non-relative imports
  if (!relative.startsWith('./') && !relative.startsWith('../')) {
    return relative;
  }
  
  const parts = base.split('/');
  parts.pop(); // Remove filename
  
  const relativeParts = relative.split('/');
  
  for (const part of relativeParts) {
    if (part === '.') continue;
    if (part === '..') {
      parts.pop();
    } else {
      parts.push(part);
    }
  }
  
  return parts.join('/');
}

// Export for use in browser or Node.js
if (typeof module !== 'undefined') {
  module.exports = { checkDependencies };
} else {
  console.log('Dependency checker loaded. Call checkDependencies() to run the analysis.');
}
