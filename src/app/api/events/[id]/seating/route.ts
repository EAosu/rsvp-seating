import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const [tables, guests] = await Promise.all([
        prisma.table.findMany({
            where: { eventId: id },
            orderBy: [{ name: "asc" }],
            select: { id: true, name: true, capacity: true },
        }),
        prisma.guest.findMany({
            where: { eventId: id },
            orderBy: [{ fullName: "asc" }],
            select: {
                id: true,
                fullName: true,
                rsvpStatus: true,
                tableId: true,
                householdId: true, // חשוב לגרירה משפחתית
            },
        }),
    ])

    return NextResponse.json({ tables, guests })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: eventId } = await params
    const body = await req.json().catch(() => ({}))

    // תמיכה ב-bulk
    if (Array.isArray(body?.updates)) {
        const updates: Array<{ guestId: string; tableId: string | null }> = body.updates
        if (!updates.length) return NextResponse.json({ ok: true, updated: 0 })

        await prisma.$transaction(
            updates.map(u =>
                prisma.guest.update({
                    where: { id: u.guestId },
                    data: { tableId: u.tableId, seatNumber: null },
                }),
            ),
        )
        return NextResponse.json({ ok: true, updated: updates.length })
    }

    // יחיד
    const { guestId, tableId } = body || {}
    if (!guestId) return NextResponse.json({ error: "guestId is required" }, { status: 400 })

    await prisma.guest.update({
        where: { id: guestId },
        data: { tableId: tableId ?? null, seatNumber: null },
    })

    return NextResponse.json({ ok: true, updated: 1 })
}
