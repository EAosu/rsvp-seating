import { NextRequest, NextResponse } from "next/server"
import * as XLSX from "xlsx"
import { parse as parseCsv } from "csv-parse/sync"
import iconv from "iconv-lite"
import { toPreviewRows } from "@/lib/guest-import"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    await params // לא צריך את id כאן, אבל Next 15 דורש await

    const ctype = req.headers.get("content-type") || ""
    let logicalRows: any[] = []

    if (ctype.startsWith("multipart/form-data")) {
        const fd = await req.formData()
        const file = fd.get("file") as File | null
        if (!file) return NextResponse.json({ error: "missing file" }, { status: 400 })
        const buf = Buffer.from(await file.arrayBuffer())

        if (file.name.toLowerCase().endsWith(".xlsx") || file.type.includes("sheet")) {
            const wb = XLSX.read(buf, { type: "buffer" })
            const ws = wb.Sheets[wb.SheetNames[0]]
            logicalRows = XLSX.utils.sheet_to_json(ws, { defval: "" })
        } else {
            const hasBOM = buf.length >= 3 && buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF
            const tryUtf8 = iconv.decode(buf, "utf8")
            const text = hasBOM ? tryUtf8 : (/Ã.|�/.test(tryUtf8) ? iconv.decode(buf, "win1255") : tryUtf8)
            logicalRows = parseCsv(text, { columns: true, skip_empty_lines: true, trim: true })
        }
    } else {
        const body = await req.json()
        logicalRows = body?.rows || []
    }

    const { rows, errors } = toPreviewRows(logicalRows)
    return NextResponse.json({ rows, errors })
}
