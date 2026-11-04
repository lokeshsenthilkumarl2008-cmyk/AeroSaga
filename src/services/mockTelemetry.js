import { DRONES, CITIES } from '../data/drones'

export const TICK_MS = 1000

// Har drone ki orbit: kis city ke around, kitne radius par, kis direction mein
const cityOf = (n) => (n <= 7 ? CITIES[n - 1] : CITIES[n % 7])
const rankInCity = {}

export const ORBITS = DRONES.map((d) => {
  const n = Number(d.id.slice(-3))
  const city = cityOf(n)
  const rank = (rankInCity[city.name] = (rankInCity[city.name] ?? -1) + 1)
  const r = 0.25 + rank * 0.14 // radius degrees mein: andar se bahar ke rings
  return {
    id: d.id,
    city,
    r,
    dir: n % 2 === 0 ? 1 : -1, // 1 = anti-clockwise, -1 = clockwise
    period: 20 + r * 30, // ek chakkar ka time (seconds). Chhota number = tez
    phase: (((n * 137.5) % 360) * Math.PI) / 180, // drones alag-alag jagah se shuru
  }
})

const orbitById = new Map(ORBITS.map((o) => [o.id, o]))

// Time se position nikalna: koi random nahi, hamesha ek hi circle
function place(d, tSec) {
  const o = orbitById.get(d.id)
  const moving = d.status === 'active'
  const th = o.phase + (moving ? o.dir * ((2 * Math.PI) / o.period) * tSec : 0)
  const deg = (th * 180) / Math.PI
  const heading = (((o.dir === 1 ? -deg : 180 - deg) % 360) + 360) % 360

  return {
    ...d,
    lat: o.city.lat + o.r * Math.sin(th),
    lon: o.city.lon + (o.r * Math.cos(th)) / Math.cos((o.city.lat * Math.PI) / 180),
    heading: moving ? Math.round(heading) : d.heading,
    speed: moving ? d.speed : 0,
    battery: moving ? Math.max(5, d.battery - 0.02 * tSec) : d.battery,
    dest: [o.city.lat, o.city.lon], // orbit ka center
  }
}

const t0 = performance.now()
const snapshot = () => {
  const t = (performance.now() - t0) / 1000
  return DRONES.map((d) => place(d, t))
}

const listeners = new Set()
let timer = null

export function subscribe(cb) {
  listeners.add(cb)
  cb(snapshot())
  if (!timer) {
    timer = setInterval(() => {
      const s = snapshot()
      listeners.forEach((fn) => fn(s))
    }, TICK_MS)
  }
  return () => {
    listeners.delete(cb)
    if (listeners.size === 0) {
      clearInterval(timer)
      timer = null
    }
  }
}