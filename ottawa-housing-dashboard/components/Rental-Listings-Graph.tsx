'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface FreeholdRental {
    date: string
    active_listings: number
    rented_properties: number
}

interface CondoRental {
    date: string
    active_listings: number
    rented_properties: number
}

interface ChartDataPoint {
    date: string
    freeholdListings: number | null
    condoListings: number | null
    freeholdRented: number | null
    condoRented: number | null
    freeholdListingsMoM?: number | null
    condoListingsMoM?: number | null
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

export interface RentalListingsData {
    latestFreeholdListings: number | null
    latestCondoListings: number | null
    freeholdMoM: number | null
    condoMoM: number | null
    freeholdYoY: number | null
}

interface RentalListingsGraphProps {
    onDataLoad?: (data: RentalListingsData) => void
}

export default function RentalListingsGraph({ onDataLoad }: RentalListingsGraphProps) {
    const [chartData, setChartData] = useState<ChartDataPoint[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true)

                // Fetch freehold rental data
                const { data: freeholdData, error: freeholdError } = await supabase
                    .from('freehold_rentals')
                    .select('date, active_listings, rented_properties')
                    .order('date', { ascending: true })

                if (freeholdError) throw freeholdError

                // Fetch condo rental data
                const { data: condoData, error: condoError } = await supabase
                    .from('condo_rentals')
                    .select('date, active_listings, rented_properties')
                    .order('date', { ascending: true })

                if (condoError) throw condoError

                // Merge the data by date
                const dateMap = new Map<string, ChartDataPoint>()

                // Add freehold data
                freeholdData?.forEach((item: FreeholdRental) => {
                    dateMap.set(item.date, {
                        date: item.date,
                        freeholdListings: item.active_listings,
                        freeholdRented: item.rented_properties,
                        condoListings: null,
                        condoRented: null,
                        freeholdListingsMoM: null,
                        condoListingsMoM: null
                    })
                })

                // Add condo data
                condoData?.forEach((item: CondoRental) => {
                    const existing = dateMap.get(item.date)
                    if (existing) {
                        existing.condoListings = item.active_listings
                        existing.condoRented = item.rented_properties
                    } else {
                        dateMap.set(item.date, {
                            date: item.date,
                            freeholdListings: null,
                            freeholdRented: null,
                            condoListings: item.active_listings,
                            condoRented: item.rented_properties,
                            freeholdListingsMoM: null,
                            condoListingsMoM: null
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

                    // Look for the data point closest to 1 month (30 days) prior
                    let closestPriorIndex = -1
                    let closestDiff = Infinity

                    for (let j = 0; j < i; j++) {
                        const priorDate = new Date(mergedData[j].date)
                        const actualDaysDiff = (currentDate.getTime() - priorDate.getTime()) / (1000 * 60 * 60 * 24)

                        // We want something close to 30 days ago, but accept anything from 20-45 days
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

                        // Calculate freehold MoM
                        if (current.freeholdListings && previous.freeholdListings) {
                            current.freeholdListingsMoM = ((current.freeholdListings - previous.freeholdListings) / previous.freeholdListings) * 100
                        }

                        // Calculate condo MoM
                        if (current.condoListings && previous.condoListings) {
                            current.condoListingsMoM = ((current.condoListings - previous.condoListings) / previous.condoListings) * 100
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
                        if (latest.freeholdListings && yearPrior.freeholdListings) {
                            freeholdYoY = ((latest.freeholdListings - yearPrior.freeholdListings) / yearPrior.freeholdListings) * 100
                        }
                    }
                }

                // Send data to parent component
                if (onDataLoad && mergedData.length > 0) {
                    const latest = mergedData[mergedData.length - 1]
                    onDataLoad({
                        latestFreeholdListings: latest.freeholdListings,
                        latestCondoListings: latest.condoListings,
                        freeholdMoM: latest.freeholdListingsMoM !== undefined ? latest.freeholdListingsMoM : null,
                        condoMoM: latest.condoListingsMoM !== undefined ? latest.condoListingsMoM : null,
                        freeholdYoY: freeholdYoY
                    })
                }

                setError(null)
            } catch (err) {
                console.error('Error fetching rental listings data:', err)
                setError('Failed to load rental listings data')
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

    // Custom legend component (Needed to show dashed lines for rented properties)
    const CustomLegend = () => {
        return (
            <div className="flex justify-center items-center gap-6 pt-5 flex-wrap">
                {/* Freehold Listings */}
                <div className="flex items-center gap-2">
                    <svg width="30" height="3">
                        <line x1="0" y1="1.5" x2="30" y2="1.5" stroke="#3b82f6" strokeWidth="3" />
                    </svg>
                    <span className="text-sm text-gray-700">Freehold Listings</span>
                </div>

                {/* Condo Listings */}
                <div className="flex items-center gap-2">
                    <svg width="30" height="3">
                        <line x1="0" y1="1.5" x2="30" y2="1.5" stroke="#ef4444" strokeWidth="3" />
                    </svg>
                    <span className="text-sm text-gray-700">Condo Listings</span>
                </div>

                {/* Freehold Rented */}
                <div className="flex items-center gap-2">
                    <svg width="30" height="3">
                        <line x1="0" y1="1.5" x2="30" y2="1.5" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5,5" />
                    </svg>
                    <span className="text-sm text-gray-700">Freehold Rented</span>
                </div>

                {/* Condo Rented */}
                <div className="flex items-center gap-2">
                    <svg width="30" height="3">
                        <line x1="0" y1="1.5" x2="30" y2="1.5" stroke="#ef4444" strokeWidth="2" strokeDasharray="5,5" />
                    </svg>
                    <span className="text-sm text-gray-700">Condo Rented</span>
                </div>
            </div>
        )
    }

    // Custom tooltip component
    const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
        if (active && payload && payload.length) {
            // Find freehold and condo data
            const freeholdListingsData = payload.find(p => p.dataKey === 'freeholdListings')
            const condoListingsData = payload.find(p => p.dataKey === 'condoListings')
            const freeholdRentedData = payload.find(p => p.dataKey === 'freeholdRented')
            const condoRentedData = payload.find(p => p.dataKey === 'condoRented')

            return (
                <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                    <p className="font-semibold text-gray-800 mb-2">{formatDate(label || '')}</p>

                    {/* Freehold always comes first */}
                    {freeholdListingsData && freeholdListingsData.value && (
                        <div className="mb-2">
                            <p className="text-blue-600 font-medium">
                                Freehold: {freeholdListingsData.value.toLocaleString()} listings
                                {formatMoM(freeholdListingsData.payload.freeholdListingsMoM)}
                            </p>
                            {freeholdRentedData && freeholdRentedData.value && (
                                <p className="text-blue-500 text-sm ml-2">
                                    Rented: {freeholdRentedData.value.toLocaleString()} properties
                                </p>
                            )}
                        </div>
                    )}

                    {/* Condo comes second */}
                    {condoListingsData && condoListingsData.value && (
                        <div>
                            <p className="text-red-600 font-medium">
                                Condo: {condoListingsData.value.toLocaleString()} listings
                                {formatMoM(condoListingsData.payload.condoListingsMoM)}
                            </p>
                            {condoRentedData && condoRentedData.value && (
                                <p className="text-red-500 text-sm ml-2">
                                    Rented: {condoRentedData.value.toLocaleString()} properties
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
        return (
            <div className="w-full h-96 flex items-center justify-center">
                <div className="text-gray-500">Loading rental listings data...</div>
            </div>
        )
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
                <div className="text-gray-500">No rental listings data available</div>
            </div>
        )
    }

    return (
        <div className="w-full bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Ottawa Rental Market - Active Listings & Rented Properties
            </h2>
            <ResponsiveContainer width="100%" height={450}>
                <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 70, bottom: 5 }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        stroke="#6b7280"
                    />
                    <YAxis
                        stroke="#6b7280"
                        width={60}
                        domain={['dataMin - 10', 'dataMax + 10']}
                    />
                    <text
                        x={20}
                        y={200}
                        fill="#6b7280"
                        fontSize={14}
                        fontWeight={600}
                        transform="rotate(-90, 20, 200)"
                        textAnchor="middle"
                    >
                        Number of Properties
                    </text>
                    <Tooltip content={<CustomTooltip />} />
                    {/* Solid lines for active listings */}
                    <Line
                        type="monotone"
                        dataKey="freeholdListings"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', r: 4 }}
                        activeDot={{ r: 6 }}
                        connectNulls
                        legendType="none"
                    />
                    <Line
                        type="monotone"
                        dataKey="condoListings"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={{ fill: '#ef4444', r: 4 }}
                        activeDot={{ r: 6 }}
                        connectNulls
                        legendType="none"
                    />
                    {/* Dotted lines for rented properties */}
                    <Line
                        type="monotone"
                        dataKey="freeholdRented"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: '#3b82f6', r: 3 }}
                        activeDot={{ r: 5 }}
                        connectNulls
                        legendType="none"
                    />
                    <Line
                        type="monotone"
                        dataKey="condoRented"
                        stroke="#ef4444"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ fill: '#ef4444', r: 3 }}
                        activeDot={{ r: 5 }}
                        connectNulls
                        legendType="none"
                    />
                </LineChart>
            </ResponsiveContainer>
            <CustomLegend />
        </div>
    )
}