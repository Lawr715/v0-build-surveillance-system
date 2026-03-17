"use client"

import { AlertCircle, User } from "lucide-react"

interface Event {
  id: string
  type: "detection" | "alert" | "motion"
  location: string
  timestamp: string
  description: string
  pedestrianId?: number
}

const events: Event[] = [
  { id: "1", type: "detection", location: "North Gate", timestamp: "10:45:32 AM", description: "3 pedestrians detected", pedestrianId: 45 },
  { id: "2", type: "alert", location: "Main Hall", timestamp: "10:42:18 AM", description: "Unusual activity detected" },
  { id: "3", type: "motion", location: "Parking Lot A", timestamp: "10:38:55 AM", description: "Vehicle movement detected" },
  { id: "4", type: "detection", location: "North Gate", timestamp: "10:35:12 AM", description: "5 pedestrians detected", pedestrianId: 32 },
  { id: "5", type: "detection", location: "Main Hall", timestamp: "10:30:44 AM", description: "2 pedestrians detected", pedestrianId: 18 },
  { id: "6", type: "alert", location: "Parking Lot A", timestamp: "10:25:33 AM", description: "Perimeter breach alert" },
  { id: "7", type: "detection", location: "North Gate", timestamp: "10:20:15 AM", description: "4 pedestrians detected", pedestrianId: 12 },
  { id: "8", type: "motion", location: "Main Hall", timestamp: "10:15:28 AM", description: "Rapid movement detected" },
]

interface EventFeedProps {
  filteredVideoId?: string
}

export function EventFeed({ filteredVideoId }: EventFeedProps) {
  const displayEvents = filteredVideoId 
    ? events.filter((_, i) => i % 2 === 0).slice(0, 5) 
    : events

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-medium text-foreground">Event Feed</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {filteredVideoId ? "Video-specific events" : "Real-time detections"}
        </p>
      </div>
      
      <div className="flex-1 overflow-auto">
        <div className="p-2 space-y-2">
          {displayEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      </div>
    </div>
  )
}

function EventCard({ event }: { event: Event }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-all cursor-pointer">
      <div className="flex items-start gap-3">
        {/* Thumbnail placeholder */}
        <div className="w-14 h-10 rounded bg-slate-700 flex items-center justify-center shrink-0">
          {event.type === "detection" ? (
            <User className="w-4 h-4 text-white" />
          ) : (
            <AlertCircle className="w-4 h-4 text-white" />
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{event.location}</p>
          <p className="text-xs text-muted-foreground">{event.description}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{event.timestamp}</p>
          {event.pedestrianId && (
            <span className="inline-flex items-center mt-1 text-[10px] text-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
              Pedestrian ID #{event.pedestrianId}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
