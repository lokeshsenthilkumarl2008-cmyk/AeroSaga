import { useEffect, useRef } from 'react'
import * as Cesium from 'cesium'
import { Plus, Minus, LocateFixed } from 'lucide-react'
import 'cesium/Build/Cesium/Widgets/widgets.css'

import { CITIES, STATUS_COLORS } from '../data/drones'

const token = import.meta.env.VITE_CESIUM_ION_TOKEN

Cesium.Ion.defaultAccessToken = token

// Initial camera position
const INDIA_VIEW = Cesium.Cartesian3.fromDegrees(
  79.5,
  19.5,
  3_800_000
)

// Orbit configuration
const RING_RADII_KM = [8, 16, 24]
const ROTATION_SPEED = 0.30
const ORBIT_HEIGHT = 500

const DEG = Math.PI / 180

// --------------------------------------------------
// CALCULATE DRONE POSITION ON A CIRCULAR ORBIT
// --------------------------------------------------

function getOrbitPosition(city, radiusKm, angle) {
  const north = radiusKm * Math.sin(angle)
  const east = radiusKm * Math.cos(angle)

  const lat = city.lat + north / 111.32

  const lon =
    city.lon +
    east / (111.32 * Math.cos(city.lat * DEG))

  return Cesium.Cartesian3.fromDegrees(
    lon,
    lat,
    ORBIT_HEIGHT
  )
}

// --------------------------------------------------
// DISTRIBUTE ALL DRONES EQUALLY BETWEEN CITIES
// --------------------------------------------------

function distributeDrones(drones) {
  const cityGroups = CITIES.map(() => [])

  const sortedDrones = [...drones].sort((a, b) =>
    String(a.id).localeCompare(String(b.id))
  )

  sortedDrones.forEach((drone) => {
    // Find the city with the fewest drones
    let smallestCity = 0

    for (let i = 1; i < cityGroups.length; i++) {
      if (
        cityGroups[i].length <
        cityGroups[smallestCity].length
      ) {
        smallestCity = i
      }
    }

    cityGroups[smallestCity].push(drone)
  })

  return cityGroups
}

// --------------------------------------------------
// DRAW THREE CIRCULAR ORBIT LINES AROUND EVERY CITY
// --------------------------------------------------

function drawOrbitLines(viewer) {
  const orbitCollection =
    viewer.scene.primitives.add(
      new Cesium.PolylineCollection()
    )

  CITIES.forEach((city) => {
    RING_RADII_KM.forEach((radius) => {
      const positions = []

      // 360-degree circle
      for (let i = 0; i <= 180; i++) {
        const angle = (i / 180) * Math.PI * 2

        positions.push(
          getOrbitPosition(city, radius, angle)
        )
      }

      orbitCollection.add({
        positions,
        width: 2.5,
        material: Cesium.Material.fromType(
          'Color',
          {
            color: Cesium.Color.fromCssColorString(
              '#f5a742'
            ).withAlpha(0.85),
          }
        ),
      })
    })
  })

  return orbitCollection
}

// --------------------------------------------------
// MAIN COMPONENT
// --------------------------------------------------

