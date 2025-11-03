'use client'

import { useState } from 'react'
import SalesGraph, { SalesGraphData } from '@/components/Sales-Graph'
import SalesListingsGraph, { SalesListingsData } from '@/components/Sales-Listings-Graph'

export default function Home() {
  const [salesData, setSalesData] = useState<SalesGraphData | null>(null)
  const [listingsData, setListingsData] = useState<SalesListingsData | null>(null)

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

  // "N/A" if null
  const formatNumber = (value: number | null) => {
    if (value === null) return 'N/A'
    return value.toLocaleString()
  }

  return (
    <main className="min-h-screen bg-linear-to-br from-white via-green-50 to-green-100">
      <div className="container mx-auto p-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">
          Ottawa Housing Market Dashboard
        </h1>

        {salesData && (
          <div className="mb-4 space-y-4">
            {/* Freehold Summary */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 p-4">
              <p className="text-lg text-center text-gray-700 leading-relaxed">
                The median sold price for <span className="font-semibold text-blue-600">freehold homes</span> in Ottawa last week was{' '}
                <span className="font-bold text-gray-900">{formatCurrency(salesData.latestFreeholdPrice)}</span>,
                this represents a month over month change of {formatPercentage(salesData.freeholdMoM)}
                {salesData.freeholdYoY !== null && (
                  <>
                    , and a year over year change of {formatPercentage(salesData.freeholdYoY)}
                  </>
                )}.
              </p>

              {/* Condo Summary */}
              <p className="text-lg text-center text-gray-700 leading-relaxed">
                The median sold price for <span className="font-semibold text-red-600">condos</span> in Ottawa last week was{' '}
                <span className="font-bold text-gray-900">{formatCurrency(salesData.latestCondoPrice)}</span>,
                this represents a month over month change of {formatPercentage(salesData.condoMoM)}.
              </p>
            </div>
          </div>
        )}

        {/* Sales Price Graph */}
        <div className="mb-8">
          <SalesGraph onDataLoad={setSalesData} />
        </div>

        {/* Active Listings Summary */}
        {listingsData && (
          <div className="mb-4">
            {/* Freehold Listings Summary */}
            <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border w-full mx-auto border-gray-200 p-4">
              <p className="text-lg text-center text-gray-700 leading-relaxed">
                There were <span className="font-bold text-gray-900">{formatNumber(listingsData.latestFreeholdListings)}</span>{' '}
                <span className="font-semibold text-blue-600">freehold homes</span> listed for sale in Ottawa last week,
                this represents a month over month change of {formatPercentage(listingsData.freeholdMoM)}
                {listingsData.freeholdYoY !== null && (
                  <>
                    , and a year over year change of {formatPercentage(listingsData.freeholdYoY)}
                  </>
                )}
              </p>

              {/* Condo Listings Summary */}
              <p className="text-lg text-center text-gray-700 leading-relaxed">
                There were <span className="font-bold text-gray-900">{formatNumber(listingsData.latestCondoListings)}</span>{' '}
                <span className="font-semibold text-red-600">condos</span> listed for sale in Ottawa last week,
                this represents a month over month change of {formatPercentage(listingsData.condoMoM)}
              </p>
            </div>
          </div>
        )}

        {/* Active Listings Graph */}
        <SalesListingsGraph onDataLoad={setListingsData} />
      </div>
    </main >
  )
}