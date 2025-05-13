import React from 'react'
import NvidiaSettings from './NvidiaSettings'
import GeneralSettings from './GeneralSettings'
import SupervisorSettings from './SupervisorSettings'
import ComfyUISettings from './ComfyUISettings'
import OpenWebUISettings from './OpenWebUISettings'
import OllamaSettings from './OllamaSettings'
import QdrantSettings from './QdrantSettings'
import QdrantDashboardSettings from './QdrantDashboardSettings'
import PostgresSettings from './PostgresSettings'
import N8nSettings from './N8nSettings'

/**
 * DefaultPanesSettingsMenu - Main controller for all settings panels
 * Maps active tab IDs to their specific settings components
 */
export default function DefaultPanesSettingsMenu({ activeTab }) {
  // Map tabs to their respective components
  const renderSettingsComponent = () => {
    switch (activeTab) {
      case 'GENERAL':
        return <GeneralSettings />
      case 'SUPERVISOR':
        return <SupervisorSettings />
      case 'NVIDIA':
        return <NvidiaSettings />
      case 'COMFYUI':
        return <ComfyUISettings />
      case 'OPENWEBUI':
        return <OpenWebUISettings />
      case 'OLLAMA':
        return <OllamaSettings />
      case 'QDRANT':
        return <QdrantSettings />
      case 'QDRANT_DASHBOARD':
        return <QdrantDashboardSettings />
      case 'POSTGRES':
        return <PostgresSettings />
      case 'N8N':
        return <N8nSettings />
      default:
        // For tabs without a dedicated component yet
        return (
          <div className="flex p-4 items-center  justify-center h-full">
            <div className="text-center p-4">
              <h3 className="text-green-300 m-3">
                {activeTab} Settings
              </h3>
              <p className="text-green-400 text-xs opacity-70">
                Settings for this service are under development.
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="h-full">
      {renderSettingsComponent()}
    </div>
  )
}