'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function Header() {
    const pathname = usePathname()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    return (
        <header className="sticky top-0 z-50 bg-transparent backdrop-blur-lg shadow-lg">
            <div className="container mx-auto px-4 sm:px-8">
                <div className="flex items-center justify-between py-3 sm:py-4">
                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-2">
                        <Link
                            href="/"
                            className={`group relative px-4 lg:px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${pathname === '/'
                                ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                        >
                            <span className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                                <span>Sales Data</span>
                            </span>
                            {pathname !== '/' && (
                                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-linear-to-r from-blue-600 to-blue-700 scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                            )}
                        </Link>

                        <Link
                            href="/rentals"
                            className={`group relative px-4 lg:px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${pathname === '/rentals'
                                ? 'bg-linear-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/30'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                }`}
                        >
                            <span className="flex items-center space-x-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                </svg>
                                <span>Rental Data</span>
                            </span>
                            {pathname !== '/rentals' && (
                                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-linear-to-r from-green-600 to-green-700 scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                            )}
                        </Link>
                    </nav>

                    <span className="hidden md:block text-xs sm:text-sm text-gray-600">
                        Updated every Monday @ 6 PM ET
                    </span>

                    {/* Mobile: Hamburger Button */}
                    <div className="flex md:hidden items-center justify-between w-full">
                        <span className="text-xs text-gray-600">
                            Updated Mon @ 6 PM
                        </span>
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors relative"
                            aria-label="Toggle menu"
                        >
                            {/* Hamburger Icon */}
                            <div className="w-6 h-6 flex flex-col justify-center items-center">
                                <span
                                    className={`block w-5 h-0.5 bg-current transform transition-all duration-300 ease-in-out ${isMenuOpen ? 'rotate-45 translate-y-1.5' : '-translate-y-1'
                                        }`}
                                />
                                <span
                                    className={`block w-5 h-0.5 bg-current transition-all duration-300 ease-in-out ${isMenuOpen ? 'opacity-0' : 'opacity-100 my-1'
                                        }`}
                                />
                                <span
                                    className={`block w-5 h-0.5 bg-current transform transition-all duration-300 ease-in-out ${isMenuOpen ? '-rotate-45 -translate-y-1.5' : 'translate-y-1'
                                        }`}
                                />
                            </div>
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                <div
                    className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        }`}
                >
                    <div className="pb-4 space-y-2">
                        <Link
                            href="/"
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${pathname === '/'
                                ? 'bg-linear-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
                                : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                            <span>Sales Data</span>
                        </Link>

                        <Link
                            href="/rentals"
                            onClick={() => setIsMenuOpen(false)}
                            className={`flex items-center space-x-3 px-4 py-3 rounded-lg font-semibold transition-all duration-200 ${pathname === '/rentals'
                                ? 'bg-linear-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/30'
                                : 'text-gray-700 hover:bg-gray-100'
                                }`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            <span>Rental Data</span>
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    )
}