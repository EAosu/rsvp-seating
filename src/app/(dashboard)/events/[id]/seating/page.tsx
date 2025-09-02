"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { DndContext, DragEndEvent, useDroppable, useDraggable } from "@dnd-kit/core"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Rsvp = "YES" | "NO" | "MAYBE" | "PENDING"

type Table = { id: string; name: string; capacity: number }
type Guest = { id: string; fullName: string; rsvpStatus: Rsvp; tableId?: string | null }

function statusClasses(status: Rsvp) {
    // רקע/מסגרת/טקסט עדינים ונעימים
    switch (status) {
        case "YES":
            return "bg-green-50 border-green-200 text-green-800"
        case "NO":
            return "bg-red-50 border-red-200 text-red-700 line-through"
        case "MAYBE":
            return "bg-amber-50 border-amber-200 text-amber-800"
        case "PENDING":
        default:
            return "bg-gray-50 border-gray-200 text-gray-700"
    }
}

function StatusDot({ status }: { status: Rsvp }) {
    const color =
        status === "YES" ? "bg-green-500" :
            status === "NO" ? "bg-red-500" :
                status === "MAYBE" ? "bg-amber-500" : "bg-gray-400"
    return <span className={cn("inline-block size-2 rounded-full", color)} />
}

function TableCard({ table, count, children }: { table: Table; count: number; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id: table.id })
    const full = count >= table.capacity

    return (
        <div
            ref={setNodeRef}
            className={cn(
                "rounded-2xl border bg-white shadow-sm transition-colors",
                isOver ? "border-gray-400" : "border-gray-200",
                full ? "outline outline-1 outline-red-300" : ""
            )}
        >
            <div className="flex items-center justify-between p-4">
                <div className="font-medium">{table.name}</div>
                <div className={cn("text-xs", full ? "text-red-600 font-medium" : "text-gray-500")}>
                    {count}/{table.capacity}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-2 p-4 pt-0">{children}</div>
        </div>
    )
}

function UnassignedBin({ children }: { children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id: "unassigned" })
    return (
        <div
            ref={setNodeRef}
            className={cn(
                "rounded-2xl border border-dashed p-4 min-h-[96px]",
                isOver ? "border-gray-600 bg-gray-50" : "border-gray-300"
            )}
        >
            <div className="text-xs text-gray-500 mb-2">אורחים שלא שובצו</div>
            <div className="flex flex-wrap gap-2">{children}</div>
        </div>
    )
}

function GuestPill({ guest }: { guest: Guest }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: guest.id })
    const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined

    return (
        <div
            ref={setNodeRef}
            {...attributes}
            {...listeners}
            title={`${guest.fullName} • ${guest.rsvpStatus}`}
            style={style}
            className={cn(
                "px-3 py-2 rounded-full border text-sm cursor-grab select-none",
                "transition-colors",
                statusClasses(guest.rsvpStatus),
                isDragging ? "opacity-60" : ""
            )}
        >
      <span className="inline-flex items-center gap-2">
        <StatusDot status={guest.rsvpStatus} />
          {guest.fullName}
      </span>
        </div>
    )
}

export default function SeatingPage() {
    const { id } = useParams<{ id: string }>()
    const [tables, setTables] = useState<Table[]>([])
    const [guests, setGuests] = useState<Guest[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (!id) return
        const es = new EventSource(`/api/events/${id}/rsvp/stream`)
        es.onmessage = (ev) => {
            const msg = JSON.parse(ev.data)
            if (msg.type === "rsvp_update") {
                setGuests(prev =>
                    prev.map(g => msg.guestIds.includes(g.id) ? { ...g, rsvpStatus: msg.rsvpStatus } : g)
                )
            }
        }
        return () => es.close()
    }, [id])

    useEffect(() => {
        ;(async () => {
            const res = await fetch(`/api/events/${id}/seating`)
            if (!res.ok) {
                toast.error("שגיאה בטעינת נתוני הושבה")
                return
            }
            const data = await res.json()
            setTables(data.tables)
            setGuests(data.guests)
            setLoading(false)
        })()
    }, [id])

    const countsByTable = useMemo(() => {
        const map: Record<string, number> = {}
        for (const g of guests) {
            if (g.tableId) map[g.tableId] = (map[g.tableId] || 0) + 1
        }
        return map
    }, [guests])

    const onDragEnd = async (ev: DragEndEvent) => {
        const guestId = String(ev.active.id)
        const overId = ev.over?.id ? String(ev.over.id) : null
        const newTableId = overId === "unassigned" ? null : overId

        // עדכון לוקלי מידי
        setGuests(prev => prev.map(g => (g.id === guestId ? { ...g, tableId: newTableId } : g)))

        // שמירה בשרת
        const res = await fetch(`/api/events/${id}/seating`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ guestId, tableId: newTableId })
        })
        if (!res.ok) toast.error("שגיאה בשמירת השיבוץ")
    }

    if (loading) return <div className="container-page rtl">טוען…</div>

    // מקרא קטן (Legend)
    const Legend = () => (
        <div className="flex gap-3 text-xs text-gray-600 mb-4">
            <span className="inline-flex items-center gap-1"><StatusDot status="YES" />מאשר</span>
            <span className="inline-flex items-center gap-1"><StatusDot status="MAYBE" />אולי</span>
            <span className="inline-flex items-center gap-1"><StatusDot status="PENDING" />ממתין</span>
            <span className="inline-flex items-center gap-1"><StatusDot status="NO" />לא מגיע</span>
        </div>
    )

    return (
        <div className="container-page rtl">
            <h1 className="title mb-2">סידורי הושבה</h1>
            <Legend />

            <DndContext onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {tables.map(t => (
                        <TableCard key={t.id} table={t} count={countsByTable[t.id] || 0}>
                            {guests.filter(g => g.tableId === t.id).map(g => <GuestPill key={g.id} guest={g} />)}
                        </TableCard>
                    ))}
                </div>

                <UnassignedBin>
                    {guests.filter(g => !g.tableId).map(g => <GuestPill key={g.id} guest={g} />)}
                </UnassignedBin>
            </DndContext>

            <button
                onClick={async () => {
                    const res = await fetch(`/api/events/${id}/invites/send`, { method: "POST" })
                    if (res.ok) toast.success("נשלחו הזמנות"); else toast.error("שגיאה בשליחה")
                }}
                className="rounded-xl bg-gray-900 text-white px-4 py-2 text-sm"
            >
                שלח אישורי הגעה
            </button>
        </div>
    )
}
