/**
 * WhatsApp utility functions for RSVP flow
 */

export interface WhatsAppMessageParams {
  guestName: string
  eventName: string
  eventDate: Date
  venue?: string | null
}

/**
 * Generates a WhatsApp message for RSVP invitation
 */
export function generateWhatsAppMessage({
  guestName,
  eventName,
  eventDate,
  venue,
}: WhatsAppMessageParams): string {
  const dateStr = new Date(eventDate).toLocaleDateString("he-IL", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const venueStr = venue ? ` ב-${venue}` : ""

  return `שלום ${guestName}, זה הזמנה ל${eventName} בתאריך ${dateStr}${venueStr}. האם תגיע/י? אם כן, עם כמה אנשים כולל אותך?`
}

/**
 * Creates a WhatsApp deep link URL
 * @param phoneNumber Phone number in international format (e.g., 972501234567)
 * @param message Pre-filled message text
 */
export function createWhatsAppDeepLink(
  phoneNumber: string,
  message: string
): string {
  // Remove any non-digit characters
  const cleanPhone = phoneNumber.replace(/\D/g, "")

  // Ensure phone number starts with country code (assume Israel if starts with 0)
  const formattedPhone = cleanPhone.startsWith("0")
    ? `972${cleanPhone.slice(1)}`
    : cleanPhone.startsWith("972")
    ? cleanPhone
    : `972${cleanPhone}`

  // Encode message for URL
  const encodedMessage = encodeURIComponent(message)

  // WhatsApp Web/App deep link format
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`
}

/**
 * Opens WhatsApp message in new window/tab
 */
export function openWhatsAppMessage(phoneNumber: string, message: string) {
  const url = createWhatsAppDeepLink(phoneNumber, message)
  window.open(url, "_blank", "noopener,noreferrer")
}

