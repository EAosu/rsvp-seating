"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { toast } from "sonner"

export default function AutoSeatButton() {
    const { id } = useParams<{ id: string }>()
    const [keep, setKeep] = useState(true)
    const [loading, setLoading] = useState(false)

    async function run() {
        try {
            setLoading(true)
            const r = await fetch(`/api/events/${id}/seating/auto`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ keepExisting: keep }),
            })
            const j = await r.json()
            if (!r.ok) throw new Error(j?.error || "שגיאה")
            toast.success(`שובצו ${j.assigned || 0} אורחים`)
            // אם יש לך SSE בדף סידור — הוא יעדכן. אחרת:
            location.reload()
        } catch (e:any) {
            toast.error(e.message || "שגיאה בשיבוץ")
        } finally { setLoading(false) }
    }

    return (
        <div className="flex items-center gap-3 mb-3">
            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={keep} onChange={e=>setKeep(e.target.checked)} />
                שמור שיבוצים קיימים
            </label>
            <button onClick={run} disabled={loading} className="px-3 py-2 rounded-xl border bg-white hover:bg-gray-50 disabled:opacity-50">
                {loading ? "משבץ…" : "שיבוץ אוטומטי"}
            </button>
        </div>
    )
}
