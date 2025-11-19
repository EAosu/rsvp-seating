import { redirect } from "next/navigation"
import { auth } from "@/lib/auth-server"
import { prisma } from "@/server/db"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export const dynamic = "force-dynamic"
export const revalidate = 0

export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/login")
  }

  const events = await prisma.event.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      title: true,
      eventDate: true,
      venue: true,
      createdAt: true,
      _count: {
        select: {
          guests: true,
          tables: true,
        },
      },
    },
    orderBy: { eventDate: "desc" },
  })

  return (
    <div className="container-page rtl min-h-screen py-8">
      <div className="mb-10 flex items-center justify-between animate-slideInUp">
        <div>
          <h1 className="title mb-3 relative">האירועים שלי</h1>
          <p className="sub text-gray-700 font-medium">
            ניהול הזמנות וסידורי הושבה לאירועים שלך
          </p>
        </div>
        <Link href="/events/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            צור אירוע חדש
          </Button>
        </Link>
      </div>

      {events.length === 0 ? (
        <Card style={{
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
        }}>
          <CardContent className="py-16 text-center">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center animate-float">
                <Plus className="h-10 w-10 text-white" />
              </div>
            </div>
            <p className="text-gray-700 mb-6 text-lg font-medium">אין לך אירועים עדיין</p>
            <Link href="/events/new">
              <Button size="lg">צור את האירוע הראשון שלך</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event, index) => (
            <Link 
              key={event.id} 
              href={`/events/${event.id}`}
              style={{ animationDelay: `${index * 0.1}s` }}
              className="animate-slideInUp"
            >
              <Card className="hover:shadow-2xl transition-all duration-300 cursor-pointer h-full group" style={{
                background: 'rgba(255, 255, 255, 0.7)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
              }}>
                <CardHeader className="relative">
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-400/20 to-purple-500/20 rounded-full blur-2xl group-hover:from-indigo-400/30 group-hover:to-purple-500/30 transition-all"></div>
                  <CardTitle className="group-hover:bg-gradient-to-r group-hover:from-indigo-600 group-hover:to-purple-600 group-hover:bg-clip-text group-hover:text-transparent transition-all relative z-10">
                    {event.title}
                  </CardTitle>
                  <CardDescription className="relative z-10">
                    {new Date(event.eventDate).toLocaleDateString("he-IL", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                    {event.venue && ` • ${event.venue}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="flex gap-6 text-sm">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 group-hover:from-blue-100 group-hover:to-indigo-100 transition-all">
                      <span className="font-bold text-indigo-700">{event._count.guests}</span>
                      <span className="text-indigo-600">אורחים</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 group-hover:from-purple-100 group-hover:to-pink-100 transition-all">
                      <span className="font-bold text-purple-700">{event._count.tables}</span>
                      <span className="text-purple-600">שולחנות</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

