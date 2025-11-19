import { prisma } from "@/server/db"
import { auth } from "@/lib/auth-server"

/**
 * Get the current authenticated user's ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.id || null
}

/**
 * Check if a user owns an event
 */
export async function userOwnsEvent(
  userId: string | null,
  eventId: string
): Promise<boolean> {
  if (!userId) return false

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { userId: true },
  })

  return event?.userId === userId
}

/**
 * Require authentication and return user ID, or throw error
 */
export async function requireAuth(): Promise<string> {
  const userId = await getCurrentUserId()
  if (!userId) {
    throw new Error("Unauthorized")
  }
  return userId
}

/**
 * Require event ownership, or throw error
 */
export async function requireEventOwnership(eventId: string): Promise<string> {
  const userId = await requireAuth()
  const owns = await userOwnsEvent(userId, eventId)
  if (!owns) {
    throw new Error("Forbidden: You don't own this event")
  }
  return userId
}

