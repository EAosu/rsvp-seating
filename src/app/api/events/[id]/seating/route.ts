import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"
import { z } from "zod"

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    const event = await prisma.event.findUnique({
        where: { id },
        include: {
            tables: { select: { id: true, name: true, capacity: true } },
            guests: { select: { id: true, fullName: true, rsvpStatus: true, tableId: true } }
        }
    })
    if (!event) return NextResponse.json({ error: "Event not found" }, { status: 404 })

    return NextResponse.json({ tables: event.tables, guests: event.guests })
}

const SaveSchema = z.object({
    guestId: z.string(),
    tableId: z.string().nullable()
})

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params

    const body = await req.json()
    const parsed = SaveSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: "Bad payload" }, { status: 400 })

    const guest = await prisma.guest.findFirst({ where: { id: parsed.data.guestId, eventId: id } })
    if (!guest) return NextResponse.json({ error: "Guest not found" }, { status: 404 })

    if (parsed.data.tableId) {
        const table = await prisma.table.findFirst({ where: { id: parsed.data.tableId, eventId: id } })
        if (!table) return NextResponse.json({ error: "Table not found" }, { status: 404 })
    }

    await prisma.guest.update({ where: { id: guest.id }, data: { tableId: parsed.data.tableId } })
    return NextResponse.json({ ok: true })
}
