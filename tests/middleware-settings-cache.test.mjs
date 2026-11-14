import test from 'node:test'
import assert from 'node:assert/strict'
import { createMiddlewareSettingsCache } from '../lib/middleware-settings-cache.ts'

test('shares a snapshot and concurrent loads, then refreshes after expiry', async () => {
  const originalNow = Date.now
  let now = 1000
  Date.now = () => now
  try {
    const get = createMiddlewareSettingsCache(30_000)
    let calls = 0
    const load = async () => { calls++; return { version: calls } }
    const [a, b] = await Promise.all([get('https://example.com', load), get('https://example.com', load)])
    assert.deepEqual(a, b)
    assert.equal(calls, 1)
    assert.equal((await get('https://example.com', load)).version, 1)
    now += 30_000
    assert.equal((await get('https://example.com', load)).version, 2)
    assert.equal((await get('https://other.com', load)).version, 3)
  } finally { Date.now = originalNow }
})

test('does not cache failures', async () => {
  const get = createMiddlewareSettingsCache(30_000)
  await assert.rejects(get('https://example.com', async () => { throw new Error('offline') }))
  assert.equal(await get('https://example.com', async () => 'recovered'), 'recovered')
})

test('an older in-flight request cannot overwrite a newer origin', async () => {
  const get = createMiddlewareSettingsCache(30_000)
  let resolve
  const old = get('https://old.com', () => new Promise(r => { resolve = r }))
  await get('https://new.com', async () => 'new')
  resolve('old')
  await old
  assert.equal(await get('https://new.com', async () => 'unexpected'), 'new')
})