import { PrismaClient } from "@prisma/client"
import { canonPhone } from "@/lib/phone"

const prisma = new PrismaClient()

async function run() {
    const events = await prisma.event.findMany({
        include: {
            households: {
                include: {
                    guests: true,
                    invites: true, // ← ברבים
                },
            },
        },
    })

    let contactsCreated = 0
    let linksCreated = 0
    let invitesUpdated = 0

    for (const ev of events) {
        for (const hh of ev.households) {
            const phone = canonPhone(hh.phoneWa || "")
            if (!phone) continue

            // צור/מצא Contact ברמת האירוע + מספר
            const contact = await prisma.contact.upsert({
                where: { eventId_phoneWa: { eventId: ev.id, phoneWa: phone } },
                create: {
                    eventId: ev.id,
                    phoneWa: phone,
                    displayName: hh.name || null,
                    scope: "ALL_LINKED",
                },
                update: {},
            })
            contactsCreated++

            // קשר את כל האורחים למשיב הזה (הראשון PRIMARY)
            for (let i = 0; i < hh.guests.length; i++) {
                const g = hh.guests[i]
                await prisma.contactGuest.upsert({
                    where: { contactId_guestId: { contactId: contact.id, guestId: g.id } },
                    create: {
                        contactId: contact.id,
                        guestId: g.id,
                        role: i === 0 ? "PRIMARY" : "OTHER",
                    },
                    update: {},
                })
                linksCreated++
            }

            // עדכן הזמנות היסטוריות של ה-Household שיצביעו על ה-Contact
            for (const inv of hh.invites) {
                await prisma.invite.update({
                    where: { id: inv.id },
                    data: {
                        contactId: contact.id,
                        phoneWa: phone,
                    },
                })
                invitesUpdated++
            }
        }
    }

    console.log("Migration complete:", { contactsCreated, linksCreated, invitesUpdated })
}

run()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
