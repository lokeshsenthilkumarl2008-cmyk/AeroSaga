import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowLeft,
  Battery,
  BrainCircuit,
  CheckCircle,
  CircleAlert,
  MapPin,
  Plane,
  RefreshCw,
  ShieldAlert,
  Workflow,
} from 'lucide-react'

import {
  executeMission,
  getSentinelOverview,
  requestMissionEmergency,
} from '../../services/backendClient'
import './SentinelDashboard.css'

const CITIES = [
  'Bangalore',
  'Chennai',
  'Delhi',
  'Mumbai',
  'Kolkata',
  'Hyderabad',
  'Ahmedabad',
]

const riskClass = {
  LOW: 'sentinel-low',
  MEDIUM: 'sentinel-medium',
  HIGH: 'sentinel-high',
  UNKNOWN: 'sentinel-unknown',
}

function Metric({ icon: Icon, label, value, detail }) {
  return (
    <article className="sentinel-metric">
      <div className="sentinel-metric-icon">
        <Icon size={21} />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  )
}

function formatTime(value) {
  if (!value) return 'Time unavailable'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? 'Time unavailable' : date.toLocaleString()
}

function droneStatus(status) {
  switch (status?.toUpperCase()) {
    case 'IN_FLIGHT':
    case 'IN_PROGRESS':
    case 'RUNNING':
      return 'active'
    case 'OFFLINE':
      return 'offline'
    default:
      return 'idle'
  }
}

function telemetryRisk(battery) {
  if (battery == null) return 'UNKNOWN'
  if (battery <= 10) return 'HIGH'
  if (battery <= 20) return 'MEDIUM'
  return 'LOW'
}

function eventRisk(severity) {
  switch (severity?.toUpperCase()) {
    case 'CRITICAL':
    case 'HIGH':
      return 'HIGH'
    case 'WARNING':
    case 'MEDIUM':
      return 'MEDIUM'
    default:
      return 'LOW'
  }
}

