"use client"

import { useState } from "react"

interface PlaybackTimelineProps {
  startTime: string
  endTime: string
}

// Mock detection events along the timeline
const detectionEvents = [
  { position: 5, count: 3 },
  { position: 15, count: 8 },
  { position: 25, count: 12 },
  { position: 35, count: 5 },
  { position: 45, count: 15 },
  { position: 55, count: 7 },
  { position: 65, count: 20 },
  { position: 75, count: 10 },
  { position: 85, count: 6 },
  { position: 95, count: 4 },
]

export function PlaybackTimeline({ startTime, endTime }: PlaybackTimelineProps) {
  const [currentPosition, setCurrentPosition] = useState(35)

  const generateTimeMarkers = () => {
    const markers = []
    const [startHour] = startTime.split(":").map(Number)
    const [endHour] = endTime.split(":").map(Number)
    const hourCount = endHour - startHour || 1
    
    for (let i = 0; i <= hourCount * 4; i++) {
      const totalMinutes = (i * 15)
      const hour = startHour + Math.floor(totalMinutes / 60)
      const minute = totalMinutes % 60
      markers.push(`${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`)
    }
    return markers.slice(0, 5)
  }

  const timeMarkers = generateTimeMarkers()

  return (
    <div className="p-4 rounded-lg bg-card border border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">Playback Timeline</h3>
        <span className="text-xs text-muted-foreground">
          {startTime} - {endTime}
        </span>
      </div>

      {/* Timeline Container */}
      <div className="relative">
        {/* Detection Heatmap */}
        <div className="h-8 rounded-lg bg-secondary overflow-hidden relative mb-2">
          {detectionEvents.map((event, index) => (
            <div
              key={index}
              className="absolute top-0 bottom-0 w-4"
              style={{
                left: `${event.position}%`,
                background: `rgba(34, 197, 94, ${Math.min(event.count / 20, 0.8)})`,
              }}
            />
          ))}
          
          {/* Current Position Indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-accent z-10 cursor-pointer"
            style={{ left: `${currentPosition}%` }}
          >
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-accent rounded-full" />
          </div>
        </div>

        {/* Clickable Timeline */}
        <div 
          className="h-2 rounded-full bg-secondary cursor-pointer relative"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const x = e.clientX - rect.left
            const percentage = (x / rect.width) * 100
            setCurrentPosition(Math.max(0, Math.min(100, percentage)))
          }}
        >
          <div 
            className="h-full rounded-full bg-primary/50"
            style={{ width: `${currentPosition}%` }}
          />
        </div>

        {/* Time Markers */}
        <div className="flex justify-between mt-2">
          {timeMarkers.map((time, index) => (
            <span key={index} className="text-[10px] text-muted-foreground">
              {time}
            </span>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary/40" />
          <span className="text-xs text-muted-foreground">Low Activity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-primary/80" />
          <span className="text-xs text-muted-foreground">High Activity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-accent" />
          <span className="text-xs text-muted-foreground">Current Position</span>
        </div>
      </div>
    </div>
  )
}
