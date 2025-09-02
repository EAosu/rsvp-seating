import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"
import { z } from "zod"
import { parse as parseCsv } from "csv-parse/sync"
import * as XLSX from "xlsx"
import iconv from "iconv-lite"
import { canonPhone } from "@/lib/phone"

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: eventId } = await params

    // נקבל או FormData עם קובץ, או JSON עם rows (מ-Paste)
    const ctype = req.headers.get("content-type") || ""
    let rows: any[] = []

    if (ctype.startsWith("multipart/form-data")) {
        const fd = await req.formData()
        const file = fd.get("file") as File | null
        if (!file) return NextResponse.json({ error: "missing file" }, { status: 400 })
        const buf = Buffer.from(await file.arrayBuffer())

        if (file.name.toLowerCase().endsWith(".xlsx") || file.type.includes("sheet")) {
            const wb = XLSX.read(buf, { type: "buffer" })
            const sheet = wb.Sheets[wb.SheetNames[0]]
            rows = XLSX.utils.sheet_to_json(sheet, { defval: "" })
        } else {
            // CSV — נזהה קידוד
            const buf = Buffer.from(await file.arrayBuffer())
            let text: string
            const hasBOM = buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF
            if (hasBOM) {
                text = iconv.decode(buf, "utf8")
            } else {
                // ננסה UTF-8; אם נראה ג׳יבריש (Ã—/�), ננסה CP1255 (Windows-1255)
                const tryUtf8 = iconv.decode(buf, "utf8")
                if (/Ã.|�/.test(tryUtf8)) {
                    text = iconv.decode(buf, "win1255")
                } else {
                    text = tryUtf8
                }
            }

            rows = parseCsv(text, {
                columns: true,
                skip_empty_lines: true,
                trim: true,
            })
        }
    } else {
        const body = await req.json()
        rows = body?.rows || []
    }

    // סכמת שורה (כותרות מפתח)
    const Row = z.object({
        household_name: z.string().optional().nullable(),
        phone: z.string(), // חובה — לפי זה מאחדים ל-household
        guest_full_name: z.string(),
        relation: z.string().optional().nullable(),
        meal_preference: z.string().optional().nullable(),
        group: z.string().optional().nullable(),
    })

    const bad: Array<{ idx: number; error: string }> = []
    const good: z.infer<typeof Row>[] = []

    // מפה שמות עמודות לצורה אחידה אם העלו באנגלית/עברית אחרת
    const normalizeHeaders = (obj: any) => {
        const m: Record<string, string> = {
            household_name: "household_name",
            household: "household_name",
            "שם משק בית": "household_name",
            phone: "phone",
            tel: "phone",
            "טלפון": "phone",
            guest_full_name: "guest_full_name",
            guest: "guest_full_name",
            name: "guest_full_name",
            "שם מוזמן": "guest_full_name",
            relation: "relation",
            "קשר": "relation",
            meal_preference: "meal_preference",
            "מנה": "meal_preference",
            group: "group",
            "קבוצה": "group",
        }
        const out: any = {}
        for (const [k, v] of Object.entries(obj)) {
            const key = m[k] || m[k.toLowerCase()] || k
            out[key] = (v ?? "").toString().trim()
        }
        return out
    }

    rows.forEach((r, i) => {
        const n = normalizeHeaders(r)
        const parsed = Row.safeParse(n)
        if (!parsed.success) {
            bad.push({
                idx: i + 2,
                error: parsed.error.issues.map(iss => iss.message || iss.path.join(".")).join(", "),
            })
        } else {
            const clean = { ...parsed.data, phone: canonPhone(parsed.data.phone) }
            if (!/^\d{11,15}$/.test(clean.phone)) {
                bad.push({ idx: i + 2, error: "phone invalid" })
            } else {
                good.push(clean)
            }
        }
    })

    // קיבוץ לפי household (טלפון): מערך אורחים לכל טלפון
    const groups = good.reduce((acc, r) => {
        const key = r.phone
        acc[key] = acc[key] || { phone: r.phone, name: r.household_name || "", group: r.group || "", guests: [] as any[] }
        acc[key].name = acc[key].name || r.household_name || ""
        acc[key].group = acc[key].group || r.group || ""
        acc[key].guests.push({
            fullName: r.guest_full_name,
            relation: r.relation || null,
            phoneWa: r.phone,
            mealPreference: r.meal_preference || null,
        })
        return acc
    }, {} as Record<string, { phone: string; name: string; group: string; guests: any[] }>)

    let createdHouseholds = 0
    let updatedHouseholds = 0
    let createdGuests = 0
    let updatedGuests = 0

    for (const phone of Object.keys(groups)) {
        const pack = groups[phone]
        const existing = await prisma.household.findFirst({
            where: { eventId, OR: [{ phoneWa: phone }, { phoneWa: "+" + phone }] },
            include: { guests: true }
        })

        if (!existing) {
            // חדש
            const hh = await prisma.household.create({
                data: {
                    eventId,
                    name: pack.name || "Household",
                    group: pack.group || null,
                    phoneWa: phone,
                    guests: {
                        create: pack.guests.map(g => ({
                            eventId, // ← הוספנו!
                            fullName: g.fullName,
                            phoneWa: g.phoneWa,
                            relation: g.relation,
                            mealPreference: g.mealPreference,
                            rsvpStatus: "PENDING",
                        })),
                    },
                },
                include: { guests: true },
            })
            createdHouseholds++
            createdGuests += hh.guests.length
        } else {
            // עדכון: נעדכן name/group אם סופקו, ונוסיף/נעדכן אורחים לפי fullName
            await prisma.household.update({
                where: { id: existing.id },
                data: {
                    name: pack.name || existing.name,
                    group: pack.group || existing.group,
                }
            })
            updatedHouseholds++

            for (const g of pack.guests) {
                const found = existing.guests.find(x => x.fullName.trim() === g.fullName.trim())
                if (found) {
                    await prisma.guest.update({
                        where: { id: found.id },
                        data: {
                            relation: g.relation,
                            mealPreference: g.mealPreference ?? found.mealPreference,
                        }
                    })
                    updatedGuests++
                } else {
                    await prisma.guest.create({
                        data: {
                            eventId,
                            householdId: existing.id,
                            fullName: g.fullName,
                            phoneWa: g.phoneWa,
                            relation: g.relation,
                            mealPreference: g.mealPreference,
                            rsvpStatus: "PENDING",
                        }
                    })
                    createdGuests++
                }
            }
        }
    }

    return NextResponse.json({
        summary: { createdHouseholds, updatedHouseholds, createdGuests, updatedGuests, errors: bad.length },
        errors: bad,
    })
}
