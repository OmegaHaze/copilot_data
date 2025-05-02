import React, { useState, useEffect } from 'react'

// Component for settings sections
const SettingsSection = ({ title, children }) => (
  <div className="border border-green-800/50 rounded bg-black/30 p-4 mb-4">
    <h4 className="text-green-300 font-bold mb-3 border-b border-green-800/50 pb-1">
      {title}
    </h4>
    <div className="space-y-3">
      {children}
    </div>
  </div>
)

export default function SupervisorSettings() {
  const [serviceStatus, setServiceStatus] = useState([])
  const [loading, setLoading] = useState(true)
  const [output, setOutput] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState(null)

  const fetchServiceStatus = async () => {
    console.log('Fetching supervisor status...')
    setRefreshing(true)
    setError(null)

    try {
      const res = await fetch('/run-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cmd: 'supervisorctl -c /etc/supervisor/supervisord.conf status'
        })
      })

      console.log('API response status:', res.status)

      if (!res.ok) {
        throw new Error(`Server responded with status: ${res.status}`)
      }

      const text = await res.text()
      console.log('Response received:', text.substring(0, 100) + '...')

      const lines = text.trim().split('\n')

      const parsedServices = lines.map(line => {
        const parts = line.split(/\s+/)
        const name = parts[0]
        let status = 'UNKNOWN'
        let info = ''

        if (line.includes('RUNNING')) status = 'RUNNING'
        else if (line.includes('STARTING')) status = 'STARTING'
        else if (line.includes('STOPPED')) status = 'STOPPED'
        else if (line.includes('FATAL')) status = 'ERROR'
        else if (line.includes('ERROR')) status = 'ERROR'

        // Extract info like PID and uptime
        if (parts.length > 2) {
          info = parts.slice(2).join(' ')
        }

        return { name, status, info }
      })

      console.log('Parsed services:', parsedServices.length)
      setServiceStatus(parsedServices)
      setOutput(text)
      setLoading(false)
    } catch (err) {
      console.error('Error fetching service status:', err)
      setError(err.message)
      setOutput(`Failed to fetch service status: ${err.message}`)
      setLoading(false)
    }
    setRefreshing(false)
  }

  useEffect(() => {
    fetchServiceStatus()

    // Poll every 10 seconds
    const interval = setInterval(fetchServiceStatus, 10000)
    return () => clearInterval(interval)
  }, [])

  const handleServiceAction = async (action, service) => {
    if (action === 'restart' && !confirm(`Are you sure you want to restart ${service}?`)) {
      return
    }

    try {
      setOutput(`Executing: supervisorctl ${action} ${service}...`)

      const res = await fetch('/run-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cmd: `supervisorctl -c /etc/supervisor/supervisord.conf ${action} ${service}`
        })
      })

      if (!res.ok) {
        throw new Error(`Server responded with status: ${res.status}`)
      }

      const text = await res.text()
      setOutput(text)

      // Refresh status after a delay
      setTimeout(fetchServiceStatus, 1500)
    } catch (err) {
      console.error(`Error ${action} service:`, err)
      setOutput(`Failed to ${action} service: ${err.message}`)
    }
  }

  const handleUpdateConfig = async () => {
    try {
      setOutput('Reading and updating supervisor configuration...')

      const res = await fetch('/run-command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cmd: 'supervisorctl -c /etc/supervisor/supervisord.conf reread && supervisorctl -c /etc/supervisor/supervisord.conf update'
        })
      })

      if (!res.ok) {
        throw new Error(`Server responded with status: ${res.status}`)
      }

      const text = await res.text()
      setOutput(text)

      // Refresh status after a delay
      setTimeout(fetchServiceStatus, 1500)
    } catch (err) {
      console.error('Error updating supervisor config:', err)
      setOutput(`Failed to update configuration: ${err.message}`)
    }
  }

  // Get status color class based on service status
  const getStatusColor = (status) => {
    switch (status) {
      case 'RUNNING':
        return 'text-green-400'
      case 'STARTING':
        return 'text-yellow-400'
      case 'STOPPED':
        return 'text-gray-400'
      case 'ERROR':
        return 'text-red-400'
      default:
        return 'text-gray-300'
    }
  }

  if (loading && serviceStatus.length === 0) {
    return (
      <div className="h-full p-2 flex flex-col items-center justify-center">
        <div className="text-green-400 animate-pulse">
          Loading service status...
        </div>
        {error && (
          <div className="mt-4 text-red-400 text-sm">
            Error: {error}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full p-2 overflow-y-auto">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-green-200 text-lg font-medium">Supervisor Controls</h3>
        <button
          className="bg-green-800/70 hover:bg-green-700 text-white py-1.5 px-3 rounded text-xs font-medium flex items-center"
          onClick={fetchServiceStatus}
          disabled={refreshing}
        >
          {refreshing ? (
            <>
              <span className="mr-1 animate-spin">⟳</span> Refreshing...
            </>
          ) : (
            <>
              <span className="mr-1">⟳</span> Refresh Status
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800/50 text-red-400 p-3 mb-4 rounded text-sm">
          API Error: {error}
        </div>
      )}

      {/* Service Actions */}
      <SettingsSection title="Configuration Management">
        <div className="flex items-center gap-4">
          <button
            onClick={handleUpdateConfig}
            className="bg-green-700 hover:bg-green-600 text-white py-2 px-4 rounded text-sm font-medium"
          >
            Reread & Update Config
          </button>

          <button
            onClick={() => handleServiceAction('restart', 'all')}
            className="bg-red-700/70 hover:bg-red-600 text-white py-2 px-4 rounded text-sm font-medium"
          >
            Restart All Services
          </button>
        </div>
        <p className="text-green-400 text-xs mt-2">
          "Reread & Update Config" refreshes service configurations without restarting running services.
        </p>
      </SettingsSection>

      {/* Service Status Table */}
      <SettingsSection title="Service Status">
        <div className="border border-green-800/50 rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-green-900/30 text-green-200">
                <th className="py-2 px-3 text-left">Service</th>
                <th className="py-2 px-3 text-left">Status</th>
                <th className="py-2 px-3 text-left">Info</th>
                <th className="py-2 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-800/30">
              {serviceStatus.map((service, idx) => (
                <tr
                  key={idx}
                  className={idx % 2 === 0 ? 'bg-black/40' : 'bg-black/20'}
                >
                  <td className="py-2 px-3 font-mono text-green-100">
                    {service.name}
                  </td>
                  <td className="py-2 px-3">
                    <span className={`font-medium ${getStatusColor(service.status)}`}>
                      {service.status}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-gray-300 text-xs">
                    {service.info}
                  </td>
                  <td className="py-2 px-3 text-right space-x-1">
                    {/* Action buttons */}
                    {service.status === 'RUNNING' && (
                      <>
                        <button
                          onClick={() => handleServiceAction('stop', service.name)}
                          className="text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/40 px-2 py-1 rounded text-xs"
                        >
                          Stop
                        </button>
                        <button
                          onClick={() => handleServiceAction('restart', service.name)}
                          className="text-yellow-400 hover:text-yellow-300 bg-yellow-900/20 hover:bg-yellow-900/40 px-2 py-1 rounded text-xs"
                        >
                          Restart
                        </button>
                      </>
                    )}
                    {service.status !== 'RUNNING' && (
                      <button
                        onClick={() => handleServiceAction('start', service.name)}
                        className="text-green-400 hover:text-green-300 bg-green-900/20 hover:bg-green-900/40 px-2 py-1 rounded text-xs"
                      >
                        Start
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {serviceStatus.length === 0 && (
                <tr>
                  <td colSpan="4" className="py-4 text-center text-gray-400">
                    No services found or error connecting to supervisor
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </SettingsSection>

      {/* Command Output */}
      <SettingsSection title="Command Output">
        <div className="bg-black/50 border border-green-800/30 rounded p-2 font-mono text-xs text-green-300 h-32 overflow-y-auto whitespace-pre-wrap">
          {output || 'No output available'}
        </div>
      </SettingsSection>
    </div>
  )
}