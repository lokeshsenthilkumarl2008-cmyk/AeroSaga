
import { useEffect, useMemo, useState } from 'react'

import {
  Activity,
  ArrowLeft,
  Battery,
  BrainCircuit,
  CheckCircle,
  CircleAlert,
  Plane,
  ShieldAlert,
  Workflow,
  MapPin,
} from 'lucide-react'

import './SentinelDashboard.css'
import { subscribeToSentinelTelemetry } from '../../services/sentinelTelemetry'

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

export default function SentinelDashboard({ onBack }) {
  const [drones, setDrones] = useState([])
  const [selectedCity, setSelectedCity] = useState(null)

  useEffect(() => {
    const unsubscribe = subscribeToSentinelTelemetry(setDrones)
    return () => unsubscribe()
  }, [])

  // Overall fleet statistics
  const fleetStats = useMemo(() => ({
    total: drones.length,
    active: drones.filter(
      drone => drone.status === 'active'
    ).length,
    idle: drones.filter(
      drone => drone.status === 'idle'
    ).length,
    offline: drones.filter(
      drone => drone.status === 'offline'
    ).length,
  }), [drones])

  // City-wise fleet statistics
  const cityStats = useMemo(() => {
    return CITIES.map(city => {
      const cityDrones = drones.filter(
        drone => drone.location === city
      )

      return {
        name: city,
        total: cityDrones.length,

        active: cityDrones.filter(
          drone => drone.status === 'active'
        ).length,

        idle: cityDrones.filter(
          drone => drone.status === 'idle'
        ).length,

        offline: cityDrones.filter(
          drone => drone.status === 'offline'
        ).length,

        alerts: cityDrones.filter(
          drone => drone.risk !== 'LOW'
        ).length,
      }
    })
  }, [drones])

  // Selected city drones
  const selectedDrones = useMemo(() => {
    if (!selectedCity) return []

    return drones.filter(
      drone => drone.location === selectedCity
    )
  }, [drones, selectedCity])

  // Safety alerts
  const alerts = drones.filter(
    drone => drone.risk !== 'LOW'
  )

  const highRisk = drones.filter(
    drone => drone.risk === 'HIGH'
  ).length

  return (
    <main className="sentinel-page">

      {/* HEADER */}
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
              <p>Drone safety monitoring and emergency response</p>
            </div>
          </div>
        </div>

        <span className="sentinel-demo-label">
          SIMULATED TELEMETRY · DEMO
        </span>
      </header>

      {/* FLEET OVERVIEW */}
      <section className="sentinel-metrics">
        <Metric
          icon={Plane}
          label="Registered drones"
          value={fleetStats.total}
          detail="Across 7 cities"
        />

        <Metric
          icon={Activity}
          label="Active / Flying"
          value={fleetStats.active}
          detail="Simulated flight activity"
        />

        <Metric
          icon={CheckCircle}
          label="Idle / Available"
          value={fleetStats.idle}
          detail="Not currently flying"
        />

        <Metric
          icon={CircleAlert}
          label="Offline drones"
          value={fleetStats.offline}
          detail="Currently unavailable"
        />
      </section>

      {/* CITY-WISE MONITORING */}
      <section className="sentinel-section">
        <div className="sentinel-section-heading">
          <div>
            <h2>
              <MapPin size={20} />
              City-wise fleet monitoring
            </h2>

            <p>
              Select a city to view its drone fleet and safety status.
            </p>
          </div>

          <span className="sentinel-demo-label">
            MOCK MODE
          </span>
        </div>

        <div className="sentinel-city-grid">
          {cityStats.map(city => (
            <button
              key={city.name}
              className={`sentinel-city-card ${
                selectedCity === city.name ? 'selected' : ''
              }`}
              onClick={() =>
                setSelectedCity(
                  selectedCity === city.name ? null : city.name
                )
              }
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
                <span>Alerts: {city.alerts}</span>
              </div>

              <small>
                {selectedCity === city.name
                  ? 'Click to close details'
                  : 'Click to view drones →'}
              </small>
            </button>
          ))}
        </div>

        {/* SELECTED CITY DETAILS */}
        {selectedCity && (
          <div className="sentinel-city-drone-list">
            <div className="sentinel-section-heading">
              <div>
                <h2>{selectedCity} — Drone fleet</h2>
                <p>
                  {selectedDrones.length} drones assigned to this city.
                </p>
              </div>

              <button onClick={() => setSelectedCity(null)}>
                Close
              </button>
            </div>

            <div className="sentinel-table-wrap">
              <table className="sentinel-table">
                <thead>
                  <tr>
                    <th>Drone</th>
                    <th>Battery</th>
                    <th>Status</th>
                    <th>Risk</th>
                  </tr>
                </thead>

                <tbody>
                  {selectedDrones.map(drone => (
                    <tr key={drone.id}>
                      <td>
                        <strong>{drone.id}</strong>
                      </td>

                      <td>{drone.battery}%</td>

                      <td>
                        {drone.status.toUpperCase()}
                      </td>

                      <td>
                        <span
                          className={`sentinel-risk ${riskClass[drone.risk]}`}
                        >
                          {drone.risk}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* SAFETY ALERTS */}
      <section className="sentinel-section">
        <div className="sentinel-section-heading">
          <div>
            <h2>
              <BrainCircuit size={19} />
              Safety alerts
            </h2>

            <p>
              Battery-based demonstration warnings, not AI predictions.
            </p>
          </div>
        </div>

        {alerts.length > 0 ? (
          alerts.map(drone => (
            <article className="sentinel-alert" key={drone.id}>
              <CircleAlert size={20} />

              <div>
                <strong>
                  {drone.id} — {drone.anomaly}
                </strong>

                <p>
                  {drone.location} · Simulated telemetry · {drone.risk} risk
                </p>
              </div>

              <span
                className={`sentinel-risk ${riskClass[drone.risk]}`}
              >
                {drone.risk}
              </span>
            </article>
          ))
        ) : (
          <p>
            {drones.length === 0
              ? 'Loading telemetry...'
              : 'No battery warnings detected.'}
          </p>
        )}
      </section>

      {/* MISSION ACTIVITY */}
      <section className="sentinel-section">
        <div className="sentinel-section-heading">
          <div>
            <h2>
              <Workflow size={19} />
              Mission activity
            </h2>

            <p>
              Mission lifecycle is separate from simulated fleet activity.
            </p>
          </div>
        </div>

        <p>
          Mission execution currently completes quickly in the simulation.
          Sentinel independently monitors the simulated drone fleet,
          regardless of mission completion.
        </p>

        <p>
          Completed, pending and running mission information can be
          connected to the existing backend API in the next integration step.
        </p>
      </section>

      {/* EMERGENCY RESPONSE */}
      <section className="sentinel-section sentinel-workflow">
        <Workflow size={24} />

        <div>
          <h2>Emergency response</h2>

          <p>
            Temporal emergency workflow integration will be added after
            the backend team provides its API contract.
          </p>

          <span>
            <CheckCircle size={15} />
            No emergency action has been triggered
          </span>
        </div>
      </section>

    </main>
  )
}
