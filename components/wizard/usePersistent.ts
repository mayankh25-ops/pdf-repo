"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * A small localStorage-backed store that hydrates safely: the server render
 * uses the fallback, the client snapshot reads the saved value, and updates
 * notify every subscribed component.
 */
interface Store {
  value: string;
  read: boolean;
  listeners: Set<() => void>;
}

const stores = new Map<string, Store>();

const writeStore = (key: string, value: string) => {
  const store = stores.get(key);
  if (!store) return;
  store.value = value;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private browsing */
  }
  store.listeners.forEach((listener) => listener());
};

const getStore = (key: string, fallback: string): Store => {
  let store = stores.get(key);
  if (!store) {
    store = { value: fallback, read: false, listeners: new Set() };
    stores.set(key, store);
  }
  if (!store.read && typeof window !== "undefined") {
    store.read = true;
    const saved = window.localStorage.getItem(key);
    if (saved !== null) store.value = saved;
  }
  return store;
};

export function usePersistent(key: string, fallback: string): [string, (v: string) => void] {
  const store = getStore(key, fallback);
  const value = useSyncExternalStore(
    useCallback(
      (onChange: () => void) => {
        store.listeners.add(onChange);
        return () => store.listeners.delete(onChange);
      },
      [store],
    ),
    () => store.value,
    () => fallback,
  );
  const set = useCallback((v: string) => writeStore(key, v), [key]);
  return [value, set];
}
