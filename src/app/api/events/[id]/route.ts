import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"
import { requireEventOwnership } from "@/lib/authorization"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    try {
        await requireEventOwnership(id)
    } catch (error) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const event = await prisma.event.findUnique({
        where: { id },
        select: {
            id: true,
            title: true,
            eventDate: true,
            venue: true,
        },
    })

    if (!event) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ event })
}

