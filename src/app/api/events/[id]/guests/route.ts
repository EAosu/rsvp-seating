import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const guests = await prisma.guest.findMany({
        where: { eventId: id },
        include: { household: true, table: true },
        orderBy: [{ household: { name: "asc" } }, { fullName: "asc" }],
    })
    const out = guests.map(g => ({
        id: g.id,
        name: g.fullName,
        status: g.rsvpStatus,                 // YES/NO/MAYBE/PENDING
        meal: g.mealPreference,
        relation: g.relation,
        table: g.table?.name || null,
        group: g.household?.group || null,
        household: g.household?.name || "",
        phone: g.phoneWa || g.household?.phoneWa || null,
    }))
    return NextResponse.json({ guests: out })
}
