"use client"

import { useState } from "react"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { PedestrianChart } from "@/components/dashboard/pedestrian-chart"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Clock, Download, RefreshCw } from "lucide-react"

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState("1h")

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div>
          <h1 className="text-xl font-semibold text-foreground">System Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time pedestrian tracking metrics</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Time Range Filter */}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-44 bg-secondary border-border text-foreground">
              <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="1h" className="text-foreground">Last 1 Hour</SelectItem>
              <SelectItem value="6h" className="text-foreground">Last 6 Hours</SelectItem>
              <SelectItem value="24h" className="text-foreground">Last 24 Hours</SelectItem>
              <SelectItem value="7d" className="text-foreground">Last 7 Days</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" className="border-border text-foreground hover:bg-secondary">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>

          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* KPI Cards */}
        <KPICards />

        {/* Main Chart */}
        <PedestrianChart timeRange={timeRange} />
      </div>
    </div>
  )
}
