import { NextResponse } from "next/server"
import * as XLSX from "xlsx"

export async function GET() {
    const data = [
        { "שם משק בית": "משפחת כהן", "טלפון": "0502555897", "שם מוזמן": "דנה כהן", "קשר": "כלה",  "מנה": "צמחוני", "קבוצה": "צד כלה" },
        { "שם משק בית": "משפחת כהן", "טלפון": "0502555897", "שם מוזמן": "יואב כהן", "קשר": "חתן", "מנה": "רגיל",   "קבוצה": "צד חתן" },
        { "שם משק בית": "חברים",      "טלפון": "0541234567", "שם מוזמן": "רותם לוי", "קשר": "חבר/ה","מנה": "טבעוני","קבוצה": "חברים" },
    ]
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data, {
        header: ["שם משק בית","טלפון","שם מוזמן","קשר","מנה","קבוצה"]
    })
    XLSX.utils.book_append_sheet(wb, ws, "מוזמנים")
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
    return new NextResponse(buf, {
        headers: {
            "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": 'attachment; filename="guests_template.xlsx"',
        },
    })
}
