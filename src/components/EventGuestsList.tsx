"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"

type G = {
    id: string
    name: string
    status: "YES" | "NO" | "MAYBE" | "PENDING"
    meal: string | null
    relation: string | null
    table: string | null
    group: string | null
    household: string
    phone: string | null
}

export default function EventGuestsList({ initial }: { initial?: G[] }) {
    const { id } = useParams<{ id: string }>()
    const [guests, setGuests] = useState<G[]>(initial || [])
    const [q, setQ] = useState("")
    const [filter, setFilter] = useState<"ALL" | "YES" | "NO" | "MAYBE" | "PENDING">("ALL")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (initial && initial.length) return
            ;(async () => {
            setLoading(true)
            const r = await fetch(`/api/events/${id}/guests`, { cache: "no-store" })
            const j = await r.json()
            setGuests(j.guests || [])
            setLoading(false)
        })()
    }, [id])

    // לייב (SSE) — מעדכן סטטוס על פי webhook
    useEffect(() => {
        const es = new EventSource(`/api/events/${id}/rsvp/stream`)
        es.onmessage = (ev) => {
            try {
                const msg = JSON.parse(ev.data)
                if (msg.type === "rsvp_update") {
                    setGuests(prev => prev.map(g => msg.guestIds.includes(g.id) ? { ...g, status: msg.rsvpStatus } : g))
                }
            } catch {}
        }
        return () => es.close()
    }, [id])

    const filtered = useMemo(() => {
        const term = q.trim().toLowerCase()
        return guests.filter(g => {
            if (filter !== "ALL" && g.status !== filter) return false
            if (!term) return true
            const hay = `${g.name} ${g.household} ${g.group ?? ""} ${g.table ?? ""} ${g.phone ?? ""} ${g.relation ?? ""}`.toLowerCase()
            return hay.includes(term)
        })
    }, [guests, q, filter])

    const Badge = ({ s }: { s: G["status"] }) => (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border-2 transition-all hover:scale-110",
                s === "YES" && "bg-gradient-to-r from-emerald-400 to-green-500 text-white border-emerald-300 shadow-md",
                s === "NO" && "bg-gradient-to-r from-red-400 to-rose-500 text-white border-red-300 shadow-md",
                s === "MAYBE" && "bg-gradient-to-r from-amber-400 to-yellow-500 text-white border-amber-300 shadow-md",
                s === "PENDING" && "bg-gradient-to-r from-gray-400 to-slate-500 text-white border-gray-300 shadow-md"
            )}
        >
      {s === "YES" ? "מאשר/ת" : s === "NO" ? "לא מגיע/ה" : s === "MAYBE" ? "אולי" : "ממתין/ה"}
    </span>
    )

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3">
                <input
                    className="w-full rounded-lg border-2 border-indigo-200 bg-white/90 backdrop-blur-sm px-4 py-2.5 text-sm shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 focus:shadow-lg transition-all"
                    placeholder="חיפוש לפי שם/קבוצה/שולחן/טלפון…"
                    value={q}
                    onChange={e => setQ(e.target.value)}
                />
                <div className="flex flex-wrap gap-2 text-sm">
                    {(["ALL","YES","MAYBE","NO","PENDING"] as const).map(k => (
                        <button
                            key={k}
                            onClick={() => setFilter(k)}
                            className={cn(
                                "rounded-lg px-3 sm:px-4 py-2 font-medium border-2 transition-all duration-300 text-xs sm:text-sm",
                                filter===k 
                                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-500 shadow-lg" 
                                    : "bg-white/90 text-gray-700 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300"
                            )}
                        >
                            {k==="ALL"?"הכול":k==="YES"?"מאשרים":k==="MAYBE"?"אולי":k==="NO"?"לא": "ממתינים"}
                        </button>
                    ))}
                </div>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block rounded-2xl overflow-hidden" style={{
              background: 'rgba(255, 255, 255, 0.7)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              boxShadow: '0 8px 32px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
            }}>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b-2 border-indigo-200">
                        <tr>
                            <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs font-bold text-indigo-700 uppercase tracking-wider">אורח/ת</th>
                            <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs font-bold text-indigo-700 uppercase tracking-wider">סטטוס</th>
                            <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs font-bold text-indigo-700 uppercase tracking-wider">שולחן</th>
                            <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs font-bold text-indigo-700 uppercase tracking-wider">קבוצה</th>
                            <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs font-bold text-indigo-700 uppercase tracking-wider">משפחה</th>
                            <th className="px-4 lg:px-6 py-3 lg:py-4 text-right text-xs font-bold text-indigo-700 uppercase tracking-wider">טלפון</th>
                        </tr>
                        </thead>
                        <tbody>
                        {loading ? (
                            <tr><td colSpan={6} className="p-8 text-center text-gray-500">טוען…</td></tr>
                        ) : filtered.length ? (
                            filtered.map(g => (
                                <tr key={g.id} className="border-b border-gray-100/50 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-300">
                                    <td className="px-4 lg:px-6 py-3 lg:py-4 font-medium text-gray-900">{g.name}{g.relation ? <span className="text-gray-500 text-sm"> · {g.relation}</span> : null}</td>
                                    <td className="px-4 lg:px-6 py-3 lg:py-4"><Badge s={g.status} /></td>
                                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-gray-700">{g.table ?? "-"}</td>
                                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-gray-700">{g.group ?? "-"}</td>
                                    <td className="px-4 lg:px-6 py-3 lg:py-4 text-gray-700">{g.household}</td>
                                    <td className="px-4 lg:px-6 py-3 lg:py-4 ltr text-gray-700 font-mono">{g.phone ?? "-"}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={6} className="p-4 text-center text-gray-500">לא נמצאו פריטים</td></tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">טוען…</div>
                ) : filtered.length ? (
                    filtered.map(g => (
                        <Card key={g.id} className="p-4">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex-1 min-w-0">
                                    <div className="text-base font-semibold text-gray-900 mb-1">
                                        {g.name}
                                    </div>
                                    {g.relation && (
                                        <div className="text-sm text-gray-500 mb-2">
                                            {g.relation}
                                        </div>
                                    )}
                                    <Badge s={g.status} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                    <span className="text-gray-500 text-xs">שולחן:</span>
                                    <div className="text-gray-900 mt-0.5">{g.table ?? "-"}</div>
                                </div>
                                <div>
                                    <span className="text-gray-500 text-xs">קבוצה:</span>
                                    <div className="text-gray-900 mt-0.5">{g.group ?? "-"}</div>
                                </div>
                                <div>
                                    <span className="text-gray-500 text-xs">משפחה:</span>
                                    <div className="text-gray-900 mt-0.5">{g.household}</div>
                                </div>
                                <div>
                                    <span className="text-gray-500 text-xs">טלפון:</span>
                                    <div className="text-gray-900 ltr font-mono mt-0.5">{g.phone ?? "-"}</div>
                                </div>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="p-8 text-center text-gray-500">לא נמצאו פריטים</div>
                )}
            </div>
        </div>
    )
}
