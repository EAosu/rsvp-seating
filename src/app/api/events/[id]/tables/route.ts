import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const tables = await prisma.table.findMany({
        where: { eventId: id },
        orderBy: [{ name: "asc" }],
    })
    return NextResponse.json({ tables })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const name = String(body?.name ?? "").trim() || "שולחן"
    const capacity = Math.max(1, Number(body?.capacity ?? 10))

    const table = await prisma.table.create({
        data: { eventId: id, name, capacity },
    })
    return NextResponse.json({ table })
}
