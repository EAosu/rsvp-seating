import { PrismaClient } from "@prisma/client"
import { randomUUID } from "crypto"
const prisma = new PrismaClient()

async function main() {
    const ev = await prisma.event.create({
        data: {
            title: "חתונת דנה ויואב",
            eventDate: new Date(Date.now() + 1000*60*60*24*30),
            venue: "אולם רימונים",
            tables: { create: [{ name: "משפחת כלה 1", capacity: 10 }, { name: "חברים 1", capacity: 12 }] }
        }
    })

    const hh = await prisma.household.create({
        data: {
            eventId: ev.id,
            name: "משפחת כהן",
            group: "צד כלה",
            phoneWa: "+972501234567",
            guests: { create: [{ eventId: ev.id, fullName: "דנה כהן" }, { eventId: ev.id, fullName: "יואב כהן" }] }
        }
    })

    await prisma.invite.create({
        data: { eventId: ev.id, householdId: hh.id, rsvpToken: randomUUID() }
    })

    console.log("Seed done:", ev.id)
}

main().finally(() => prisma.$disconnect())
