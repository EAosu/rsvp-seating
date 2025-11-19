"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import Link from "next/link"

const createEventSchema = z.object({
  title: z.string().min(1, "כותרת האירוע היא שדה חובה"),
  eventDate: z.string().min(1, "תאריך האירוע הוא שדה חובה"),
  venue: z.string().optional(),
})

type CreateEventForm = z.infer<typeof createEventSchema>

export default function NewEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateEventForm>({
    resolver: zodResolver(createEventSchema),
  })

  const onSubmit = async (data: CreateEventForm) => {
    try {
      setLoading(true)
      
      // Convert local datetime to ISO string
      const eventDate = new Date(data.eventDate).toISOString()

      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: data.title,
          eventDate,
          venue: data.venue || null,
        }),
      })

      const result = await res.json()

      if (!res.ok) {
        toast.error(result.error || "שגיאה ביצירת האירוע. נסה שוב.")
        return
      }

      toast.success("האירוע נוצר בהצלחה!")
      router.push(`/events/${result.event.id}`)
    } catch (error) {
      toast.error("שגיאה ביצירת האירוע. נסה שוב מאוחר יותר.")
    } finally {
      setLoading(false)
    }
  }

  // Get today's date in local datetime format for the input
  const today = new Date()
  today.setHours(23, 59, 0, 0)
  const minDate = today.toISOString().slice(0, 16)

  return (
    <div className="container-page rtl min-h-screen">
      <div className="mb-6">
        <Link href="/dashboard" className="text-sm text-muted-foreground hover:underline">
          ← חזרה לדשבורד
        </Link>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">צור אירוע חדש</CardTitle>
          <CardDescription>
            הזן את פרטי האירוע כדי להתחיל לנהל הזמנות וסידורי הושבה
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">כותרת האירוע *</Label>
              <Input
                id="title"
                type="text"
                placeholder="לדוגמה: חתונת דנה ויואב"
                {...register("title")}
                aria-invalid={errors.title ? "true" : "false"}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="eventDate">תאריך ושעה *</Label>
              <Input
                id="eventDate"
                type="datetime-local"
                min={minDate}
                {...register("eventDate")}
                aria-invalid={errors.eventDate ? "true" : "false"}
              />
              {errors.eventDate && (
                <p className="text-sm text-red-600">{errors.eventDate.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="venue">מיקום (אופציונלי)</Label>
              <Input
                id="venue"
                type="text"
                placeholder="לדוגמה: אולם רימונים, תל אביב"
                {...register("venue")}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? "יוצר..." : "צור אירוע"}
              </Button>
              <Link href="/dashboard">
                <Button type="button" variant="outline">
                  ביטול
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

