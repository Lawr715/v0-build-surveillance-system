"use client"

import { useState, useEffect, useCallback } from "react"
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
import { MapPin, Search, Loader2 } from "lucide-react"
import { searchLocations } from "@/lib/api"

const SEARCHABLE_LOCATIONS: Array<{
  aliases: string[]
  lat: number
  lng: number
  address: string
}> = [
  {
    aliases: ["edsa sec walk", "edsa sec walkway", "xavier hall", "xavier"],
    lat: 14.6397,
    lng: 121.0775,
    address: "EDSA Sec Walk, Xavier Hall, Ateneo de Manila University",
  },
  {
    aliases: ["kostka walk", "kostka walkway", "kostka hall", "kostka"],
    lat: 14.639,
    lng: 121.0781,
    address: "Kostka Walk, Kostka Hall, Ateneo de Manila University",
  },
  {
    aliases: ["gate 1", "gate 1 walkway", "gate one"],
    lat: 14.6418,
    lng: 121.0758,
    address: "Gate 1 Walkway, Ateneo de Manila University",
  },
  {
    aliases: ["gate 3", "gate 3 walkway", "gate three"],
    lat: 14.6376,
    lng: 121.0742,
    address: "Gate 3 Walkway, Ateneo de Manila University",
  },
  {
    aliases: ["manila"],
    lat: 14.5995,
    lng: 120.9842,
    address: "Manila, Philippines",
  },
  {
    aliases: ["tokyo"],
    lat: 35.6762,
    lng: 139.6503,
    address: "Tokyo, Japan",
  },
]

function normalizeSearchQuery(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim()
}

function findFallbackMatch(normalizedQuery: string) {
  return SEARCHABLE_LOCATIONS.find(({ aliases }) => aliases.some((alias) => normalizedQuery.includes(alias) || alias.includes(normalizedQuery)))
}

interface LocationFormData {
  name: string
  latitude: number
  longitude: number
  description: string
  address: string
}

interface AddLocationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialData?: LocationFormData | null
  onSubmitLocation?: (data: LocationFormData) => void | Promise<void>
}

export function AddLocationModal({ open, onOpenChange, initialData = null, onSubmitLocation }: AddLocationModalProps) {
  const [name, setName] = useState("")
  const [latitude, setLatitude] = useState("")
  const [longitude, setLongitude] = useState("")
  const [description, setDescription] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [address, setAddress] = useState("")
  const [searchError, setSearchError] = useState<string | null>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = Boolean(initialData)

  const resetForm = useCallback((nextData?: LocationFormData | null) => {
    setName(nextData?.name ?? "")
    setLatitude(nextData ? nextData.latitude.toString() : "")
    setLongitude(nextData ? nextData.longitude.toString() : "")
    setDescription(nextData?.description ?? "")
    setSearchQuery(nextData?.address ?? nextData?.name ?? "")
    setAddress(nextData?.address ?? "")
    setSearchError(null)
  }, [])

  useEffect(() => {
    if (!open) return
    resetForm(initialData)
  }, [initialData, open, resetForm])

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || isSearching) return

    setIsSearching(true)
    setSearchError(null)

    const normalizedQuery = normalizeSearchQuery(searchQuery)
    const fallbackMatch = findFallbackMatch(normalizedQuery)
    let foundResult = false
    let remoteSearchError: string | null = null

    try {
      const results = await searchLocations(searchQuery.trim())
      const firstResult = results[0]

      if (firstResult) {
        setLatitude(firstResult.latitude.toString())
        setLongitude(firstResult.longitude.toString())
        setAddress(firstResult.address)
        if (!name.trim()) {
          setName(firstResult.name || searchQuery.trim())
        }
        foundResult = true
      }
    } catch (error) {
      remoteSearchError = error instanceof Error ? error.message : "Location search is unavailable right now."
    } finally {
      if (!foundResult && fallbackMatch) {
        setLatitude(fallbackMatch.lat.toString())
        setLongitude(fallbackMatch.lng.toString())
        setAddress(fallbackMatch.address)
        if (!name.trim()) {
          setName(searchQuery.trim())
        }
        foundResult = true
      }

      if (!foundResult) {
        setSearchError(remoteSearchError ?? "Location not found. Try a more specific name or enter the coordinates manually.")
      }

      setIsSearching(false)
    }
  }, [isSearching, name, searchQuery])

  const handleSubmit = async () => {
    if (!name || !latitude || !longitude || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onSubmitLocation?.({
        name,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        description,
        address,
      })
      handleClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    resetForm(null)
    setIsSearching(false)
    setSearchError(null)
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleClose()
        } else {
          onOpenChange(nextOpen)
        }
      }}
    >
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <MapPin className="w-5 h-5" />
            {isEditing ? "Edit Location" : "Add New Location"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isEditing ? "Update the location details and camera coordinates." : "Search for a place or enter GPS coordinates manually."}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Place Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Search Location</label>
            <div className="flex gap-2">
              <Input 
                placeholder="Search for a place..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    void handleSearch()
                  }
                }}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
              <Button 
                variant="outline" 
                onClick={() => void handleSearch()}
                disabled={isSearching || isSubmitting}
                className="border-border shrink-0"
              >
                {isSearching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>
            {address && (
              <p className="text-xs text-muted-foreground">Found: {address}</p>
            )}
            {searchError && (
              <p className="text-xs text-destructive">{searchError}</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Location Name</label>
            <Input 
              placeholder="e.g., Gate 1 Walkway" 
              value={name}
              onChange={(e) => setName(e.target.value)}
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
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Longitude</label>
              <Input 
                type="number" 
                step="0.000001"
                placeholder="-74.0060" 
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* Mini Map Preview */}
          {latitude && longitude && (
            <div className="rounded-lg overflow-hidden border border-border bg-muted h-32 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="w-6 h-6 text-primary mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">
                  {parseFloat(latitude).toFixed(4)}, {parseFloat(longitude).toFixed(4)}
                </p>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Description (Optional)</label>
            <Input 
              placeholder="Brief description of the location" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-secondary border-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting} className="border-border text-foreground">
            Cancel
          </Button>
          <Button 
            onClick={() => void handleSubmit()}
            disabled={!name || !latitude || !longitude || isSubmitting}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Add Location"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