export default function SentinelDashboard({ onBack }) {
  const [data, setData] = useState({
    status: 'loading',
    drones: [],
    telemetry: [],
    safetyEvents: [],
    missions: [],
    workflowSignals: [],
    error: '',
  })
  const [selectedCity, setSelectedCity] = useState(null)
  const [actionInProgress, setActionInProgress] = useState(null)
  const [actionError, setActionError] = useState('')

  const refreshBackend = useCallback(async () => {
    try {
      const overview = await getSentinelOverview()
      setData({ status: 'online', ...overview, error: '' })
    } catch (error) {
      setData((current) => ({
        ...current,
        status: 'offline',
        error: error instanceof Error ? error.message : 'Unable to reach the backend API',
      }))
    }
  }, [])

  useEffect(() => {
    const initialRefresh = setTimeout(() => void refreshBackend(), 0)
    const timer = setInterval(() => void refreshBackend(), 5000)
    return () => {
      clearTimeout(initialRefresh)
      clearInterval(timer)
    }
  }, [refreshBackend])

  const telemetryByDrone = useMemo(() => {
    const latest = new Map()
    for (const reading of data.telemetry) {
      const existing = latest.get(String(reading.droneId))
      if (
        !existing ||
        Date.parse(reading.recordedAt) > Date.parse(existing.recordedAt)
      ) {
        latest.set(String(reading.droneId), reading)
      }
    }
    return latest
  }, [data.telemetry])

  const drones = useMemo(
    () => data.drones.map((drone) => {
      const telemetry = telemetryByDrone.get(String(drone.id))
      return {
        ...drone,
        telemetry,
        battery: telemetry?.batteryLevel,
        statusLabel: droneStatus(drone.status),
        risk: telemetryRisk(telemetry?.batteryLevel),
      }
    }),
    [data.drones, telemetryByDrone],
  )

  const fleetStats = useMemo(() => ({
    total: drones.length,
    active: drones.filter((drone) => drone.statusLabel === 'active').length,
    idle: drones.filter((drone) => drone.statusLabel === 'idle').length,
    offline: drones.filter((drone) => drone.statusLabel === 'offline').length,
  }), [drones])

  const safetyEvents = useMemo(() => [...data.safetyEvents].sort(
    (first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt),
  ), [data.safetyEvents])

  const eventsByDrone = useMemo(() => {
    const counts = new Map()
    for (const event of safetyEvents) {
      const key = String(event.droneId)
      counts.set(key, (counts.get(key) || 0) + 1)
    }
    return counts
  }, [safetyEvents])

  const cityStats = useMemo(() => CITIES.map((city) => {
    const cityDrones = drones.filter(
      (drone) => drone.location?.trim().toLowerCase() === city.toLowerCase(),
    )
    return {
      name: city,
      total: cityDrones.length,
      active: cityDrones.filter((drone) => drone.statusLabel === 'active').length,
      idle: cityDrones.filter((drone) => drone.statusLabel === 'idle').length,
      offline: cityDrones.filter((drone) => drone.statusLabel === 'offline').length,
      alerts: cityDrones.reduce(
        (total, drone) => total + (eventsByDrone.get(String(drone.id)) || 0),
        0,
      ),
    }
  }), [drones, eventsByDrone])

  const selectedDrones = useMemo(
    () => drones.filter((drone) => drone.location === selectedCity),
    [drones, selectedCity],
  )

  const missions = useMemo(
    () => [...data.missions].sort((first, second) => Number(second.id) - Number(first.id)),
    [data.missions],
  )

  const latestSignalByMission = useMemo(() => {
    const signals = [...data.workflowSignals].sort(
      (first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt),
    )
    const latest = new Map()
    for (const signal of signals) {
      const key = String(signal.missionId)
      if (!latest.has(key)) latest.set(key, signal)
    }
    return latest
  }, [data.workflowSignals])

  const runMissionAction = async (missionId, action) => {
    setActionInProgress(String(missionId))
    setActionError('')
    try {
      await action()
      await refreshBackend()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The mission action failed')
    } finally {
      setActionInProgress(null)
    }
  }

  const highRiskEvents = safetyEvents.filter(
    (event) => eventRisk(event.severity) === 'HIGH',
  ).length

  return (
    <main className="sentinel-page">
      <header className="sentinel-header">
        <div>
          <button className="sentinel-back" onClick={onBack}>
            <ArrowLeft size={16} />
            AeroSaga dashboard
          </button>

          <div className="sentinel-brand">
            <ShieldAlert size={27} />
            <div>
              <h1>AeroSaga Sentinel</h1>
              <p>Backend-connected drone safety monitoring and response</p>
            </div>
          </div>
        </div>

        <div className="sentinel-header-actions">
          <span className={`sentinel-connection ${data.status}`}>
            {data.status === 'online'
              ? 'BACKEND CONNECTED'
              : data.status === 'loading' ? 'CONNECTING' : 'BACKEND OFFLINE'}
          </span>
          <button
            className="sentinel-refresh"
            onClick={() => void refreshBackend()}
            disabled={data.status === 'loading'}
          >
            <RefreshCw size={15} />
            Refresh
          </button>
        </div>
      </header>

      {data.status === 'offline' && (
        <section className="sentinel-api-error" role="alert">
          <strong>Sentinel backend unavailable</strong>
          <p>{data.error}</p>
          <button onClick={() => void refreshBackend()}>Retry connection</button>
        </section>
      )}
      {actionError && (
        <section className="sentinel-api-error" role="alert">{actionError}</section>
      )}

      <section className="sentinel-metrics">
        <Metric icon={Plane} label="Registered drones" value={fleetStats.total} detail="From backend drone records" />
        <Metric icon={Activity} label="Active / Flying" value={fleetStats.active} detail="Current backend status" />
        <Metric icon={CheckCircle} label="Idle / Available" value={fleetStats.idle} detail="Current backend status" />
        <Metric icon={CircleAlert} label="Offline drones" value={fleetStats.offline} detail="Current backend status" />
        <Metric icon={ShieldAlert} label="Safety events" value={safetyEvents.length} detail={`${highRiskEvents} critical / high severity`} />
      </section>

      <section className="sentinel-section">
        <div className="sentinel-section-heading">
          <div>
            <h2><MapPin size={20} />City-wise fleet monitoring</h2>
            <p>Fleet status and persisted safety-event counts by assigned drone location.</p>
          </div>
          <span className="sentinel-demo-label">LIVE BACKEND DATA</span>
        </div>

        <div className="sentinel-city-grid">
          {cityStats.map((city) => (
            <button
              key={city.name}
              className={`sentinel-city-card ${selectedCity === city.name ? 'selected' : ''}`}
              onClick={() => setSelectedCity(selectedCity === city.name ? null : city.name)}
            >
              <h3>{city.name}</h3>
              <strong>{city.total}</strong>
              <span>Registered drones</span>
              <div className="sentinel-city-details">
                <span>Active: {city.active}</span>
                <span>Idle: {city.idle}</span>
              </div>
              <div className="sentinel-city-details">
                <span>Offline: {city.offline}</span>
                <span>Safety events: {city.alerts}</span>
              </div>
            </button>
          ))}
        </div>

        {selectedCity && (
          <div className="sentinel-city-drone-list">
            <div className="sentinel-section-heading">
              <div>
                <h2>{selectedCity} — Drone fleet</h2>
                <p>{selectedDrones.length} backend drone records assigned to this city.</p>
              </div>
              <button className="sentinel-refresh" onClick={() => setSelectedCity(null)}>Close</button>
            </div>

            <div className="sentinel-table-wrap">
              <table className="sentinel-table">
                <thead>
                  <tr>
                    <th>Drone</th>
                    <th>Battery</th>
                    <th>Status</th>
                    <th>Risk</th>
                    <th>Position / altitude</th>
                    <th>Telemetry source / time</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDrones.map((drone) => (
                    <tr key={drone.id}>
                      <td><strong>{drone.name}</strong> · #{drone.id}</td>
                      <td>{drone.battery == null ? '—' : `${drone.battery}%`}</td>
                      <td>{drone.statusLabel.toUpperCase()}</td>
                      <td><span className={`sentinel-risk ${riskClass[drone.risk]}`}>{drone.risk}</span></td>
                      <td>
                        {drone.telemetry &&
                        drone.telemetry.latitude != null &&
                        drone.telemetry.longitude != null
                          ? `${Number(drone.telemetry.latitude).toFixed(4)}, ${Number(drone.telemetry.longitude).toFixed(4)}`
                          : '—'}
                        {drone.telemetry?.altitude != null
                          ? ` · ${drone.telemetry.altitude} m`
                          : ''}
                      </td>
                      <td>
                        {drone.telemetry
                          ? `${drone.telemetry.source || 'TELEMETRY'} · ${formatTime(drone.telemetry.recordedAt)}`
                          : 'No readings'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="sentinel-section">
        <div className="sentinel-section-heading">
          <div>
            <h2><Battery size={19} />Safety events</h2>
            <p>Persisted events recorded by the backend safety rule engine.</p>
          </div>
          <span className="sentinel-demo-label">{safetyEvents.length} EVENTS</span>
        </div>

        {safetyEvents.length ? safetyEvents.slice(0, 20).map((event) => {
          const drone = drones.find((item) => String(item.id) === String(event.droneId))
          const risk = eventRisk(event.severity)
          return (
            <article className="sentinel-alert" key={event.id}>
              <CircleAlert size={20} />
              <div>
                <strong>
                  {event.eventType || 'Safety event'} · {drone?.name || `Drone #${event.droneId}`}
                </strong>
                <p>
                  {event.message} · {drone?.location || 'Location unavailable'}
                  {event.missionId ? ` · Mission #${event.missionId}` : ''}
                  {' · '}{formatTime(event.createdAt)}
                </p>
              </div>
              <span className={`sentinel-risk ${riskClass[risk]}`}>{event.severity || 'INFO'}</span>
            </article>
          )
        }) : (
          <p className="sentinel-empty">
            {data.status === 'loading'
              ? 'Loading safety events…'
              : data.status === 'offline'
                ? 'Safety events are unavailable while the backend is offline.'
                : 'No persisted safety events have been recorded.'}
          </p>
        )}
      </section>

      <section className="sentinel-section">
        <div className="sentinel-section-heading">
          <div>
            <h2><Workflow size={19} />Mission activity</h2>
            <p>Backend mission and workflow state, refreshed every five seconds.</p>
          </div>
          <span className="sentinel-demo-label">{missions.length} MISSIONS</span>
        </div>

        {missions.length ? (
          <div className="sentinel-table-wrap">
            <table className="sentinel-table">
              <thead>
                <tr><th>Mission</th><th>Drone</th><th>Destination</th><th>Status</th><th>Latest workflow update</th><th>Action</th></tr>
              </thead>
              <tbody>
                {missions.map((mission) => {
                  const signal = latestSignalByMission.get(String(mission.id))
                  const busy = actionInProgress === String(mission.id)
                  return (
                    <tr key={mission.id}>
                      <td><strong>{mission.missionName || `Mission #${mission.id}`}</strong></td>
                      <td>{mission.drone?.name || 'Unassigned'}</td>
                      <td>{mission.destination}</td>
                      <td>{mission.status}</td>
                      <td>
                        {signal
                          ? `${signal.signalType} · ${signal.signalStatus}: ${signal.message}`
                          : 'No workflow updates'}
                      </td>
                      <td>
                        {mission.status?.toUpperCase() === 'PENDING' && (
                          <button
                            className="sentinel-action"
                            disabled={Boolean(actionInProgress) || data.status !== 'online'}
                            onClick={() => void runMissionAction(
                              mission.id,
                              () => executeMission(mission.id),
                            )}
                          >
                            {busy ? 'Starting…' : 'Start'}
                          </button>
                        )}
                        {mission.status?.toUpperCase() === 'RUNNING' && (
                          <button
                            className="sentinel-action emergency"
                            disabled={Boolean(actionInProgress) || data.status !== 'online'}
                            onClick={() => void runMissionAction(
                              mission.id,
                              () => requestMissionEmergency(
                                mission.id,
                                'Emergency return requested from Sentinel dashboard',
                              ),
                            )}
                          >
                            {busy ? 'Requesting…' : 'Emergency return'}
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="sentinel-empty">
            {data.status === 'loading'
              ? 'Loading missions…'
              : data.status === 'offline'
                ? 'Mission records are unavailable while the backend is offline.'
                : 'No missions have been created.'}
          </p>
        )}
      </section>

      <section className="sentinel-section">
        <div className="sentinel-section-heading">
          <div>
            <h2><BrainCircuit size={19} />Latest workflow signals</h2>
            <p>Recent persisted mission activity from the backend.</p>
          </div>
          <span className="sentinel-demo-label">{data.workflowSignals.length} SIGNALS</span>
        </div>
        {data.workflowSignals.length ? (
          [...data.workflowSignals]
            .sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt))
            .slice(0, 10)
            .map((signal) => (
              <article className="sentinel-alert sentinel-signal" key={signal.id}>
                <Activity size={18} />
                <div>
                  <strong>
                    {signal.signalType} · {signal.signalStatus}
                    {signal.missionId ? ` · Mission #${signal.missionId}` : ''}
                  </strong>
                  <p>{signal.message} · {formatTime(signal.createdAt)}</p>
                </div>
              </article>
            ))
        ) : (
          <p className="sentinel-empty">No workflow signals have been recorded.</p>
        )}
      </section>
    </main>
  )
}
