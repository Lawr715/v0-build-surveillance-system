"use client"

import { Sparkles } from "lucide-react"

interface AISynthesisProps {
  selectedDate: string
  timeRange: string
}

export function AISynthesis({ selectedDate, timeRange }: AISynthesisProps) {
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
    })
  }

  return (
    <div className="rounded-3xl bg-[#2C2C2E] border border-[#3A3A3C] p-6 shadow-elevated">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-elevated-sm">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            ALIVE AI Synthesis
          </h3>
          <p className="text-sm text-muted-foreground">
            Intelligent summary for {formatDate(selectedDate)}
          </p>
        </div>
      </div>

      {/* Content Sections */}
      <div className="space-y-6">
        {/* 1. Executive Overview */}
        <section>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            1. Executive Overview
          </h4>
          <div className="space-y-3 text-sm text-foreground leading-relaxed">
            <p>
              Analysis of surveillance footage across all monitored zones detected a total of{" "}
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#22C55E]/10 text-[#22C55E] font-bold">
                1,452 pedestrians
              </span>{" "}
              during the selected time period. Peak pedestrian density occurred at{" "}
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#F97316]/10 text-[#F97316] font-bold">
                12:05 PM
              </span>{" "}
              with{" "}
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#22C55E]/10 text-[#22C55E] font-bold">
                127 simultaneous detections
              </span>.
            </p>
            <p>
              Overall tracking accuracy remained high at{" "}
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#A855F7]/10 text-[#A855F7] font-bold">
                94.7%
              </span>{" "}
              with ByteTrack maintaining consistent ID assignments. Minor occlusion events were handled effectively with re-identification confidence above{" "}
              <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#A855F7]/10 text-[#A855F7] font-bold">
                89%
              </span>.
            </p>
          </div>
        </section>

        {/* 2. Peak Traffic Events */}
        <section>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            2. Peak Traffic Events
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Event 1 */}
            <div className="p-4 rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Morning Rush</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#F97316]/10 text-[#F97316] font-bold text-xs">
                  8:15 - 9:30 AM
                </span>
              </div>
              <p className="text-sm text-foreground">
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#06B6D4]/10 text-[#06B6D4] font-bold">
                  North Gate
                </span>{" "}
                recorded{" "}
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#22C55E]/10 text-[#22C55E] font-bold">
                  342 entries
                </span>
              </p>
            </div>

            {/* Event 2 */}
            <div className="p-4 rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Lunch Peak</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#F97316]/10 text-[#F97316] font-bold text-xs">
                  12:00 - 1:15 PM
                </span>
              </div>
              <p className="text-sm text-foreground">
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#06B6D4]/10 text-[#06B6D4] font-bold">
                  Main Hall
                </span>{" "}
                recorded{" "}
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#22C55E]/10 text-[#22C55E] font-bold">
                  489 crossings
                </span>
              </p>
            </div>

            {/* Event 3 */}
            <div className="p-4 rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">Evening Exit</span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#F97316]/10 text-[#F97316] font-bold text-xs">
                  5:30 - 6:45 PM
                </span>
              </div>
              <p className="text-sm text-foreground">
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#06B6D4]/10 text-[#06B6D4] font-bold">
                  South Entrance
                </span>{" "}
                recorded{" "}
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#22C55E]/10 text-[#22C55E] font-bold">
                  298 exits
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* 3. Spatial Breakdown */}
        <section>
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            3. Spatial Breakdown
          </h4>
          <div className="space-y-3">
            {/* Location 1 */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C]">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#EF4444]" />
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#06B6D4]/10 text-[#06B6D4] font-bold text-sm">
                  North Gate
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-foreground">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#22C55E]/10 text-[#22C55E] font-bold">
                    456 pedestrians
                  </span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#EF4444]/10 text-[#EF4444] font-bold text-xs">
                  Heavy Occlusion
                </span>
              </div>
            </div>

            {/* Location 2 */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C]">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#F97316]" />
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#06B6D4]/10 text-[#06B6D4] font-bold text-sm">
                  Main Hall
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-foreground">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#22C55E]/10 text-[#22C55E] font-bold">
                    512 pedestrians
                  </span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#F97316]/10 text-[#F97316] font-bold text-xs">
                  Moderate Occlusion
                </span>
              </div>
            </div>

            {/* Location 3 */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C]">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#EAB308]" />
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#06B6D4]/10 text-[#06B6D4] font-bold text-sm">
                  Parking Lot A
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-foreground">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#22C55E]/10 text-[#22C55E] font-bold">
                    234 pedestrians
                  </span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#EAB308]/10 text-[#EAB308] font-bold text-xs">
                  Light Occlusion
                </span>
              </div>
            </div>

            {/* Location 4 */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1C1C1E] border border-[#3A3A3C]">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#F97316]" />
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#06B6D4]/10 text-[#06B6D4] font-bold text-sm">
                  South Entrance
                </span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-foreground">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#22C55E]/10 text-[#22C55E] font-bold">
                    250 pedestrians
                  </span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#F97316]/10 text-[#F97316] font-bold text-xs">
                  Moderate Occlusion
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
