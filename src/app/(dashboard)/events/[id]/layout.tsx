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
            <nav 
                className="sticky top-16 z-40 border-b border-white/20 bg-white/70 backdrop-blur-xl saturate-150 shadow-md"
                role="navigation"
                aria-label="ניווט אירוע"
                style={{
                    background: 'rgba(255, 255, 255, 0.7)',
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.5)'
                }}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between py-3">
                        <Link
                            href="/dashboard"
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            aria-label="חזרה לדשבורד"
                        >
                            <span>←</span>
                            <span className="hidden sm:inline">חזרה לדשבורד</span>
                        </Link>
                        <EventNavTabs id={id} />
                    </div>
                </div>
            </nav>
            <main className="bg-gray-50/50 min-h-[calc(100vh-8rem)]">{children}</main>
        </div>
    )
}
