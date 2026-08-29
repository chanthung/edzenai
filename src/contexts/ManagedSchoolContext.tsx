import { useSyncExternalStore } from "react";

/**
 * Lightweight store holding the school a platform admin is currently managing.
 * Backed by localStorage so the selection survives refreshes.
 * No provider needed — safe to read from any hook.
 */
const STORAGE_KEY = "edzen.managedSchoolId";

const listeners = new Set<() => void>();

function read(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function setManagedSchoolId(id: string | null) {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  emit();
}

export function getManagedSchoolId(): string | null {
  return read();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}

export function useManagedSchoolId(): string | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
