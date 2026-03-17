"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Sparkles, Play, Clock, MapPin, Calendar } from "lucide-react"

// Mock search results
const searchResults = [
  {
    id: "1",
    timestamp: "10:45:32 AM",
    date: "2024-03-15",
    location: "North Gate",
    confidence: 94,
    matchReason: "Red shirt detected on pedestrian ID #45",
  },
  {
    id: "2",
    timestamp: "10:32:18 AM",
    date: "2024-03-15",
    location: "Main Hall",
    confidence: 89,
    matchReason: "Red shirt detected on pedestrian ID #32",
  },
  {
    id: "3",
    timestamp: "10:15:44 AM",
    date: "2024-03-15",
    location: "Parking Lot A",
    confidence: 87,
    matchReason: "Red shirt detected on pedestrian ID #18",
  },
  {
    id: "4",
    timestamp: "09:58:22 AM",
    date: "2024-03-15",
    location: "North Gate",
    confidence: 82,
    matchReason: "Red shirt detected on pedestrian ID #67",
  },
  {
    id: "5",
    timestamp: "09:45:11 AM",
    date: "2024-03-15",
    location: "South Entrance",
    confidence: 78,
    matchReason: "Red shirt detected on pedestrian ID #23",
  },
]

function SearchContent() {
  const searchParams = useSearchParams()
  const query = searchParams.get("q") || "pedestrians with red shirt"

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <h1 className="text-xl font-semibold text-foreground">AI Search Results</h1>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Query: {'"'}{query}{'"'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {searchResults.length} matches found
          </span>
        </div>
      </header>

      {/* Search Results */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              Showing top {searchResults.length} video snippets in chronological order
            </p>
          </div>

          {/* Result Cards */}
          {searchResults.map((result, index) => (
            <SearchResultCard 
              key={result.id} 
              result={result} 
              index={index + 1}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function SearchResultCard({ 
  result, 
  index 
}: { 
  result: typeof searchResults[0]
  index: number 
}) {
  return (
    <div className="flex gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all group">
      {/* Thumbnail */}
      <div className="relative w-64 aspect-video rounded-lg overflow-hidden bg-secondary shrink-0">
        {/* Mock video thumbnail */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950">
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
                                linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)`,
              backgroundSize: '15px 15px'
            }}
          />
        </div>
        
        {/* Bounding box highlight */}
        <div className="absolute top-1/4 left-1/3 w-12 h-20 border-2 border-primary rounded-sm">
          <span className="absolute -top-4 left-0 text-[8px] bg-primary text-primary-foreground px-1 rounded">
            MATCH
          </span>
        </div>

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
            <Play className="w-5 h-5 text-primary-foreground ml-0.5" />
          </div>
        </div>

        {/* Result number */}
        <div className="absolute top-2 left-2">
          <span className="text-xs font-medium bg-accent text-accent-foreground px-2 py-1 rounded">
            #{index}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-lg font-medium text-foreground">{result.location}</h3>
            <p className="text-sm text-primary">{result.matchReason}</p>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10">
            <span className="text-xs font-medium text-primary">{result.confidence}% match</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {result.timestamp}
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4" />
            {result.date}
          </div>
          <div className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            {result.location}
          </div>
        </div>

        <div className="mt-auto">
          <Link href={`/video/${result.id}`}>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Play className="w-4 h-4 mr-2" />
              View Footage
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
