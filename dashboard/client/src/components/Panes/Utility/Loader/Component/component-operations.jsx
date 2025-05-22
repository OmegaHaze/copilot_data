/**
 * component-operations.jsx
 * High-level operations for working with components
 */

import React from 'react';
import { isValidPaneId, parsePaneId, createPlaceholder } from './component-core';
import { loadComponent } from './component-loader';
import registry from './component-registry';

/**
 * Resolve a component for rendering
 * @param {string} paneId - Pane ID
 * @param {Object} moduleData - Module data
 * @returns {Promise<Object|null>} Component data or null
 */
export async function resolvePaneComponent(paneId, moduleData = {}) {
  if (!isValidPaneId(paneId)) return null;

  const parsed = parsePaneId(paneId);
  if (!parsed) return null;

  try {
    const component = await loadComponent(parsed.moduleType, parsed.staticIdentifier, paneId);
    if (!component) return null;

    return {
      Component: component,
      props: {
        key: paneId,
        slug: paneId,
        moduleType: parsed.moduleType,
        staticIdentifier: parsed.staticIdentifier,
        instanceId: parsed.instanceId,
        moduleData: {
          ...moduleData,
          staticIdentifier: parsed.staticIdentifier
        }
      }
    };
  } catch (error) {
    console.error(`Failed to resolve component for ${paneId}:`, error);
    return null;
  }
}

/**
 * Render a component
 * @param {string} paneId - Pane ID
 * @param {Object} props - Component props
 * @returns {JSX.Element} Rendered component or placeholder
 */
export function renderComponent(paneId, props = {}) {
  if (!isValidPaneId(paneId)) {
    return createPlaceholder(paneId, 'Invalid pane ID');
  }

  const parsed = parsePaneId(paneId);
  if (!parsed) {
    return createPlaceholder(paneId, 'Failed to parse pane ID');
  }

  const component = registry.getComponent(paneId);

  if (!component) {
    // Start loading in background
    loadComponent(parsed.moduleType, parsed.staticIdentifier, paneId)
      .then(() => {
        if (props.onComponentLoaded) {
          props.onComponentLoaded();
        }
      })
      .catch(() => {});

    return createPlaceholder(paneId, `Loading component: ${paneId}`);
  }

  const Component = typeof component === 'function' ? component : component?.default;

  if (typeof Component !== 'function') {
    return createPlaceholder(paneId, `Invalid component format: ${paneId}`);
  }

  try {
    // Use standardized props from parsed paneId
    return (
      <Component
        id={paneId}
        moduleType={parsed.moduleType}
        staticIdentifier={parsed.staticIdentifier}
        instanceId={parsed.instanceId}
        name={props.name || parsed.staticIdentifier}
        {...props}
      />
    );
  } catch (error) {
    return createPlaceholder(paneId, `Error rendering component: ${error.message}`);
  }
}

/**
 * Get active components from module data
 * @param {Object} modules - Module data
 * @param {Array<string>} activeModules - Active module IDs
 * @returns {Array<Object>} Active components
 */
export function getActiveComponents(modules, activeModules) {
  if (!modules || !Array.isArray(activeModules)) return [];

  const result = [];

  for (const moduleId of activeModules) {
    if (!moduleId || typeof moduleId !== 'string') continue;

    const parsed = parsePaneId(moduleId);
    if (!parsed) continue;

    const moduleList = modules[parsed.moduleType] || [];
    
    // Use standardized property lookup
    const moduleData = moduleList.find(m => {
      const identifier = m.staticIdentifier || m.module;
      return identifier === parsed.staticIdentifier;
    });

    if (moduleData) {
      result.push({
        ...moduleData,
        id: moduleId,
        moduleType: parsed.moduleType,
        staticIdentifier: parsed.staticIdentifier,
        instanceId: parsed.instanceId
      });
    }
  }

  return result;
}