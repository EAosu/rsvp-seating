"use client"

import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { LogOut, Calendar, Home } from "lucide-react"
import AccessibilityStatement from "@/components/AccessibilityStatement"

export default function Navigation() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session) {
    return null
  }

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <nav 
      className="sticky top-0 z-50 border-b border-white/20 bg-white/80 backdrop-blur-xl saturate-150 shadow-lg shadow-black/5" 
      role="navigation" 
      aria-label="ניווט ראשי"
      style={{
        background: 'rgba(255, 255, 255, 0.75)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 rtl">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-2 font-bold text-lg text-gray-900 hover:text-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-lg px-3 py-1.5"
              aria-label="RSVP Seating - דף הבית"
            >
              <Calendar className="h-6 w-6 text-indigo-600" aria-hidden="true" />
              <span>RSVP Seating</span>
            </Link>
            <div className="hidden md:flex items-center gap-1" role="list">
              <Link
                href="/dashboard"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                  pathname === "/dashboard" 
                    ? "bg-indigo-50 text-indigo-700" 
                    : "text-gray-700 hover:bg-gray-100"
                }`}
                aria-current={pathname === "/dashboard" ? "page" : undefined}
                role="listitem"
              >
                <Home className="h-4 w-4 inline ml-1.5" aria-hidden="true" />
                <span>דשבורד</span>
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <AccessibilityStatement />
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50">
              <span className="text-sm text-gray-700 font-medium" aria-label={`משתמש מחובר: ${session.user?.email}`}>
                {session.user?.email}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleLogout}
              aria-label="התנתק מהמערכת"
              className="gap-1.5"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">התנתק</span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}

