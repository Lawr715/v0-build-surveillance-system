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
import { MapPin } from "lucide-react"

interface AddLocationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddLocationModal({ open, onOpenChange }: AddLocationModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <MapPin className="w-5 h-5 text-primary" />
            Add New Location
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Enter the GPS coordinates for the new surveillance location.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Location Name</label>
            <Input 
              placeholder="e.g., South Entrance" 
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Latitude</label>
              <Input 
                type="number" 
                step="0.000001"
                placeholder="40.7128" 
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Longitude</label>
              <Input 
                type="number" 
                step="0.000001"
                placeholder="-74.0060" 
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description (Optional)</label>
            <Input 
              placeholder="Brief description of the location" 
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-border text-foreground">
            Cancel
          </Button>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
            Add Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
