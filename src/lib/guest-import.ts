import { z } from "zod"
import { canonPhone } from "./phone"

export const RowInput = z.object({
    household_name: z.string().optional().nullable(),
    phone: z.string(),                   // טלפון משק בית (חובה)
    guest_full_name: z.string(),         // שם אורח (חובה)
    relation: z.string().optional().nullable(),
    meal_preference: z.string().optional().nullable(),
    group: z.string().optional().nullable(),
    guest_phone: z.string().optional().nullable(), // טלפון לאורח (אופציונלי)
})

export type RowInputT = z.infer<typeof RowInput>

// מיפוי כותרות עברית/אנגלית לשמות אחידים
export function normalizeHeaders(obj: any) {
    const map: Record<string, string> = {
        // אנגלית
        "household_name": "household_name",
        "household": "household_name",
        "phone": "phone",
        "guest_full_name": "guest_full_name",
        "guest": "guest_full_name",
        "name": "guest_full_name",
        "relation": "relation",
        "meal_preference": "meal_preference",
        "group": "group",
        "guest_phone": "guest_phone",
        // עברית
        "שם משק בית": "household_name",
        "טלפון": "phone",
        "שם מוזמן": "guest_full_name",
        "קשר": "relation",
        "מנה": "meal_preference",
        "קבוצה": "group",
        "טלפון מוזמן": "guest_phone",
        "טלפון אורח": "guest_phone",
    }
    const out: any = {}
    for (const [k, v] of Object.entries(obj)) {
        const key = map[k] || map[k.toLowerCase?.()] || k
        out[key] = (v ?? "").toString().trim()
    }
    return out
}

export type PreviewRow = {
    _active: boolean       // לסימון/דילוג בשלב התצוגה המקדימה
    _error?: string | null // שגיאה לשורה (אם יש)
} & RowInputT & {
    phone: string          // אחרי canonPhone
    guest_phone?: string | null // אחרי canonPhone (אם יש)
}

export function toPreviewRows(rawRows: any[]): { rows: PreviewRow[], errors: Array<{ idx:number; error:string }> } {
    const errors: Array<{ idx:number; error:string }> = []
    const rows: PreviewRow[] = []
    rawRows.forEach((r, i) => {
        const n = normalizeHeaders(r)
        const parsed = RowInput.safeParse(n)
        if (!parsed.success) {
            const msg = parsed.error.issues.map(iss => iss.message || iss.path.join(".")).join(", ")
            errors.push({ idx: i+2, error: msg })
            rows.push({
                _active: false,
                _error: msg,
                household_name: String(n.household_name ?? ""),
                phone: String(n.phone ?? ""),
                guest_full_name: String(n.guest_full_name ?? ""),
                relation: n.relation ?? "",
                meal_preference: n.meal_preference ?? "",
                group: n.group ?? "",
                guest_phone: n.guest_phone ?? "",
            })
        } else {
            const clean = parsed.data
            const phone = canonPhone(clean.phone)
            const gphone = clean.guest_phone ? canonPhone(clean.guest_phone) : null
            // ולידציית טלפון בסיסית
            const badPhone = !/^\d{9,15}$/.test(phone)
            rows.push({
                _active: !badPhone, // אם טלפון בעייתי – דלוק כברירת מחדל false
                _error: badPhone ? "טלפון משק בית לא תקין" : null,
                household_name: clean.household_name ?? "",
                phone,
                guest_full_name: clean.guest_full_name,
                relation: clean.relation ?? "",
                meal_preference: clean.meal_preference ?? "",
                group: clean.group ?? "",
                guest_phone: gphone ?? "",
            })
        }
    })
    return { rows, errors }
}
