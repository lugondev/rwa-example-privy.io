import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

interface ChartWrapperProps {
  type: 'line' | 'bar' | 'doughnut'
  data: {
    labels?: string[]
    datasets: {
      label?: string
      data: number[]
      backgroundColor?: string | string[]
      borderColor?: string | string[]
      borderWidth?: number
      [key: string]: any
    }[]
  }
  options?: {
    responsive?: boolean
    maintainAspectRatio?: boolean
    plugins?: Record<string, any>
    scales?: Record<string, any>
    [key: string]: any
  }
  className?: string
}

/**
 * Chart wrapper component for dynamic loading
 * Reduces initial bundle size by lazy loading Chart.js
 */
const ChartWrapper: React.FC<ChartWrapperProps> = ({ type, data, options, className }) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#94a3b8', // slate-400
        },
      },
    },
    scales: type !== 'doughnut' ? {
      x: {
        ticks: {
          color: '#94a3b8',
        },
        grid: {
          color: '#334155', // slate-700
        },
      },
      y: {
        ticks: {
          color: '#94a3b8',
        },
        grid: {
          color: '#334155',
        },
      },
    } : undefined,
    ...options,
  }

  const chartProps = {
    data,
    options: defaultOptions,
    className,
  }

  switch (type) {
    case 'line':
      return <Line {...chartProps} />
    case 'bar':
      return <Bar {...chartProps} />
    case 'doughnut':
      return <Doughnut {...chartProps} />
    default:
      return <div>Unsupported chart type</div>
  }
}

export default ChartWrapper