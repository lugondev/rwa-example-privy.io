'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

interface ChartWrapperProps {
  children: (components: any) => React.ReactNode
  height?: number
}

export default function ChartWrapper({ children, height = 300 }: ChartWrapperProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [components, setComponents] = useState<any>(null)

  useEffect(() => {
    setIsMounted(true)
    
    // Dynamic import recharts components
    import('recharts').then((mod) => {
      setComponents({
        AreaChart: mod.AreaChart,
        Area: mod.Area,
        XAxis: mod.XAxis,
        YAxis: mod.YAxis,
        CartesianGrid: mod.CartesianGrid,
        Tooltip: mod.Tooltip,
        ResponsiveContainer: mod.ResponsiveContainer,
        PieChart: mod.PieChart,
        Pie: mod.Pie,
        Cell: mod.Cell,
        LineChart: mod.LineChart,
        Line: mod.Line,
        BarChart: mod.BarChart,
        Bar: mod.Bar
      })
    })
  }, [])

  if (!isMounted || !components) {
    return (
      <div className={`w-full bg-slate-800/50 rounded-lg flex items-center justify-center`} style={{ height }}>
        <div className="text-slate-400">Loading chart...</div>
      </div>
    )
  }

  return <>{children(components)}</>
}