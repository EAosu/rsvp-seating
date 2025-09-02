import { prisma } from "@/server/db"
import { publish } from "@/server/rsvp-bus"
import { canonPhone } from "@/lib/phone"

function canonStatus(raw: string): "YES" | "MAYBE" | "NO" {
    const up = (raw || "").toUpperCase()
    if (up.includes("YES") || up.includes("מאשר")) return "YES"
    if (up.includes("MAYBE") || up.includes("אולי")) return "MAYBE"
    return "NO"
}

/** עדכון כל אורחי ה-Household לסטטוס, וניקוי שיבוץ אם NO. משדר SSE. מחזיר true אם נמצא משק-בית. */
export async function updateRsvpByPhone(rawFrom: string, rawStatus: string) {
    const from = canonPhone(rawFrom)
    const status = canonStatus(rawStatus)

    const household = await prisma.household.findFirst({
        where: {
            OR: [
                { phoneWa: from },
                { phoneWa: "+" + from },
                { phoneWa: { endsWith: from.slice(-9) } }, // גיבוי
            ],
        },
        include: { event: true, guests: { select: { id: true } }, invite: true },
    })

    if (!household) return false

    const data: any = { rsvpStatus: status }
    if (status === "NO") Object.assign(data, { tableId: null, seatNumber: null })

    await prisma.guest.updateMany({
        where: { householdId: household.id },
        data,
    })

    // עדכון סטטוס ההזמנה אם קיימת
    if (household.invite) {
        await prisma.invite.update({
            where: { id: household.invite.id },
            data: { status: "READ" },
        }).catch(() => {})
    }

    // שידור ל-UI (SSE)
    publish(household.eventId, {
        type: "rsvp_update",
        householdId: household.id,
        guestIds: household.guests.map(g => g.id),
        rsvpStatus: status,
    })

    return true
}
