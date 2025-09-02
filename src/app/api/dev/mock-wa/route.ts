import { NextRequest, NextResponse } from "next/server"
import { updateRsvpByPhone } from "@/server/rsvp-update"

export async function POST(req: NextRequest) {
    const { from, payload } = await req.json()
    if (!from || !payload) {
        return NextResponse.json({ error: "from and payload required" }, { status: 400 })
    }
    const ok = await updateRsvpByPhone(String(from), String(payload))
    return NextResponse.json({ ok })
}
