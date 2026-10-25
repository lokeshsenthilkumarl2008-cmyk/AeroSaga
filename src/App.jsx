import { useCallback, useEffect, useMemo, useState } from 'react'
import { House, Target, Plane, Globe, ChartColumn, Settings } from 'lucide-react'
import GlobeView from './components/GlobeView'
import MissionDag from './components/MissionDag'
import { CITIES, DRONES } from './data/drones'
import {
  createDrone,
  createMission,
  deleteMission,
  executeMission,
  getBackendOverview,
} from './services/backendClient'
import './App.css'

const NAV = [
  ['Dashboard', House, 'fleet-overview'],
  ['Missions', Target, 'mission-list'],
  ['Drones', Plane, 'drone-roster'],
  // ['Map View', Globe, 'map-view'],
  ['Analytics', ChartColumn, 'backend-overview'],
  // ['Settings', Settings, 'backend-overview'],
]

const coord = (lat, lon) =>
  `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}, ${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? 'E' : 'W'}`

const ORBIT_UPDATE_MS = 1000

const displayStatus = (status) => {
  switch (status?.toUpperCase()) {
    case 'AVAILABLE': return 'idle'
    case 'IN_FLIGHT':
    case 'IN_PROGRESS':
    case 'RUNNING': return 'active'
    case 'OFFLINE': return 'offline'
    default: return 'idle'
  }
}

function latestTelemetry(telemetry, droneId) {
  return telemetry
    .filter((item) => String(item.droneId) === String(droneId))
    .sort((a, b) => Date.parse(b.recordedAt) - Date.parse(a.recordedAt))[0]
}

