import { prisma } from "@/server/db"
import Link from "next/link"
import EventGuestsList from "@/components/EventGuestsList"

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const event = await prisma.event.findUnique({
        where: { id },
        include: { guests: true, tables: true },
    })
    if (!event) return <div className="container-page rtl">אירוע לא נמצא</div>

    const total = event.guests.length
    const yes = event.guests.filter(g => g.rsvpStatus === "YES").length
    const no = event.guests.filter(g => g.rsvpStatus === "NO").length
    const maybe = event.guests.filter(g => g.rsvpStatus === "MAYBE").length
    const pending = event.guests.filter(g => g.rsvpStatus === "PENDING").length

    return (
        <div className="container-page rtl">
            <div className="mb-6">
                <h1 className="title">{event.title}</h1>
                <p className="sub">
                    {new Date(event.eventDate).toLocaleDateString("he-IL")}
                    {event.venue ? ` • ${event.venue}` : ""}
                </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                <div className="card card-section">סה״כ: <b>{total}</b></div>
                <div className="card card-section">מאשרים: <b className="text-green-600">{yes}</b></div>
                <div className="card card-section">אולי: <b className="text-amber-600">{maybe}</b></div>
                <div className="card card-section">לא: <b className="text-red-600">{no}</b></div>
                <div className="card card-section">ממתינים: <b className="text-gray-600">{pending}</b></div>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
                <Link href={`/events/${id}/seating`} className="underline">סידורי הושבה →</Link>
                <Link href={`/events/${id}/import`} className="underline">ייבוא מוזמנים →</Link>
                <form action={`/api/events/${id}/invites/send`} method="post">
                    <button className="underline" formMethod="post">שלח הזמנות בוואטסאפ</button>
                </form>
            </div>

            {/* רשימת אורחים עשירה + חיפוש/פילטר + לייב */}
            <EventGuestsList />
        </div>
    )
}
