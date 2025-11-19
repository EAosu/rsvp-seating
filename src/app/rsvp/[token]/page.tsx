"use client"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

const schema = z.object({
    guests: z.array(z.object({
        id: z.string(),
        fullName: z.string(),
        rsvpStatus: z.enum(["YES","NO","MAYBE"]),
        mealPreference: z.string().optional()
    })),
    attendeesCount: z.number().min(0).max(50).optional()
})
type FormData = z.infer<typeof schema>

export default function RSVPPage() {
    const { token } = useParams<{ token: string }>()
    const [loading, setLoading] = useState(true)
    const [header, setHeader] = useState<{ title: string, date: string, venue?: string } | null>(null)

    const { control, register, handleSubmit, setValue } = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: { guests: [] }
    })
    const { fields } = useFieldArray({ control, name: "guests" })

    useEffect(() => {
        if(!token) return
        (async () => {
            const res = await fetch(`/api/rsvp/${token}`)
            const data = await res.json()
            if (data.error) return
            setHeader({
                title: data.event.title,
                date: new Date(data.event.date).toLocaleDateString("he-IL"),
                venue: data.event.venue ?? undefined
            })
            const guests = data.guests.map((g: any) => ({
                id: g.id, fullName: g.fullName,
                rsvpStatus: (g.rsvpStatus === "PENDING" ? "MAYBE" : (g.rsvpStatus ?? "MAYBE")) as "YES" | "NO" | "MAYBE",
                mealPreference: g.mealPreference || ""
            }))
            setValue("guests", guests)
            setLoading(false)
        })()
    }, [token, setValue])

    const onSubmit = async (values: FormData) => {
        if (!token) return
        const payload = {
            guests: values.guests.map(g => ({
                id: g.id,
                rsvpStatus: g.rsvpStatus,
                mealPreference: g.mealPreference || null
            }))
        }
        const res = await fetch(`/api/rsvp/${token}`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        if (res.ok) toast.success("תודה! האישור התקבל 🎉");
        else toast.error("משהו השתבש. נסו שוב עוד רגע.")
    }

    if (loading) return <div className="container-page">טוען…</div>

    return (
        <div className="container-page rtl">
            <div className="mb-6">
                <h1 className="title mb-3 relative">{header?.title}</h1>
                <p className="sub text-gray-700 font-medium">תאריך: {header?.date}{header?.venue ? ` • מקום: ${header?.venue}` : ""}</p>
            </div>

            <Card className="card">
                <form className="card-section space-y-4" onSubmit={handleSubmit(onSubmit)}>
                    {fields.map((f, idx) => (
                        <div key={f.id} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                            <Input defaultValue={(f as any).fullName} readOnly className="bg-gray-50" />
                            <Select
                                defaultValue={(f as any).rsvpStatus === "PENDING" ? "MAYBE" : (f as any).rsvpStatus}
                                onValueChange={(v) => { setValue(`guests.${idx}.rsvpStatus`, v as any) }}
                            >
                                <SelectTrigger><SelectValue placeholder="סטטוס" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="YES">מגיע/ה</SelectItem>
                                    <SelectItem value="NO">לא מגיע/ה</SelectItem>
                                    <SelectItem value="MAYBE">אולי</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input placeholder="העדפת מנה / אלרגיות (אופציונלי)"
                                   {...register(`guests.${idx}.mealPreference` as const)} />
                            <input type="hidden" {...register(`guests.${idx}.id` as const)} />
                            <input type="hidden" defaultValue={(f as any).fullName} {...register(`guests.${idx}.fullName` as const)} />
                        </div>
                    ))}

                    <div className="pt-2">
                        <Button type="submit" className="w-full sm:w-auto">שמור אישור</Button>
                    </div>
                </form>
            </Card>
        </div>
    )
}
