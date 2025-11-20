import { prisma } from "@/server/db"
import Link from "next/link"
import EventGuestsList from "@/components/EventGuestsList"
import SendInvitesButton from "@/components/SendInvitesButton"
import { requireEventOwnership } from "@/lib/authorization"
import { redirect } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function EventPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    try {
        await requireEventOwnership(id)
    } catch (error) {
        redirect("/dashboard")
    }

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

    // Optimized: Use aggregation to reduce connection usage in serverless environments
    // This reduces 7 separate queries to 3 queries (more efficient for connection pooling)
    const [guestStats, contactsTotal, contactsSent] = await Promise.all([
        // Single aggregation query for all guest counts
        prisma.guest.groupBy({
            by: ["rsvpStatus"],
            where: { eventId: id },
            _count: { _all: true },
        }),
        prisma.contact.count({ where: { eventId: id } }),
        prisma.invite.count({ where: { eventId: id } }),
    ])

    // Extract counts from aggregation result
    const statsMap = new Map(guestStats.map(s => [s.rsvpStatus, s._count._all]))
    const total = guestStats.reduce((sum, s) => sum + s._count._all, 0)
    const yes = statsMap.get("YES") || 0
    const no = statsMap.get("NO") || 0
    const maybe = statsMap.get("MAYBE") || 0
    const pending = statsMap.get("PENDING") || 0

    return (
        <main className="container-page rtl py-8" role="main" aria-label="פרטי אירוע">
            <div className="mb-8 animate-slideInUp">
                <h1 className="title mb-3 relative">{event.title}</h1>
                <p className="sub text-gray-700 font-medium" aria-label={`תאריך האירוע: ${new Date(event.eventDate).toLocaleDateString("he-IL")}${event.venue ? ` במקום: ${event.venue}` : ""}`}>
                    {new Date(event.eventDate).toLocaleDateString("he-IL")}
                    {event.venue ? ` • ${event.venue}` : ""}
                </p>
            </div>

            {/* כרטיסי מצב */}
            <section aria-label="סטטיסטיקות אירוע" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-6 sm:mb-8">
                <Card className="border-l-4 border-l-blue-500/80 group" role="region" aria-label="סה״כ אורחים" style={{
                  background: 'rgba(239, 246, 255, 0.6)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  borderLeft: '4px solid rgba(59, 130, 246, 0.8)',
                  boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
                }}>
                    <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                        <div className="text-xs sm:text-sm font-medium text-blue-800 mb-1 sm:mb-2 group-hover:text-blue-900 transition-colors">סה״כ אורחים</div>
                        <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent" aria-label={`סה״כ ${total} אורחים`}>{total}</div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-emerald-500/80 group" role="region" aria-label="מאשרים" style={{
                  background: 'rgba(236, 253, 245, 0.6)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  borderLeft: '4px solid rgba(16, 185, 129, 0.8)',
                  boxShadow: '0 8px 32px rgba(16, 185, 129, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
                }}>
                    <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                        <div className="text-xs sm:text-sm font-medium text-emerald-800 mb-1 sm:mb-2 group-hover:text-emerald-900 transition-colors">מאשרים</div>
                        <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-700 to-green-700 bg-clip-text text-transparent" aria-label={`${yes} אורחים מאשרים`}>{yes}</div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-amber-500/80 group" role="region" aria-label="אולי" style={{
                  background: 'rgba(255, 251, 235, 0.6)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  borderLeft: '4px solid rgba(245, 158, 11, 0.8)',
                  boxShadow: '0 8px 32px rgba(245, 158, 11, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
                }}>
                    <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                        <div className="text-xs sm:text-sm font-medium text-amber-800 mb-1 sm:mb-2 group-hover:text-amber-900 transition-colors">אולי</div>
                        <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-amber-700 to-yellow-700 bg-clip-text text-transparent" aria-label={`${maybe} אורחים אולי`}>{maybe}</div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-red-500/80 group" role="region" aria-label="לא מגיעים" style={{
                  background: 'rgba(254, 242, 242, 0.6)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  borderLeft: '4px solid rgba(239, 68, 68, 0.8)',
                  boxShadow: '0 8px 32px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
                }}>
                    <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                        <div className="text-xs sm:text-sm font-medium text-red-800 mb-1 sm:mb-2 group-hover:text-red-900 transition-colors">לא מגיעים</div>
                        <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-red-700 to-rose-700 bg-clip-text text-transparent" aria-label={`${no} אורחים לא מגיעים`}>{no}</div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-gray-500/80 group" role="region" aria-label="ממתינים" style={{
                  background: 'rgba(249, 250, 251, 0.6)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  borderLeft: '4px solid rgba(107, 114, 128, 0.8)',
                  boxShadow: '0 8px 32px rgba(107, 114, 128, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
                }}>
                    <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                        <div className="text-xs sm:text-sm font-medium text-gray-800 mb-1 sm:mb-2 group-hover:text-gray-900 transition-colors">ממתינים</div>
                        <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-gray-700 to-slate-700 bg-clip-text text-transparent" aria-label={`${pending} אורחים ממתינים`}>{pending}</div>
                    </CardContent>
                </Card>
                <Card className="border-l-4 border-l-purple-500/80 group" role="region" aria-label="הזמנות" style={{
                  background: 'rgba(250, 245, 255, 0.6)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  borderLeft: '4px solid rgba(168, 85, 247, 0.8)',
                  boxShadow: '0 8px 32px rgba(168, 85, 247, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
                }}>
                    <CardContent className="pt-4 sm:pt-6 p-4 sm:p-6">
                        <div className="text-xs sm:text-sm font-medium text-purple-800 mb-1 sm:mb-2 group-hover:text-purple-900 transition-colors">הזמנות</div>
                        <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-700 to-pink-700 bg-clip-text text-transparent" aria-label={`${contactsSent} מתוך ${contactsTotal} הזמנות נשלחו`}>
                            {contactsSent}<span className="text-base sm:text-lg font-normal text-gray-700">/{contactsTotal}</span>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* פעולות מהירות */}
            <nav aria-label="פעולות מהירות" className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
                <Link href={`/events/${id}/guests`} className="w-full sm:w-auto">
                    <Button variant="outline" className="gap-2 w-full sm:w-auto" aria-label="עבור לניהול אורחים">
                        ניהול אורחים
                    </Button>
                </Link>
                <Link href={`/events/${id}/import`} className="w-full sm:w-auto">
                    <Button variant="outline" className="gap-2 w-full sm:w-auto" aria-label="עבור לייבוא והוספת אורחים">
                        ייבוא/הוספת אורחים
                    </Button>
                </Link>
                <Link href={`/events/${id}/seating`} className="w-full sm:w-auto">
                    <Button variant="outline" className="gap-2 w-full sm:w-auto" aria-label="עבור לסידורי הושבה">
                        סידורי הושבה
                    </Button>
                </Link>
                <div className="w-full sm:w-auto">
                    <SendInvitesButton eventId={id} />
                </div>
            </nav>

            {/* רשימת אורחים מפורטת */}
            <section aria-label="רשימת אורחים">
                <EventGuestsList />
            </section>
        </main>
    )
}
