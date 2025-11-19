import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"
import { requireEventOwnership } from "@/lib/authorization"
import { z } from "zod"

export const dynamic = "force-dynamic"
export const revalidate = 0

const updateGuestSchema = z.object({
    fullName: z.string().min(1).optional(),
    phoneWa: z.string().optional().nullable(),
    group: z.string().optional().nullable(),
    relation: z.string().optional().nullable(),
    mealPreference: z.string().optional().nullable(),
    invitedSeats: z.number().int().positive().optional().nullable(),
    confirmedSeats: z.number().int().positive().optional().nullable(),
    rsvpStatus: z.enum(["PENDING", "YES", "NO", "MAYBE"]).optional(),
    householdId: z.string().optional().nullable(),
    tableId: z.string().optional().nullable(),
})

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; guestId: string }> }
) {
    const { id, guestId } = await params

    try {
        await requireEventOwnership(id)
    } catch (error) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        // Verify guest belongs to event
        const existingGuest = await prisma.guest.findFirst({
            where: { id: guestId, eventId: id },
        })

        if (!existingGuest) {
            return NextResponse.json({ error: "Guest not found" }, { status: 404 })
        }

        const body = await req.json()
        const parsed = updateGuestSchema.safeParse(body)

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

        // Verify table belongs to event if provided
        if (data.tableId) {
            const table = await prisma.table.findFirst({
                where: { id: data.tableId, eventId: id },
            })
            if (!table) {
                return NextResponse.json({ error: "Table not found" }, { status: 404 })
            }
        }

        const guest = await prisma.guest.update({
            where: { id: guestId },
            data: {
                ...(data.fullName && { fullName: data.fullName }),
                ...(data.phoneWa !== undefined && { phoneWa: data.phoneWa }),
                ...(data.group !== undefined && { group: data.group }),
                ...(data.relation !== undefined && { relation: data.relation }),
                ...(data.mealPreference !== undefined && { mealPreference: data.mealPreference }),
                ...(data.invitedSeats !== undefined && { invitedSeats: data.invitedSeats }),
                ...(data.confirmedSeats !== undefined && { confirmedSeats: data.confirmedSeats }),
                ...(data.rsvpStatus && { rsvpStatus: data.rsvpStatus }),
                ...(data.householdId !== undefined && { householdId: data.householdId }),
                ...(data.tableId !== undefined && { tableId: data.tableId }),
            },
        })

        return NextResponse.json({ guest })
    } catch (error) {
        console.error("Update guest error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string; guestId: string }> }
) {
    const { id, guestId } = await params

    try {
        await requireEventOwnership(id)
    } catch (error) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
        // Verify guest belongs to event
        const existingGuest = await prisma.guest.findFirst({
            where: { id: guestId, eventId: id },
        })

        if (!existingGuest) {
            return NextResponse.json({ error: "Guest not found" }, { status: 404 })
        }

        await prisma.guest.delete({
            where: { id: guestId },
        })

        return NextResponse.json({ message: "Guest deleted successfully" })
    } catch (error) {
        console.error("Delete guest error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

