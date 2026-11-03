
import { subscribe } from './telemetryClient'
import { DRONES, CITIES } from '../data/drones'

/**
 * AeroSaga Sentinel telemetry adapter.
 *
 * Reads the existing simulated telemetry.
 * Keeps each drone assigned to its original home city.
 * Does not modify the original drone simulation.
 */

const cityByDroneId = new Map(
  DRONES.map((drone) => {
    const number = Number(drone.id.slice(-3))

    const cityIndex =
      number <= 7
        ? number - 1
        : number % 7

    return [drone.id, CITIES[cityIndex].name]
  })
)

export function subscribeToSentinelTelemetry(callback) {
  return subscribe((drones) => {
    const sentinelDrones = drones.map((drone) => {
      const battery = drone.battery

      return {
        id: drone.id,

        // Original assigned city, not the moving GPS position.
        location: cityByDroneId.get(drone.id) ?? 'Unknown',

        latitude: drone.lat,
        longitude: drone.lon,

        altitude: drone.alt,
        speed: drone.speed,
        heading: drone.heading,

        battery,
        status: drone.status,

        // Battery-based demonstration rules only.
        risk: getBatteryRisk(battery),
        anomaly: getBatteryMessage(battery),

        // Awaiting actual sensor and AI integration.
        temperature: null,
        signal: null,
        anomalyScore: null,

        dataSource: 'SIMULATED_TELEMETRY',
      }
    })

    callback(sentinelDrones)
  })
}

function getBatteryRisk(battery) {
  if (battery < 20) return 'HIGH'
  if (battery < 40) return 'MEDIUM'
  return 'LOW'
}

function getBatteryMessage(battery) {
  if (battery < 20) return 'Critical battery level'
  if (battery < 40) return 'Low battery level'
  return 'No battery warning'
}
