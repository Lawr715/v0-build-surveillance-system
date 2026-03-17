"use client"

import { VideoThumbnail } from "./video-thumbnail"
import { Plus } from "lucide-react"

const locations = [
  {
    name: "North Gate",
    id: "north-gate",
    videos: [
      { id: "1", timestamp: "10:45:32 AM", date: "2024-03-15", thumbnail: 1 },
      { id: "2", timestamp: "10:42:18 AM", date: "2024-03-15", thumbnail: 2 },
    ]
  },
  {
    name: "Main Hall",
    id: "main-hall",
    videos: [
      { id: "3", timestamp: "10:38:55 AM", date: "2024-03-15", thumbnail: 3 },
    ]
  },
  {
    name: "Parking Lot A",
    id: "parking-a",
    videos: [
      { id: "4", timestamp: "10:30:12 AM", date: "2024-03-15", thumbnail: 4 },
      { id: "5", timestamp: "10:25:44 AM", date: "2024-03-15", thumbnail: 5 },
    ]
  }
]

interface VideoGridProps {
  detectionMode: boolean
}

export function VideoGrid({ detectionMode }: VideoGridProps) {
  return (
    <div className="space-y-8">
      {locations.map((location) => (
        <div key={location.id}>
          <h2 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
            {location.name}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Video Thumbnails */}
            {location.videos.map((video) => (
              <VideoThumbnail
                key={video.id}
                id={video.id}
                location={location.name}
                timestamp={video.timestamp}
                date={video.date}
                thumbnailIndex={video.thumbnail}
                detectionMode={detectionMode}
              />
            ))}
            
            {/* Empty Placeholder Boxes */}
            {[1, 2].map((placeholder) => (
              <button
                key={`placeholder-${placeholder}`}
                className="rounded-lg border-2 border-dashed border-border bg-muted/50 flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-muted transition-all cursor-pointer group"
                style={{ aspectRatio: '16/10' }}
              >
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                  <Plus className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                  Add Video
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
