// Dummy mission engine. Baad mein yahi data backend ke Temporal workflow se aayega.
const t0 = performance.now()
export const nowSec = () => (performance.now() - t0) / 1000

const DUR = { preflight: 3, takeoff: 4, navigate: 8, drop: 4, confirm: 3, rtb: 7, land: 3 } // seconds
const HOLD = 4 // mission khatam hone ke baad kitni der result dikhe

const ALL = ['preflight', 'takeoff', 'navigate', 'drop', 'confirm', 'rtb', 'land']
const LABELS = {
  preflight: 'Pre-flight check',
  takeoff: 'Takeoff',
  navigate: 'Navigate to drop zone',
  drop: 'Drop package',
  confirm: 'Confirm delivery',
  rtb: 'Return to base',
  land: 'Land',
}

export function getMission(drone, t, forceFail = false) {
  const n = Number(drone.id.slice(-3))
  const fails = forceFail || n % 4 === 0
  const path = fails
    ? ['preflight', 'takeoff', 'navigate', 'drop', 'rtb', 'land']
    : ['preflight', 'takeoff', 'navigate', 'drop', 'confirm', 'land']
  const total = path.reduce((a, k) => a + DUR[k], 0)

  const status = Object.fromEntries(ALL.map((id) => [id, 'pending']))
  let state = drone.status === 'offline' ? 'OFFLINE' : 'QUEUED'

  if (drone.status === 'active') {
    // Skip hui branch dhundli dikhegi
    ALL.forEach((id) => {
      if (!path.includes(id)) status[id] = 'skipped'
    })

    const tt = (t + n * 3.7) % (total + HOLD)
    let acc = 0
    state = 'RUNNING'
    for (const id of path) {
      if (tt >= acc + DUR[id]) status[id] = 'completed'
      else if (tt >= acc) status[id] = 'active'
      acc += DUR[id]
    }

    if (fails && status.drop === 'completed') {
      status.drop = 'failed'
      if (status.rtb === 'active') status.rtb = 'compensating'
      state = tt >= total ? 'COMPENSATED' : 'COMPENSATING'
    } else if (!fails && tt >= total) {
      state = 'COMPLETED'
    }
  }

  return {
    state,
    fails,
    steps: ALL.map((id) => ({ id, label: LABELS[id], status: status[id] })),
  }
}