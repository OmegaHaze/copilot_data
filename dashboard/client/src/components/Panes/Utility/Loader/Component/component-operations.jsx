/**
 * component-operations.js
 * High-level operations for working with components
 */

import { isValidPaneId, parsePaneId, createPlaceholder } from './component-core';
import { loadComponent } from './component-loader';
import registry from './component-registry';
import React from 'react';

/**
 * Resolve a pane component for rendering
 * @param {string} paneId - Pane ID
 * @param {Object} moduleData - Module data
 * @returns {Promise<Object|null>} - Component configuration
 */
export async function resolvePaneComponent(paneId, moduleData = {}) {
  if (!isValidPaneId(paneId)) {
    return null;
  }

  const parsed = parsePaneId(paneId);
  if (!parsed) return null;

  try {
    const component = await loadComponent(parsed.moduleType, parsed.staticIdentifier, paneId);

    if (!component) {
      return null;
    }

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
    return null;
  }
}

/**
 * Render a component for a specific pane
 * @param {string} paneId - Pane ID
 * @param {Object} props - Additional props
 * @returns {JSX.Element} - Rendered component
 */
export function renderComponent(paneId, props = {}) {
  if (!isValidPaneId(paneId)) {
    return createPlaceholder(paneId, 'Invalid pane ID');
  }

  const parsed = parsePaneId(paneId);
  if (!parsed) {
    return createPlaceholder(paneId, 'Failed to parse pane ID');
  }

  const registrationKey = paneId;
  const raw = registry.getComponent(registrationKey);

  if (!raw) {
    // Start loading the component in the background
    loadComponent(parsed.moduleType, parsed.staticIdentifier, paneId)
      .then(() => {
        if (props.onComponentLoaded && typeof props.onComponentLoaded === 'function') {
          props.onComponentLoaded();
        }
      })
      .catch(() => {});

    return createPlaceholder(paneId, `Loading component: ${registrationKey}`);
  }

  const Component = typeof raw === 'function' ? raw : raw?.default;

  if (typeof Component !== 'function') {
    return createPlaceholder(paneId, `Invalid component format: ${registrationKey}`);
  }

  try {
    return (
      <Component
        id={paneId}
        moduleType={parsed.moduleType}
        staticIdentifier={parsed.staticIdentifier}
        name={props.name || parsed.staticIdentifier}
        {...props}
      />
    );
  } catch (error) {
    return createPlaceholder(paneId, `Error rendering component: ${error.message}`);
  }
}

/**
 * Get active components from module configuration
 * @param {Object} modules - All modules
 * @param {Array} activeModules - Active module IDs
 * @returns {Array} - Active component data
 */
export function getActiveComponents(modules, activeModules) {
  if (!modules || !Array.isArray(activeModules)) {
    return [];
  }

  const result = [];

  for (const moduleId of activeModules) {
    if (!moduleId || typeof moduleId !== 'string') continue;

    const [moduleType, staticIdentifier] = moduleId.split('-');
    if (!moduleType || !staticIdentifier) continue;

    const moduleList = modules[moduleType] || [];
    const moduleData = moduleList.find(m =>
      m.staticIdentifier === staticIdentifier ||
      m.module === staticIdentifier
    );

    if (moduleData) {
      result.push({
        ...moduleData,
        id: moduleId,
        moduleType,
        staticIdentifier
      });
    }
  }

  return result;
}
