export { subscribe, TICK_MS, ORBITS } from './mockTelemetry'

export function sendSignal(droneId, signal) {
  console.log('signal bheja:', droneId, signal)
}