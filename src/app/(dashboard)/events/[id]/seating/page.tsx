"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useParams } from "next/navigation"
import { DndContext, DragEndEvent, DragStartEvent, useDroppable, useDraggable } from "@dnd-kit/core"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import TableManager from "@/components/TableManager"
import AutoSeatButton from "@/components/AutoSeatButton"
import FamilyDragToggle from "@/components/FamilyDragToggle"

type Rsvp = "YES" | "NO" | "MAYBE" | "PENDING"
type Table = { id: string; name: string; capacity: number }
type Guest = { id: string; fullName: string; rsvpStatus: Rsvp; tableId?: string | null; householdId?: string | null }

function statusClasses(status: Rsvp) {
    switch (status) {
        case "YES": return "bg-green-50 border-green-200 text-green-800"
        case "NO": return "bg-red-50 border-red-200 text-red-700 line-through"
        case "MAYBE": return "bg-amber-50 border-amber-200 text-amber-800"
        case "PENDING":
        default: return "bg-gray-50 border-gray-200 text-gray-700"
    }
}
function StatusDot({ status }: { status: Rsvp }) {
    const color = status === "YES" ? "bg-green-500" : status === "NO" ? "bg-red-500" : status === "MAYBE" ? "bg-amber-500" : "bg-gray-400"
    return <span className={cn("inline-block size-2 rounded-full", color)} />
}

function TableCard({ table, count, children }: { table: Table; count: number; children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id: table.id })
    const full = count >= table.capacity
    return (
        <div ref={setNodeRef} className={cn("rounded-2xl border bg-white shadow-sm transition-colors", isOver ? "border-gray-400" : "border-gray-200", full ? "outline outline-1 outline-red-300" : "")}>
            <div className="flex items-center justify-between p-4">
                <div className="font-medium">{table.name}</div>
                <div className={cn("text-xs", full ? "text-red-600 font-medium" : "text-gray-500")}>{count}/{table.capacity}</div>
            </div>
            <div className="grid grid-cols-2 gap-2 p-4 pt-0">{children}</div>
        </div>
    )
}

function UnassignedBin({ children }: { children: React.ReactNode }) {
    const { setNodeRef, isOver } = useDroppable({ id: "unassigned" })
    return (
        <div ref={setNodeRef} className={cn("rounded-2xl border border-dashed p-4 min-h-[96px]", isOver ? "border-gray-600 bg-gray-50" : "border-gray-300")}>
            <div className="text-xs text-gray-500 mb-2">אורחים שלא שובצו</div>
            <div className="flex flex-wrap gap-2">{children}</div>
        </div>
    )
}

function GuestPill({
                       guest,
                       onFamilyHandlePointerDown,
                   }: {
    guest: Guest
    onFamilyHandlePointerDown: () => void
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: guest.id })
    const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined

    return (
        <div
            ref={setNodeRef}
            // שומר יכולת לגרור מכל מקום (אורח בודד)
            {...attributes}
            {...listeners}
            title={`${guest.fullName} • ${guest.rsvpStatus}`}
            style={style}
            className={cn(
                "px-3 py-2 rounded-full border text-sm cursor-grab select-none",
                "transition-colors flex items-center justify-between gap-3",
                statusClasses(guest.rsvpStatus),
                isDragging ? "opacity-60" : ""
            )}
        >
      <span className="inline-flex items-center gap-2">
        <StatusDot status={guest.rsvpStatus} />
          {guest.fullName}
      </span>

            {/* ידית משפחה 👪 — לחיצה וגרירה ממנה גורמת לגרור את כל המשפחה */}
            <button
                type="button"
                className="shrink-0 rounded-full border px-2 py-1 text-[11px] leading-none bg-white hover:bg-gray-50"
                title="גרור/י משפחה שלמה"
                aria-label="גרור משפחה שלמה"
                onPointerDownCapture={onFamilyHandlePointerDown}
            >
                👪
            </button>
        </div>
    )
}