export default function GlobeView({
  drones,
  selectedId,
  onSelect,
}) {
  const containerRef = useRef(null)
  const viewerRef = useRef(null)

  const pointsCollectionRef = useRef(null)
  const pointsRef = useRef(new Map())

  const selectedRef = useRef(selectedId)
  const onSelectRef = useRef(onSelect)

  const startTimeRef = useRef(0)

  // Keep callbacks updated
  useEffect(() => {
    selectedRef.current = selectedId
    onSelectRef.current = onSelect
  }, [selectedId, onSelect])

  // --------------------------------------------------
  // 1. INITIALIZE CESIUM
  // --------------------------------------------------

  useEffect(() => {
    if (!containerRef.current) return

    const baseLayer = token
      ? Cesium.ImageryLayer.fromWorldImagery()
      : new Cesium.ImageryLayer(
          new Cesium.OpenStreetMapImageryProvider({
            url: 'https://tile.openstreetmap.org/',
          })
        )

    const viewer = new Cesium.Viewer(
      containerRef.current,
      {
        baseLayer,

        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        sceneModePicker: false,
        navigationHelpButton: false,

        animation: false,
        timeline: false,
        fullscreenButton: false,
        infoBox: false,
        selectionIndicator: false,
      }
    )

    viewerRef.current = viewer

    viewer.scene.globe.baseColor =
      Cesium.Color.fromCssColorString('#dce8e8')

    viewer.scene.globe.enableLighting = false
    viewer.scene.fog.enabled = false

    // Drone and city marker collection
    const points =
      viewer.scene.primitives.add(
        new Cesium.PointPrimitiveCollection()
      )

    pointsCollectionRef.current = points

    // --------------------------------------------------
    // 2. DRAW ORBIT LINES
    // --------------------------------------------------

    drawOrbitLines(viewer)

    // --------------------------------------------------
    // 3. CITY LABELS
    // --------------------------------------------------

    const labels =
      viewer.scene.primitives.add(
        new Cesium.LabelCollection()
      )

    CITIES.forEach((city) => {
      labels.add({
        position: Cesium.Cartesian3.fromDegrees(
          city.lon,
          city.lat,
          0
        ),

        text: city.name,

        font: 'bold 14px sans-serif',

        fillColor: Cesium.Color.WHITE,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 3,

        style:
          Cesium.LabelStyle.FILL_AND_OUTLINE,

        showBackground: true,

        backgroundColor:
          Cesium.Color.fromCssColorString(
            '#07111e'
          ).withAlpha(0.9),

        pixelOffset: new Cesium.Cartesian2(0, -25),
      })

      // City centre marker
      points.add({
        position: Cesium.Cartesian3.fromDegrees(
          city.lon,
          city.lat,
          200
        ),

        color: Cesium.Color.fromCssColorString(
          '#ffd166'
        ),

        pixelSize: 8,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 2,
      })
    })

    // --------------------------------------------------
    // 4. SELECTED DRONE HIGHLIGHT
    // --------------------------------------------------

    const selectedRing = points.add({
      position: Cesium.Cartesian3.ZERO,

      show: false,

      color: Cesium.Color.TRANSPARENT,

      pixelSize: 25,

      outlineColor:
        Cesium.Color.fromCssColorString('#19d3c5'),

      outlineWidth: 3,
    })

    startTimeRef.current = performance.now()

    // --------------------------------------------------
    // 5. CONTINUOUS DRONE ROTATION
    // --------------------------------------------------

    const removeAnimation =
      viewer.scene.preRender.addEventListener(() => {
        const elapsed =
          (performance.now() -
            startTimeRef.current) / 1000

        pointsRef.current.forEach((entry) => {
          const angle =
            entry.startAngle +
            elapsed *
              ROTATION_SPEED *
              entry.direction

          entry.point.position =
            getOrbitPosition(
              entry.city,
              entry.radius,
              angle
            )
        })

        // Follow selected drone
        const selected = pointsRef.current.get(
          String(selectedRef.current)
        )

        if (selected) {
          selectedRing.position =
            selected.point.position

          selectedRing.show = true
        } else {
          selectedRing.show = false
        }
      })

    // --------------------------------------------------
    // 6. DRONE CLICK SELECTION
    // --------------------------------------------------

    const handler =
      new Cesium.ScreenSpaceEventHandler(
        viewer.scene.canvas
      )

    handler.setInputAction((click) => {
      const picked = viewer.scene.pick(
        click.position
      )

      if (
        picked &&
        typeof picked.id === 'string' &&
        pointsRef.current.has(picked.id)
      ) {
        onSelectRef.current(picked.id)
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    // Initial camera position
    viewer.camera.flyTo({
      destination: INDIA_VIEW,
      duration: 2.5,
    })

    // --------------------------------------------------
    // CLEANUP
    // --------------------------------------------------

    return () => {
      removeAnimation()

      handler.destroy()
      viewer.destroy()

      pointsRef.current.clear()

      pointsCollectionRef.current = null
      viewerRef.current = null
    }
  }, [])

  // --------------------------------------------------
  // 7. DISTRIBUTE DRONES ACROSS ALL CITIES AND RINGS
  // --------------------------------------------------

  useEffect(() => {
    const points = pointsCollectionRef.current

    if (!points || CITIES.length === 0) return

    const cityGroups = distributeDrones(drones)

    const activeIds = new Set(
      drones.map((drone) => String(drone.id))
    )

    cityGroups.forEach((cityDrones, cityIndex) => {
      const city = CITIES[cityIndex]

      // Three orbit groups
      const rings = [[], [], []]

      // Spread drones equally between all three rings
      cityDrones.forEach((drone, index) => {
        rings[index % 3].push(drone)
      })

      rings.forEach((ringDrones, ringIndex) => {
        const radius = RING_RADII_KM[ringIndex]

        const totalInRing = ringDrones.length

        ringDrones.forEach((drone, positionIndex) => {
          const id = String(drone.id)

          // Even 360-degree spacing
          const angle =
            (positionIndex / totalInRing) *
              Math.PI *
              2 +
            ringIndex * 0.18

          const color =
            Cesium.Color.fromCssColorString(
              STATUS_COLORS[drone.status] ||
                '#f5a742'
            )

          const existing =
            pointsRef.current.get(id)

          if (existing) {
            // Update existing drone
            existing.point.color = color

            existing.city = city
            existing.radius = radius
            existing.startAngle = angle

            existing.direction =
              cityIndex % 2 === 0 ? 1 : -1

            return;
          }

          // Create new drone marker
          const point = points.add({
            id,

            position: getOrbitPosition(
              city,
              radius,
              angle
            ),

            color,

            pixelSize: 10,

            outlineColor:
              Cesium.Color.fromCssColorString(
                '#172333'
              ),

            outlineWidth: 2,
          })

          pointsRef.current.set(id, {
            point,

            city,
            radius,
            startAngle: angle,

            direction:
              cityIndex % 2 === 0 ? 1 : -1,
          })
        })
      })
    })

    // Remove drones no longer in the fleet
    pointsRef.current.forEach((entry, id) => {
      if (!activeIds.has(id)) {
        points.remove(entry.point)
        pointsRef.current.delete(id)
      }
    })
  }, [drones])

  // --------------------------------------------------
  // 8. FOCUS SELECTED DRONE'S CITY
  // --------------------------------------------------

  useEffect(() => {
    if (!selectedId) return

    const entry = pointsRef.current.get(
      String(selectedId)
    )

    const viewer = viewerRef.current

    if (!entry || !viewer) return

    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        entry.city.lon,
        entry.city.lat,
        300_000
      ),

      duration: 1.5,
    })
  }, [selectedId])

  // --------------------------------------------------
  // 9. ZOOM CONTROLS
  // --------------------------------------------------

  const zoom = (direction) => {
    const camera = viewerRef.current?.camera

    if (!camera) return

    const height =
      camera.positionCartographic.height

    if (direction > 0) {
      camera.zoomIn(height * 0.4)
    } else {
      camera.zoomOut(height * 0.4)
    }
  }

  // --------------------------------------------------
  // 10. CENTER ON INDIA
  // --------------------------------------------------

  const centerOnIndia = () => {
    viewerRef.current?.camera.flyTo({
      destination: INDIA_VIEW,
      duration: 1.5,
    })
  }

  // --------------------------------------------------
  // 11. UI
  // --------------------------------------------------

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
        }}
      />

      {/* Map controls */}
      <div className="map-controls">
        <div className="ctrl-group">
          <button
            aria-label="Zoom in"
            onClick={() => zoom(1)}
          >
            <Plus size={18} />
          </button>

          <button
            aria-label="Zoom out"
            onClick={() => zoom(-1)}
          >
            <Minus size={18} />
          </button>
        </div>

        <div className="ctrl-group">
          <button
            aria-label="Center on India"
            onClick={centerOnIndia}
          >
            <LocateFixed size={18} />
          </button>
        </div>
      </div>

      {/* Fleet legend */}
      <div className="legend">
        <span>
          <i className="dot active" />
          Active
        </span>

        <span>
          <i className="dot idle" />
          Idle
        </span>

        <span>
          <i className="dot offline" />
          Offline
        </span>
      </div>
    </div>
  )
}