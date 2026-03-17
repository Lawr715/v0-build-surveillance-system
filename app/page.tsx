"use client"

import { useState } from "react"
import { VideoGrid } from "@/components/surveillance/video-grid"
import { EventFeed } from "@/components/surveillance/event-feed"
import { AISearchBar } from "@/components/surveillance/ai-search-bar"
import { AddLocationModal } from "@/components/surveillance/add-location-modal"
import { AddVideoModal } from "@/components/surveillance/add-video-modal"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Eye, MapPin, Video, ScanLine } from "lucide-react"

export default function SurveillancePage() {
  const [detectionMode, setDetectionMode] = useState(true)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [videoModalOpen, setVideoModalOpen] = useState(false)

  return (
    <div className="flex h-full">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
          <h1 className="text-xl font-semibold text-foreground">Surveillance Overview</h1>
          
          <div className="flex items-center gap-3">
            {/* Detection Mode Toggle */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary border border-border">
              <ScanLine className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">Detection Mode</span>
              <Switch
                checked={detectionMode}
                onCheckedChange={setDetectionMode}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            {/* Add Location Button */}
            <Button
              variant="outline"
              className="border-border text-foreground hover:bg-secondary"
              onClick={() => setLocationModalOpen(true)}
            >
              <MapPin className="w-4 h-4 mr-2" />
              Add Location
            </Button>

            {/* Add Video Button */}
            <Button
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              onClick={() => setVideoModalOpen(true)}
            >
              <Video className="w-4 h-4 mr-2" />
              Add Video
            </Button>
          </div>
        </header>

        {/* Video Grid */}
        <div className="flex-1 overflow-auto p-6">
          <VideoGrid detectionMode={detectionMode} />
        </div>
      </div>

      {/* Right Sidebar */}
      <aside className="w-80 border-l border-border bg-card flex flex-col h-full">
        <AISearchBar />
        <EventFeed />
      </aside>

      {/* Modals */}
      <AddLocationModal open={locationModalOpen} onOpenChange={setLocationModalOpen} />
      <AddVideoModal open={videoModalOpen} onOpenChange={setVideoModalOpen} />
    </div>
  )
}
