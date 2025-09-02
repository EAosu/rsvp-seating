import Link from "next/link"
import EventNavTabs from "@/components/EventNavTabs"

export default async function EventLayout({
                                              children,
                                              params
                                          }: {
    children: React.ReactNode
    params: Promise<{ id: string }>
}) {
    const { id } = await params

    return (
        <div className="rtl">
            <nav className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
                <div className="container-page flex items-center justify-between py-3">
                    <Link href="/" className="font-semibold">אישורי הזמנה</Link>
                    <EventNavTabs id={id} />
                </div>
            </nav>
            <main>{children}</main>
        </div>
    )
}
