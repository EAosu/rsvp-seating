import { NextResponse } from "next/server"

export async function GET() {
    const rows = [
        ["שם משק בית","טלפון","שם מוזמן","קשר","מנה","קבוצה"],
        ["משפחת כהן","0502555897","דנה כהן","כלה","צמחוני","צד כלה"],
        ["משפחת כהן","0502555897","יואב כהן","חתן","רגיל","צד חתן"],
        ["חברים","0541234567","רותם לוי","חבר/ה","טבעוני","חברים"],
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n")
    const withBOM = "\uFEFF" + csv // ← חשוב ל-Excel על Windows
    return new NextResponse(withBOM, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": 'attachment; filename="guests_template.csv"',
        },
    })
}
