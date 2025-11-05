'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface FreeholdSale {
    date: string
    median_sold_price: number
}

interface CondoSale {
    date: string
    median_sold_price: number
}

interface ChartDataPoint {
    date: string
    freehold: number | null
    condo: number | null
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

export interface SalesGraphData {
    latestFreeholdPrice: number | null
    latestCondoPrice: number | null
    freeholdMoM: number | null
    condoMoM: number | null
    freeholdYoY: number | null
}

interface SalesGraphProps {
    onDataLoad?: (data: SalesGraphData) => void
}

export default function SalesGraph({ onDataLoad }: SalesGraphProps) {
    const [chartData, setChartData] = useState<ChartDataPoint[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true)

                // Fetch freehold sales data
                const { data: freeholdData, error: freeholdError } = await supabase
                    .from('freehold_sales')
                    .select('date, median_sold_price')
                    .order('date', { ascending: true })

                if (freeholdError) throw freeholdError

                // Fetch condo sales data
                const { data: condoData, error: condoError } = await supabase
                    .from('condo_sales')
                    .select('date, median_sold_price')
                    .order('date', { ascending: true })

                if (condoError) throw condoError

                // Merge the data by date
                const dateMap = new Map<string, ChartDataPoint>()

                // Add freehold data
                freeholdData?.forEach((item: FreeholdSale) => {
                    dateMap.set(item.date, {
                        date: item.date,
                        freehold: item.median_sold_price,
                        condo: null,
                        freeholdMoM: null,
                        condoMoM: null
                    })
                })

                // Add condo data
                condoData?.forEach((item: CondoSale) => {
                    const existing = dateMap.get(item.date)
                    if (existing) {
                        existing.condo = item.median_sold_price
                    } else {
                        dateMap.set(item.date, {
                            date: item.date,
                            freehold: null,
                            condo: item.median_sold_price,
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
                        if (current.freehold && previous.freehold) {
                            current.freeholdMoM = ((current.freehold - previous.freehold) / previous.freehold) * 100
                        }

                        // Calculate condo MoM
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

                // Send data to parent component
                if (onDataLoad && mergedData.length > 0) {
                    const latest = mergedData[mergedData.length - 1]
                    onDataLoad({
                        latestFreeholdPrice: latest.freehold,
                        latestCondoPrice: latest.condo,
                        freeholdMoM: latest.freeholdMoM !== undefined ? latest.freeholdMoM : null,
                        condoMoM: latest.condoMoM !== undefined ? latest.condoMoM : null,
                        freeholdYoY: freeholdYoY
                    })
                }

                setError(null)
            } catch (err) {
                console.error('Error fetching sales data:', err)
                setError('Failed to load sales data')
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [onDataLoad])

    // Format currency for tooltip
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-CA', {
            style: 'currency',
            currency: 'CAD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value)
    }

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

    // Custom tooltip component
    const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
        if (active && payload && payload.length) {
            // Find freehold and condo data
            const freeholdData = payload.find(p => p.dataKey === 'freehold')
            const condoData = payload.find(p => p.dataKey === 'condo')

            return (
                <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                    <p className="font-semibold text-gray-800 mb-2">{formatDate(label || '')}</p>

                    {/* Freehold always comes first */}
                    {freeholdData && freeholdData.value && (
                        <p className="text-blue-600 font-medium">
                            Freehold: {formatCurrency(freeholdData.value)}
                            {formatMoM(freeholdData.payload.freeholdMoM)}
                        </p>
                    )}

                    {/* Condo comes second */}
                    {condoData && condoData.value && (
                        <p className="text-red-600 font-medium">
                            Condo: {formatCurrency(condoData.value)}
                            {formatMoM(condoData.payload.condoMoM)}
                        </p>
                    )}
                </div>
            )
        }

        return null
    }

    if (loading) {
        return (
            <div className="w-full h-96 flex items-center justify-center">
                <div className="text-gray-500">Loading sales data...</div>
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
                <div className="text-gray-500">No sales data available</div>
            </div>
        )
    }

    return (
        <div className="w-full bg-white rounded-lg shadow-md border border-gray-200 p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Ottawa Housing Market - Median Sold Prices
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
                        tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        stroke="#6b7280"
                        width={60}
                        domain={['dataMin - 50000', 'dataMax + 50000']}
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
                        Median Sold Price
                    </text>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                        wrapperStyle={{ paddingTop: '20px' }}
                        iconType="line"
                    />
                    <Line
                        type="monotone"
                        dataKey="freehold"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        name="Freehold"
                        dot={{ fill: '#3b82f6', r: 4 }}
                        activeDot={{ r: 6 }}
                        connectNulls
                    />
                    <Line
                        type="monotone"
                        dataKey="condo"
                        stroke="#ef4444"
                        strokeWidth={3}
                        name="Condo"
                        dot={{ fill: '#ef4444', r: 4 }}
                        activeDot={{ r: 6 }}
                        connectNulls
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}