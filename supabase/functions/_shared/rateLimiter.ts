// In-Memory-Rate-Limiter für fehlgeschlagene Passwortversuche.
//
// Schutz gegen Brute-Force auf ADMIN_PASSWORD: pro Client-IP sind maximal
// MAX_FAILURES Fehlversuche im Zeitfenster erlaubt, danach 429. Der Zustand
// lebt pro Edge-Function-Instanz — das ist kein perfekter verteilter
// Limiter, drosselt aber jeden realistischen Brute-Force-Versuch massiv.

const WINDOW_MS = 15 * 60 * 1000 // 15 Minuten
const MAX_FAILURES = 5

const failures = new Map<string, number[]>()

export function getClientIp(req: Request): string {
    return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
        ?? req.headers.get('cf-connecting-ip')
        ?? 'unknown'
}

/** true = blockiert (zu viele Fehlversuche im Zeitfenster) */
export function isRateLimited(ip: string): boolean {
    const now = Date.now()
    const recent = (failures.get(ip) ?? []).filter(t => now - t < WINDOW_MS)
    failures.set(ip, recent)
    return recent.length >= MAX_FAILURES
}

export function recordFailedAttempt(ip: string): void {
    const now = Date.now()
    const recent = (failures.get(ip) ?? []).filter(t => now - t < WINDOW_MS)
    recent.push(now)
    failures.set(ip, recent)

    // Map nicht unbegrenzt wachsen lassen
    if (failures.size > 10000) {
        failures.clear()
    }
}

export function clearFailedAttempts(ip: string): void {
    failures.delete(ip)
}
