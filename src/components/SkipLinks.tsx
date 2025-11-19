"use client"

import Link from "next/link"

export default function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only focus-within:absolute focus-within:z-[100] focus-within:top-4 focus-within:right-4">
      <Link
        href="#main-content"
        className="block px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      >
        דלג לתוכן הראשי
      </Link>
    </div>
  )
}

