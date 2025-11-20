"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Plus,
    Search,
    Edit,
    Trash2,
    MessageCircle,
    Filter,
    X,
} from "lucide-react"
import { generateWhatsAppMessage, openWhatsAppMessage } from "@/lib/whatsapp"
import { toast } from "sonner"

type Guest = {
    id: string
    name: string
    status: "YES" | "NO" | "MAYBE" | "PENDING"
    meal: string | null
    relation: string | null
    table: string | null
    group: string | null
    household: string
    phone: string | null
    invitedSeats: number
    confirmedSeats: number | null
}

type EventInfo = {
    title: string
    eventDate: string
    venue: string | null
}

export default function GuestsManagementPage() {
    const { id } = useParams<{ id: string }>()
    const [guests, setGuests] = useState<Guest[]>([])
    const [eventInfo, setEventInfo] = useState<EventInfo | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [statusFilter, setStatusFilter] = useState<"ALL" | "YES" | "NO" | "MAYBE" | "PENDING">("ALL")
    const [groupFilter, setGroupFilter] = useState<string>("ALL")
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
    const [editingGuest, setEditingGuest] = useState<Guest | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        fullName: "",
        phoneWa: "",
        group: "",
        relation: "",
        mealPreference: "",
        invitedSeats: 1,
        confirmedSeats: null as number | null,
        rsvpStatus: "PENDING" as "PENDING" | "YES" | "NO" | "MAYBE",
    })

    useEffect(() => {
        loadData()
    }, [id])

    // Live updates via SSE
    useEffect(() => {
        const es = new EventSource(`/api/events/${id}/rsvp/stream`)
        es.onmessage = (ev) => {
            try {
                const msg = JSON.parse(ev.data)
                if (msg.type === "rsvp_update") {
                    setGuests((prev) =>
                        prev.map((g) =>
                            msg.guestIds.includes(g.id)
                                ? { ...g, status: msg.rsvpStatus }
                                : g
                        )
                    )
                }
            } catch {}
        }
        return () => es.close()
    }, [id])

    async function loadData() {
        try {
            setLoading(true)
            const [guestsRes, eventRes] = await Promise.all([
                fetch(`/api/events/${id}/guests`, { cache: "no-store" }),
                fetch(`/api/events/${id}`, { cache: "no-store" }),
            ])

            const guestsData = await guestsRes.json()
            const eventData = await eventRes.json()

            setGuests(guestsData.guests || [])
            if (eventData.event) {
                setEventInfo({
                    title: eventData.event.title,
                    eventDate: eventData.event.eventDate,
                    venue: eventData.event.venue,
                })
            }
        } catch (error) {
            console.error("Failed to load data:", error)
            toast.error("שגיאה בטעינת הנתונים")
        } finally {
            setLoading(false)
        }
    }

    const filteredGuests = useMemo(() => {
        const query = searchQuery.trim().toLowerCase()
        const groups = Array.from(new Set(guests.map((g) => g.group).filter(Boolean)))

        return guests.filter((g) => {
            if (statusFilter !== "ALL" && g.status !== statusFilter) return false
            if (groupFilter !== "ALL" && g.group !== groupFilter) return false
            if (!query) return true
            const haystack = `${g.name} ${g.household} ${g.group ?? ""} ${g.table ?? ""} ${g.phone ?? ""} ${g.relation ?? ""}`.toLowerCase()
            return haystack.includes(query)
        })
    }, [guests, searchQuery, statusFilter, groupFilter])

    const uniqueGroups = useMemo(() => {
        return Array.from(new Set(guests.map((g) => g.group).filter((g): g is string => g !== null && g !== undefined)))
    }, [guests])

    function resetForm() {
        setFormData({
            fullName: "",
            phoneWa: "",
            group: "",
            relation: "",
            mealPreference: "",
            invitedSeats: 1,
            confirmedSeats: null,
            rsvpStatus: "PENDING",
        })
    }

    function openAddDialog() {
        resetForm()
        setIsAddDialogOpen(true)
    }

    function openEditDialog(guest: Guest) {
        setFormData({
            fullName: guest.name,
            phoneWa: guest.phone || "",
            group: guest.group || "",
            relation: guest.relation || "",
            mealPreference: guest.meal || "",
            invitedSeats: guest.invitedSeats,
            confirmedSeats: guest.confirmedSeats,
            rsvpStatus: guest.status,
        })
        setEditingGuest(guest)
    }

    async function handleSave() {
        try {
            const url = editingGuest
                ? `/api/events/${id}/guests/${editingGuest.id}`
                : `/api/events/${id}/guests`

            const method = editingGuest ? "PATCH" : "POST"

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    fullName: formData.fullName,
                    phoneWa: formData.phoneWa || null,
                    group: formData.group || null,
                    relation: formData.relation || null,
                    mealPreference: formData.mealPreference || null,
                    invitedSeats: formData.invitedSeats,
                    confirmedSeats: formData.confirmedSeats,
                    rsvpStatus: formData.rsvpStatus,
                }),
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || "שגיאה בשמירה")
            }

            toast.success(editingGuest ? "אורח עודכן בהצלחה" : "אורח נוסף בהצלחה")
            setIsAddDialogOpen(false)
            setEditingGuest(null)
            resetForm()
            loadData()
        } catch (error: any) {
            toast.error(error.message || "שגיאה בשמירה")
        }
    }

    async function handleDelete(guestId: string) {
        try {
            const response = await fetch(`/api/events/${id}/guests/${guestId}`, {
                method: "DELETE",
            })

            if (!response.ok) {
                throw new Error("שגיאה במחיקה")
            }

            toast.success("אורח נמחק בהצלחה")
            setDeleteConfirm(null)
            loadData()
        } catch (error) {
            toast.error("שגיאה במחיקה")
        }
    }

    function handleWhatsAppClick(guest: Guest) {
        if (!eventInfo || !guest.phone) {
            toast.error("מספר טלפון חסר")
            return
        }

        const message = generateWhatsAppMessage({
            guestName: guest.name,
            eventName: eventInfo.title,
            eventDate: new Date(eventInfo.eventDate),
            venue: eventInfo.venue,
        })

        openWhatsAppMessage(guest.phone, message)
    }

    const StatusBadge = ({ status }: { status: Guest["status"] }) => {
        const variants = {
            YES: "bg-gradient-to-r from-emerald-400 to-green-500 text-white border-emerald-300 shadow-md",
            NO: "bg-gradient-to-r from-red-400 to-rose-500 text-white border-red-300 shadow-md",
            MAYBE: "bg-gradient-to-r from-amber-400 to-yellow-500 text-white border-amber-300 shadow-md",
            PENDING: "bg-gradient-to-r from-gray-400 to-slate-500 text-white border-gray-300 shadow-md",
        }

        const labels = {
            YES: "מאשר/ת",
            NO: "לא מגיע/ה",
            MAYBE: "אולי",
            PENDING: "ממתין/ה",
        }

        const ariaLabels = {
            YES: "סטטוס: מאשר/ת",
            NO: "סטטוס: לא מגיע/ה",
            MAYBE: "סטטוס: אולי",
            PENDING: "סטטוס: ממתין/ה",
        }

        return (
            <span
                className={cn(
                    "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border-2 transition-all hover:scale-110",
                    variants[status]
                )}
                role="status"
                aria-label={ariaLabels[status]}
            >
                {labels[status]}
            </span>
        )
    }

    if (loading) {
        return (
            <div className="container-page rtl">
                <div className="flex items-center justify-center py-12">
                    <div className="text-gray-500">טוען...</div>
                </div>
            </div>
        )
    }

    return (
        <main className="container-page rtl min-h-screen py-8" role="main" aria-label="ניהול אורחים">
            <div className="mb-6 sm:mb-8 animate-slideInUp">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div className="flex-1 min-w-0">
                        <h1 className="title mb-3 relative">ניהול אורחים</h1>
                        <p className="sub text-gray-700 text-sm font-medium" aria-label={eventInfo ? `אירוע: ${eventInfo.title}, תאריך: ${new Date(eventInfo.eventDate).toLocaleDateString("he-IL")}` : undefined}>
                            {eventInfo?.title && (
                                <>
                                    {eventInfo.title} •{" "}
                                    {new Date(eventInfo.eventDate).toLocaleDateString("he-IL")}
                                </>
                            )}
                        </p>
                    </div>
                    <Button 
                        onClick={openAddDialog} 
                        className="gap-2 w-full sm:w-auto"
                        aria-label="הוסף אורח חדש"
                    >
                        <Plus className="h-4 w-4" aria-hidden="true" />
                        <span>הוסף אורח</span>
                    </Button>
                </div>

                {/* Filters and Search */}
                <Card className="mb-6" role="search" aria-label="חיפוש וסינון אורחים" style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 32px rgba(99, 102, 241, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
                }}>
                    <CardContent className="pt-4 sm:pt-6">
                        <div className="flex flex-col gap-4">
                            <div className="flex-1 relative">
                                <Label htmlFor="search-input" className="sr-only">
                                    חיפוש אורחים
                                </Label>
                                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" aria-hidden="true" />
                                <Input
                                    id="search-input"
                                    placeholder="חיפוש לפי שם, קבוצה, שולחן, טלפון..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pr-10 w-full"
                                    aria-label="חיפוש אורחים"
                                    aria-describedby="search-description"
                                />
                                <span id="search-description" className="sr-only">
                                    חיפוש לפי שם, קבוצה, שולחן או מספר טלפון
                                </span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2" role="group" aria-label="מסננים">
                                <div className="flex-1 sm:flex-initial">
                                    <Label htmlFor="status-filter" className="sr-only">
                                        סינון לפי סטטוס
                                    </Label>
                                    <Select
                                        value={statusFilter}
                                        onValueChange={(v) =>
                                            setStatusFilter(v as typeof statusFilter)
                                        }
                                    >
                                        <SelectTrigger 
                                            id="status-filter"
                                            className="w-full sm:w-[140px]"
                                            aria-label="בחר סטטוס"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">כל הסטטוסים</SelectItem>
                                            <SelectItem value="YES">מאשרים</SelectItem>
                                            <SelectItem value="MAYBE">אולי</SelectItem>
                                            <SelectItem value="NO">לא</SelectItem>
                                            <SelectItem value="PENDING">ממתינים</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="flex-1 sm:flex-initial">
                                    <Label htmlFor="group-filter" className="sr-only">
                                        סינון לפי קבוצה
                                    </Label>
                                    <Select 
                                        value={groupFilter} 
                                        onValueChange={setGroupFilter}
                                    >
                                        <SelectTrigger 
                                            id="group-filter"
                                            className="w-full sm:w-[140px]"
                                            aria-label="בחר קבוצה"
                                        >
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ALL">כל הקבוצות</SelectItem>
                                            {uniqueGroups.map((g) => (
                                                <SelectItem key={g} value={g}>
                                                    {g}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                        {(searchQuery || statusFilter !== "ALL" || groupFilter !== "ALL") && (
                            <div className="flex items-center gap-2 mt-3" role="status" aria-live="polite">
                                <span className="text-sm text-gray-600" id="filter-results">
                                    נמצאו {filteredGuests.length} אורחים
                                </span>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSearchQuery("")
                                        setStatusFilter("ALL")
                                        setGroupFilter("ALL")
                                    }}
                                    className="gap-1"
                                    aria-label="נקה את כל המסננים"
                                >
                                    <X className="h-3 w-3" aria-hidden="true" />
                                    <span>נקה מסננים</span>
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Guests Table - Desktop / Cards - Mobile */}
                <Card style={{
                  background: 'rgba(255, 255, 255, 0.7)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 32px rgba(139, 92, 246, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)'
                }}>
                    <CardHeader style={{
                      background: 'rgba(99, 102, 241, 0.1)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      borderBottom: '1px solid rgba(99, 102, 241, 0.2)'
                    }}>
                        <CardTitle className="bg-gradient-to-r from-indigo-700 to-purple-700 bg-clip-text text-transparent font-bold">
                            רשימת אורחים ({filteredGuests.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full" role="table" aria-label="טבלת אורחים">
                                <thead style={{
                                  background: 'rgba(99, 102, 241, 0.15)',
                                  backdropFilter: 'blur(10px)',
                                  WebkitBackdropFilter: 'blur(10px)',
                                  borderBottom: '2px solid rgba(99, 102, 241, 0.3)'
                                }}>
                                    <tr>
                                        <th scope="col" className="px-4 xl:px-6 py-3 xl:py-4 text-right text-xs font-bold text-indigo-800 uppercase tracking-wider">
                                            שם
                                        </th>
                                        <th scope="col" className="px-4 xl:px-6 py-3 xl:py-4 text-right text-xs font-bold text-indigo-800 uppercase tracking-wider">
                                            טלפון
                                        </th>
                                        <th scope="col" className="px-4 xl:px-6 py-3 xl:py-4 text-right text-xs font-bold text-indigo-800 uppercase tracking-wider">
                                            קבוצה/צד
                                        </th>
                                        <th scope="col" className="px-4 xl:px-6 py-3 xl:py-4 text-right text-xs font-bold text-indigo-800 uppercase tracking-wider">
                                            מושבים הוזמנו
                                        </th>
                                        <th scope="col" className="px-4 xl:px-6 py-3 xl:py-4 text-right text-xs font-bold text-indigo-800 uppercase tracking-wider">
                                            מושבים מאושרים
                                        </th>
                                        <th scope="col" className="px-4 xl:px-6 py-3 xl:py-4 text-right text-xs font-bold text-indigo-800 uppercase tracking-wider">
                                            סטטוס
                                        </th>
                                        <th scope="col" className="px-4 xl:px-6 py-3 xl:py-4 text-right text-xs font-bold text-indigo-800 uppercase tracking-wider">
                                            פעולות
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: 'rgba(0, 0, 0, 0.05)' }}>
                                    {filteredGuests.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-6 py-12 text-center text-gray-500"
                                                role="status"
                                                aria-live="polite"
                                            >
                                                לא נמצאו אורחים
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredGuests.map((guest, index) => (
                                            <tr
                                                key={guest.id}
                                                className="transition-all duration-300"
                                                style={{ 
                                                  animationDelay: `${index * 0.05}s`,
                                                  background: 'rgba(255, 255, 255, 0.4)',
                                                  borderBottom: '1px solid rgba(0, 0, 0, 0.05)'
                                                }}
                                                onMouseEnter={(e) => {
                                                  e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'
                                                  e.currentTarget.style.backdropFilter = 'blur(10px)'
                                                }}
                                                onMouseLeave={(e) => {
                                                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'
                                                  e.currentTarget.style.backdropFilter = 'none'
                                                }}
                                            >
                                                <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {guest.name}
                                                    </div>
                                                    {guest.relation && (
                                                        <div className="text-xs text-gray-500" aria-label={`קרבה: ${guest.relation}`}>
                                                            {guest.relation}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 ltr" aria-label={guest.phone ? `טלפון: ${guest.phone}` : "טלפון לא זמין"}>
                                                        {guest.phone || "-"}
                                                    </div>
                                                </td>
                                                <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900" aria-label={guest.group ? `קבוצה: ${guest.group}` : "ללא קבוצה"}>
                                                        {guest.group || "-"}
                                                    </div>
                                                </td>
                                                <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900" aria-label={`${guest.invitedSeats} מושבים הוזמנו`}>
                                                        {guest.invitedSeats}
                                                    </div>
                                                </td>
                                                <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900" aria-label={guest.confirmedSeats ? `${guest.confirmedSeats} מושבים מאושרים` : "ללא אישור"}>
                                                        {guest.confirmedSeats ?? "-"}
                                                    </div>
                                                </td>
                                                <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                                                    <StatusBadge status={guest.status} />
                                                </td>
                                                <td className="px-4 xl:px-6 py-3 xl:py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2" role="group" aria-label={`פעולות עבור ${guest.name}`}>
                                                        {guest.phone && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    handleWhatsAppClick(guest)
                                                                }
                                                                className="h-9 w-9 p-0 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200 hover:scale-110 transition-all"
                                                                aria-label={`שלח הודעת WhatsApp ל${guest.name}`}
                                                            >
                                                                <MessageCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => openEditDialog(guest)}
                                                            className="h-9 w-9 p-0 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200 hover:scale-110 transition-all"
                                                            aria-label={`ערוך את ${guest.name}`}
                                                        >
                                                            <Edit className="h-4 w-4 text-blue-600" aria-hidden="true" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                setDeleteConfirm(guest.id)
                                                            }
                                                            className="h-9 w-9 p-0 rounded-full bg-gradient-to-br from-red-100 to-rose-100 hover:from-red-200 hover:to-rose-200 hover:scale-110 transition-all"
                                                            aria-label={`מחק את ${guest.name}`}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Card View */}
                        <div className="lg:hidden divide-y divide-gray-200">
                            {filteredGuests.length === 0 ? (
                                <div className="px-4 py-12 text-center text-gray-500" role="status" aria-live="polite">
                                    לא נמצאו אורחים
                                </div>
                            ) : (
                                filteredGuests.map((guest, index) => (
                                    <div
                                        key={guest.id}
                                        className="p-4 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-300"
                                        style={{ animationDelay: `${index * 0.05}s` }}
                                    >
                                        <div className="flex items-start justify-between gap-3 mb-3">
                                            <div className="flex-1 min-w-0">
                                                <div className="text-base font-semibold text-gray-900 mb-1">
                                                    {guest.name}
                                                </div>
                                                {guest.relation && (
                                                    <div className="text-sm text-gray-500 mb-2" aria-label={`קרבה: ${guest.relation}`}>
                                                        {guest.relation}
                                                    </div>
                                                )}
                                                <StatusBadge status={guest.status} />
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-shrink-0" role="group" aria-label={`פעולות עבור ${guest.name}`}>
                                                {guest.phone && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleWhatsAppClick(guest)}
                                                        className="h-9 w-9 p-0 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200"
                                                        aria-label={`שלח הודעת WhatsApp ל${guest.name}`}
                                                    >
                                                        <MessageCircle className="h-4 w-4 text-green-600" aria-hidden="true" />
                                                    </Button>
                                                )}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditDialog(guest)}
                                                    className="h-9 w-9 p-0 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 hover:from-blue-200 hover:to-indigo-200"
                                                    aria-label={`ערוך את ${guest.name}`}
                                                >
                                                    <Edit className="h-4 w-4 text-blue-600" aria-hidden="true" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setDeleteConfirm(guest.id)}
                                                    className="h-9 w-9 p-0 rounded-full bg-gradient-to-br from-red-100 to-rose-100 hover:from-red-200 hover:to-rose-200"
                                                    aria-label={`מחק את ${guest.name}`}
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-600" aria-hidden="true" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-gray-500">טלפון:</span>
                                                <div className="text-gray-900 ltr font-mono mt-0.5" aria-label={guest.phone ? `טלפון: ${guest.phone}` : "טלפון לא זמין"}>
                                                    {guest.phone || "-"}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">קבוצה:</span>
                                                <div className="text-gray-900 mt-0.5" aria-label={guest.group ? `קבוצה: ${guest.group}` : "ללא קבוצה"}>
                                                    {guest.group || "-"}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">מושבים הוזמנו:</span>
                                                <div className="text-gray-900 font-semibold mt-0.5" aria-label={`${guest.invitedSeats} מושבים הוזמנו`}>
                                                    {guest.invitedSeats}
                                                </div>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">מושבים מאושרים:</span>
                                                <div className="text-gray-900 font-semibold mt-0.5" aria-label={guest.confirmedSeats ? `${guest.confirmedSeats} מושבים מאושרים` : "ללא אישור"}>
                                                    {guest.confirmedSeats ?? "-"}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog
                open={isAddDialogOpen || editingGuest !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        setIsAddDialogOpen(false)
                        setEditingGuest(null)
                        resetForm()
                    }
                }}
            >
                <DialogContent 
                    className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4"
                    role="dialog"
                    aria-labelledby="dialog-title"
                    aria-modal="true"
                >
                    <DialogHeader>
                        <DialogClose
                            onClose={() => {
                                setIsAddDialogOpen(false)
                                setEditingGuest(null)
                                resetForm()
                            }}
                            aria-label="סגור חלון"
                        />
                        <DialogTitle id="dialog-title">
                            {editingGuest ? "ערוך אורח" : "הוסף אורח חדש"}
                        </DialogTitle>
                    </DialogHeader>
                    <form 
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleSave()
                        }}
                        className="space-y-4 mt-4"
                        aria-label={editingGuest ? "טופס עריכת אורח" : "טופס הוספת אורח חדש"}
                    >
                        <div>
                            <Label htmlFor="fullName">
                                שם מלא <span className="text-red-600" aria-label="שדה חובה">*</span>
                            </Label>
                            <Input
                                id="fullName"
                                value={formData.fullName}
                                onChange={(e) =>
                                    setFormData({ ...formData, fullName: e.target.value })
                                }
                                placeholder="שם מלא"
                                required
                                aria-required="true"
                                aria-invalid={!formData.fullName.trim()}
                                aria-describedby="fullName-error"
                            />
                            {!formData.fullName.trim() && (
                                <span id="fullName-error" className="sr-only" role="alert">
                                    שם מלא הוא שדה חובה
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="phoneWa">טלפון</Label>
                                <Input
                                    id="phoneWa"
                                    value={formData.phoneWa}
                                    onChange={(e) =>
                                        setFormData({ ...formData, phoneWa: e.target.value })
                                    }
                                    placeholder="050-1234567"
                                    className="ltr"
                                />
                            </div>
                            <div>
                                <Label htmlFor="group">קבוצה/צד</Label>
                                <Input
                                    id="group"
                                    value={formData.group}
                                    onChange={(e) =>
                                        setFormData({ ...formData, group: e.target.value })
                                    }
                                    placeholder="צד כלה/חתן"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="relation">קרבה</Label>
                                <Input
                                    id="relation"
                                    value={formData.relation}
                                    onChange={(e) =>
                                        setFormData({ ...formData, relation: e.target.value })
                                    }
                                    placeholder="אח, חבר, וכו'"
                                />
                            </div>
                            <div>
                                <Label htmlFor="mealPreference">העדפת ארוחה</Label>
                                <Input
                                    id="mealPreference"
                                    value={formData.mealPreference}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            mealPreference: e.target.value,
                                        })
                                    }
                                    placeholder="צמחוני, כשר, וכו'"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="invitedSeats">מושבים הוזמנו</Label>
                                <Input
                                    id="invitedSeats"
                                    type="number"
                                    min="1"
                                    value={formData.invitedSeats}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            invitedSeats: parseInt(e.target.value) || 1,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="confirmedSeats">מושבים מאושרים</Label>
                                <Input
                                    id="confirmedSeats"
                                    type="number"
                                    min="0"
                                    value={formData.confirmedSeats ?? ""}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            confirmedSeats:
                                                e.target.value === ""
                                                    ? null
                                                    : parseInt(e.target.value) || null,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="rsvpStatus">סטטוס RSVP</Label>
                                <Select
                                    value={formData.rsvpStatus}
                                    onValueChange={(v) =>
                                        setFormData({
                                            ...formData,
                                            rsvpStatus: v as typeof formData.rsvpStatus,
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PENDING">ממתין</SelectItem>
                                        <SelectItem value="YES">מאשר</SelectItem>
                                        <SelectItem value="NO">לא</SelectItem>
                                        <SelectItem value="MAYBE">אולי</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setIsAddDialogOpen(false)
                                    setEditingGuest(null)
                                    resetForm()
                                }}
                                aria-label="בטל וסגור"
                            >
                                ביטול
                            </Button>
                            <Button 
                                type="submit"
                                disabled={!formData.fullName.trim()}
                                aria-label={editingGuest ? "שמור שינויים" : "הוסף אורח"}
                            >
                                שמור
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteConfirm !== null}
                onOpenChange={(open) => {
                    if (!open) setDeleteConfirm(null)
                }}
            >
                <DialogContent 
                    className="max-w-md"
                    role="alertdialog"
                    aria-labelledby="delete-dialog-title"
                    aria-describedby="delete-dialog-description"
                    aria-modal="true"
                >
                    <DialogHeader>
                        <DialogTitle id="delete-dialog-title">מחיקת אורח</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <p id="delete-dialog-description" className="text-gray-600">
                            האם אתה בטוח שברצונך למחוק את האורח? פעולה זו לא ניתנת לביטול.
                        </p>
                    </div>
                    <div className="flex justify-end gap-3">
                        <Button 
                            type="button"
                            variant="outline" 
                            onClick={() => setDeleteConfirm(null)}
                            aria-label="בטל מחיקה"
                        >
                            ביטול
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
                            aria-label="אשר מחיקה"
                        >
                            מחק
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </main>
    )
}

