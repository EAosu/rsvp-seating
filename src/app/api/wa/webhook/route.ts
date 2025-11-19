import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"
import { canonPhone } from "@/lib/phone"
import { publish } from "@/server/rsvp-bus"

function statusFromPayload(raw: string): "YES"|"MAYBE"|"NO" {
    const up = (raw || "").toUpperCase()
    if (up.includes("YES") || up.includes("מאשר")) return "YES"
    if (up.includes("MAYBE") || up.includes("אולי")) return "MAYBE"
    return "NO"
}

// Meta webhook verification (GET request)
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams
    const mode = searchParams.get("hub.mode")
    const token = searchParams.get("hub.verify_token")
    const challenge = searchParams.get("hub.challenge")

    const verifyToken = process.env.WA_WEBHOOK_VERIFY_TOKEN

    if (!verifyToken) {
        console.error("WA_WEBHOOK_VERIFY_TOKEN environment variable is not set")
        return NextResponse.json({ error: "Webhook verification not configured" }, { status: 500 })
    }

    if (mode === "subscribe" && token === verifyToken) {
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
                const from = canonPhone(String(msg.from || ""))
                let raw = ""

                if (msg.type === "interactive" && msg.interactive?.button_reply) {
                    const br = msg.interactive.button_reply
                    raw = String(br.payload ?? br.id ?? br.title ?? "")
                } else if (msg.type === "button" && msg.button) {
                    raw = String(msg.button.payload ?? msg.button.text ?? "")
                } else {
                    continue
                }

                const st = statusFromPayload(raw)

                // נזהה את ה-Contact לפי המספר (ייתכן בכמה אירועים – ניקח את ההזמנה האחרונה)
                const lastInvite = await prisma.invite.findFirst({
                    where: { contact: { phoneWa: from } },
                    orderBy: { lastSentAt: "desc" },
                    include: {
                        event: true,
                        contact: { include: { guestLinks: { include: { guest: true } } } },
                    },
                })

                // אם לא מצאנו הזמנה, נחפש Contact אחרון (לפי יצירה)
                const contact = lastInvite?.contact || await prisma.contact.findFirst({
                    where: { phoneWa: from },
                    orderBy: { id: "desc" },
                    include: { event: true, guestLinks: { include: { guest: true } } },
                })

                if (!contact) continue

                // עדכון האורחים המשויכים לפי scope
                const guestIds = contact.guestLinks.map(gl => gl.guest.id)
                const primaryGuestId = contact.guestLinks.find(gl => gl.role === "PRIMARY")?.guest.id
                const toUpdate = contact.scope === "ALL_LINKED" ? guestIds : (primaryGuestId ? [primaryGuestId] : [])

                if (toUpdate.length) {
                    const data: any = { rsvpStatus: st }
                    if (st === "NO") Object.assign(data, { tableId: null, seatNumber: null })
                    await prisma.guest.updateMany({ where: { id: { in: toUpdate } }, data })

                    publish(contact.eventId, {
                        type: "rsvp_update",
                        guestIds: toUpdate,
                        rsvpStatus: st,
                    })
                }

                // עדכן סטטוס invite אם קיים
                if (lastInvite) {
                    await prisma.invite.update({ where: { id: lastInvite.id }, data: { status: "READ" } }).catch(()=>{})
                }
            }
        }
    } catch (e) {
        console.error("WA webhook error", e)
    }
    return NextResponse.json({ received: true })
}
