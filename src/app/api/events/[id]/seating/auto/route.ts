import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"

export const dynamic = "force-dynamic"
export const revalidate = 0

type GuestLite = {
    id: string
    fullName: string
    group: string | null
    householdId: string | null
    tableId: string | null
}

type Cluster = { key: string; guestIds: string[]; label?: string }

function lastName(fullName: string) {
    const parts = fullName.trim().split(/\s+/)
    return parts.length > 1 ? parts[parts.length - 1] : parts[0]
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id: eventId } = await params
    const body = await req.json().catch(() => ({}))
    const keepExisting: boolean = !!body?.keepExisting

    // 1) שולחנות + אורחי YES
    const [tables, yesGuestsRaw] = await Promise.all([
        prisma.table.findMany({ where: { eventId }, orderBy: [{ name: "asc" }] }),
        prisma.guest.findMany({
            where: { eventId },
            select: { id: true, fullName: true, group: true, householdId: true, tableId: true },
            orderBy: [{ fullName: "asc" }],
        }),
    ])

    // עובדים רק על מי שלא משובץ כשkeepExisting=true
    const yesGuests: GuestLite[] = keepExisting
        ? yesGuestsRaw.filter(g => !g.tableId)
        : yesGuestsRaw

    // שימוש קיים (לכיבוד keepExisting)
    const usage = await prisma.guest.groupBy({
        by: ["tableId"],
        where: { eventId, tableId: { not: null } },
        _count: { _all: true },
    })
    const usedMap = new Map<string, number>()
    for (const u of usage) if (u.tableId) usedMap.set(u.tableId, u._count._all)

    const tablesState = tables.map(t => ({
        id: t.id,
        name: t.name,
        capacity: t.capacity,
        used: keepExisting ? (usedMap.get(t.id) || 0) : 0,
    }))

    // 2) קלאסטרים: Household תחילה, אחרת LastName+Group, אחרת LastName
    const byKey = new Map<string, Cluster>()

    for (const g of yesGuests) {
        let key: string
        if (g.householdId) {
            key = `H:${g.householdId}`
        } else if (g.group) {
            key = `LN:${lastName(g.fullName)}|G:${g.group.trim()}`
        } else {
            key = `LN:${lastName(g.fullName)}`
        }
        const c = byKey.get(key) || { key, guestIds: [], label: key }
        c.guestIds.push(g.id)
        byKey.set(key, c)
    }

    let clusters = Array.from(byKey.values())

    // 3) סידור לפי גודל (גדולים קודם)
    clusters.sort((a, b) => b.guestIds.length - a.guestIds.length)

    // 4) אלגוריתם השמה: Best-Fit Decreasing (ממזער שאריות → פחות פיצולים)
    const assign: Array<{ guestId: string; tableId: string }> = []

    function bestTableFor(size: number): number {
        let bestIdx = -1
        let bestLeft = Number.POSITIVE_INFINITY
        for (let i = 0; i < tablesState.length; i++) {
            const free = tablesState[i].capacity - tablesState[i].used
            if (free >= size && free - size < bestLeft) {
                bestLeft = free - size
                bestIdx = i
            }
        }
        return bestIdx
    }

    for (const cl of clusters) {
        const size = cl.guestIds.length
        let idx = bestTableFor(size)

        if (idx >= 0) {
            // הקלאסטר כולו נכנס לאותו שולחן
            for (const gid of cl.guestIds) assign.push({ guestId: gid, tableId: tablesState[idx].id })
            tablesState[idx].used += size
            continue
        }

        // אם לא נכנס, מפצלים "בעדינות": ממלאים טבלאות עם הכי הרבה מקום
        // (עדיין נשמרת קירבה כי כולן נסיונות צמודים)
        const order = tablesState
            .map((t, i) => ({ i, free: t.capacity - t.used }))
            .filter(x => x.free > 0)
            .sort((a, b) => b.free - a.free)

        let pos = 0
        for (const { i, free } of order) {
            if (pos >= cl.guestIds.length) break
            const chunk = cl.guestIds.slice(pos, pos + free)
            for (const gid of chunk) assign.push({ guestId: gid, tableId: tablesState[i].id })
            tablesState[i].used += chunk.length
            pos += chunk.length
        }
    }

    // 5) כתיבה למסד
    if (!keepExisting) {
        await prisma.guest.updateMany({ where: { eventId }, data: { tableId: null, seatNumber: null } })
    }

    // מספרי מושב: אם keepExisting=true מכבדים ספירה קיימת
    const startIndex = new Map<string, number>()
    if (keepExisting) {
        for (const t of tablesState) startIndex.set(t.id, usedMap.get(t.id) || 0)
    }

    const byTable = new Map<string, string[]>()
    for (const a of assign) {
        const arr = byTable.get(a.tableId) || []
        arr.push(a.guestId)
        byTable.set(a.tableId, arr)
    }

    for (const [tableId, guestIds] of byTable.entries()) {
        let seat = (startIndex.get(tableId) || 0) + 1
        for (const gid of guestIds) {
            await prisma.guest.update({ where: { id: gid }, data: { tableId, seatNumber: seat++ } })
        }
    }

    return NextResponse.json({ ok: true, assigned: assign.length })
}
