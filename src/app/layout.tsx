import type { Metadata } from "next";
import "./globals.css"
import { Heebo } from "next/font/google"
import { Toaster } from "sonner"
import { Providers } from "@/components/Providers"
import SkipLinks from "@/components/SkipLinks"

export const metadata: Metadata = {
  title: "RSVP Seating - ניהול הזמנות וסידורי הושבה",
  description: "מערכת ניהול הזמנות וסידורי הושבה לאירועים. RSVP for events.",
};

const heebo = Heebo({ subsets: ["hebrew"], weight: ["400","500","700"] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="he" dir="rtl">
            <head>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
            </head>
            <body className={heebo.className}>
                <SkipLinks />
                <Providers>
                    <div id="main-content" tabIndex={-1}>
                        {children}
                    </div>
                </Providers>
                <Toaster richColors position="bottom-center" />
            </body>
        </html>
    )
}
