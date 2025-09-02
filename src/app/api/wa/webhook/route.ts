import { NextRequest, NextResponse } from "next/server"
import { updateRsvpByPhone } from "@/server/rsvp-update"

export async function GET(req: NextRequest) {
    const url = new URL(req.url)
    const mode = url.searchParams.get("hub.mode")
    const token = url.searchParams.get("hub.verify_token")
    const challenge = url.searchParams.get("hub.challenge")
    if (mode === "subscribe" && token === process.env.WA_VERIFY_TOKEN) {
        return new NextResponse(challenge, { status: 200 })
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

export async function POST(req: NextRequest) {
    const data = await req.json()
    try {
        const entries = data?.entry ?? []
        for (const entry of entries) {
            const change = entry?.changes?.[0]?.value
            const messages = change?.messages ?? []
            for (const msg of messages) {
                const from = String(msg.from || "")
                let raw = ""

                if (msg.type === "interactive" && msg.interactive?.button_reply) {
                    const br = msg.interactive.button_reply
                    raw = String(br.payload ?? br.id ?? br.title ?? "")
                } else if (msg.type === "button" && msg.button) {
                    raw = String(msg.button.payload ?? msg.button.text ?? "")
                } else {
                    continue
                }

                const ok = await updateRsvpByPhone(from, raw)
                console.log("[WA] reply:", { from, raw, ok }) // לוג דיבוג
            }
        }
    } catch (e) {
        console.error("WA webhook error", e)
    }
    return NextResponse.json({ received: true })
}