export default function SeatingPage() {
    const { id } = useParams<{ id: string }>()
    const [tables, setTables] = useState<Table[]>([])
    const [guests, setGuests] = useState<Guest[]>([])
    const [loading, setLoading] = useState(true)

    // מצב “גרור משפחה שלמה”
    const [familyMode, setFamilyMode] = useState(false)
    const dragAsFamilyRef = useRef(false)
    const forcedFamilyNextRef = useRef(false) // נקבע כשמושכים מהידית 👪
    const draggedGuestRef = useRef<string | null>(null)

    // SSE לעדכוני RSVP
    useEffect(() => {
        if (!id) return
        const es = new EventSource(`/api/events/${id}/rsvp/stream`)
        es.onmessage = (ev) => {
            try {
                const msg = JSON.parse(ev.data)
                if (msg.type === "rsvp_update") {
                    setGuests(prev => prev.map(g => (msg.guestIds.includes(g.id) ? { ...g, rsvpStatus: msg.rsvpStatus } : g)))
                }
            } catch {}
        }
        return () => es.close()
    }, [id])

    // טעינה ראשונית
    useEffect(() => {
        ;(async () => {
            const res = await fetch(`/api/events/${id}/seating`)
            if (!res.ok) { toast.error("שגיאה בטעינת נתוני הושבה"); return }
            const data = await res.json()
            setTables(data.tables)
            setGuests(data.guests)
            setLoading(false)
        })()
    }, [id])

    const countsByTable = useMemo(() => {
        const map: Record<string, number> = {}
        for (const g of guests) if (g.tableId) map[g.tableId] = (map[g.tableId] || 0) + 1
        return map
    }, [guests])

    const guestsByHousehold = useMemo(() => {
        const m = new Map<string, Guest[]>()
        for (const g of guests) {
            if (!g.householdId) continue
            const arr = m.get(g.householdId) || []
            arr.push(g)
            m.set(g.householdId, arr)
        }
        return m
    }, [guests])

    const onDragStart = (ev: DragStartEvent) => {
        draggedGuestRef.current = String(ev.active.id)
        const e: any = ev.activatorEvent
        const shift = !!(e && typeof e === "object" && "shiftKey" in e && e.shiftKey)
        // אם נלחצה ידית המשפחה — זה ינצח
        const forced = forcedFamilyNextRef.current
        forcedFamilyNextRef.current = false
        dragAsFamilyRef.current = forced || shift || familyMode
    }

    const onDragEnd = async (ev: DragEndEvent) => {
        const draggedId = draggedGuestRef.current
        draggedGuestRef.current = null

        const overId = ev.over?.id ? String(ev.over.id) : null
        const newTableId = overId === "unassigned" ? null : overId
        if (!draggedId) return

        const dragged = guests.find(g => g.id === draggedId)
        if (!dragged) return

        let moveIds: string[] = [dragged.id]
        if (dragAsFamilyRef.current && dragged.householdId) {
            const fam = guestsByHousehold.get(dragged.householdId) || []
            moveIds = fam.map(g => g.id)
        }

        if (newTableId) {
            const t = tables.find(x => x.id === newTableId)
            const current = countsByTable[newTableId] || 0
            if (t && current + moveIds.length > t.capacity) {
                toast.error("אין מספיק מקום לשולחן עבור כל המשפחה")
                return
            }
        }

        setGuests(prev => prev.map(g => (moveIds.includes(g.id) ? { ...g, tableId: newTableId } : g)))

        const res = await fetch(`/api/events/${id}/seating`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ updates: moveIds.map(gid => ({ guestId: gid, tableId: newTableId })) }),
        })
        if (!res.ok) toast.error("שגיאה בשמירת השיבוץ")
    }

    if (loading) return <div className="container-page rtl">טוען…</div>

    const Legend = () => (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="flex gap-3 text-xs text-gray-600">
                <span className="inline-flex items-center gap-1"><StatusDot status="YES" />מאשר</span>
                <span className="inline-flex items-center gap-1"><StatusDot status="MAYBE" />אולי</span>
                <span className="inline-flex items-center gap-1"><StatusDot status="PENDING" />ממתין</span>
                <span className="inline-flex items-center gap-1"><StatusDot status="NO" />לא מגיע</span>
            </div>
        </div>
    )

    async function fetchTablesOnly() {
        const r = await fetch(`/api/events/${id}/tables`, { cache: "no-store" })
        if (!r.ok) return
        const j = await r.json()
        setTables(j.tables || [])
    }
    function handleTablesChanged(ev?: { type: "add" | "update" | "delete"; tableId?: string }) {
        if (ev?.type === "delete" && ev.tableId) {
            setTables(prev => prev.filter(t => t.id !== ev.tableId))
            setGuests(prev => prev.map(g => (g.tableId === ev.tableId ? { ...g, tableId: null } : g)))
            ;(async () => {
                const res = await fetch(`/api/events/${id}/seating`, { cache: "no-store" })
                if (res.ok) {
                    const data = await res.json()
                    setTables(data.tables)
                    setGuests(data.guests)
                }
            })()
        } else {
            fetchTablesOnly()
        }
    }

    return (
        <div className="container-page rtl">
            <h1 className="title mb-2">סידורי הושבה</h1>

            <TableManager onChanged={handleTablesChanged} />

            <h3 className="title mb-2 mt-5">שיבוץ</h3>
            <Legend />
            <AutoSeatButton />

            <FamilyDragToggle value={familyMode} onChange={setFamilyMode} />
            <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {tables.map(t => (
                        <TableCard key={t.id} table={t} count={countsByTable[t.id] || 0}>
                            {guests.filter(g => g.tableId === t.id).map(g => (
                                <GuestPill
                                    key={g.id}
                                    guest={g}
                                    onFamilyHandlePointerDown={() => { forcedFamilyNextRef.current = true }}
                                />
                            ))}
                        </TableCard>
                    ))}
                </div>

                <UnassignedBin>
                    {guests.filter(g => !g.tableId).map(g => (
                        <GuestPill
                            key={g.id}
                            guest={g}
                            onFamilyHandlePointerDown={() => { forcedFamilyNextRef.current = true }}
                        />
                    ))}
                </UnassignedBin>
            </DndContext>
        </div>
    )
}
