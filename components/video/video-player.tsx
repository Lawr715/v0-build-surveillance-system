"use client"

import { useState } from "react"
import { Play, Pause, Volume2, Maximize, SkipBack, SkipForward, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"

interface VideoPlayerProps {
  videoId: string
  location: string
}

// Mock bounding boxes for ByteTrack simulation
const boundingBoxes = [
  { id: 45, top: "25%", left: "15%", width: "8%", height: "35%", confidence: 0.95 },
  { id: 32, top: "30%", left: "35%", width: "9%", height: "38%", confidence: 0.89 },
  { id: 18, top: "28%", left: "55%", width: "7%", height: "32%", confidence: 0.92 },
  { id: 67, top: "32%", left: "72%", width: "8%", height: "36%", confidence: 0.87 },
  { id: 23, top: "35%", left: "88%", width: "7%", height: "30%", confidence: 0.91 },
]

export function VideoPlayer({ videoId, location }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(35)
  const [volume, setVolume] = useState([75])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="relative aspect-video bg-secondary rounded-xl overflow-hidden border border-border">
      {/* Video Background Simulation */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950">
        {/* Simulated camera feed with grid */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)`,
            backgroundSize: '30px 30px'
          }}
        />
        
        {/* Noise texture */}
        <div className="absolute inset-0 opacity-5 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 256 256%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.9%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />
      </div>

      {/* ByteTrack Bounding Boxes */}
      {boundingBoxes.map((box) => (
        <div
          key={box.id}
          className="absolute border-2 border-primary rounded-sm transition-all duration-300"
          style={{
            top: box.top,
            left: box.left,
            width: box.width,
            height: box.height,
          }}
        >
          {/* ID Label */}
          <div className="absolute -top-6 left-0 flex items-center gap-1">
            <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded font-medium">
              ID #{box.id}
            </span>
            <span className="text-[10px] bg-accent text-accent-foreground px-1 py-0.5 rounded">
              {(box.confidence * 100).toFixed(0)}%
            </span>
          </div>
          
          {/* Tracking indicator */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full animate-pulse" />
        </div>
      ))}

      {/* Overlay Info */}
      <div className="absolute top-4 left-4 flex items-center gap-3">
        <span className="flex items-center gap-1.5 text-xs text-white bg-black/60 px-2 py-1 rounded">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          REC
        </span>
        <span className="text-xs text-white bg-black/60 px-2 py-1 rounded">
          {location}
        </span>
        <span className="text-xs text-white bg-black/60 px-2 py-1 rounded">
          Feed #{videoId}
        </span>
      </div>

      {/* Detection Count */}
      <div className="absolute top-4 right-4">
        <span className="text-sm font-medium text-white bg-primary/90 px-3 py-1.5 rounded-lg">
          {boundingBoxes.length} Detected
        </span>
      </div>

      {/* Timestamp */}
      <div className="absolute bottom-16 right-4 text-white/80 text-xs bg-black/50 px-2 py-1 rounded">
        2024-03-15 • 10:45:32 AM
      </div>

      {/* Video Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4">
        {/* Progress Bar */}
        <div className="mb-3">
          <Slider
            value={[currentTime]}
            max={100}
            step={1}
            onValueChange={(value) => setCurrentTime(value[0])}
            className="cursor-pointer"
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
            >
              <SkipBack className="w-4 h-4" />
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white hover:bg-white/20 w-10 h-10"
              onClick={() => setIsPlaying(!isPlaying)}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={() => setCurrentTime(Math.min(100, currentTime + 10))}
            >
              <SkipForward className="w-4 h-4" />
            </Button>

            <span className="text-white text-sm ml-2">
              {formatTime(Math.floor(currentTime * 0.6))} / 01:00:00
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 w-28">
              <Volume2 className="w-4 h-4 text-white" />
              <Slider
                value={volume}
                max={100}
                step={1}
                onValueChange={setVolume}
                className="cursor-pointer"
              />
            </div>
            
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <Settings className="w-4 h-4" />
            </Button>
            
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
