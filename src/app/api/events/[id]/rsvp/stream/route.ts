import { NextRequest, NextResponse } from "next/server"
import { subscribe } from "@/server/rsvp-bus"

export const dynamic = "force-dynamic"

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    let closed = false
    let hb: ReturnType<typeof setInterval> | null = null
    let unsub: (() => void) | null = null

    const stream = new ReadableStream({
        start(controller) {
            // פונקציה לשידור אירועים ללקוח
            const push = (data: any) => {
                if (closed) return
                try {
                    controller.enqueue(`data: ${JSON.stringify(data)}\n\n`)
                } catch { /* הזרם כבר נסגר */ }
            }

            // מנוי לערוץ של האירוע
            unsub = subscribe(id, push)

            // heartbeat כל 25 שניות (לשמור חיבור חי בפרוקסי)
            hb = setInterval(() => {
                if (closed) return
                try { controller.enqueue(`: ping\n\n`) } catch {}
            }, 25_000)

            // אם הלקוח סגר (AbortSignal) – ננקה
            // (לא זמין בכל ריצה, לכן בודקים לפני שמשתמשים)
            req.signal?.addEventListener("abort", () => cleanup(controller))
        },

        cancel() {
            // נקרא אוטומטית כשהלקוח סגר את החיבור
            cleanup()
        },
    })

    function cleanup(controller?: ReadableStreamDefaultController) {
        if (closed) return
        closed = true
        try { hb && clearInterval(hb) } finally { hb = null }
        try { unsub && unsub() } finally { unsub = null }
        try { controller?.close?.() } catch {}
    }

    return new NextResponse(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache, no-transform",
            Connection: "keep-alive",
            "X-Accel-Buffering": "no",
        },
    })
}
