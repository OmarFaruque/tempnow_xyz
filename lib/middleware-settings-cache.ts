// Edge middleware instances do not share memory. Each warm instance keeps a
// short-lived snapshot; cold instances and expired snapshots fetch again.
export function createMiddlewareSettingsCache<T>(ttlMs: number) {
  let cached: { origin: string; value: T; expiresAt: number } | undefined
  let pending: { origin: string; promise: Promise<T> } | undefined

  return async (origin: string, load: () => Promise<T>): Promise<T> => {
    if (cached?.origin === origin && Date.now() < cached.expiresAt) return cached.value
    if (pending?.origin === origin) return pending.promise

    const promise = load().then((value) => {
      // Do not let an older, slower request overwrite a newer one.
      if (pending?.promise === promise) cached = { origin, value, expiresAt: Date.now() + ttlMs }
      return value
    }).finally(() => {
      if (pending?.promise === promise) pending = undefined
    })
    pending = { origin, promise }
    return promise
  }
}