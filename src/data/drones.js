export const CITIES = [
  { name: 'Bangalore', lat: 12.9716, lon: 77.5946 },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
  { name: 'Delhi', lat: 28.6139, lon: 77.209 },
  { name: 'Mumbai', lat: 19.076, lon: 72.8777 },
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
  { name: 'Hyderabad', lat: 17.385, lon: 78.4867 },
  { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 },
]

export const STATUS_COLORS = {
  active: '#19d3c5',
  idle: '#f2a33a',
  offline: '#8d98a3',
}

const IDLE = [9, 17, 25, 33, 41, 55, 63, 71, 79, 87, 95]
const OFFLINE = [12, 44, 58, 77, 91]

// Random jaisa dikhne wala par har baar same number deta hai
function seeded(seed) {
  let s = seed
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

function buildDrones() {
  const rnd = seeded(42)
  return Array.from({ length: 50 }, (_, i) => {
    const n = i + 1
    const home = n <= 7 ? CITIES[n - 1] : CITIES[n % 7]
    const spread = n <= 7 ? 0 : 1.6
    const dest = CITIES[(n * 3 + 1) % 7]
    return {
      id: `DRONE-${String(n).padStart(3, '0')}`,
      status: OFFLINE.includes(n) ? 'offline' : IDLE.includes(n) ? 'idle' : 'active',
      lat: home.lat + (rnd() - 0.5) * spread,
      lon: home.lon + (rnd() - 0.5) * spread,
      alt: Math.round(80 + rnd() * 140),
      speed: Math.round(30 + rnd() * 25),
      heading: Math.round(rnd() * 359),
      battery: Math.round(45 + rnd() * 50),
      mission: `DELIVERY-${String(n).padStart(2, '0')}`,
      dest: [dest.lat, dest.lon],
    }
  }).map((d) =>
    d.id === 'DRONE-002'
      ? { ...d, alt: 158, speed: 45, heading: 243, battery: 87, dest: [12.9716, 77.5946] }
      : d,
  )
}

export const DRONES = buildDrones()