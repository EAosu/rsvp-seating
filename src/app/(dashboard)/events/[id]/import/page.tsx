"use client"

import { useParams } from "next/navigation"
import { useState } from "react"
import Papa from "papaparse"
import { toast } from "sonner"
import { canonPhone } from "@/lib/phone"
import { Card, CardContent, Button, Input, Label, Switch } from "@/components/ui"

type PreviewRow = {
    _active: boolean
    _error?: string | null
    household_name: string
    phone: string
    guest_full_name: string
    relation?: string | null
    meal_preference?: string | null
    group?: string | null
    guest_phone?: string | null
}

export default function ImportGuestsPage() {
    const { id } = useParams<{ id: string }>()
    const [file, setFile] = useState<File | null>(null)
    const [paste, setPaste] = useState("")
    const [preview, setPreview] = useState<PreviewRow[] | null>(null)
    const [errors, setErrors] = useState<Array<{idx:number; error:string}>>([])
    const [loading, setLoading] = useState(false)
    const [sendAfter, setSendAfter] = useState(false)
    const [sending, setSending] = useState(false)

    const reset = () => { setPreview(null); setErrors([]); setPaste(""); setFile(null) }

    async function parseFile() {
        if (!file) return toast.error("בחר קובץ CSV/XLSX")
        try {
            setLoading(true)
            const fd = new FormData()
            fd.append("file", file)
            const res = await fetch(`/api/events/${id}/import/parse`, { method: "POST", body: fd })
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error || "שגיאה")
            setPreview(json.rows)
            setErrors(json.errors || [])
            toast.success("נוצרה תצוגה מקדימה")
        } catch (e:any) {
            toast.error(e.message)
        } finally { setLoading(false) }
    }

    async function parseText() {
        if (!paste.trim()) return toast.error("הדבק טבלה מאקסל או CSV")
        try {
            setLoading(true)
            const parsed = Papa.parse(paste.trim(), { header: true, skipEmptyLines: true })
            const res = await fetch(`/api/events/${id}/import/parse`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rows: parsed.data }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error || "שגיאה")
            setPreview(json.rows)
            setErrors(json.errors || [])
            toast.success("נוצרה תצוגה מקדימה")
        } catch (e:any) {
            toast.error(e.message)
        } finally { setLoading(false) }
    }

    async function commitImport() {
        if (!preview) return
        try {
            setLoading(true)
            // נרמול אחרון לצד לקוח (עריכות ידניות)
            const edited = preview.map(r => ({
                ...r,
                phone: canonPhone(r.phone),
                guest_phone: r.guest_phone ? canonPhone(r.guest_phone) : "",
            }))
            const res = await fetch(`/api/events/${id}/import/commit`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rows: edited }),
            })
            const json = await res.json()
            if (!res.ok) throw new Error(json?.error || "שגיאה")
            toast.success("הייבוא נשמר בהצלחה")
            if (sendAfter) {
                setSending(true)
                const sres = await fetch(`/api/events/${id}/invites/send`, { method: "POST" })
                if (!sres.ok) throw new Error(await sres.text())
                toast.success("ההזמנות נשלחו בוואטסאפ")
            }
            reset()
        } catch (e:any) {
            toast.error(e.message || "שגיאה בשמירה")
        } finally { setLoading(false); setSending(false) }
    }

    const hasPreview = !!preview

    return (
        <div className="container-page rtl">
            <h1 className="title mb-3 relative">ייבוא מוזמנים</h1>
            <p className="sub mb-6 text-gray-700 font-medium">שניים על השעון: צור תצוגה מקדימה → עדכן טעויות → שמור.</p>

            <div className="flex gap-3 mb-3">
                <a href="/api/templates/guests.xlsx" className="underline">הורד תבנית Excel (מומלץ)</a>
                <a href="/api/templates/guests.csv" className="underline">או תבנית CSV (UTF-8)</a>
            </div>
            <div className="text-xs text-gray-600 mb-6">
                טיפ: בעמודת <b>טלפון</b> באקסל — Format Cells → <b>Text</b> (או Custom: 0000000000) כדי לשמור אפסים מובילים.
            </div>

            {!hasPreview ? (
                <div className="grid md:grid-cols-2 gap-6">
                    <Card>
                        <CardContent>
                            <div className="space-y-3">
                                <div>
                                    <Label>העלאת קובץ CSV/XLSX</Label>
                                    <Input type="file"
                                           accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                                           onChange={e => setFile(e.target.files?.[0] || null)} />
                                </div>
                                <Button onClick={parseFile} disabled={loading}>
                                    {loading ? "מעלה..." : "צור תצוגה מקדימה מקובץ"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent>
                            <div className="space-y-3">
                                <div>
                                    <Label>הדבקה מאקסל/CSV</Label>
                                    <textarea
                                        className="w-full h-40 rounded-xl border border-gray-300 p-3 text-sm"
                                        placeholder={`שם משק בית,טלפון,שם מוזמן,קשר,מנה,קבוצה,טלפון מוזמן\nמשפחת כהן,0502555897,דנה כהן,כלה,צמחוני,צד כלה,0502555897`}
                                        value={paste}
                                        onChange={(e) => setPaste(e.target.value)}
                                    />
                                </div>
                                <Button onClick={parseText} disabled={loading}>
                                    {loading ? "מייבא..." : "צור תצוגה מקדימה מטקסט"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Switch checked={sendAfter} onChange={(e) => setSendAfter((e.target as HTMLInputElement).checked)} />
                        <span className="text-sm">שלח הזמנות בוואטסאפ מיד אחרי השמירה</span>
                        {sending && <span className="text-xs text-gray-500">שולח…</span>}
                    </div>

                    {!!errors.length && (
                        <div className="text-sm text-red-600">שגיאות בכותרות/שורות: {errors.length} (ניתן לערוך ידנית בטבלה)</div>
                    )}

                    <div className="rounded-2xl border overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                            <tr className="text-gray-600">
                                <th className="p-2 w-10">פעיל</th>
                                <th className="p-2 text-right">שם משק בית</th>
                                <th className="p-2 text-right">טלפון</th>
                                <th className="p-2 text-right">שם מוזמן</th>
                                <th className="p-2 text-right">טלפון מוזמן</th>
                                <th className="p-2 text-right">קשר</th>
                                <th className="p-2 text-right">מנה</th>
                                <th className="p-2 text-right">קבוצה</th>
                                <th className="p-2 text-right">שגיאה</th>
                            </tr>
                            </thead>
                            <tbody>
                            {preview!.map((r, idx) => (
                                <tr key={idx} className="border-t">
                                    <td className="p-2 text-center">
                                        <input type="checkbox" checked={r._active} onChange={(e) => {
                                            const v = e.target.checked
                                            setPreview(prev => prev!.map((x, i) => i===idx ? { ...x, _active: v } : x))
                                        }} />
                                    </td>
                                    <td className="p-2">
                                        <Input value={r.household_name} onChange={e => setPreview(p => p!.map((x,i)=>i===idx?{...x,household_name:e.target.value}:x))} />
                                    </td>
                                    <td className="p-2 ltr">
                                        <Input value={r.phone} onChange={e => setPreview(p => p!.map((x,i)=>i===idx?{...x,phone:e.target.value}:x))} />
                                    </td>
                                    <td className="p-2">
                                        <Input value={r.guest_full_name} onChange={e => setPreview(p => p!.map((x,i)=>i===idx?{...x,guest_full_name:e.target.value}:x))} />
                                    </td>
                                    <td className="p-2 ltr">
                                        <Input value={r.guest_phone || ""} onChange={e => setPreview(p => p!.map((x,i)=>i===idx?{...x,guest_phone:e.target.value}:x))} />
                                    </td>
                                    <td className="p-2">
                                        <Input value={r.relation || ""} onChange={e => setPreview(p => p!.map((x,i)=>i===idx?{...x,relation:e.target.value}:x))} />
                                    </td>
                                    <td className="p-2">
                                        <Input value={r.meal_preference || ""} onChange={e => setPreview(p => p!.map((x,i)=>i===idx?{...x,meal_preference:e.target.value}:x))} />
                                    </td>
                                    <td className="p-2">
                                        <Input value={r.group || ""} onChange={e => setPreview(p => p!.map((x,i)=>i===idx?{...x,group:e.target.value}:x))} />
                                    </td>
                                    <td className="p-2">{r._error ? <span className="text-red-600">{r._error}</span> : "-"}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex gap-2">
                        <Button onClick={commitImport} disabled={loading || sending}>
                            {loading ? "שומר..." : "שמור ייבוא"}
                        </Button>
                        <Button onClick={() => setPreview(null)} variant="ghost">חזרה</Button>
                    </div>
                </div>
            )}
        </div>
    )
}
