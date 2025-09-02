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
                "px-3 py-1.5 rounded-xl text-sm",
                pathname === href ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
            )}
        >
            {label}
        </Link>
    )

    return (
        <div className="flex gap-2">
            {Item(`/events/${id}`, "סקירה")}
            {Item(`/events/${id}/seating`, "סידורי הושבה")}
            {Item(`/events/${id}/import`, "ייבוא מוזמנים")}
        </div>
    )
}
