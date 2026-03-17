"use client"

import { useState } from "react"
import { KPICards } from "@/components/dashboard/kpi-cards"
import { PedestrianChart } from "@/components/dashboard/pedestrian-chart"
import { OcclusionMap } from "@/components/dashboard/occlusion-map"
import { AISynthesis } from "@/components/dashboard/ai-synthesis"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Calendar, Clock, Download, RefreshCw, Settings2, Upload, FileCode } from "lucide-react"

export default function DashboardPage() {
  const [selectedDate, setSelectedDate] = useState("2026-03-15")
  const [timeRange, setTimeRange] = useState("whole-day")
  const [hourFilter, setHourFilter] = useState("all")
  const [modelDialogOpen, setModelDialogOpen] = useState(false)
  const [modelFile, setModelFile] = useState<File | null>(null)
  const [currentModel, setCurrentModel] = useState("yolov8n-bytetrack.pt")

  const handleModelUpload = () => {
    if (modelFile) {
      setCurrentModel(modelFile.name)
      setModelDialogOpen(false)
      setModelFile(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/50 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-semibold text-foreground">System Analytics Dashboard</h1>
          <p className="text-sm text-muted-foreground">Real-time pedestrian tracking metrics</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Date Filter */}
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-secondary border border-border">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border-0 bg-transparent p-0 h-auto text-sm w-36 focus-visible:ring-0"
            />
          </div>

          {/* Time Range Filter */}
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-44 bg-secondary border-border text-foreground rounded-2xl">
              <Clock className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Select time range" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border rounded-xl">
              <SelectItem value="whole-day" className="text-foreground rounded-lg">Whole Day</SelectItem>
              <SelectItem value="last-1h" className="text-foreground rounded-lg">Last 1 Hour</SelectItem>
              <SelectItem value="last-3h" className="text-foreground rounded-lg">Last 3 Hours</SelectItem>
              <SelectItem value="last-6h" className="text-foreground rounded-lg">Last 6 Hours</SelectItem>
              <SelectItem value="last-12h" className="text-foreground rounded-lg">Last 12 Hours</SelectItem>
              <SelectItem value="morning" className="text-foreground rounded-lg">Morning (6AM-12PM)</SelectItem>
              <SelectItem value="afternoon" className="text-foreground rounded-lg">Afternoon (12PM-6PM)</SelectItem>
              <SelectItem value="evening" className="text-foreground rounded-lg">Evening (6PM-12AM)</SelectItem>
            </SelectContent>
          </Select>

          {/* Edit Model Button */}
          <Dialog open={modelDialogOpen} onOpenChange={setModelDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-border text-foreground hover:bg-secondary rounded-2xl px-4">
                <Settings2 className="w-4 h-4 mr-2" />
                Edit Model
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border rounded-3xl max-w-md">
              <DialogHeader>
                <DialogTitle className="text-foreground">Detection Model Settings</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Upload a PyTorch model file (.pt) for pedestrian detection
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 pt-4">
                {/* Current Model */}
                <div className="p-4 rounded-2xl bg-secondary border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                      <FileCode className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Current Model</p>
                      <p className="text-xs text-muted-foreground">{currentModel}</p>
                    </div>
                  </div>
                </div>

                {/* Upload New Model */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Upload New Model</label>
                  <div 
                    className={`border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${
                      modelFile ? 'border-accent bg-accent/10' : 'border-border hover:border-muted-foreground'
                    }`}
                  >
                    <input
                      type="file"
                      accept=".pt"
                      onChange={(e) => setModelFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="model-upload"
                    />
                    <label htmlFor="model-upload" className="cursor-pointer">
                      <Upload className={`w-8 h-8 mx-auto mb-2 ${modelFile ? 'text-accent' : 'text-muted-foreground'}`} />
                      {modelFile ? (
                        <p className="text-sm text-accent font-medium">{modelFile.name}</p>
                      ) : (
                        <>
                          <p className="text-sm text-foreground">Click to upload .pt file</p>
                          <p className="text-xs text-muted-foreground mt-1">PyTorch model weights</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>

                <Button 
                  onClick={handleModelUpload}
                  disabled={!modelFile}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-2xl"
                >
                  Update Model
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="border-border text-foreground hover:bg-secondary rounded-2xl px-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>

          <Button className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-2xl px-4 shadow-elevated-sm">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </header>

      {/* Dashboard Content */}
      <div className="flex-1 overflow-auto p-6 space-y-6">
        {/* KPI Cards */}
        <KPICards />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Main Chart */}
          <PedestrianChart timeRange={timeRange} selectedDate={selectedDate} />
          
          {/* Occlusion Severity Map */}
          <OcclusionMap hourFilter={hourFilter} onHourFilterChange={setHourFilter} />
        </div>

        {/* AI Synthesis Card */}
        <AISynthesis selectedDate={selectedDate} timeRange={timeRange} />
      </div>
    </div>
  )
}
