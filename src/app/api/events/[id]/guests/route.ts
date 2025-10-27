import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"

export const dynamic = "force-dynamic" // לאפשר נתונים חיים
export const revalidate = 0

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const guests = await prisma.guest.findMany({
        where: { eventId: id },
        include: {
            household: true, // אופציונלי בסכמה החדשה - לכן נבדוק null
            table: { select: { name: true } },
            contactLinks: { include: { contact: true } },
        },
        orderBy: [{ fullName: "asc" }],
    })

    const out = guests.map(g => {
        // טלפון מועדף: אישי → Contact ראשון → Household
        const contactPhone = g.contactLinks[0]?.contact.phoneWa || null
        const phone =
            g.phoneWa ||
            contactPhone ||
            g.household?.phoneWa ||
            null

        // קבוצה מועדפת: group של האורח → group של Household
        const group = g.group ?? g.household?.group ?? null

        return {
            id: g.id,
            name: g.fullName,
            status: g.rsvpStatus,                 // YES/NO/MAYBE/PENDING
            meal: g.mealPreference,
            relation: g.relation,
            table: g.table?.name || null,
            group,
            household: g.household?.name || "",
            phone,
        }
    })

    return NextResponse.json({ guests: out })
}
