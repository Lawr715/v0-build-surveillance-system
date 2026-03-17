"use client"

import { Users, Video, MapPin, AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"

const kpis = [
  {
    label: "Total Pedestrians Today",
    value: "12,847",
    change: "+12%",
    trend: "up",
    icon: Users,
    color: "primary",
  },
  {
    label: "Active Video Feeds",
    value: "24",
    change: "+4",
    trend: "up",
    icon: Video,
    color: "accent",
  },
  {
    label: "Monitored Locations",
    value: "8",
    change: "+2",
    trend: "up",
    icon: MapPin,
    color: "chart-3",
  },
  {
    label: "Alerts Generated",
    value: "156",
    change: "-8%",
    trend: "down",
    icon: AlertTriangle,
    color: "chart-4",
  },
]

export function KPICards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <KPICard key={kpi.label} {...kpi} />
      ))}
    </div>
  )
}

function KPICard({
  label,
  value,
  change,
  trend,
  icon: Icon,
  color,
}: {
  label: string
  value: string
  change: string
  trend: "up" | "down"
  icon: React.ElementType
  color: string
}) {
  const colorClasses: Record<string, { bg: string; text: string; icon: string }> = {
    primary: { bg: "bg-primary/10", text: "text-primary", icon: "text-primary" },
    accent: { bg: "bg-accent/10", text: "text-accent", icon: "text-accent" },
    "chart-3": { bg: "bg-chart-3/10", text: "text-chart-3", icon: "text-chart-3" },
    "chart-4": { bg: "bg-chart-4/10", text: "text-chart-4", icon: "text-chart-4" },
  }

  const colors = colorClasses[color] || colorClasses.primary

  return (
    <div className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-lg ${colors.bg}`}>
          <Icon className={`w-5 h-5 ${colors.icon}`} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${
          trend === "up" ? "text-primary" : "text-destructive"
        }`}>
          {trend === "up" ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {change}
        </div>
      </div>
      
      <p className={`text-3xl font-bold mb-1 ${colors.text}`}>{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  )
}
