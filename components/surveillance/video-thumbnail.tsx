"use client"

import Link from "next/link"
import { Wifi, MoreHorizontal } from "lucide-react"

interface VideoThumbnailProps {
  id: string
  location: string
  timestamp: string
  date: string
  thumbnailIndex: number
  detectionMode: boolean
}

// Mock bounding boxes for pedestrian detection
const boundingBoxes = [
  { top: "30%", left: "20%", width: "15%", height: "45%" },
  { top: "25%", left: "55%", width: "12%", height: "50%" },
  { top: "35%", left: "75%", width: "14%", height: "40%" },
]

export function VideoThumbnail({ 
  id, 
  location, 
  timestamp, 
  date, 
  thumbnailIndex,
  detectionMode 
}: VideoThumbnailProps) {
  const pedestrianCount = Math.floor(Math.random() * 50) + 10

  return (
    <Link 
      href={`/video/${id}`}
      className="group relative rounded-lg overflow-hidden bg-secondary border border-border hover:border-primary/50 transition-all"
      style={{ aspectRatio: '16/10' }}
    >
      {/* Mock Video Feed Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900">
        {/* Simulated camera feed pattern */}
        <div className="absolute inset-0 opacity-30">
          <div className="w-full h-full bg-gradient-to-t from-black/60 to-transparent" />
        </div>
      </div>

      {/* Detection Bounding Boxes */}
      {detectionMode && boundingBoxes.map((box, index) => (
        <div
          key={index}
          className="absolute border-2 border-emerald-500 rounded-sm"
          style={{
            top: box.top,
            left: box.left,
            width: box.width,
            height: box.height,
          }}
        >
          <span className="absolute -top-5 left-0 text-[10px] bg-emerald-500 text-white px-1 rounded">
            ID #{(index + 1) * thumbnailIndex}
          </span>
        </div>
      ))}

      {/* Status Indicators */}
      <div className="absolute top-2 left-2 flex items-center gap-2">
        <Wifi className="w-4 h-4 text-emerald-500" />
        <span className="text-[10px] text-white bg-black/50 px-1.5 py-0.5 rounded">LIVE</span>
      </div>

      {/* Pedestrian Count */}
      <div className="absolute top-2 right-2 flex items-center gap-2">
        <span className="text-xs font-medium text-white bg-black/50 px-2 py-1 rounded">
          {pedestrianCount}
        </span>
        <button className="text-white/70 hover:text-white">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3">
        <p className="text-sm font-medium text-white">{location}</p>
        <p className="text-xs text-white/60">{date} • {timestamp}</p>
      </div>

      {/* Hover Overlay */}
      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
    </Link>
  )
}
