"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check } from "lucide-react"

export default function OnboardingWizard() {
  const router = useRouter()

  const handleCreateEvent = () => {
    router.push("/events/new")
  }

  const handleSkip = () => {
    router.push("/dashboard")
  }

  return (
    <div className="container-page rtl min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">ברוך הבא ל-RSVP Seating!</CardTitle>
          <CardDescription>
            בואו נתחיל ביצירת האירוע הראשון שלך
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">מה תוכל לעשות כאן:</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>ניהול רשימת אורחים והזמנות</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>שליחת הזמנות אוטומטית בוואטסאפ</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>מעקב אחר תשובות RSVP</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                <span>סידורי הושבה אוטומטיים וחכמים</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleCreateEvent} className="flex-1">
              צור את האירוע הראשון שלי
            </Button>
            <Button onClick={handleSkip} variant="outline">
              דלג לעת עתה
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

