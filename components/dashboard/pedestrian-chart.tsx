"use client"

import { Button } from "@/components/ui/button"
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Loader2, RotateCcw, ZoomIn } from "lucide-react"
import type { LocationTotal, TrafficPoint } from "@/lib/api"

interface PedestrianChartProps {
  timeRange: string
  selectedDate: string
  data: TrafficPoint[]
  locationTotals: LocationTotal[]
  bucketMinutes: number
  isDrilldown: boolean
  focusTime?: string | null
  windowStart?: string | null
  windowEnd?: string | null
  loading?: boolean
  onTimeSelect?: (time: string) => void
  onResetZoom?: () => void
}

const SERIES_COLORS = ["#22C55E", "#06B6D4", "#3B82F6", "#F59E0B", "#A855F7"]

function formatTimeRangeLabel(timeRange: string) {
  return timeRange
    .replace("whole-day", "Whole Day")
    .replace("last-1h", "Last 1 Hour")
    .replace("last-3h", "Last 3 Hours")
    .replace("last-6h", "Last 6 Hours")
    .replace("last-12h", "Last 12 Hours")
    .replace("morning", "Morning")
    .replace("afternoon", "Afternoon")
    .replace("evening", "Evening")
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-2xl border border-border bg-popover p-3 shadow-elevated">
        <p className="mb-2 text-sm font-medium text-foreground">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }

  return null
}

export function PedestrianChart({
  timeRange,
  selectedDate,
  data,
  locationTotals,
  bucketMinutes,
  isDrilldown,
  focusTime,
  windowStart,
  windowEnd,
  loading = false,
  onTimeSelect,
  onResetZoom,
}: PedestrianChartProps) {
  const locations = data.length > 0 ? Object.keys(data[0]).filter((key) => key !== "time") : []
  const totals = locationTotals.length > 0
    ? locationTotals.map((item, index) => ({
        location: item.location,
        count: item.totalPedestrians,
        color: SERIES_COLORS[index % SERIES_COLORS.length],
      }))
    : locations.map((location, index) => ({
        location,
        count: data.reduce((sum, point) => sum + Number(point[location] ?? 0), 0),
        color: SERIES_COLORS[index % SERIES_COLORS.length],
      }))

  const subtitle = isDrilldown
    ? `20-minute drilldown around ${focusTime ?? "the selected hour"} · ${windowStart ?? "--"}–${windowEnd ?? "--"}`
    : `${selectedDate
        ? new Date(selectedDate).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "All dates"} - ${formatTimeRangeLabel(timeRange)}`

  const handleChartClick = (state: unknown) => {
    if (isDrilldown || typeof onTimeSelect !== "function") {
      return
    }
    const candidate = typeof state === "object" && state !== null && "activeLabel" in state ? (state as { activeLabel?: unknown }).activeLabel : undefined
    if (typeof candidate === "string" && candidate) {
      onTimeSelect(candidate)
    }
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-elevated">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Pedestrian Count Over Time</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isDrilldown
              ? `This zoomed view shows whether a pedestrian peak sustains or fades across neighboring ${bucketMinutes}-minute buckets.`
              : "Click any hourly bucket to zoom into a 4-hour, 20-minute drilldown around that time."}
          </p>
        </div>
        {isDrilldown && onResetZoom && (
          <Button variant="outline" size="sm" className="rounded-2xl" onClick={onResetZoom}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset Zoom
          </Button>
        )}
      </div>

      <div className="h-[400px]">
        {loading ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Loading traffic data...
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} onClick={handleChartClick}>
              <defs>
                {locations.map((location, index) => {
                  const gradientId = `${location.replace(/[^a-z0-9]+/gi, "")}-gradient`
                  const color = SERIES_COLORS[index % SERIES_COLORS.length]
                  return (
                    <linearGradient key={gradientId} id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  )
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
              <XAxis dataKey="time" stroke="#71717A" tick={{ fill: "#71717A", fontSize: 12 }} axisLine={{ stroke: "#27272A" }} />
              <YAxis
                stroke="#71717A"
                tick={{ fill: "#71717A", fontSize: 12 }}
                axisLine={{ stroke: "#27272A" }}
                label={{ value: "Pedestrian Count", angle: -90, position: "insideLeft", fill: "#71717A", fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: "20px" }} formatter={(value) => <span className="text-sm text-foreground">{value}</span>} />
              {locations.map((location, index) => {
                const color = SERIES_COLORS[index % SERIES_COLORS.length]
                const gradientId = `${location.replace(/[^a-z0-9]+/gi, "")}-gradient`
                return (
                  <Area
                    key={location}
                    type="monotone"
                    dataKey={location}
                    stroke={color}
                    strokeWidth={2}
                    fill={`url(#${gradientId})`}
                    dot={false}
                    activeDot={{ r: 4, fill: color }}
                    cursor={!isDrilldown ? "pointer" : "default"}
                  />
                )
              })}
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border text-muted-foreground">
            No traffic data is available for this time range yet.
          </div>
        )}
      </div>

      {totals.length > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-6 md:grid-cols-4">
          {totals.map((item) => (
            <ChartStat key={item.location} location={item.location} count={item.count.toLocaleString()} color={item.color} />
          ))}
        </div>
      )}

      {!isDrilldown && data.length > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-border/70 bg-secondary/40 px-3 py-2 text-xs text-muted-foreground">
          <ZoomIn className="h-4 w-4" />
          Click an hourly peak to inspect 20-minute changes before and after the spike.
        </div>
      )}
    </div>
  )
}

function ChartStat({ location, count, color }: { location: string; count: string; color: string }) {
  return (
    <div className="text-center">
      <div className="mb-1 flex items-center justify-center gap-2">
        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm text-muted-foreground">{location}</span>
      </div>
      <p className="text-xl font-bold" style={{ color }}>{count}</p>
    </div>
  )
}
