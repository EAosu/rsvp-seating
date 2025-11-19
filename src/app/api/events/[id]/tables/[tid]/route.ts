import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"
import { requireEventOwnership } from "@/lib/authorization"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; tid: string }> }) {
    const { id, tid } = await params
    
    try {
        await requireEventOwnership(id)
    } catch (error) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const body = await req.json().catch(() => ({}))
    const data: any = {}
    if (typeof body?.name === "string") data.name = body.name.trim() || "שולחן"
    if (body?.capacity != null) data.capacity = Math.max(1, Number(body.capacity))

    const table = await prisma.table.update({ where: { id: tid }, data })
    return NextResponse.json({ table })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; tid: string }> }) {
    const { id, tid } = await params
    
    try {
        await requireEventOwnership(id)
    } catch (error) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    // מפנים את האורחים מהשולחן
    await prisma.guest.updateMany({ where: { tableId: tid }, data: { tableId: null, seatNumber: null } })
    await prisma.table.delete({ where: { id: tid } })
    return NextResponse.json({ ok: true })
}