export default function App() {
  const [nav, setNav] = useState('Dashboard')
  const [selectedId, setSelectedId] = useState(null)
  const [orbitTime, setOrbitTime] = useState(0)
  const [backend, setBackend] = useState({
    status: 'loading',
    drones: [],
    missions: [],
    telemetry: [],
    workflowSignals: [],
  })
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState('')
  const [droneForm, setDroneForm] = useState({
    name: '',
    model: '',
    location: '',
    status: 'AVAILABLE',
  })
  const [missionForm, setMissionForm] = useState({
    droneId: '',
    missionName: '',
    destination: '',
  })

  const refreshBackend = useCallback(async () => {
    try {
      const overview = await getBackendOverview()
      setBackend({ status: 'online', ...overview })
      setSelectedId((current) =>
        overview.drones.some((drone) => String(drone.id) === current)
          ? current
          : overview.drones.length
            ? String(overview.drones[0].id)
            : null,
      )
      setMissionForm((current) => {
        const availableDrones = overview.drones.filter(
          (drone) => drone.status?.toUpperCase() === 'AVAILABLE',
        )
        const selectedIsAvailable = availableDrones.some(
          (drone) => String(drone.id) === current.droneId,
        )
        return {
          ...current,
          droneId: selectedIsAvailable
            ? current.droneId
            : String(availableDrones[0]?.id || ''),
        }
      })
    } catch (error) {
      setBackend((current) => ({
        ...current,
        status: 'offline',
        error: error instanceof Error ? error.message : 'Unable to reach the backend API',
      }))
    }
  }, [])

  useEffect(() => {
    const startedAt = performance.now()
    const timer = setInterval(
      () => setOrbitTime((performance.now() - startedAt) / 1000),
      ORBIT_UPDATE_MS,
    )
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const initialRefresh = setTimeout(refreshBackend, 0)
    const timer = setInterval(refreshBackend, 4000)
    return () => {
      clearTimeout(initialRefresh)
      clearInterval(timer)
    }
  }, [refreshBackend])

  const drones = useMemo(() => {
    const cityRanks = new Map()
    return backend.drones.map((drone) => {
      const numericId = Number(drone.id)
      const sample = DRONES[(numericId - 1 + DRONES.length) % DRONES.length]
      const location = CITIES.find(
        (city) => city.name.toLowerCase() === drone.location?.trim().toLowerCase(),
      )
      const telemetry = latestTelemetry(backend.telemetry, drone.id)
      const isInFlight = ['IN_FLIGHT', 'IN_PROGRESS', 'RUNNING'].includes(
        drone.status?.toUpperCase(),
      )
      const rank = location ? cityRanks.get(location.name) ?? 0 : 0
      if (location) cityRanks.set(location.name, rank + 1)

      const ring = Math.floor(rank / 10)
      const positionInRing = rank % 10
      const radius = 0.18 + ring * 0.16
      const phase = positionInRing * (2 * Math.PI / 10) + (ring % 2) * Math.PI / 10
      const direction = ring % 2 === 0 ? 1 : -1
      const period = 35 + ring * 8
      const angle = phase + direction * (2 * Math.PI / period) * orbitTime
      const orbitLatitude = location
        ? location.lat + radius * Math.sin(angle)
        : sample.lat
      const orbitLongitude = location
        ? location.lon + (radius * Math.cos(angle)) /
          Math.cos((location.lat * Math.PI) / 180)
        : sample.lon
      const isOffline = drone.status?.toUpperCase() === 'OFFLINE'
      const useTelemetryPosition = telemetry && (
        telemetry.source === 'DEVICE' || isInFlight
      )
      const mission = backend.missions.find(
        (item) => String(item.drone?.id) === String(drone.id) &&
          ['PENDING', 'RUNNING', 'IN_PROGRESS'].includes(item.status?.toUpperCase()),
      )

      return {
        ...sample,
        id: String(drone.id),
        backendId: drone.id,
        name: drone.name,
        model: drone.model,
        location: drone.location,
        status: displayStatus(drone.status),
        lat: isOffline
          ? location?.lat ?? sample.lat
          : useTelemetryPosition ? telemetry.latitude : orbitLatitude,
        lon: isOffline
          ? location?.lon ?? sample.lon
          : useTelemetryPosition ? telemetry.longitude : orbitLongitude,
        alt: telemetry?.altitude ?? 100 + ring * 35,
        battery: telemetry?.batteryLevel ?? sample.battery,
        speed: sample.speed,
        heading: (angle * 180 / Math.PI + 360) % 360,
        mission: mission?.missionName || 'No active mission',
        missionId: mission?.id,
        hasTelemetry: Boolean(telemetry),
        telemetrySource: telemetry?.source,
        telemetryRecordedAt: telemetry?.recordedAt,
        dest: location ? [location.lat, location.lon] : sample.dest,
      }
    })
  }, [backend.drones, backend.missions, backend.telemetry, orbitTime])

  const selected = drones.find((drone) => drone.id === selectedId)
  const selectedMission = selected
    ? backend.missions
      .filter((mission) => String(mission.drone?.id) === selected.id)
      .sort((a, b) => Number(b.id) - Number(a.id))[0]
    : null
  const availableDrones = backend.drones.filter(
    (drone) => drone.status?.toUpperCase() === 'AVAILABLE',
  )
  const count = (status) => drones.filter((drone) => drone.status === status).length

  const performAction = async (action) => {
    setBusy(true)
    setActionError('')
    try {
      await action()
      await refreshBackend()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'The request failed')
    } finally {
      setBusy(false)
    }
  }

  const submitDrone = (event) => {
    event.preventDefault()
    performAction(async () => {
      const drone = await createDrone(droneForm)
      setSelectedId(String(drone.id))
      setDroneForm({ name: '', model: '', location: '', status: 'AVAILABLE' })
    })
  }

  const submitMission = (event) => {
    event.preventDefault()
    performAction(async () => {
      await createMission({
        droneId: Number(missionForm.droneId),
        missionName: missionForm.missionName,
        destination: missionForm.destination,
      })
      setMissionForm((current) => ({
        ...current,
        missionName: '',
        destination: '',
      }))
    })
  }

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="brand">
          <Plane size={24} />
          <div>
            <div className="brand-name">Aero Saga</div>
            <div className="brand-sub">Drone Fleet Control</div>
          </div>
        </div>

        {NAV.map(([label, Icon, target]) => (
          <button
            key={label}
            className={nav === label ? 'on' : ''}
            onClick={() => {
              setNav(label)
              if (target === 'map-view') {
                document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' })
              } else {
                document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' })
              }
            }}
          >
            <Icon size={20} />
            {label}
          </button>
        ))}

        <div className="side-foot">
          <div><i className={`dot ${backend.status === 'online' ? 'live' : 'offline'}`} />API {backend.status}</div>
          <div className="muted">Backend refreshes every 4 seconds</div>
        </div>
      </nav>

      <main className="map-area" id="map-view">
        <GlobeView drones={drones} selectedId={selectedId} onSelect={setSelectedId} />
      </main>

      <aside className="panel">
        <div className="panel-head">
          <span className="panel-icon"><Plane size={20} /></span>
          <h2>Fleet control</h2>
          <span className="live-text"><i className={`dot ${backend.status === 'online' ? 'live' : 'offline'}`} />{backend.status === 'online' ? 'API LIVE' : 'API OFFLINE'}</span>
        </div>

        {backend.status === 'offline' && (
          <section className="api-error" aria-live="polite">
            <strong>Backend unavailable</strong>
            <p>{backend.error}</p>
            <button className="inject" onClick={refreshBackend}>Retry connection</button>
          </section>
        )}
        {actionError && <section className="api-error" role="alert">{actionError}</section>}

        <section id="fleet-overview">
          <div className="row">
            <h3>Fleet overview</h3>
            <span className="tiny">{drones.length} REGISTERED</span>
          </div>
          <div className="stats">
            <div><span>Active</span><b className="teal">{count('active')}</b></div>
            <div><span>Available</span><b className="amber">{count('idle')}</b></div>
            <div><span>Offline</span><b>{count('offline')}</b></div>
          </div>
        </section>

        <section id="backend-overview" aria-live="polite">
          <div className="row">
            <h3>Backend records</h3>
            <span className="tiny">{backend.status.toUpperCase()}</span>
          </div>
          <div className="stats">
            <div><span>Drones</span><b>{backend.drones.length}</b></div>
            <div><span>Missions</span><b>{backend.missions.length}</b></div>
            <div><span>Telemetry</span><b>{backend.telemetry.length}</b></div>
          </div>
        </section>

        <section id="drone-form">
          <h3>Register drone</h3>
          <form className="api-form" onSubmit={submitDrone}>
            <input
              aria-label="Drone name"
              placeholder="Drone name"
              required
              value={droneForm.name}
              onChange={(event) => setDroneForm({ ...droneForm, name: event.target.value })}
            />
            <input
              aria-label="Drone model"
              placeholder="Model"
              required
              value={droneForm.model}
              onChange={(event) => setDroneForm({ ...droneForm, model: event.target.value })}
            />
            <select
              aria-label="Drone location"
              required
              value={droneForm.location}
              onChange={(event) => setDroneForm({ ...droneForm, location: event.target.value })}
            >
              <option value="">Choose location</option>
              {CITIES.map((city) => (
                <option key={city.name} value={city.name}>{city.name}</option>
              ))}
            </select>
            <select
              aria-label="Drone status"
              required
              value={droneForm.status}
              onChange={(event) => setDroneForm({ ...droneForm, status: event.target.value })}
            >
              <option value="AVAILABLE">Active</option>
              <option value="OFFLINE">Offline</option>
            </select>
            <button className="inject" disabled={busy || backend.status !== 'online'}>Register drone</button>
          </form>
        </section>

        <section id="mission-form">
          <h3>Create mission</h3>
          <form className="api-form" onSubmit={submitMission}>
            <select
              aria-label="Available drone"
              required
              value={missionForm.droneId}
              onChange={(event) => setMissionForm({ ...missionForm, droneId: event.target.value })}
            >
              <option value="">Choose available drone</option>
              {availableDrones.map((drone) => (
                <option key={drone.id} value={drone.id}>{drone.name} · {drone.model}</option>
              ))}
            </select>
            <input
              aria-label="Mission name"
              placeholder="Mission name"
              required
              value={missionForm.missionName}
              onChange={(event) => setMissionForm({ ...missionForm, missionName: event.target.value })}
            />
            <select
              aria-label="Destination"
              required
              value={missionForm.destination}
              onChange={(event) => setMissionForm({ ...missionForm, destination: event.target.value })}
            >
              <option value="">Choose destination city</option>
              {CITIES.map((city) => (
                <option key={city.name} value={city.name}>{city.name}</option>
              ))}
            </select>
            <button className="inject" disabled={busy || !availableDrones.length || backend.status !== 'online'}>
              Create mission
            </button>
          </form>
          {!availableDrones.length && <p className="tiny">Register or free a drone before creating a mission.</p>}
        </section>

        {selected ? (
          <>
            <section id="mission-list">
              <div className="row">
                <h3>Selected aircraft</h3>
                <span className={`badge ${selected.status}`}>{selected.status.toUpperCase()}</span>
              </div>
              <div className="drone-name">{selected.name}</div>
              <div className="tiny">
                {selected.model} · {selected.hasTelemetry
                  ? `${selected.telemetrySource === 'DEVICE' ? 'DEVICE' : selected.telemetrySource === 'SIMULATED_MISSION' ? 'SIMULATED MISSION' : 'RECORDED'} TELEMETRY${selected.telemetryRecordedAt ? ` · ${new Date(selected.telemetryRecordedAt).toLocaleTimeString()}` : ''}`
                  : 'NO TELEMETRY · ORBIT VISUALIZATION IS SIMULATED'}
              </div>
              <div className="grid2">
                <div><span>Location</span><b>{selected.location || 'Unknown'}</b></div>
                <div><span>Altitude</span><b>{selected.alt} m</b></div>
                <div><span>Speed</span><b>{selected.speed} km/h*</b></div>
                <div><span>Heading</span><b>{selected.heading}°*</b></div>
                <div><span>Battery</span><b>{Math.round(selected.battery)}%</b></div>
              </div>
              <div className="mission">
                <div><span>Current position</span><b>{coord(selected.lat, selected.lon)}</b></div>
                <div className="right"><span>Current mission</span><b>{selected.mission}</b></div>
              </div>
              <p className="tiny">* Speed and heading remain simulated until provided by telemetry.</p>
            </section>

            <MissionDag
              mission={selectedMission}
              signals={backend.workflowSignals}
              busy={busy}
              onExecute={(missionId) => performAction(() => executeMission(missionId))}
            />
          </>
        ) : (
          <section>
            <h3>No registered drones</h3>
            <p className="tiny">Register a drone to see it on the map and create missions.</p>
          </section>
        )}

        <section>
          <div className="row">
            <h3>Missions</h3>
            <span className="tiny">{backend.missions.length}</span>
          </div>
          <ul className="mission-list">
            {backend.missions.map((mission) => (
              <li key={mission.id}>
                <div>
                  <strong>{mission.missionName}</strong>
                  <span className="tiny">{mission.drone?.name || 'Unassigned'} · {mission.destination}</span>
                </div>
                <div className="mission-actions">
                  <span className={`wf-badge ${mission.status}`}>{mission.status}</span>
                  {mission.status?.toUpperCase() === 'PENDING' && (
                    <>
                      <button className="tiny-button" disabled={busy} onClick={() => performAction(() => executeMission(mission.id))}>Start</button>
                      <button className="tiny-button" disabled={busy} onClick={() => performAction(() => deleteMission(mission.id))}>Delete</button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {selected && (
          <section>
            <div className="row">
              <h3>Workflow activity</h3>
              <span className="tiny">{backend.workflowSignals.filter((signal) => String(signal.droneId) === selected.id).length}</span>
            </div>
            <ul className="signal-list">
              {backend.workflowSignals
                .filter((signal) => String(signal.droneId) === selected.id)
                .slice(0, 5)
                .map((signal) => (
                  <li key={signal.id}>
                    <span>{signal.signalType} · {signal.signalStatus}</span>
                    <span className="tiny">{signal.message}</span>
                  </li>
                ))}
            </ul>
          </section>
        )}

        <section className="roster-section" id="drone-roster">
          <div className="row">
            <h3>Aircraft roster</h3>
            <span className="tiny">{drones.length}</span>
          </div>
          <ul className="roster">
            {drones.map((drone) => (
              <li key={drone.id}>
                <button className={drone.id === selectedId ? 'on' : ''} onClick={() => setSelectedId(drone.id)}>
                  <span className="rid">{drone.name}</span>
                  <span className="rstat"><i className={`dot ${drone.status}`} />{drone.status}</span>
                  <span className="rbat">{Math.round(drone.battery)}%</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </aside>
    </div>
  )
}
