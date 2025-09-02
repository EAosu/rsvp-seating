"use client"
import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { cn } from "@/lib/utils"

type G = {
    id: string; name: string; status: "YES"|"NO"|"MAYBE"|"PENDING";
    meal: string|null; relation: string|null;
    table: string|null; group: string|null; household: string; phone: string|null
}

export default function EventGuestsList({ initial }: { initial?: G[] }) {
    const { id } = useParams<{ id: string }>()
    const [guests, setGuests] = useState<G[]>(initial || [])
    const [q, setQ] = useState("")
    const [filter, setFilter] = useState<"ALL"|"YES"|"NO"|"MAYBE"|"PENDING">("ALL")

    useEffect(() => {
        if (initial && initial.length) return
            ;(async () => {
            const r = await fetch(`/api/events/${id}/guests`, { cache: "no-store" })
            const j = await r.json()
            setGuests(j.guests)
        })()
    }, [id])

    // לייב: מעדכן סטטוס אורחים שמקבלים דרך SSE (publish מה-webhook)
    useEffect(() => {
        const es = new EventSource(`/api/events/${id}/rsvp/stream`)
        es.onmessage = (ev) => {
            const msg = JSON.parse(ev.data)
            if (msg.type === "rsvp_update") {
                setGuests(prev => prev.map(g => msg.guestIds.includes(g.id) ? { ...g, status: msg.rsvpStatus } : g))
            }
        }
        return () => es.close()
    }, [id])

    const filtered = useMemo(() => {
        const term = q.trim()
        return guests.filter(g => {
            if (filter !== "ALL" && g.status !== filter) return false
            if (!term) return true
            const hay = `${g.name} ${g.household} ${g.group ?? ""} ${g.table ?? ""} ${g.phone ?? ""}`.toLowerCase()
            return hay.includes(term.toLowerCase())
        })
    }, [guests, q, filter])

    const Badge = ({ s }: { s: G["status"] }) => (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs",
                s==="YES" && "bg-green-100 text-green-700",
                s==="NO" && "bg-red-100 text-red-700",
                s==="MAYBE" && "bg-amber-100 text-amber-700",
                s==="PENDING" && "bg-gray-100 text-gray-700",
            )}
        >
      {s==="YES" ? "מאשר/ת" : s==="NO" ? "לא מגיע/ה" : s==="MAYBE" ? "אולי" : "ממתין/ה"}
    </span>
    )

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <input
                    className="w-full sm:w-72 rounded-xl border px-3 py-2 text-sm"
                    placeholder="חיפוש לפי שם/קבוצה/שולחן/טלפון…"
                    value={q}
                    onChange={e => setQ(e.target.value)}
                />
                <div className="flex gap-2 text-sm">
                    {(["ALL","YES","MAYBE","NO","PENDING"] as const).map(k => (
                        <button
                            key={k}
                            onClick={() => setFilter(k)}
                            className={cn(
                                "rounded-xl px-3 py-1 border",
                                filter===k ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-700 hover:bg-gray-100"
                            )}
                        >
                            {k==="ALL"?"הכול":k==="YES"?"מאשרים":k==="MAYBE"?"אולי":k==="NO"?"לא": "ממתינים"}
                        </button>
                    ))}
                </div>
            </div>

            <div className="rounded-2xl border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                    <tr className="text-gray-600">
                        <th className="p-2 text-right">אורח/ת</th>
                        <th className="p-2 text-right">סטטוס</th>
                        <th className="p-2 text-right">שולחן</th>
                        <th className="p-2 text-right">קבוצה</th>
                        <th className="p-2 text-right">Household</th>
                        <th className="p-2 text-right">טלפון</th>
                        <th className="p-2 text-right">מנה</th>
                    </tr>
                    </thead>
                    <tbody>
                    {filtered.map(g => (
                        <tr key={g.id} className="border-t">
                            <td className="p-2">{g.name}{g.relation ? <span className="text-gray-500"> · {g.relation}</span> : null}</td>
                            <td className="p-2"><Badge s={g.status} /></td>
                            <td className="p-2">{g.table ?? "-"}</td>
                            <td className="p-2">{g.group ?? "-"}</td>
                            <td className="p-2">{g.household}</td>
                            <td className="p-2 ltr">{g.phone ?? "-"}</td>
                            <td className="p-2">{g.meal ?? "-"}</td>
                        </tr>
                    ))}
                    {!filtered.length && (
                        <tr><td className="p-4 text-center text-gray-500" colSpan={7}>לא נמצאו פריטים</td></tr>
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
