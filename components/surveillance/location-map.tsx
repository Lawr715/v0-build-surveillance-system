"use client"

import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type WheelEvent as ReactWheelEvent } from "react"
import { MapPin, Minus, Plus, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"

const CAMPUS_BOUNDS = {
  minLat: 14.6368,
  maxLat: 14.6426,
  minLng: 121.0738,
  maxLng: 121.0792,
}

const VIEWBOX_WIDTH = 100
const VIEWBOX_HEIGHT = 64
const DEFAULT_ZOOM = 1
const MIN_ZOOM = 1
const MAX_ZOOM = 2.5
const BUTTON_ZOOM_STEP = 0.12
const DOUBLE_CLICK_ZOOM_STEP = 0.18
const MIN_WHEEL_ZOOM_STEP = 0.04
const MAX_WHEEL_ZOOM_STEP = 0.1

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

interface Location {
  id: string
  name: string
  address?: string
  latitude: number
  longitude: number
  videos: Array<{ id: string }>
}

interface LocationMapProps {
  locations: Location[]
}

function isWithinCampusBounds(location: Pick<Location, "latitude" | "longitude">) {
  return (
    location.latitude >= CAMPUS_BOUNDS.minLat &&
    location.latitude <= CAMPUS_BOUNDS.maxLat &&
    location.longitude >= CAMPUS_BOUNDS.minLng &&
    location.longitude <= CAMPUS_BOUNDS.maxLng
  )
}

export function LocationMap({ locations }: LocationMapProps) {
  const [zoom, setZoom] = useState(DEFAULT_ZOOM)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStateRef = useRef<{ clientX: number; clientY: number } | null>(null)
  const svgRef = useRef<SVGSVGElement | null>(null)

  const panLimitX = zoom > DEFAULT_ZOOM ? ((VIEWBOX_WIDTH * zoom) - VIEWBOX_WIDTH) / 2 + 4 : 0
  const panLimitY = zoom > DEFAULT_ZOOM ? ((VIEWBOX_HEIGHT * zoom) - VIEWBOX_HEIGHT) / 2 + 4 : 0

  useEffect(() => {
    setPan((current) => ({
      x: clamp(current.x, -panLimitX, panLimitX),
      y: clamp(current.y, -panLimitY, panLimitY),
    }))
  }, [panLimitX, panLimitY])

  useEffect(() => {
    setZoom(DEFAULT_ZOOM)
    setPan({ x: 0, y: 0 })
    setIsDragging(false)
    dragStateRef.current = null
  }, [locations])

  const updateZoom = (nextZoom: number) => {
    const normalizedZoom = clamp(Number(nextZoom.toFixed(2)), MIN_ZOOM, MAX_ZOOM)
    setZoom(normalizedZoom)
    if (normalizedZoom === DEFAULT_ZOOM) {
      setPan({ x: 0, y: 0 })
    }
  }

  const handleMouseDown = (event: ReactMouseEvent<SVGSVGElement>) => {
    if (zoom <= DEFAULT_ZOOM || event.button !== 0) {
      return
    }

    event.preventDefault()
    dragStateRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
    }
    setIsDragging(true)
  }

  const handleMouseMove = (event: ReactMouseEvent<SVGSVGElement>) => {
    if (!dragStateRef.current || !svgRef.current) {
      return
    }

    const rect = svgRef.current.getBoundingClientRect()
    if (!rect.width || !rect.height) {
      return
    }

    const deltaX = ((event.clientX - dragStateRef.current.clientX) / rect.width) * VIEWBOX_WIDTH
    const deltaY = ((event.clientY - dragStateRef.current.clientY) / rect.height) * VIEWBOX_HEIGHT

    dragStateRef.current = {
      clientX: event.clientX,
      clientY: event.clientY,
    }

    setPan((current) => ({
      x: clamp(current.x + deltaX, -panLimitX, panLimitX),
      y: clamp(current.y + deltaY, -panLimitY, panLimitY),
    }))
  }

  const endDrag = () => {
    dragStateRef.current = null
    setIsDragging(false)
  }

  const handleWheel = (event: ReactWheelEvent<SVGSVGElement>) => {
    event.preventDefault()
    const wheelStep = clamp(Math.abs(event.deltaY) / 600, MIN_WHEEL_ZOOM_STEP, MAX_WHEEL_ZOOM_STEP)
    const nextZoom = zoom + (event.deltaY < 0 ? wheelStep : -wheelStep)
    updateZoom(nextZoom)
  }

  const handleDoubleClick = () => {
    updateZoom(zoom + DOUBLE_CLICK_ZOOM_STEP)
  }

  if (locations.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-secondary/50 p-3 shadow-elevated-sm">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Location Overview</h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">0 locations</span>
        </div>
        <div className="rounded-xl border border-dashed border-border bg-background/40 px-3 py-6 text-center text-xs text-muted-foreground">
          Add a location to generate the site map.
        </div>
      </div>
    )
  }

  const useCampusBackdrop = locations.every(isWithinCampusBounds)

  const latitudes = locations.map((location) => location.latitude)
  const longitudes = locations.map((location) => location.longitude)
  const dynamicMinLat = Math.min(...latitudes)
  const dynamicMaxLat = Math.max(...latitudes)
  const dynamicMinLng = Math.min(...longitudes)
  const dynamicMaxLng = Math.max(...longitudes)

  const latPadding = Math.max((dynamicMaxLat - dynamicMinLat) * 0.2, 0.0015)
  const lngPadding = Math.max((dynamicMaxLng - dynamicMinLng) * 0.2, 0.0015)

  const minLat = useCampusBackdrop ? CAMPUS_BOUNDS.minLat : dynamicMinLat - latPadding
  const maxLat = useCampusBackdrop ? CAMPUS_BOUNDS.maxLat : dynamicMaxLat + latPadding
  const minLng = useCampusBackdrop ? CAMPUS_BOUNDS.minLng : dynamicMinLng - lngPadding
  const maxLng = useCampusBackdrop ? CAMPUS_BOUNDS.maxLng : dynamicMaxLng + lngPadding

  const getPosition = (lat: number, lng: number) => {
    const latRange = maxLat - minLat || 0.01
    const lngRange = maxLng - minLng || 0.01

    return {
      x: ((lng - minLng) / lngRange) * 64 + 18,
      y: ((maxLat - lat) / latRange) * 38 + 18,
    }
  }

  const plottedLocations = locations.map((location) => {
    const position = getPosition(location.latitude, location.longitude)
    const labelAnchor: "start" | "middle" | "end" = position.x <= 28 ? "start" : position.x >= 72 ? "end" : "middle"
    const labelDx = labelAnchor === "middle" ? 0 : labelAnchor === "end" ? -4 : 4
    const labelDy = position.y <= 22 ? 6 : -4.75

    return {
      ...location,
      ...position,
      labelAnchor,
      labelDx,
      labelDy,
    }
  })

  const plottedXs = plottedLocations.map((location) => location.x)
  const plottedYs = plottedLocations.map((location) => location.y)
  const focusX = (Math.min(...plottedXs) + Math.max(...plottedXs)) / 2
  const focusY = (Math.min(...plottedYs) + Math.max(...plottedYs)) / 2
  const clampedPanX = clamp(pan.x, -panLimitX, panLimitX)
  const clampedPanY = clamp(pan.y, -panLimitY, panLimitY)
  const zoomTranslateX = VIEWBOX_WIDTH / 2 - focusX * zoom + clampedPanX
  const zoomTranslateY = VIEWBOX_HEIGHT / 2 - focusY * zoom + clampedPanY

  return (
    <div className="rounded-2xl border border-border bg-secondary/50 p-3 shadow-elevated-sm">
      <div className="mb-2 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="pt-0.5 text-sm font-semibold text-foreground">Location Overview</h3>

          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 rounded-lg text-muted-foreground"
              onClick={() => updateZoom(zoom - BUTTON_ZOOM_STEP)}
              disabled={zoom <= MIN_ZOOM}
              aria-label="Zoom out location overview"
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 rounded-lg text-muted-foreground"
              onClick={() => updateZoom(zoom + BUTTON_ZOOM_STEP)}
              disabled={zoom >= MAX_ZOOM}
              aria-label="Zoom in location overview"
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 rounded-lg text-muted-foreground"
              onClick={() => {
                updateZoom(DEFAULT_ZOOM)
                setPan({ x: 0, y: 0 })
              }}
              disabled={zoom === DEFAULT_ZOOM && clampedPanX === 0 && clampedPanY === 0}
              aria-label="Reset location overview zoom"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">{locations.length} locations</span>
          <span className="text-[10px] text-muted-foreground">{Math.round(zoom * 100)}% zoom</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-background/50">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className="h-36 w-full touch-none select-none"
          style={{ cursor: zoom > DEFAULT_ZOOM ? (isDragging ? "grabbing" : "grab") : "default" }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={endDrag}
          onDoubleClick={handleDoubleClick}
          onMouseLeave={endDrag}
          onWheel={handleWheel}
        >
          <defs>
            <linearGradient id="map-surface" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(51, 65, 85, 0.62)" />
              <stop offset="100%" stopColor="rgba(15, 23, 42, 0.24)" />
            </linearGradient>
            <radialGradient id="location-map-glow" cx="50%" cy="42%" r="68%">
              <stop offset="0%" stopColor="rgba(34, 197, 94, 0.14)" />
              <stop offset="100%" stopColor="rgba(15, 23, 42, 0)" />
            </radialGradient>
          </defs>

          <g transform={`translate(${zoomTranslateX} ${zoomTranslateY}) scale(${zoom})`}>
            <rect x="0" y="0" width="100" height="64" fill="rgba(9, 9, 11, 0.42)" />
            <rect x="0" y="0" width="100" height="64" fill="url(#location-map-glow)" />

            {useCampusBackdrop ? (
              <>
                <path
                  d="M12 53 L15 17 L28 10 L46 9 L64 14 L77 22 L87 34 L88 49 L80 58 L42 60 Z"
                  fill="url(#map-surface)"
                  stroke="rgba(148, 163, 184, 0.24)"
                  strokeWidth="0.9"
                />
                <path d="M14 18 L28 10 L49 10 L66 14" fill="none" stroke="rgba(96, 165, 250, 0.22)" strokeWidth="1.3" strokeDasharray="4 3" />
                <path d="M20 31 C31 25, 42 24, 54 27 S73 35, 82 41" fill="none" stroke="rgba(34, 197, 94, 0.26)" strokeWidth="2.3" strokeLinecap="round" />
                <path d="M48 44 C57 42, 68 42, 81 46" fill="none" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="1.5" strokeLinecap="round" />
                <rect x="24" y="18" width="12" height="8" rx="1.8" fill="rgba(30, 41, 59, 0.82)" stroke="rgba(148, 163, 184, 0.22)" />
                <rect x="39" y="20" width="13" height="8.5" rx="1.8" fill="rgba(30, 41, 59, 0.78)" stroke="rgba(148, 163, 184, 0.2)" />
                <rect x="56" y="24" width="10" height="7.5" rx="1.8" fill="rgba(30, 41, 59, 0.76)" stroke="rgba(148, 163, 184, 0.2)" />
                <rect x="62" y="39" width="14" height="7" rx="1.8" fill="rgba(30, 41, 59, 0.68)" stroke="rgba(148, 163, 184, 0.18)" />
              </>
            ) : (
              <>
                {[16, 32, 48].map((y) => (
                  <path key={`h-${y}`} d={`M8 ${y} L92 ${y}`} fill="none" stroke="rgba(148, 163, 184, 0.12)" strokeWidth="0.6" strokeDasharray="3 4" />
                ))}
                {[20, 40, 60, 80].map((x) => (
                  <path key={`v-${x}`} d={`M${x} 8 L${x} 56`} fill="none" stroke="rgba(148, 163, 184, 0.1)" strokeWidth="0.6" strokeDasharray="3 4" />
                ))}
                <path d="M10 48 C24 38, 40 34, 60 32 S82 31, 90 24" fill="none" stroke="rgba(34, 197, 94, 0.14)" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M12 18 C28 12, 48 11, 70 16 S85 22, 90 18" fill="none" stroke="rgba(96, 165, 250, 0.14)" strokeWidth="1.2" strokeDasharray="4 3" />
              </>
            )}

            {plottedLocations.map((location) => (
              <g key={location.id} transform={`translate(${location.x} ${location.y})`}>
                <circle r="5" fill="rgba(34, 197, 94, 0.14)" />
                <circle r="2.4" fill="rgb(34, 197, 94)" stroke="rgba(255,255,255,0.8)" strokeWidth="0.8" />
                <text
                  x={location.labelDx}
                  y={location.labelDy}
                  textAnchor={location.labelAnchor}
                  fill="rgba(248, 250, 252, 0.96)"
                  fontSize="2.8"
                  fontWeight="600"
                  stroke="rgba(2, 6, 23, 0.95)"
                  strokeWidth="0.9"
                  paintOrder="stroke"
                >
                  {location.name}
                </text>
              </g>
            ))}
          </g>
        </svg>
      </div>

      <div className="mt-3 space-y-2">
        {plottedLocations.map((location) => (
          <div key={location.id} className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-foreground">{location.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{location.address}</p>
            </div>
            <span className="ml-3 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
              <MapPin className="h-2.5 w-2.5" />
              {location.videos.length} feeds
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
