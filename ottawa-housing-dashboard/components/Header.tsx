'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
    const pathname = usePathname()

    return (
        <nav className="bg-white/80 backdrop-blur-sm shadow-md border-b border-gray-200 mb-8">
            <div className="container mx-auto px-8">
                <div className="flex space-x-8">
                    <Link
                        href="/"
                        className={`py-4 px-2 border-b-2 font-medium transition-colors ${pathname === '/'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                            }`}
                    >
                        Sales Data
                    </Link>
                    <Link
                        href="/rentals"
                        className={`py-4 px-2 border-b-2 font-medium transition-colors ${pathname === '/rentals'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                            }`}
                    >
                        Rental Data
                    </Link>
                </div>
            </div>
        </nav>
    )
}