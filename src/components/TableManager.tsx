"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"

type T = { id: string; name: string; capacity: number }
type ChangeEvent = { type: "add" | "update" | "delete"; tableId?: string }

export default function TableManager({ onChanged }: { onChanged?: (ev: ChangeEvent) => void }) {
    const { id } = useParams<{ id: string }>()
    const [tables, setTables] = useState<T[]>([])
    const [name, setName] = useState("")
    const [capacity, setCapacity] = useState(10)
    const [loading, setLoading] = useState(false)

    async function refresh() {
        const r = await fetch(`/api/events/${id}/tables`, { cache: "no-store" })
        const j = await r.json()
        setTables(j.tables || [])
    }

    useEffect(() => { refresh() }, [id])

    async function add() {
        try {
            setLoading(true)
            const r = await fetch(`/api/events/${id}/tables`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, capacity }),
            })
            if (!r.ok) throw new Error(await r.text())
            toast.success("שולחן נוסף")
            setName("")
            setCapacity(10)
            await refresh()
            onChanged?.({ type: "add" })
        } catch (e: any) {
            toast.error(e.message || "שגיאה")
        } finally { setLoading(false) }
    }

    async function update(tid: string, patch: Partial<T>) {
        const r = await fetch(`/api/events/${id}/tables/${tid}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(patch),
        })
        if (!r.ok) {
            toast.error("שגיאה בעדכון")
        } else {
            await refresh()
            onChanged?.({ type: "update" })
        }
    }

    async function remove(tid: string) {
        if (!confirm("למחוק את השולחן? האורחים יפונו מהשולחן.")) return
        const r = await fetch(`/api/events/${id}/tables/${tid}`, { method: "DELETE" })
        if (!r.ok) {
            toast.error("שגיאה במחיקה")
        } else {
            toast.success("נמחק")
            await refresh()
            // מודיע להורה איזה שולחן הוסר – כדי לפנות אורחים בצד הלקוח מיידית
            onChanged?.({ type: "delete", tableId: tid })
        }
    }

    return (
        <div className="space-y-3">
            <div className="rounded-2xl border p-3">
                <div className="font-medium mb-2">הוסף שולחן</div>
                <div className="flex gap-2 items-center">
                    <input className="border rounded-xl px-3 py-2 text-sm" placeholder="שם שולחן"
                           value={name} onChange={e=>setName(e.target.value)} />
                    <input className="border rounded-xl px-3 py-2 text-sm w-24 ltr" type="number" min={1}
                           value={capacity} onChange={e=>setCapacity(Number(e.target.value))}/>
                    <button onClick={add} disabled={loading}
                            className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 disabled:opacity-50">
                        הוסף
                    </button>
                </div>
            </div>

            <div className="rounded-2xl border overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                    <tr className="text-gray-600">
                        <th className="p-2 text-right">שם</th>
                        <th className="p-2 text-right w-24">קיבולת</th>
                        <th className="p-2 w-28"></th>
                    </tr>
                    </thead>
                    <tbody>
                    {tables.map(t => (
                        <tr key={t.id} className="border-t">
                            <td className="p-2">
                                <input className="border rounded-xl px-2 py-1 w-full" defaultValue={t.name}
                                       onBlur={(e)=>{const v=e.target.value.trim(); if(v && v!==t.name) update(t.id,{name:v})}}/>
                            </td>
                            <td className="p-2">
                                <input className="border rounded-xl px-2 py-1 w-full ltr" type="number" min={1} defaultValue={t.capacity}
                                       onBlur={(e)=>{const v=Number(e.target.value); if(v>0 && v!==t.capacity) update(t.id,{capacity:v})}}/>
                            </td>
                            <td className="p-2 text-left">
                                <button onClick={()=>remove(t.id)} className="text-red-600 underline">מחק</button>
                            </td>
                        </tr>
                    ))}
                    {!tables.length && <tr><td colSpan={3} className="p-3 text-center text-gray-500">אין שולחנות עדיין</td></tr>}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
