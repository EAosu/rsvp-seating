import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/server/db"
import { requireAuth } from "@/lib/authorization"
import { z } from "zod"

const createEventSchema = z.object({
  title: z.string().min(1).max(200),
  eventDate: z.string().or(z.date()),
  venue: z.string().max(200).optional().nullable(),
})

export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth()

    const events = await prisma.event.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        eventDate: true,
        venue: true,
        createdAt: true,
        _count: {
          select: {
            guests: true,
            tables: true,
          },
        },
      },
      orderBy: { eventDate: "desc" },
    })

    return NextResponse.json({ events })
  } catch (error) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireAuth()
    const body = await req.json()
    const parsed = createEventSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { title, eventDate, venue } = parsed.data

    // Handle both ISO string and Date object
    const date = typeof eventDate === "string" ? new Date(eventDate) : eventDate
    if (isNaN(date.getTime())) {
      return NextResponse.json({ error: "Invalid date" }, { status: 400 })
    }

    const event = await prisma.event.create({
      data: {
        userId,
        title,
        eventDate: date,
        venue: venue || null,
      },
      select: {
        id: true,
        title: true,
        eventDate: true,
        venue: true,
      },
    })

    return NextResponse.json({ event }, { status: 201 })
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Create event error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

