import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"
import { canonPhone } from "@/lib/phone"
import { requireEventOwnership } from "@/lib/authorization"

// טיפוס לוגי בסיסי של שורה שמגיעה מה-parse (לא חייב לייבא)
type Row = {
    _active: boolean
    _error?: string | null
    household_name: string
    phone: string
    guest_full_name: string
    relation?: string | null
    meal_preference?: string | null
    group?: string | null
    guest_phone?: string | null
}

export const dynamic = "force-dynamic"
export const revalidate = 0

function normPhoneMaybe(v?: string | null): string | null {
    if (!v) return null
    const p = canonPhone(v)
    return /^\d{9,15}$/.test(p) ? p : null
}

async function linkGuestToContact(opts: {
    eventId: string
    guestId: string
    guestName: string
    householdPhone: string | null
    householdName: string
    guestPhone?: string | null
}) {
    const { eventId, guestId, guestName, householdPhone, householdName } = opts
    const guestPhone = normPhoneMaybe(opts.guestPhone)

    if (guestPhone) {
        // Contact אישי לאורח
        const personal = await prisma.contact.upsert({
            where: { eventId_phoneWa: { eventId, phoneWa: guestPhone } },
            create: {
                eventId,
                phoneWa: guestPhone,
                displayName: guestName,
                scope: "PRIMARY_ONLY",
            },
            update: {},
        })

        // קשר כ-PRIMARY (לא יכפיל: @@id(contactId,guestId))
        await prisma.contactGuest.upsert({
            where: { contactId_guestId: { contactId: personal.id, guestId } },
            create: { contactId: personal.id, guestId, role: "PRIMARY" },
            update: {},
        })
    }

    // אם אין טלפון אישי, או גם וגם – קשר למשפחתי אם יש מספר
    const hhPhone = normPhoneMaybe(householdPhone)
    if (hhPhone) {
        const householdContact = await prisma.contact.upsert({
            where: { eventId_phoneWa: { eventId, phoneWa: hhPhone } },
            create: {
                eventId,
                phoneWa: hhPhone,
                displayName: householdName || "איש קשר",
                scope: "ALL_LINKED",
            },
            update: {},
        })

        await prisma.contactGuest.upsert({
            where: { contactId_guestId: { contactId: householdContact.id, guestId } },
            create: { contactId: householdContact.id, guestId, role: guestPhone ? "OTHER" : "PRIMARY" },
            update: {},
        })
    }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: eventId } = await params
    
    try {
        await requireEventOwnership(eventId)
    } catch (error) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    const body = await req.json()
    const rows: Row[] = Array.isArray(body?.rows) ? body.rows : []

    // קיבוץ לפי "טלפון המשפחה" (עמודת phone)
    const groups = rows
        .filter(r => r._active && !r._error)
        .reduce((acc, r) => {
            const householdPhone = normPhoneMaybe(r.phone)
            if (!householdPhone) return acc
            const key = householdPhone
            const pack = acc.get(key) || {
                phone: key,
                name: (r.household_name || "").trim(),
                group: (r.group || "").trim(),
                guests: [] as Array<{
                    fullName: string
                    relation: string | null
                    mealPreference: string | null
                    guestPhone: string | null
                }>,
            }
            if (!pack.name && r.household_name) pack.name = r.household_name.trim()
            if (!pack.group && r.group) pack.group = (r.group || "").trim()
            pack.guests.push({
                fullName: (r.guest_full_name || "").trim(),
                relation: (r.relation || "") || null,
                mealPreference: (r.meal_preference || "") || null,
                guestPhone: normPhoneMaybe(r.guest_phone || null),
            })
            acc.set(key, pack)
            return acc
        }, new Map<string, { phone: string; name: string; group: string; guests: any[] }>())

    let createdHouseholds = 0
    let updatedHouseholds = 0
    let createdGuests = 0
    let updatedGuests = 0

    for (const [hhPhone, pack] of groups.entries()) {
        // Household קיים?
        const existing = await prisma.household.findFirst({
            where: { eventId, OR: [{ phoneWa: hhPhone }, { phoneWa: "+" + hhPhone }] },
            include: { guests: true },
        })

        if (!existing) {
            // יצירת Household + Guests
            const hh = await prisma.household.create({
                data: {
                    eventId,
                    name: pack.name || "Household",
                    group: pack.group || null,
                    phoneWa: hhPhone,
                    guests: {
                        create: pack.guests.map((g: any) => ({
                            eventId,
                            fullName: g.fullName,
                            relation: g.relation,
                            mealPreference: g.mealPreference,
                            rsvpStatus: "PENDING",
                            phoneWa: g.guestPhone, // טלפון אישי אם יש
                            // householdId ייקבע אוטומטית דרך create המוטמע
                        })),
                    },
                },
                include: { guests: true },
            })
            createdHouseholds++
            createdGuests += hh.guests.length

            // קישורים ל-Contacts עבור כל אורח
            for (const g of pack.guests) {
                const createdGuest = hh.guests.find(gu => gu.fullName.trim() === g.fullName.trim())
                if (!createdGuest) continue
                await linkGuestToContact({
                    eventId,
                    guestId: createdGuest.id,
                    guestName: createdGuest.fullName,
                    householdPhone: hhPhone,
                    householdName: pack.name,
                    guestPhone: g.guestPhone,
                })
            }
        } else {
            // עדכון Household
            await prisma.household.update({
                where: { id: existing.id },
                data: {
                    name: pack.name || existing.name,
                    group: pack.group || existing.group,
                },
            })
            updatedHouseholds++

            // עדכון/יצירה אורחים + קישורי Contacts
            for (const g of pack.guests) {
                const found = existing.guests.find(x => x.fullName.trim() === g.fullName.trim())
                if (found) {
                    await prisma.guest.update({
                        where: { id: found.id },
                        data: {
                            relation: g.relation,
                            mealPreference: g.mealPreference ?? found.mealPreference,
                            phoneWa: g.guestPhone ?? found.phoneWa,
                        },
                    })
                    updatedGuests++

                    await linkGuestToContact({
                        eventId,
                        guestId: found.id,
                        guestName: found.fullName,
                        householdPhone: hhPhone,
                        householdName: pack.name || existing.name,
                        guestPhone: g.guestPhone ?? found.phoneWa ?? null,
                    })
                } else {
                    const created = await prisma.guest.create({
                        data: {
                            eventId,
                            householdId: existing.id,
                            fullName: g.fullName,
                            relation: g.relation,
                            mealPreference: g.mealPreference,
                            rsvpStatus: "PENDING",
                            phoneWa: g.guestPhone,
                        },
                    })
                    createdGuests++

                    await linkGuestToContact({
                        eventId,
                        guestId: created.id,
                        guestName: created.fullName,
                        householdPhone: hhPhone,
                        householdName: pack.name || existing.name,
                        guestPhone: g.guestPhone ?? null,
                    })
                }
            }
        }
    }

    return NextResponse.json({
        ok: true,
        summary: { createdHouseholds, updatedHouseholds, createdGuests, updatedGuests },
    })
}
