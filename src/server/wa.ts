export async function sendRsvpQuick(toE164: string, data: {
    guestName: string
    businessName: string
    eventTitle: string
    eventDate: string
}) {
    const phoneId = process.env.WA_PHONE_NUMBER_ID!
    const tokenApi = process.env.WA_ACCESS_TOKEN!
    const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`

    const bodyParams = [data.guestName, data.businessName, data.eventTitle, data.eventDate]
        .map(t => ({ type: "text", text: t }))

    const res = await fetch(url, {
        method: "POST",
        headers: { "Authorization": `Bearer ${tokenApi}`, "Content-Type": "application/json" },
        body: JSON.stringify({
            messaging_product: "whatsapp",
            to: toE164,
            type: "template",
            template: {
                name: "rsvp_inv_heb",
                language: { code: "he" },
                components: [
                    { type: "body", parameters: bodyParams }
                    // שים לב: אין header ואין button-URL כאן; הלחצנים באים מהתבנית עצמה
                ]
            }
        })
    })

    if (!res.ok) throw new Error(`WA send failed: ${res.status} ${await res.text()}`)
    return res.json()
}
