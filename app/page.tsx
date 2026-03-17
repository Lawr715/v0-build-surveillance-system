"use client"

import { useState, useMemo } from "react"
import { VideoGrid } from "@/components/surveillance/video-grid"
import { EventFeed } from "@/components/surveillance/event-feed"
import { AISearchBar } from "@/components/surveillance/ai-search-bar"
import { AddLocationModal } from "@/components/surveillance/add-location-modal"
import { AddVideoModal } from "@/components/surveillance/add-video-modal"
import { LocationMap } from "@/components/surveillance/location-map"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { MapPin, Video, ScanLine, Calendar, X } from "lucide-react"

// Mock data for locations with coordinates
const initialLocations = [
  {
    id: "north-gate",
    name: "North Gate",
    latitude: 14.5547,
    longitude: 121.0244,
    videos: [
      { id: "1", timestamp: "10:45:32 AM", date: "2026-03-15", startTime: "10:00", endTime: "11:00" },
      { id: "2", timestamp: "10:42:18 AM", date: "2026-03-13", startTime: "10:00", endTime: "11:00" },
    ]
  },
  {
    id: "main-hall",
    name: "Main Hall",
    latitude: 14.5565,
    longitude: 121.0220,
    videos: [
      { id: "3", timestamp: "10:38:55 AM", date: "2026-03-15", startTime: "10:00", endTime: "11:00" },
    ]
  },
  {
    id: "parking-a",
    name: "Parking Lot A",
    latitude: 14.5530,
    longitude: 121.0260,
    videos: [
      { id: "4", timestamp: "10:30:12 AM", date: "2026-03-13", startTime: "10:00", endTime: "11:00" },
      { id: "5", timestamp: "10:25:44 AM", date: "2026-03-15", startTime: "10:00", endTime: "11:00" },
    ]
  }
]

export default function SurveillancePage() {
  const [detectionMode, setDetectionMode] = useState(true)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [videoModalOpen, setVideoModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  const [locations, setLocations] = useState(initialLocations)

  // Filter videos by selected date
  const filteredLocations = useMemo(() => {
    if (!selectedDate) return locations
    
    return locations.map(location => ({
      ...location,
      videos: location.videos.filter(video => video.date === selectedDate)
    })).filter(location => location.videos.length > 0)
  }, [locations, selectedDate])

  const handleAddLocation = (data: {
    name: string
    latitude: number
    longitude: number
    description: string
    address: string
  }) => {
    const newLocation = {
      id: data.name.toLowerCase().replace(/\s+/g, '-'),
      name: data.name,
      latitude: data.latitude,
      longitude: data.longitude,
      videos: []
    }
    setLocations(prev => [...prev, newLocation])
  }

  const handleAddVideo = (data: {
    file: File
    locationId: string
    date: string
    startTime: string
    endTime: string
  }) => {
    const newVideo = {
      id: `video-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString(),
      date: data.date,
      startTime: data.startTime,
      endTime: data.endTime,
    }
    
    setLocations(prev => prev.map(loc => 
      loc.id === data.locationId 
        ? { ...loc, videos: [...loc.videos, newVideo] }
        : loc
    ))
  }

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
          <h1 className="text-xl font-semibold text-white shrink-0 mr-6">Surveillance Overview</h1>
          
          <div className="flex items-center gap-3 flex-wrap justify-end">
            {/* Date Filter */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-secondary border border-border">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border-0 bg-transparent p-0 h-auto text-sm w-36 focus-visible:ring-0"
              />
              {selectedDate && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 hover:bg-muted rounded-full"
                  onClick={() => setSelectedDate("")}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>

            {/* Detection Mode Toggle */}
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-secondary border border-border">
              <ScanLine className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-foreground">Detection</span>
              <Switch
                checked={detectionMode}
                onCheckedChange={setDetectionMode}
                className="data-[state=checked]:bg-accent"
              />
            </div>

            {/* Add Location Button */}
            <Button
              variant="outline"
              className="border-border text-foreground hover:bg-secondary rounded-2xl px-4"
              onClick={() => setLocationModalOpen(true)}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Add Location
            </Button>

            {/* Add Video Button */}
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl px-4 shadow-elevated-sm"
              onClick={() => setVideoModalOpen(true)}
            >
              <Video className="w-4 h-4 mr-2" />
              Add Video
            </Button>
          </div>
        </header>

        {/* Video Grid */}
        <div className="flex-1 overflow-auto p-6">
          {/* Video Grid */}
          {filteredLocations.length > 0 ? (
            <VideoGrid 
              locations={filteredLocations} 
              detectionMode={detectionMode} 
              onAddVideoClick={() => setVideoModalOpen(true)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center mb-4">
                <Video className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">No videos found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {selectedDate 
                  ? `No videos available for ${new Date(selectedDate).toLocaleDateString()}`
                  : "Add a video to get started"
                }
              </p>
              {selectedDate && (
                <Button variant="outline" onClick={() => setSelectedDate("")} className="rounded-2xl">
                  Clear date filter
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <aside className="w-80 border-l border-border bg-card/30 flex flex-col h-full">
        <AISearchBar />
        {/* Location Map - Below Search Bar */}
        <div className="px-4 pb-4">
          <LocationMap locations={locations} />
        </div>
        <EventFeed />
      </aside>

      {/* Modals */}
      <AddLocationModal 
        open={locationModalOpen} 
        onOpenChange={setLocationModalOpen}
        onAddLocation={handleAddLocation}
      />
      <AddVideoModal 
        open={videoModalOpen} 
        onOpenChange={setVideoModalOpen}
        locations={locations.map(l => ({ id: l.id, name: l.name }))}
        onAddVideo={handleAddVideo}
      />
    </div>
  )
}
