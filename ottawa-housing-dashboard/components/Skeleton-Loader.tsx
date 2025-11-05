'use client'

export function GraphSkeleton() {
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