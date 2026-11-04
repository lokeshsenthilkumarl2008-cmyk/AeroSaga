async function getJson(path) {
  const response = await fetch(path)
  if (!response.ok) {
    throw new Error(`Backend request failed (${response.status})`)
  }
  return response.json()
}

async function sendJson(path, method, body) {
  const response = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    const message =
      payload?.message ||
      Object.values(payload || {}).find((value) => typeof value === 'string') ||
      `Backend request failed (${response.status})`
    throw new Error(message)
  }
  return response.status === 204 ? null : response.json()
}

export async function getBackendOverview() {
  const [drones, missions, telemetry, workflowSignals] = await Promise.all([
    getJson('/api/drones'),
    getJson('/api/missions'),
    getJson('/api/telemetry'),
    getJson('/api/workflow-signals'),
  ])

  if (
    !Array.isArray(drones) ||
    !Array.isArray(missions) ||
    !Array.isArray(telemetry) ||
    !Array.isArray(workflowSignals)
  ) {
    throw new Error('Backend returned an invalid API response')
  }

  return { drones, missions, telemetry, workflowSignals }
}

export function createDrone(drone) {
  return sendJson('/api/drones', 'POST', drone)
}

export function createMission(mission) {
  return sendJson('/api/missions', 'POST', mission)
}

export function executeMission(missionId) {
  return sendJson(`/api/missions/${missionId}/execute`, 'POST', {})
}

export function deleteMission(missionId) {
  return fetch(`/api/missions/${missionId}`, { method: 'DELETE' }).then((response) => {
    if (!response.ok) {
      throw new Error(`Unable to delete mission (${response.status})`)
    }
  })
}

export function postTelemetry(droneId, telemetry) {
  return sendJson(`/api/telemetry/drone/${droneId}`, 'POST', telemetry)
}
