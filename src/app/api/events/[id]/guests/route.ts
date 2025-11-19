import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"
import { requireEventOwnership } from "@/lib/authorization"
import { z } from "zod"

export const dynamic = "force-dynamic"
export const revalidate = 0

const createGuestSchema = z.object({
    fullName: z.string().min(1),
    phoneWa: z.string().optional().nullable(),
    group: z.string().optional().nullable(),
    relation: z.string().optional().nullable(),
    mealPreference: z.string().optional().nullable(),
    invitedSeats: z.number().int().positive().optional().nullable(),
    householdId: z.string().optional().nullable(),
})

const updateGuestSchema = createGuestSchema.partial().extend({
    rsvpStatus: z.enum(["PENDING", "YES", "NO", "MAYBE"]).optional(),
    confirmedSeats: z.number().int().positive().optional().nullable(),
})

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    try {
        await requireEventOwnership(id)
    } catch (error) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const guests = await prisma.guest.findMany({
        where: { eventId: id },
        include: {
            household: true,
            table: { select: { name: true } },
            contactLinks: { include: { contact: true } },
        },
        orderBy: [{ fullName: "asc" }],
    })

    const out = guests.map(g => {
        const contactPhone = g.contactLinks[0]?.contact.phoneWa || null
        const phone =
            g.phoneWa ||
            contactPhone ||
            g.household?.phoneWa ||
            null

        const group = g.group ?? g.household?.group ?? null

        return {
            id: g.id,
            name: g.fullName,
            status: g.rsvpStatus,
            meal: g.mealPreference,
            relation: g.relation,
            table: g.table?.name || null,
            group,
            household: g.household?.name || "",
            phone,
            invitedSeats: g.invitedSeats ?? 1,
            confirmedSeats: g.confirmedSeats ?? null,
        }
    })

    return NextResponse.json({ guests: out })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    try {
        await requireEventOwnership(id)
    } catch (error) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        const body = await req.json()
        const parsed = createGuestSchema.safeParse(body)

        if (!parsed.success) {
            return NextResponse.json(
                { error: "Invalid input", details: parsed.error.flatten() },
                { status: 400 }
            )
        }

        const data = parsed.data

        // Verify household belongs to event if provided
        if (data.householdId) {
            const household = await prisma.household.findFirst({
                where: { id: data.householdId, eventId: id },
            })
            if (!household) {
                return NextResponse.json({ error: "Household not found" }, { status: 404 })
            }
        }

        const guest = await prisma.guest.create({
            data: {
                eventId: id,
                fullName: data.fullName,
                phoneWa: data.phoneWa,
                group: data.group,
                relation: data.relation,
                mealPreference: data.mealPreference,
                invitedSeats: data.invitedSeats ?? 1,
                householdId: data.householdId,
            },
        })

        return NextResponse.json({ guest }, { status: 201 })
    } catch (error) {
        console.error("Create guest error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}
