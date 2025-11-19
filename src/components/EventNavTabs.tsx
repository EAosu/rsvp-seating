"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export default function EventNavTabs({ id }: { id: string }) {
    const pathname = usePathname()
    const Item = (href: string, label: string) => (
        <Link
            href={href}
            className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 relative",
                pathname === href
                    ? "text-white shadow-lg"
                    : "text-gray-800 hover:text-indigo-700"
            )}
            style={pathname === href ? {
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.9), rgba(139, 92, 246, 0.9))',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 4px 16px rgba(99, 102, 241, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
            } : {
                background: 'rgba(255, 255, 255, 0.5)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
            onMouseEnter={(e) => {
                if (pathname !== href) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.4)'
                }
            }}
            onMouseLeave={(e) => {
                if (pathname !== href) {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.5)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                }
            }}
            aria-current={pathname === href ? "page" : undefined}
        >
            {label}
        </Link>
    )

    return (
        <div className="flex gap-2">
            {Item(`/events/${id}`, "סקירה")}
            {Item(`/events/${id}/guests`, "ניהול אורחים")}
            {Item(`/events/${id}/seating`, "סידורי הושבה")}
            {Item(`/events/${id}/import`, "ייבוא מוזמנים")}
        </div>
    )
}
