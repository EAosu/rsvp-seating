type Subscriber = (data: any) => void
const channels = new Map<string, Set<Subscriber>>()

export function subscribe(eventId: string, cb: Subscriber) {
  const set = channels.get(eventId) ?? new Set<Subscriber>()
  set.add(cb)
  channels.set(eventId, set)
  return () => { set.delete(cb) }
}

export function publish(eventId: string, data: any) {
  const set = channels.get(eventId)
  if (!set) return
  for (const cb of set) cb(data)
}
