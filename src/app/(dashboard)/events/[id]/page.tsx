import { prisma } from "@/server/db"
import Link from "next/link"
import EventGuestsList from "@/components/EventGuestsList"
import SendInvitesButton from "@/components/SendInvitesButton"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const event = await prisma.event.findUnique({
        where: { id },
        select: {
            title: true,
            eventDate: true,
            venue: true,
            id: true,
        },
    })
    if (!event) return <div className="container-page rtl">אירוע לא נמצא</div>

    // מונים (ישיר מה-DB)
    const [total, yes, no, maybe, pending, contactsTotal, contactsSent] = await Promise.all([
        prisma.guest.count({ where: { eventId: id } }),
        prisma.guest.count({ where: { eventId: id, rsvpStatus: "YES" } }),
        prisma.guest.count({ where: { eventId: id, rsvpStatus: "NO" } }),
        prisma.guest.count({ where: { eventId: id, rsvpStatus: "MAYBE" } }),
        prisma.guest.count({ where: { eventId: id, rsvpStatus: "PENDING" } }),
        prisma.contact.count({ where: { eventId: id } }),
        prisma.invite.count({ where: { eventId: id } }),
    ])

    return (
        <div className="container-page rtl">
            <div className="mb-6">
                <h1 className="title">{event.title}</h1>
                <p className="sub">
                    {new Date(event.eventDate).toLocaleDateString("he-IL")}
                    {event.venue ? ` • ${event.venue}` : ""}
                </p>
            </div>

            {/* כרטיסי מצב */}
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 mb-6">
                <div className="card card-section">סה״כ: <b>{total}</b></div>
                <div className="card card-section">מאשרים: <b className="text-green-600">{yes}</b></div>
                <div className="card card-section">אולי: <b className="text-amber-600">{maybe}</b></div>
                <div className="card card-section">לא: <b className="text-red-600">{no}</b></div>
                <div className="card card-section">ממתינים: <b className="text-gray-600">{pending}</b></div>
                <div className="card card-section">
                    הזמנות: <b>{contactsSent}</b>/<b className="text-gray-600">{contactsTotal}</b>
                </div>
            </div>

            {/* פעולות מהירות */}
            <div className="flex flex-wrap gap-3 mb-6">
                <Link href={`/events/${id}/import`} className="underline">ייבוא/הוספת אורחים →</Link>
                <Link href={`/events/${id}/seating`} className="underline">סידורי הושבה →</Link>
                <SendInvitesButton eventId={id} />
            </div>

            {/* רשימת אורחים מפורטת */}
            <EventGuestsList />
        </div>
    )
}
