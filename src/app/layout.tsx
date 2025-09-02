import type { Metadata } from "next";
import "./globals.css"
import { Heebo } from "next/font/google"
import { Toaster } from "sonner"
import EventNavTabs from "@/components/EventNavTabs"

export const metadata: Metadata = {
  title: "RSVP Seating",
  description: "RSVP for events.",
};

const heebo = Heebo({ subsets: ["hebrew"], weight: ["400","500","700"] })

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="he" dir="rtl">
            <body className={heebo.className}>
                {children}
                <Toaster richColors position="bottom-center" />
            </body>
        </html>
    )
}
