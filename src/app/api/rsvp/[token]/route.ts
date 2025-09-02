import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"
import { z } from "zod"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    const { token } = await params
    const invite = await prisma.invite.findUnique({
        where: { rsvpToken: token },
        include: { household: { include: { guests: true } }, event: true }
    })
    if (!invite) return NextResponse.json({ error: "Invalid token" }, { status: 404 })
    return NextResponse.json({
        event: { title: invite.event.title, date: invite.event.eventDate, venue: invite.event.venue },
        household: { name: invite.household.name, group: invite.household.group },
        guests: invite.household.guests.map(g => ({
            id: g.id, fullName: g.fullName, mealPreference: g.mealPreference, rsvpStatus: g.rsvpStatus
        }))
    })
}

const RsvpSchema = z.object({
    guests: z.array(z.object({
        id: z.string(),
        rsvpStatus: z.enum(["YES","NO","MAYBE"]),
        mealPreference: z.string().optional().nullable(),
        notes: z.string().optional().nullable()
    })),
    attendeesCount: z.number().int().min(0).max(50).optional()
})

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    const { token } = await params
    const invite = await prisma.invite.findUnique({
        where: { rsvpToken: token },
        include: { household: { include: { guests: true } } }
    })
    if (!invite) return NextResponse.json({ error: "Invalid token" }, { status: 404 })

    const body = await req.json()
    const parsed = RsvpSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

    // עדכון אורחים
    await Promise.all(parsed.data.guests.map(g =>
        prisma.guest.update({
            where: { id: g.id },
            data: {
                rsvpStatus: g.rsvpStatus,
                mealPreference: g.mealPreference ?? undefined,
                notes: g.notes ?? undefined
            }
        })
    ))

    if (parsed.data.attendeesCount !== undefined) {
        await prisma.guest.updateMany({
            where: { householdId: invite.householdId },
            data: { attendeesCount: parsed.data.attendeesCount }
        })
    }

    return NextResponse.json({ ok: true })
}
