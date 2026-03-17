"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Video } from "lucide-react"

interface AddVideoModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const locations = [
  { id: "north-gate", name: "North Gate" },
  { id: "main-hall", name: "Main Hall" },
  { id: "parking-a", name: "Parking Lot A" },
]

export function AddVideoModal({ open, onOpenChange }: AddVideoModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Video className="w-5 h-5 text-primary" />
            Add New Video Feed
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configure the video feed settings and time range.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Location</label>
            <Select>
              <SelectTrigger className="bg-secondary border-border text-foreground">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {locations.map((loc) => (
                  <SelectItem key={loc.id} value={loc.id} className="text-foreground">
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Date</label>
            <Input 
              type="date" 
              className="bg-secondary border-border text-foreground"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Start Time</label>
              <Input 
                type="time" 
                className="bg-secondary border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">End Time</label>
              <Input 
                type="time" 
                className="bg-secondary border-border text-foreground"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Video Source URL</label>
            <Input 
              placeholder="rtsp://camera-stream-url" 
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border text-foreground">
            Cancel
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Add Video
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
