import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"
import { canonPhone } from "@/lib/phone"
import { sendRsvpQuick } from "@/server/wa"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: eventId } = await params
    const body = await req.json().catch(() => ({}))
    const onlyPending: boolean = body?.onlyPending ?? false

    const event = await prisma.event.findUnique({ where: { id: eventId } })
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 })

    // 1) Contacts קיימים
    let contacts = await prisma.contact.findMany({
        where: { eventId },
        include: {
            guestLinks: { include: { guest: true } },
            invites: true,
        },
    })

    // 2) מילוי אוטומטי של Contacts אם חסרים (פעם ראשונה / נתונים לא הוגרו)
    if (contacts.length === 0) {
        // 2.1 ממשקי בית (מספר משפחתי)
        const households = await prisma.household.findMany({
            where: { eventId },
            include: { guests: true }, // ← חשוב כדי להשתמש hh.guests
        })

        for (const hh of households) {
            const phone = canonPhone(hh.phoneWa || "")
            if (!phone) continue

            const contact = await prisma.contact.upsert({
                where: { eventId_phoneWa: { eventId, phoneWa: phone } },
                create: {
                    eventId,
                    phoneWa: phone,
                    displayName: hh.name || null,
                    scope: "ALL_LINKED",
                },
                update: {},
            })

            // קשר את כל האורחים של הבית: הראשון PRIMARY, השאר OTHER
            for (let i = 0; i < hh.guests.length; i++) {
                const g = hh.guests[i]
                await prisma.contactGuest.upsert({
                    where: { contactId_guestId: { contactId: contact.id, guestId: g.id } },
                    create: { contactId: contact.id, guestId: g.id, role: i === 0 ? "PRIMARY" : "OTHER" },
                    update: {},
                })
            }
        }

        // 2.2 מטלפונים אישיים של אורחים (guest.phoneWa)
        const guestsWithPhone = await prisma.guest.findMany({
            where: { eventId, phoneWa: { not: null } },
            select: { id: true, fullName: true, phoneWa: true },
        })

        for (const g of guestsWithPhone) {
            const phone = canonPhone(g.phoneWa as string)
            if (!phone) continue

            const contact = await prisma.contact.upsert({
                where: { eventId_phoneWa: { eventId, phoneWa: phone } },
                create: {
                    eventId,
                    phoneWa: phone,
                    displayName: g.fullName,
                    scope: "PRIMARY_ONLY",
                },
                update: {},
            })

            await prisma.contactGuest.upsert({
                where: { contactId_guestId: { contactId: contact.id, guestId: g.id } },
                create: { contactId: contact.id, guestId: g.id, role: "PRIMARY" },
                update: {},
            })
        }

        // רענון רשימת contacts לאחר המילוי
        contacts = await prisma.contact.findMany({
            where: { eventId },
            include: {
                guestLinks: { include: { guest: true } },
                invites: true,
            },
        })
    }

    // 3) סינון מועמדים לשליחה
    const candidates = contacts.filter((c) => {
        // אל תשלח שוב אם כבר יש Invite ל-contact הזה
        if (c.invites.length) return false
        if (!onlyPending) return true
        // שלח רק אם יש לפחות אורח אחד שעדיין PENDING
        return c.guestLinks.some((gl) => gl.guest.rsvpStatus === "PENDING")
    })

    let sent = 0
    let failed = 0
    const skipped = contacts.length - candidates.length

    // 4) שליחה בפועל
    for (const c of candidates) {
        try {
            const name =
                c.displayName ||
                c.guestLinks.find((gl) => gl.role === "PRIMARY")?.guest.fullName ||
                c.guestLinks[0]?.guest.fullName ||
                "מוזמן/ת"

            await sendRsvpQuick(c.phoneWa, {
                guestName: name,
                businessName: "העסק שלך",
                eventTitle: event.title,
                eventDate: new Date(event.eventDate).toLocaleDateString("he-IL"),
            })

            await prisma.invite.upsert({
                where: { eventId_contactId: { eventId, contactId: c.id } },
                create: {
                    eventId,
                    contactId: c.id,
                    phoneWa: c.phoneWa,
                    status: "SENT",
                    lastSentAt: new Date(),
                },
                update: { status: "SENT", lastSentAt: new Date() },
            })

            sent++
        } catch (e) {
            console.error("WA send failed for", c.phoneWa, e)
            failed++
        }
    }

    return NextResponse.json({
        ok: true,
        summary: { total: contacts.length, candidates: candidates.length, sent, skipped, failed },
    })
}
