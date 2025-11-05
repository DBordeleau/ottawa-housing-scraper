'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
    const pathname = usePathname()

    return (
        <nav className="bg-linear-to-br bg-transparent absolute inset-x-0 top-0 backdrop-blur-md shadow-md">
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