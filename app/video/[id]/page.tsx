"use client"

import { use } from "react"
import Link from "next/link"
import { VideoPlayer } from "@/components/video/video-player"
import { VideoMetadata } from "@/components/video/video-metadata"
import { PlaybackTimeline } from "@/components/video/playback-timeline"
import { EventFeed } from "@/components/surveillance/event-feed"
import { AISearchBar } from "@/components/surveillance/ai-search-bar"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Download, Share2 } from "lucide-react"

// Mock video data
const videoData: Record<string, {
  location: string
  date: string
  startTime: string
  endTime: string
  gpsLat: number
  gpsLng: number
  pedestrianCount: number
}> = {
  "1": { location: "North Gate", date: "2024-03-15", startTime: "10:00:00", endTime: "11:00:00", gpsLat: 40.7128, gpsLng: -74.0060, pedestrianCount: 156 },
  "2": { location: "North Gate", date: "2024-03-15", startTime: "09:00:00", endTime: "10:00:00", gpsLat: 40.7128, gpsLng: -74.0060, pedestrianCount: 89 },
  "3": { location: "Main Hall", date: "2024-03-15", startTime: "10:00:00", endTime: "11:00:00", gpsLat: 40.7589, gpsLng: -73.9851, pedestrianCount: 234 },
  "4": { location: "Parking Lot A", date: "2024-03-15", startTime: "10:00:00", endTime: "11:00:00", gpsLat: 40.7484, gpsLng: -73.9857, pedestrianCount: 45 },
  "5": { location: "Parking Lot A", date: "2024-03-15", startTime: "09:00:00", endTime: "10:00:00", gpsLat: 40.7484, gpsLng: -73.9857, pedestrianCount: 67 },
}

export default function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const video = videoData[id] || videoData["1"]

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-semibold text-foreground">{video.location}</h1>
              <p className="text-sm text-muted-foreground">Video Feed #{id}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </header>

        {/* Video Player and Controls */}
        <div className="flex-1 overflow-auto p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Video Player with Bounding Boxes */}
            <VideoPlayer videoId={id} location={video.location} />
            
            {/* Playback Timeline */}
            <PlaybackTimeline 
              startTime={video.startTime} 
              endTime={video.endTime} 
            />
            
            {/* Metadata Section */}
            <VideoMetadata 
              date={video.date}
              startTime={video.startTime}
              endTime={video.endTime}
              gpsLat={video.gpsLat}
              gpsLng={video.gpsLng}
              pedestrianCount={video.pedestrianCount}
            />
          </div>
        </div>
      </div>

      {/* Right Sidebar - Filtered Event Feed */}
      <aside className="w-80 border-l border-border bg-card flex flex-col h-full">
        <AISearchBar />
        <EventFeed filteredVideoId={id} />
        
        {/* Detection Details */}
        <div className="p-4 border-t border-border">
          <h4 className="text-sm font-medium text-foreground mb-3">Detection Details</h4>
          <div className="space-y-2">
            <DetectionDetail id={45} status="Heavy Occlusion" />
            <DetectionDetail id={32} status="Clear Track" />
            <DetectionDetail id={18} status="Partial Occlusion" />
          </div>
        </div>
      </aside>
    </div>
  )
}

function DetectionDetail({ id, status }: { id: number; status: string }) {
  const statusColor = status === "Clear Track" ? "text-primary" : status === "Heavy Occlusion" ? "text-destructive" : "text-accent"
  
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 border border-border">
      <span className="text-sm text-foreground">Pedestrian ID #{id}</span>
      <span className={`text-xs ${statusColor}`}>{status}</span>
    </div>
  )
}
