import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"
import { sendRsvpQuick } from "@/server/wa"
import { canonPhone } from "@/lib/phone"

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: eventId } = await params
    const event = await prisma.event.findUnique({ where: { id: eventId } })
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 })

    // אוספים את כל המספרים: גם של Household וגם של Guests (אם קיימים)
    const households = await prisma.household.findMany({
        where: { eventId },
        select: { phoneWa: true, name: true, id: true, guests: { select: { fullName: true, phoneWa: true } } },
    })

    const allPhones = new Set<string>()
    const phoneToDisplayName = new Map<string, string>() // לשיבוץ פרסונלי בהודעה

    for (const hh of households) {
        const phHh = hh.phoneWa ? canonPhone(hh.phoneWa) : ""
        if (phHh) {
            allPhones.add(phHh)
            phoneToDisplayName.set(phHh, hh.guests[0]?.fullName || hh.name || "מוזמן/ת")
        }
        for (const g of hh.guests) {
            if (!g.phoneWa) continue
            const phG = canonPhone(g.phoneWa)
            if (!phG) continue
            allPhones.add(phG)
            // שם ספציפי לאורח אם הגדרנו טלפון אישי
            phoneToDisplayName.set(phG, g.fullName)
        }
    }

    // מסננים מספרים שכבר קיבלו שליחה באירוע זה (PhoneInvite unique per event+phone)
    const already = await prisma.phoneInvite.findMany({
        where: { eventId, phoneWa: { in: Array.from(allPhones) } },
        select: { phoneWa: true },
    })

    const sentSet = new Set(already.map(x => x.phoneWa))
    const toSend = Array.from(allPhones).filter(p => !sentSet.has(p))

    const businessName = "העסק שלך" // שנה אם צריך
    let sent = 0, failed = 0

    for (const phone of toSend) {
        try {
            const displayName = phoneToDisplayName.get(phone) || "מוזמן/ת"
            await sendRsvpQuick(phone, {
                guestName: displayName,
                businessName,
                eventTitle: event.title,
                eventDate: new Date(event.eventDate).toLocaleDateString("he-IL"),
            })

            await prisma.phoneInvite.create({
                data: { eventId, phoneWa: phone, status: "SENT", lastSentAt: new Date() },
            })
            sent++
        } catch (e) {
            console.error("WA send failed for", phone, e)
            // אפשר לשמור כישלון, או לנסות מאוחר יותר
            failed++
        }
    }

    return NextResponse.json({ ok: true, summary: { candidates: allPhones.size, skipped: sentSet.size, sent, failed } })
}
