import { useEffect, useRef } from 'react'
import * as Cesium from 'cesium'
import { Plus, Minus, LocateFixed } from 'lucide-react'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { CITIES } from '../data/drones'

const token = import.meta.env.VITE_CESIUM_ION_TOKEN

Cesium.Ion.defaultAccessToken = token

const HOME = Cesium.Cartesian3.fromDegrees(79.5, 19.5, 8_000_000)

// Orbital configuration
const DRONES_PER_CITY = 50
const LANES = 5
const DRONES_PER_LANE = DRONES_PER_CITY / LANES

// Angular radii in degrees
const ORBIT_RADII = [0.16, 0.28, 0.40, 0.52, 0.64]

// All lanes rotate in the same direction and at the same speed.
const ORBIT_SPEED = 0.00012
const ORBIT_DIRECTION = 1

const ORANGE = Cesium.Color.fromCssColorString('#ffad42')
const CYAN = Cesium.Color.fromCssColorString('#19d3c5')

export default function GlobeView() {
  const containerRef = useRef(null)
  const viewerRef = useRef(null)
  const simulationRef = useRef([])
  const selectedRingRef = useRef(null)

  // Initialize Cesium
  useEffect(() => {
    if (!containerRef.current) return

    const baseLayer = token
      ? Cesium.ImageryLayer.fromWorldImagery()
      : new Cesium.ImageryLayer(
          new Cesium.OpenStreetMapImageryProvider({
            url: 'https://tile.openstreetmap.org/',
          }),
        )

    const viewer = new Cesium.Viewer(containerRef.current, {
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
      requestRenderMode: false,
    })

    viewerRef.current = viewer

    viewer.scene.globe.baseColor =
      Cesium.Color.fromCssColorString('#0a2747')

    const primitives = viewer.scene.primitives

    // Drone markers
    const dronePoints = primitives.add(
      new Cesium.PointPrimitiveCollection(),
    )

    // City markers
    const cityPoints = primitives.add(
      new Cesium.PointPrimitiveCollection(),
    )

    // Orbital paths
    const orbitPaths = primitives.add(
      new Cesium.PolylineCollection(),
    )

    // City labels
    const labels = primitives.add(
      new Cesium.LabelCollection(),
    )

    const simulation = []

    // Create 50 simulated drones for every city
    CITIES.forEach((city, cityIndex) => {
      const latitudeCorrection = Math.max(
        0.2,
        Math.cos(Cesium.Math.toRadians(city.lat)),
      )

      // City center marker
      cityPoints.add({
        position: Cesium.Cartesian3.fromDegrees(
          city.lon,
          city.lat,
          0,
        ),
        color: Cesium.Color.fromCssColorString('#ffd166'),
        pixelSize: 9,
        outlineColor: Cesium.Color.BLACK,
        outlineWidth: 1,
      })

      // City label
      labels.add({
        position: Cesium.Cartesian3.fromDegrees(
          city.lon,
          city.lat,
          0,
        ),
        text: city.name,
        font: '14px sans-serif',
        showBackground: true,
        backgroundColor: Cesium.Color.fromCssColorString(
          '#040c16',
        ).withAlpha(0.85),
        pixelOffset: new Cesium.Cartesian2(0, -26),
      })

      // Five circular orbital lanes
      ORBIT_RADII.forEach((radius, laneIndex) => {
        const positions = []

        // Draw complete circular path
        for (let i = 0; i <= 240; i++) {
          const angle = (i / 240) * Math.PI * 2

          const lat =
            city.lat + radius * Math.sin(angle)

          const lon =
            city.lon +
            (radius / latitudeCorrection) *
              Math.cos(angle)

          positions.push(
            Cesium.Cartesian3.fromDegrees(
              lon,
              lat,
              1500,
            ),
          )
        }

        orbitPaths.add({
          positions,
          width: 2,
          material: Cesium.Material.fromType('Color', {
            color: ORANGE.withAlpha(
              0.25 + laneIndex * 0.035,
            ),
          }),
        })

        // Ten evenly spaced drones per lane
        for (
          let droneIndex = 0;
          droneIndex < DRONES_PER_LANE;
          droneIndex++
        ) {
          const phase =
            (droneIndex / DRONES_PER_LANE) *
            Math.PI *
            2

          const point = dronePoints.add({
            id: `SIM-${cityIndex}-${laneIndex}-${droneIndex}`,
            position: Cesium.Cartesian3.fromDegrees(
              city.lon,
              city.lat,
              1500,
            ),
            color: ORANGE,
            pixelSize: 8,
            outlineColor: Cesium.Color.fromCssColorString(
              '#17212b',
            ),
            outlineWidth: 1.5,
          })

          simulation.push({
            point,
            centerLat: city.lat,
            centerLon: city.lon,
            radius,
            latitudeCorrection,
            altitude: 1500,
            phase,

            // Same speed and direction for all drones
            // in the same orbital system.
            speed: ORBIT_SPEED,
            direction: ORBIT_DIRECTION,
          })
        }
      })
    })

    simulationRef.current = simulation

    // Animate all drones continuously
    const removeAnimation =
      viewer.scene.preRender.addEventListener(() => {
        const now = performance.now()

        simulationRef.current.forEach((drone) => {
          const angle =
            now * drone.speed * drone.direction +
            drone.phase

          const lat =
            drone.centerLat +
            drone.radius * Math.sin(angle)

          const lon =
            drone.centerLon +
            (drone.radius /
              drone.latitudeCorrection) *
              Math.cos(angle)

          drone.point.position =
            Cesium.Cartesian3.fromDegrees(
              lon,
              lat,
              drone.altitude,
            )
        })
      })

    // Initial camera position
    viewer.camera.flyTo({
      destination: HOME,
      duration: 2.5,
    })

    return () => {
      removeAnimation()
      viewer.destroy()

      simulationRef.current = []
      viewerRef.current = null
    }
  }, [])

  // Zoom controls
  const zoom = (direction) => {
    const camera = viewerRef.current?.camera

    if (!camera) return

    const height = camera.positionCartographic.height

    if (direction > 0) {
      camera.zoomIn(height * 0.4)
    } else {
      camera.zoomOut(height * 0.4)
    }
  }

  // Center on India
  const centerOnIndia = () => {
    viewerRef.current?.camera.flyTo({
      destination: HOME,
      duration: 1.5,
    })
  }

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
      }}
    >
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
        }}
      />

      {/* Zoom controls */}
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

      {/* Legend */}
      <div className="legend">
        <span>
          <i className="dot active" />
          Simulated drones
        </span>

        <span>
          <i
            className="dot"
            style={{ background: '#ffd166' }}
          />
          City center
        </span>
      </div>
    </div>
  )
}