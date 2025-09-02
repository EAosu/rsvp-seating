import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"
import { PreviewRow } from "@/lib/guest-import"
import { canonPhone } from "@/lib/phone"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: eventId } = await params
    const body = await req.json()
    const rows: PreviewRow[] = Array.isArray(body?.rows) ? body.rows : []

    // קיבוץ לפי household phone
    const groups = rows
        .filter(r => r._active && !r._error)
        .reduce((acc, r) => {
            const key = canonPhone(r.phone)
            if (!key) return acc
            const pack = acc.get(key) || { phone: key, name: r.household_name || "", group: r.group || "", guests: [] as any[] }
            if (!pack.name && r.household_name) pack.name = r.household_name
            if (!pack.group && r.group) pack.group = r.group
            pack.guests.push({
                fullName: r.guest_full_name,
                relation: r.relation || null,
                mealPreference: r.meal_preference || null,
                phoneWa: r.guest_phone ? canonPhone(r.guest_phone) : null,
            })
            acc.set(key, pack)
            return acc
        }, new Map<string, { phone:string; name:string; group:string; guests:any[] }>())

    let createdHouseholds = 0, updatedHouseholds = 0, createdGuests = 0, updatedGuests = 0

    for (const [phone, pack] of groups.entries()) {
        const existing = await prisma.household.findFirst({
            where: { eventId, OR: [{ phoneWa: phone }, { phoneWa: "+" + phone }] },
            include: { guests: true },
        })

        if (!existing) {
            const hh = await prisma.household.create({
                data: {
                    eventId,
                    name: pack.name || "Household",
                    group: pack.group || null,
                    phoneWa: phone,
                    guests: {
                        create: pack.guests.map(g => ({
                            eventId,
                            fullName: g.fullName,
                            relation: g.relation,
                            mealPreference: g.mealPreference,
                            rsvpStatus: "PENDING",
                            phoneWa: g.phoneWa,
                        })),
                    },
                },
                include: { guests: true },
            })
            createdHouseholds++
            createdGuests += hh.guests.length
        } else {
            await prisma.household.update({
                where: { id: existing.id },
                data: { name: pack.name || existing.name, group: pack.group || existing.group },
            })
            updatedHouseholds++

            for (const g of pack.guests) {
                const found = existing.guests.find(x => x.fullName.trim() === g.fullName.trim())
                if (found) {
                    await prisma.guest.update({
                        where: { id: found.id },
                        data: {
                            relation: g.relation,
                            mealPreference: g.mealPreference ?? found.mealPreference,
                            phoneWa: g.phoneWa ?? found.phoneWa,
                        },
                    })
                    updatedGuests++
                } else {
                    await prisma.guest.create({
                        data: {
                            eventId,
                            householdId: existing.id,
                            fullName: g.fullName,
                            relation: g.relation,
                            mealPreference: g.mealPreference,
                            rsvpStatus: "PENDING",
                            phoneWa: g.phoneWa,
                        },
                    })
                    createdGuests++
                }
            }
        }
    }

    return NextResponse.json({
        summary: { createdHouseholds, updatedHouseholds, createdGuests, updatedGuests }
    })
}
