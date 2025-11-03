'use client'

import { useState } from 'react'
import SalesGraph, { SalesGraphData } from '@/components/Sales-Graph'

export default function Home() {
  const [salesData, setSalesData] = useState<SalesGraphData | null>(null)

  const formatCurrency = (value: number | null) => {
    if (value === null) return 'N/A'
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  // Red when negative, green when positive
  const formatPercentage = (value: number | null) => {
    if (value === null || value === undefined) return 'N/A'
    const sign = value >= 0 ? '+' : ''
    const colorClass = value >= 0 ? 'text-green-600' : 'text-red-600'
    return (
      <span className={`font-semibold ${colorClass}`}>
        {sign}{value.toFixed(1)}%
      </span>
    )
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-white via-green-50 to-green-100">
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          Ottawa Housing Market Dashboard
        </h1>

        {salesData && (
          <div className="mb-8 space-y-4">
            {/* Freehold Summary */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 p-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                The median sold price for <span className="font-semibold text-blue-600">freehold homes</span> in Ottawa last week was{' '}
                <span className="font-bold text-gray-900">{formatCurrency(salesData.latestFreeholdPrice)}</span>,
                this represents a month over month change of {formatPercentage(salesData.freeholdMoM)}
                {salesData.freeholdYoY !== null && (
                  <>
                    , and a year over year change of {formatPercentage(salesData.freeholdYoY)}
                  </>
                )}.
              </p>
            </div>

            {/* Condo Summary */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 p-6">
              <p className="text-lg text-gray-700 leading-relaxed">
                The median sold price for <span className="font-semibold text-red-600">condos</span> in Ottawa last week was{' '}
                <span className="font-bold text-gray-900">{formatCurrency(salesData.latestCondoPrice)}</span>,
                this represents a month over month change of {formatPercentage(salesData.condoMoM)}.
              </p>
            </div>
          </div>
        )}

        <SalesGraph onDataLoad={setSalesData} />
      </div>
    </main>
  )
}