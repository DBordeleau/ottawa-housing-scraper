'use client'

import { useState } from 'react'
import RentGraph, { RentGraphData } from '@/components/Rent-Graph'
import RentalListingsGraph, { RentalListingsData } from '@/components/Rental-Listings-Graph'
import { SummarySkeleton } from '@/components/Skeleton-Loader'

export default function RentalsPage() {
    const [rentData, setRentData] = useState<RentGraphData | null>(null)
    const [listingsData, setListingsData] = useState<RentalListingsData | null>(null)

    const formatCurrency = (value: number | null) => {
        if (value === null) return 'N/A'
        return new Intl.NumberFormat('en-CA', {
            style: 'currency',
            currency: 'CAD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value)
    }

    const formatNumber = (value: number | null) => {
        if (value === null) return 'N/A'
        return value.toLocaleString()
    }

    const formatPercentage = (value: number | null) => {
        if (value === null || value === undefined) return 'N/A'
        const sign = value >= 0 ? '+' : ''
        const colorClass = value >= 0 ? 'text-green-600' : 'text-red-600'

        const displayValue = Math.abs(value) < 0.05 && value !== 0 ? 0.1 : Math.abs(value)
        const displaySign = value >= 0 ? '+' : '-'

        return (
            <span className={`font-semibold ${colorClass}`}>
                {displaySign}{displayValue.toFixed(1)}%
            </span>
        )
    }

    return (
        <div className="container mx-auto p-4 sm:p-8">
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-4 sm:mb-8 text-center">
                Ottawa Housing Market Dashboard - Rentals
            </h1>

            {/* Rental Summary */}
            <div className="mb-4 space-y-2 sm:space-y-4">
                {!rentData ? (
                    <SummarySkeleton />
                ) : (
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border border-gray-200 p-3 sm:p-4">
                        <p className="text-sm sm:text-lg text-center text-gray-700 leading-relaxed">
                            The median rental price for <span className="font-semibold text-blue-600">freehold homes</span> in Ottawa last week was{' '}
                            <span className="font-bold text-gray-900">{formatCurrency(rentData.latestFreeholdPrice)}</span>,
                            this represents a month over month change of {formatPercentage(rentData.freeholdMoM)}
                            {rentData.freeholdYoY !== null && (
                                <>
                                    , and a year over year change of {formatPercentage(rentData.freeholdYoY)}
                                </>
                            )}.
                        </p>

                        <p className="text-sm sm:text-lg text-center text-gray-700 leading-relaxed mt-2">
                            The median rental price for <span className="font-semibold text-red-600">condos</span> in Ottawa last week was{' '}
                            <span className="font-bold text-gray-900">{formatCurrency(rentData.latestCondoPrice)}</span>,
                            this represents a month over month change of {formatPercentage(rentData.condoMoM)}.
                        </p>
                    </div>
                )}
            </div>

            {/* Rental Price Graph */}
            <div className="mb-4 sm:mb-8">
                <RentGraph onDataLoad={setRentData} />
            </div>

            {/* Rental Listings Summary */}
            <div className="mb-4">
                {!listingsData ? (
                    <SummarySkeleton />
                ) : (
                    <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-md border w-full mx-auto border-gray-200 p-3 sm:p-4">
                        <p className="text-sm sm:text-lg text-center text-gray-700 leading-relaxed">
                            There were <span className="font-bold text-gray-900">{formatNumber(listingsData.latestFreeholdListings)}</span>{' '}
                            <span className="font-semibold text-blue-600">freehold homes</span> available for rent in Ottawa last week,
                            this represents a month over month change of {formatPercentage(listingsData.freeholdMoM)}
                            {listingsData.freeholdYoY !== null && (
                                <>
                                    , and a year over year change of {formatPercentage(listingsData.freeholdYoY)}
                                </>
                            )}.
                        </p>

                        <p className="text-sm sm:text-lg text-center text-gray-700 leading-relaxed mt-2">
                            There were <span className="font-bold text-gray-900">{formatNumber(listingsData.latestCondoListings)}</span>{' '}
                            <span className="font-semibold text-red-600">condos</span> available for rent in Ottawa last week,
                            this represents a month over month change of {formatPercentage(listingsData.condoMoM)}.
                        </p>
                    </div>
                )}
            </div>

            {/* Rental Listings Graph */}
            <RentalListingsGraph onDataLoad={setListingsData} />
        </div>
    )
}