"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function SendInvitesButton({ eventId }: { eventId: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function onClick() {
        try {
            setLoading(true)
            const res = await fetch(`/api/events/${eventId}/invites/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ onlyPending: true }), // אפשר לשנות להעדפה אחרת
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data?.error || "שגיאה בשליחה")
            const s = data?.summary || {}
            toast.success(`נשלחו ${s.sent || 0} הודעות · דילגנו על ${s.skipped || 0} · שגיאות ${s.failed || 0}`)
            router.refresh()
        } catch (e:any) {
            toast.error(e.message || "שגיאה בשליחה")
        } finally {
            setLoading(false)
        }
    }

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={loading}
            className="underline disabled:opacity-50 rounded-xl bg-gray-900 text-white px-4 py-2 text-sm"
        >
            {loading ? "שולח…" : "שלח הזמנות בוואטסאפ"}
        </button>
    )
}
