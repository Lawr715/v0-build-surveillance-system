"use client"

import { MapPin } from "lucide-react"

interface Location {
  id: string
  name: string
  latitude: number
  longitude: number
  videos: Array<{ id: string }>
}

interface LocationMapProps {
  locations: Location[]
}

export function LocationMap({ locations }: LocationMapProps) {
  // Calculate bounds for the map
  const minLat = Math.min(...locations.map(l => l.latitude))
  const maxLat = Math.max(...locations.map(l => l.latitude))
  const minLng = Math.min(...locations.map(l => l.longitude))
  const maxLng = Math.max(...locations.map(l => l.longitude))
  
  // Calculate normalized positions (0-100)
  const getPosition = (lat: number, lng: number) => {
    const latRange = maxLat - minLat || 0.01
    const lngRange = maxLng - minLng || 0.01
    
    return {
      x: ((lng - minLng) / lngRange) * 70 + 15, // 15-85% range
      y: ((maxLat - lat) / latRange) * 50 + 25, // 25-75% range (inverted for map)
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-secondary/50 p-3 shadow-elevated-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-medium text-foreground">Location Overview</h3>
        <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-muted">{locations.length} locations</span>
      </div>
      
      {/* Compact Map Visualization */}
      <div className="relative h-28 bg-background/50 rounded-xl overflow-hidden">
        {/* Subtle grid */}
        <div className="absolute inset-0 opacity-30">
          {[0, 33, 66, 100].map((percent) => (
            <div
              key={`h-${percent}`}
              className="absolute w-full border-t border-border/50"
              style={{ top: `${percent}%` }}
            />
          ))}
          {[0, 33, 66, 100].map((percent) => (
            <div
              key={`v-${percent}`}
              className="absolute h-full border-l border-border/50"
              style={{ left: `${percent}%` }}
            />
          ))}
        </div>
        
        {/* Location markers */}
        {locations.map((location) => {
          const pos = getPosition(location.latitude, location.longitude)
          return (
            <div
              key={location.id}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              {/* Glow effect */}
              <div className="absolute inset-0 w-6 h-6 -ml-2 -mt-2 rounded-full bg-primary/30 animate-pulse" />
              
              {/* Marker */}
              <div className="relative w-3 h-3 rounded-full bg-primary border-2 border-background shadow-lg flex items-center justify-center">
                <div className="w-1 h-1 rounded-full bg-white" />
              </div>
              
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-popover text-popover-foreground text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-elevated-sm border border-border z-10">
                {location.name}
                <span className="ml-1 text-accent font-medium">({location.videos.length})</span>
              </div>
            </div>
          )
        })}
        
        {/* Map label */}
        <div className="absolute bottom-1.5 right-1.5 text-[9px] text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded-lg flex items-center gap-1">
          <MapPin className="w-2.5 h-2.5" />
          Area
        </div>
      </div>
    </div>
  )
}
