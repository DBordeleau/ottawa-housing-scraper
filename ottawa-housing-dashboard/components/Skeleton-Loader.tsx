'use client'

import { useEffect, useState } from 'react'

export function GraphSkeleton() {
    const [mounted, setMounted] = useState(false)

    // Only generate random points on client side after mount
    useEffect(() => {
        setMounted(true)
    }, [])

    // Generate stable points
    const line1Points = mounted ? Array.from({ length: 20 }, () => Math.random() * 40 + 30) : Array(20).fill(50)
    const line2Points = mounted ? Array.from({ length: 20 }, () => Math.random() * 40 + 30) : Array(20).fill(50)

    // Create SVG path data for smooth lines
    const createPath = (points: number[]) => {
        const spacing = 100 / (points.length - 1)
        let path = `M 0,${100 - points[0]}`

        for (let i = 1; i < points.length; i++) {
            const x = i * spacing
            const y = 100 - points[i]
            path += ` L ${x},${y}`
        }

        return path
    }

    return (
        <div className="w-full bg-white rounded-lg shadow-md border border-gray-200 p-3 sm:p-6">
            {/* Title skeleton */}
            <div className="h-5 sm:h-6 bg-gray-200 rounded w-3/4 mb-3 sm:mb-4 animate-pulse"></div>

            {/* Graph skeleton */}
            <div className="w-full h-[300px] sm:h-[400px] bg-gray-50 rounded-lg border border-gray-200 relative overflow-hidden">
                {/* Y-axis title space (left margin) */}
                <div className="absolute left-0 top-0 bottom-0 w-5 sm:w-8 bg-transparent"></div>

                {/* Y-axis labels */}
                <div className="absolute left-5 sm:left-8 top-4 bottom-14 w-10 sm:w-12 flex flex-col justify-between z-10">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-2 sm:h-2.5 w-8 sm:w-10 bg-gray-200 rounded animate-pulse"></div>
                    ))}
                </div>

                {/* Grid lines */}
                <div className="absolute left-16 sm:left-20 right-4 top-4 bottom-14 flex flex-col justify-between">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-px bg-gray-200 w-full"></div>
                    ))}
                </div>

                {/* Line chart simulation */}
                <svg
                    className="absolute left-16 sm:left-20 right-4 top-4 bottom-14"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                >
                    {/* Gray line 1 */}
                    <path
                        d={createPath(line1Points)}
                        fill="none"
                        stroke="#d1d5db"
                        strokeWidth="1.5"
                        vectorEffect="non-scaling-stroke"
                        className="animate-pulse"
                        style={{ animationDuration: '2s' }}
                    />

                    {/* Gray line 2 */}
                    <path
                        d={createPath(line2Points)}
                        fill="none"
                        stroke="#d1d5db"
                        strokeWidth="1.5"
                        vectorEffect="non-scaling-stroke"
                        className="animate-pulse"
                        style={{ animationDuration: '2s', animationDelay: '0.3s' }}
                    />

                    {/* Dots on lines */}
                    {line1Points.map((y, i) => (
                        <circle
                            key={`dot1-${i}`}
                            cx={(i / (line1Points.length - 1)) * 100}
                            cy={100 - y}
                            r="0.8"
                            fill="#d1d5db"
                            className="animate-pulse"
                            style={{ animationDelay: `${i * 0.05}s` }}
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}
                    {line2Points.map((y, i) => (
                        <circle
                            key={`dot2-${i}`}
                            cx={(i / (line2Points.length - 1)) * 100}
                            cy={100 - y}
                            r="0.8"
                            fill="#d1d5db"
                            className="animate-pulse"
                            style={{ animationDelay: `${i * 0.05 + 0.3}s` }}
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}
                </svg>

                {/* X-axis labels */}
                <div className="absolute bottom-4 left-16 sm:left-20 right-4 flex justify-between items-end">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center">
                            <div className="h-1.5 w-px bg-gray-200 mb-1"></div>
                            <div className="h-2 w-10 sm:w-12 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend skeleton */}
            <div className="flex justify-center gap-4 sm:gap-6 pt-4 sm:pt-5 flex-wrap">
                <div className="flex items-center gap-2 animate-pulse">
                    <div className="w-6 sm:w-8 h-0.5 bg-gray-300 rounded"></div>
                    <div className="h-2.5 w-14 sm:w-16 bg-gray-200 rounded"></div>
                </div>
                <div className="flex items-center gap-2 animate-pulse">
                    <div className="w-6 sm:w-8 h-0.5 bg-gray-300 rounded"></div>
                    <div className="h-2.5 w-12 sm:w-14 bg-gray-200 rounded"></div>
                </div>
            </div>
        </div>
    )
}

export function SummarySkeleton() {
    return (
        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 p-3 sm:p-4">
            {/* First paragraph */}
            <div className="space-y-1.5 mb-2 sm:mb-3 animate-pulse">
                <div className="h-3.5 sm:h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-3.5 sm:h-4 bg-gray-200 rounded w-11/12"></div>
                <div className="h-3.5 sm:h-4 bg-gray-200 rounded w-4/5"></div>
            </div>

            {/* Second paragraph */}
            <div className="space-y-1.5 animate-pulse">
                <div className="h-3.5 sm:h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-3.5 sm:h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
        </div>
    )
}