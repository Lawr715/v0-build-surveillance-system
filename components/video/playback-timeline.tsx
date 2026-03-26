"use client"

import { useMemo } from "react"
import type { EventRecord } from "@/lib/api"

interface PlaybackTimelineProps {
  startTime: string
  endTime: string
  durationSeconds: number
  currentTimeSeconds: number
  events: EventRecord[]
  onSeek?: (seconds: number) => void
}

function formatDuration(seconds: number) {
  const totalSeconds = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const remainingSeconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
}

function parseClockMinutes(value: string) {
  const trimmed = value.trim()
  const twelveHourMatch = trimmed.match(/^([0-9]{1,2}):([0-9]{2})(?::[0-9]{2})?\s*(AM|PM)$/i)

  if (twelveHourMatch) {
    let hours = Number(twelveHourMatch[1])
    const minutes = Number(twelveHourMatch[2])
    const period = twelveHourMatch[3].toUpperCase()

    if (period === "PM" && hours < 12) hours += 12
    if (period === "AM" && hours === 12) hours = 0
    return hours * 60 + minutes
  }

  const parts = trimmed.split(":")
  if (parts.length < 2) return null

  const hours = Number(parts[0])
  const minutes = Number(parts[1])
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  return hours * 60 + minutes
}

function formatClock(minutes: number) {
  const normalizedMinutes = ((Math.round(minutes) % 1440) + 1440) % 1440
  const hours24 = Math.floor(normalizedMinutes / 60)
  const mins = normalizedMinutes % 60
  const period = hours24 >= 12 ? "PM" : "AM"
  const hours12 = hours24 % 12 || 12
  return `${hours12}:${mins.toString().padStart(2, "0")} ${period}`
}

export function PlaybackTimeline({ startTime, endTime, durationSeconds, currentTimeSeconds, events, onSeek }: PlaybackTimelineProps) {
  const safeDuration = Number.isFinite(durationSeconds) && durationSeconds > 0 ? durationSeconds : 0
  const safeCurrentTime = Math.max(0, Math.min(currentTimeSeconds, safeDuration || currentTimeSeconds))

  const detectionOffsets = useMemo(
    () => events.flatMap((event) => (typeof event.offsetSeconds === "number" ? [event.offsetSeconds] : [])),
    [events],
  )

  const heatBuckets = useMemo(() => {
    if (!safeDuration) return []

    const bucketCount = 24
    const counts = Array.from({ length: bucketCount }, () => 0)
    detectionOffsets.forEach((offset) => {
      const bucketIndex = Math.min(bucketCount - 1, Math.floor((offset / safeDuration) * bucketCount))
      counts[Math.max(0, bucketIndex)] += 1
    })

    const highestCount = Math.max(...counts, 1)
    return counts.map((count, index) => ({
      left: (index / bucketCount) * 100,
      width: 100 / bucketCount,
      opacity: count > 0 ? 0.15 + count / highestCount : 0.05,
    }))
  }, [detectionOffsets, safeDuration])

  const markerOffsets = useMemo(() => {
    if (!safeDuration) return []

    return Array.from({ length: 5 }, (_, index) => {
      const ratio = index / 4
      const offset = safeDuration * ratio
      return {
        offset,
        label: (() => {
          const startMinutes = parseClockMinutes(startTime)
          if (startMinutes === null) {
            return index === 4 ? endTime : formatDuration(offset)
          }
          return formatClock(startMinutes + offset / 60)
        })(),
      }
    })
  }, [endTime, safeDuration, startTime])

  const currentPosition = safeDuration ? (safeCurrentTime / safeDuration) * 100 : 0
  const currentWallClock = (() => {
    const startMinutes = parseClockMinutes(startTime)
    if (startMinutes === null) return formatDuration(safeCurrentTime)
    return formatClock(startMinutes + safeCurrentTime / 60)
  })()

  const handleSeek = (clientX: number, target: HTMLDivElement) => {
    if (!safeDuration || !onSeek) return
    const rect = target.getBoundingClientRect()
    const relativeX = Math.max(0, Math.min(clientX - rect.left, rect.width))
    onSeek((relativeX / rect.width) * safeDuration)
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-elevated-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-foreground">Playback Timeline</h3>
          <p className="mt-1 text-xs text-muted-foreground">Click anywhere on the bar to jump through the recording.</p>
        </div>
        <div className="text-right text-xs text-muted-foreground">
          <p>{startTime} - {endTime}</p>
          <p className="mt-1 text-foreground">{currentWallClock}</p>
        </div>
      </div>

      {safeDuration > 0 ? (
        <>
          <div
            className="relative mb-2 h-12 overflow-hidden rounded-xl border border-border bg-secondary/70"
            onClick={(event) => handleSeek(event.clientX, event.currentTarget)}
          >
            {heatBuckets.map((bucket) => (
              <div
                key={`${bucket.left}`}
                className="absolute inset-y-0 bg-primary"
                style={{ left: `${bucket.left}%`, width: `${bucket.width}%`, opacity: bucket.opacity }}
              />
            ))}

            {detectionOffsets.map((offset, index) => (
              <div
                key={`${offset}-${index}`}
                className="absolute top-1/2 h-6 w-0.5 -translate-y-1/2 bg-accent/90"
                style={{ left: `${(offset / safeDuration) * 100}%` }}
              />
            ))}

            <div className="absolute inset-y-0 left-0 bg-primary/20" style={{ width: `${currentPosition}%` }} />
            <div className="absolute inset-y-0 z-10 w-0.5 bg-accent" style={{ left: `${currentPosition}%` }}>
              <div className="absolute -top-1 left-1/2 h-3 w-3 -translate-x-1/2 rounded-full border border-background bg-accent" />
            </div>
          </div>

          <div
            className="relative h-2 cursor-pointer rounded-full bg-secondary"
            onClick={(event) => handleSeek(event.clientX, event.currentTarget)}
          >
            <div className="h-full rounded-full bg-primary/50" style={{ width: `${currentPosition}%` }} />
          </div>

          <div className="mt-3 flex justify-between gap-2 text-[10px] text-muted-foreground">
            {markerOffsets.map((marker) => (
              <span key={marker.label}>{marker.label}</span>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm bg-primary/70" />
                Activity heat
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="h-2.5 w-0.5 bg-accent" />
                Detection marker
              </span>
            </div>
            <span>
              {formatDuration(safeCurrentTime)} / {formatDuration(safeDuration)}
            </span>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-6 text-sm text-muted-foreground">
          Timeline controls will activate once the video metadata loads.
        </div>
      )}
    </div>
  )
}
