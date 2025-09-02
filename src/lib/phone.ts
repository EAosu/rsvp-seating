// נירמול טלפון: מסיר תווים לא-ספרתיים, מתקן IL, ותומך באיבוד '0' באקסל
export function canonPhone(input: string) {
    const digits = (input || "").replace(/\D/g, "")
    if (digits.length === 10 && digits.startsWith("0")) return "972" + digits.slice(1) // 05X -> 9725X
    if (digits.length === 9 && digits.startsWith("5")) return "972" + digits          // אקסל בלע את ה-0
    return digits
}

export function samePhone(a?: string | null, b?: string | null) {
    if (!a || !b) return false
    return canonPhone(a) === canonPhone(b)
}
