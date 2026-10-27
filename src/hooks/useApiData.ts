'use client';
import { useCallback, useEffect, useState } from 'react';
import { AUTH_EVENT, readSession } from '@/services/backend/session';

const pending = new Map<string, Promise<unknown>>();
const invalidated = new WeakMap<Event, Set<string>>();
function dedupe<T>(key: string, load: () => Promise<T>): Promise<T> {
  const existing = pending.get(key);
  if (existing) return existing as Promise<T>;
  const task = load().finally(() => { if (pending.get(key) === task) pending.delete(key); });
  pending.set(key, task);
  return task;
}
// Share concurrent loads, discard responses from a previous account or unmounted screen.
export function useApiData<T>(key: string, load: () => Promise<T>, initial: T, event: string, refreshMs = 0) {
  const [state, setState] = useState({ data: initial, ready: false, error: '' });
  const [revision, setRevision] = useState(0);
  const retry = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    let generation = 0;
    let active = true;
    const sync = (event?: Event, background = false) => {
      const current = ++generation;
      const token = readSession()?.accessToken ?? '';
      if (event) {
        const keys = invalidated.get(event) ?? new Set<string>();
        const resource = `${key}:${token}`;
        if (!keys.has(resource)) { pending.delete(resource); keys.add(resource); }
        invalidated.set(event, keys);
      }
      if (!background) setState({ data: initial, ready: false, error: '' });
      dedupe(`${key}:${token}`, load).then((data) => {
        if (active && current === generation && (readSession()?.accessToken ?? '') === token) setState({ data, ready: true, error: '' });
      }).catch((cause) => {
        if (active && current === generation) setState({ data: initial, ready: true, error: cause instanceof Error ? cause.message : 'Không thể tải dữ liệu.' });
      });
    };
    const timer = window.setTimeout(sync, 0);
    const poll = refreshMs > 0 ? window.setInterval(() => sync(undefined, true), refreshMs) : undefined;
    const events = [AUTH_EVENT, event, 'storage'];
    events.forEach((name) => window.addEventListener(name, sync));
    return () => { active = false; generation++; window.clearTimeout(timer); window.clearInterval(poll); events.forEach((name) => window.removeEventListener(name, sync)); };
  }, [key, load, initial, event, revision, refreshMs]);
  return { ...state, retry };
}
