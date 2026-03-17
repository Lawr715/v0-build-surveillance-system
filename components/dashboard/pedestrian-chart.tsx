"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"

interface PedestrianChartProps {
  timeRange: string
}

// Generate mock data based on time range
const generateData = (timeRange: string) => {
  const dataPoints = timeRange === "1h" ? 12 : timeRange === "6h" ? 24 : timeRange === "24h" ? 24 : 7
  const data = []
  
  for (let i = 0; i < dataPoints; i++) {
    let label: string
    if (timeRange === "7d") {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      label = days[i % 7]
    } else {
      const hour = Math.floor((i * (timeRange === "1h" ? 5 : timeRange === "6h" ? 15 : 60)) / 60)
      const minute = (i * (timeRange === "1h" ? 5 : timeRange === "6h" ? 15 : 60)) % 60
      label = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
    }
    
    data.push({
      time: label,
      "North Gate": Math.floor(Math.random() * 150) + 50 + (i * 5),
      "Main Hall": Math.floor(Math.random() * 200) + 80 + (i * 3),
      "Parking Lot A": Math.floor(Math.random() * 100) + 30 + (i * 2),
      "South Entrance": Math.floor(Math.random() * 120) + 40 + (i * 4),
    })
  }
  
  return data
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="text-sm font-medium text-foreground mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color }} 
            />
            <span className="text-muted-foreground">{entry.name}:</span>
            <span className="font-medium text-foreground">{entry.value}</span>
          </div>
        ))}
      </div>
    )
  }
  return null
}

export function PedestrianChart({ timeRange }: PedestrianChartProps) {
  const data = generateData(timeRange)

  return (
    <div className="p-6 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Pedestrian Count Over Time</h3>
          <p className="text-sm text-muted-foreground">Aggregated by location</p>
        </div>
      </div>

      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="northGateGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="mainHallGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="parkingGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="southGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272A" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#71717A" 
              tick={{ fill: "#71717A", fontSize: 12 }}
              axisLine={{ stroke: "#27272A" }}
            />
            <YAxis 
              stroke="#71717A" 
              tick={{ fill: "#71717A", fontSize: 12 }}
              axisLine={{ stroke: "#27272A" }}
              label={{ 
                value: "Pedestrian Count", 
                angle: -90, 
                position: "insideLeft",
                fill: "#71717A",
                fontSize: 12,
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => <span className="text-foreground text-sm">{value}</span>}
            />
            <Area
              type="monotone"
              dataKey="North Gate"
              stroke="#22C55E"
              strokeWidth={2}
              fill="url(#northGateGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#22C55E" }}
            />
            <Area
              type="monotone"
              dataKey="Main Hall"
              stroke="#06B6D4"
              strokeWidth={2}
              fill="url(#mainHallGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#06B6D4" }}
            />
            <Area
              type="monotone"
              dataKey="Parking Lot A"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#parkingGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#3B82F6" }}
            />
            <Area
              type="monotone"
              dataKey="South Entrance"
              stroke="#F59E0B"
              strokeWidth={2}
              fill="url(#southGradient)"
              dot={false}
              activeDot={{ r: 4, fill: "#F59E0B" }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Stats */}
      <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
        <ChartStat location="North Gate" count="3,245" color="#22C55E" />
        <ChartStat location="Main Hall" count="4,892" color="#06B6D4" />
        <ChartStat location="Parking Lot A" count="2,156" color="#3B82F6" />
        <ChartStat location="South Entrance" count="2,554" color="#F59E0B" />
      </div>
    </div>
  )
}

function ChartStat({ location, count, color }: { location: string; count: string; color: string }) {
  return (
    <div className="text-center">
      <div className="flex items-center justify-center gap-2 mb-1">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm text-muted-foreground">{location}</span>
      </div>
      <p className="text-xl font-bold" style={{ color }}>{count}</p>
    </div>
  )
}
