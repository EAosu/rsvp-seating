"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { MessageCircle, Send, Loader2 } from "lucide-react"

export default function SendInvitesButton({ eventId }: { eventId: string }) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function onClick() {
        try {
            setLoading(true)
            const res = await fetch(`/api/events/${eventId}/invites/send`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ onlyPending: true }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data?.error || "שגיאה בשליחה")
            const s = data?.summary || {}
            toast.success(`נשלחו ${s.sent || 0} הודעות · דילגנו על ${s.skipped || 0} · שגיאות ${s.failed || 0}`)
            router.refresh()
        } catch (e: any) {
            toast.error(e.message || "שגיאה בשליחה")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button
            type="button"
            onClick={onClick}
            disabled={loading}
            className="gap-2 text-white shadow-lg hover:shadow-xl transition-all duration-300 font-semibold px-6 py-2.5"
            style={{
                background: 'linear-gradient(135deg, rgba(37, 211, 102, 0.95), rgba(18, 140, 126, 0.95))',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 4px 16px rgba(37, 211, 102, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
            }}
            onMouseEnter={(e) => {
                if (!loading) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(32, 186, 90, 0.95), rgba(15, 122, 111, 0.95))'
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.4)'
                }
            }}
            onMouseLeave={(e) => {
                if (!loading) {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(37, 211, 102, 0.95), rgba(18, 140, 126, 0.95))'
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(37, 211, 102, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.3)'
                }
            }}
            aria-label="שלח הזמנות בוואטסאפ"
        >
            {loading ? (
                <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    <span>שולח…</span>
                </>
            ) : (
                <>
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    <span>שלח הזמנות בוואטסאפ</span>
                </>
            )}
        </Button>
    )
}
