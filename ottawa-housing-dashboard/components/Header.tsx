'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Header() {
    const pathname = usePathname()

    return (
        <header className="sticky top-0 z-50 bg-transparent backdrop-blur-lg shadow-lg">
            <div className="container mx-auto px-8">
                <div className="flex items-center justify-between py-4">
                    {/* Navigation Links */}
                    <nav className="flex space-x-2">
                        <Link
                            href="/"
                            className={`group relative px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${pathname === '/'
                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/30'
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
                                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-gradient-to-r from-blue-600 to-blue-700 scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                            )}
                        </Link>

                        <Link
                            href="/rentals"
                            className={`group relative px-6 py-2.5 rounded-lg font-semibold transition-all duration-200 ${pathname === '/rentals'
                                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg shadow-green-500/30'
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
                                <span className="absolute inset-x-0 -bottom-px h-0.5 bg-gradient-to-r from-green-600 to-green-700 scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
                            )}
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    )
}