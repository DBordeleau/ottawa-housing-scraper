'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { GraphSkeleton } from "./Skeleton-Loader";

interface FreeholdSale {
    date: string
    active_listings: number
    median_dom: number
}

interface CondoSale {
    date: string
    active_listings: number
    median_dom: number
}

interface ChartDataPoint {
    date: string
    freehold: number | null
    condo: number | null
    freeholdDOM: number | null
    condoDOM: number | null
    freeholdMoM?: number | null
    condoMoM?: number | null
}

interface CustomTooltipProps {
    active?: boolean;
    payload?: Array<{
        value: number;
        name: string;
        dataKey: string;
        color: string;
        payload: ChartDataPoint;
    }>;
    label?: string;
}

export interface SalesListingsData {
    latestFreeholdListings: number | null
    latestCondoListings: number | null
    freeholdMoM: number | null
    condoMoM: number | null
    freeholdYoY: number | null
}

interface SalesListingsGraphProps {
    onDataLoad?: (data: SalesListingsData) => void
}

export default function SalesListingsGraph({ onDataLoad }: SalesListingsGraphProps) {
    const [chartData, setChartData] = useState<ChartDataPoint[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isMobile, setIsMobile] = useState(false)

    // Detect mobile screen size on mount and on resize
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768)
        }

        checkMobile()
        window.addEventListener('resize', checkMobile)

        return () => window.removeEventListener('resize', checkMobile)
    }, [])

    // Fetch data from supabase
    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true)

                const { data: freeholdData, error: freeholdError } = await supabase
                    .from('freehold_sales')
                    .select('date, active_listings, median_dom')
                    .order('date', { ascending: true })

                if (freeholdError) throw freeholdError

                const { data: condoData, error: condoError } = await supabase
                    .from('condo_sales')
                    .select('date, active_listings, median_dom')
                    .order('date', { ascending: true })

                if (condoError) throw condoError

                // Merge the data by date
                const dateMap = new Map<string, ChartDataPoint>()

                freeholdData?.forEach((item: FreeholdSale) => {
                    dateMap.set(item.date, {
                        date: item.date,
                        freehold: item.active_listings,
                        freeholdDOM: item.median_dom,
                        condo: null,
                        condoDOM: null,
                        freeholdMoM: null,
                        condoMoM: null
                    })
                })

                condoData?.forEach((item: CondoSale) => {
                    const existing = dateMap.get(item.date)
                    if (existing) {
                        existing.condo = item.active_listings
                        existing.condoDOM = item.median_dom
                    } else {
                        dateMap.set(item.date, {
                            date: item.date,
                            freehold: null,
                            freeholdDOM: null,
                            condo: item.active_listings,
                            condoDOM: item.median_dom,
                            freeholdMoM: null,
                            condoMoM: null
                        })
                    }
                })

                // Convert map to array and sort by date
                const mergedData = Array.from(dateMap.values()).sort(
                    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
                )

                // Calculate month-over-month changes (comparing to closest date ~30 days prior)
                for (let i = 0; i < mergedData.length; i++) {
                    const current = mergedData[i]
                    const currentDate = new Date(current.date)

                    let closestPriorIndex = -1
                    let closestDiff = Infinity

                    for (let j = 0; j < i; j++) {
                        const priorDate = new Date(mergedData[j].date)
                        const actualDaysDiff = (currentDate.getTime() - priorDate.getTime()) / (1000 * 60 * 60 * 24)

                        if (actualDaysDiff >= 20 && actualDaysDiff <= 45) {
                            const diffFrom30 = Math.abs(actualDaysDiff - 30)

                            if (diffFrom30 < closestDiff) {
                                closestDiff = diffFrom30
                                closestPriorIndex = j
                            }
                        }
                    }

                    // If we found a suitable prior point, calculate MoM
                    if (closestPriorIndex >= 0) {
                        const previous = mergedData[closestPriorIndex]

                        if (current.freehold && previous.freehold) {
                            current.freeholdMoM = ((current.freehold - previous.freehold) / previous.freehold) * 100
                        }

                        if (current.condo && previous.condo) {
                            current.condoMoM = ((current.condo - previous.condo) / previous.condo) * 100
                        }
                    }
                }

                setChartData(mergedData)

                // Calculate YoY for freehold (comparing to ~365 days prior)
                let freeholdYoY: number | null = null
                if (mergedData.length > 0) {
                    const latest = mergedData[mergedData.length - 1]
                    const latestDate = new Date(latest.date)

                    let closestYearPriorIndex = -1
                    let closestYearDiff = Infinity

                    for (let j = 0; j < mergedData.length - 1; j++) {
                        const priorDate = new Date(mergedData[j].date)
                        const actualDaysDiff = (latestDate.getTime() - priorDate.getTime()) / (1000 * 60 * 60 * 24)

                        // Look for data around 365 days ago (accept 330-395 days)
                        if (actualDaysDiff >= 330 && actualDaysDiff <= 395) {
                            const diffFrom365 = Math.abs(actualDaysDiff - 365)

                            if (diffFrom365 < closestYearDiff) {
                                closestYearDiff = diffFrom365
                                closestYearPriorIndex = j
                            }
                        }
                    }

                    if (closestYearPriorIndex >= 0) {
                        const yearPrior = mergedData[closestYearPriorIndex]
                        if (latest.freehold && yearPrior.freehold) {
                            freeholdYoY = ((latest.freehold - yearPrior.freehold) / yearPrior.freehold) * 100
                        }
                    }
                }

                // Send data to parent component (so the page can have dynamic summary text)
                if (onDataLoad && mergedData.length > 0) {
                    const latest = mergedData[mergedData.length - 1]
                    onDataLoad({
                        latestFreeholdListings: latest.freehold,
                        latestCondoListings: latest.condo,
                        freeholdMoM: latest.freeholdMoM !== undefined ? latest.freeholdMoM : null,
                        condoMoM: latest.condoMoM !== undefined ? latest.condoMoM : null,
                        freeholdYoY: freeholdYoY
                    })
                }

                setError(null)
            } catch (err) {
                console.error('Error fetching listings data:', err)
                setError('Failed to load listings data')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [onDataLoad])

    // Format date for display
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-CA', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    // Format MoM percentage with color coding
    const formatMoM = (value: number | null | undefined) => {
        if (value === null || value === undefined) return null

        const sign = value >= 0 ? '+' : ''
        const colorClass = value >= 0 ? 'text-green-600' : 'text-red-600'

        return (
            <span className={`text-sm font-semibold ${colorClass}`}>
                {` (${sign}${value.toFixed(1)}% MoM)`}
            </span>
        )
    }

    // Custom tooltip component to show changes for each data point
    const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
        if (active && payload && payload.length) {
            const freeholdData = payload.find(p => p.dataKey === 'freehold')
            const condoData = payload.find(p => p.dataKey === 'condo')

            return (
                <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                    <p className="font-semibold text-gray-800 mb-2">{formatDate(label || '')}</p>

                    {freeholdData && freeholdData.value && (
                        <div className="mb-2">
                            <p className="text-blue-600 font-medium">
                                Freehold: {freeholdData.value.toLocaleString()} listings
                                {formatMoM(freeholdData.payload.freeholdMoM)}
                            </p>
                            {freeholdData.payload.freeholdDOM !== null && (
                                <p className="text-blue-500 text-sm ml-2">
                                    Median DOM: {freeholdData.payload.freeholdDOM} days
                                </p>
                            )}
                        </div>
                    )}

                    {condoData && condoData.value && (
                        <div>
                            <p className="text-red-600 font-medium">
                                Condo: {condoData.value.toLocaleString()} listings
                                {formatMoM(condoData.payload.condoMoM)}
                            </p>
                            {condoData.payload.condoDOM !== null && (
                                <p className="text-red-500 text-sm ml-2">
                                    Median DOM: {condoData.payload.condoDOM} days
                                </p>
                            )}
                        </div>
                    )}
                </div>
            )
        }

        return null
    }

    if (loading) {
        return <GraphSkeleton />
    }

    if (error) {
        return (
            <div className="w-full h-96 flex items-center justify-center">
                <div className="text-red-500">{error}</div>
            </div>
        )
    }

    if (chartData.length === 0) {
        return (
            <div className="w-full h-96 flex items-center justify-center">
                <div className="text-gray-500">No listings data available</div>
            </div>
        )
    }

    return (
        <div className="w-full bg-white rounded-lg shadow-md border border-gray-200 p-3 sm:p-6">
            <h2 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">
                Ottawa Housing Market - Active Listings
            </h2>
            <ResponsiveContainer width="100%" height={isMobile ? 350 : 450}>
                <LineChart
                    data={chartData}
                    margin={{
                        top: 5,
                        right: isMobile ? 10 : 30,
                        left: isMobile ? 20 : 70,
                        bottom: 5
                    }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        stroke="#6b7280"
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        interval={isMobile ? 'preserveStartEnd' : 'preserveEnd'}
                    />
                    <YAxis
                        stroke="#6b7280"
                        width={isMobile ? 45 : 60}
                        tick={{ fontSize: isMobile ? 10 : 12 }}
                        domain={['dataMin - 10', 'dataMax + 10']}
                    />
                    {!isMobile && (
                        <text
                            x={20}
                            y={200}
                            fill="#6b7280"
                            fontSize={14}
                            fontWeight={600}
                            transform="rotate(-90, 20, 200)"
                            textAnchor="middle"
                        >
                            Active Listings
                        </text>
                    )}
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="line"
                        iconSize={isMobile ? 8 : 10}
                        formatter={(value) => <span className={isMobile ? 'text-xs' : 'text-sm'}>{value}</span>}
                    />
                    <Line
                        type="monotone"
                        dataKey="freehold"
                        stroke="#3b82f6"
                        strokeWidth={isMobile ? 2 : 3}
                        name="Freehold"
                        dot={isMobile ? false : { fill: '#3b82f6', r: 4 }}
                        activeDot={{ r: isMobile ? 4 : 6 }}
                        connectNulls
                    />
                    <Line
                        type="monotone"
                        dataKey="condo"
                        stroke="#ef4444"
                        strokeWidth={isMobile ? 2 : 3}
                        name="Condo"
                        dot={isMobile ? false : { fill: '#ef4444', r: 4 }}
                        activeDot={{ r: isMobile ? 4 : 6 }}
                        connectNulls
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}