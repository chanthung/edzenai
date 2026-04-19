import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AutoSaveManager } from "@/lib/auto-save/AutoSaveManager";
import type { AutoSaveConfig, AutoSaveDraft, AutoSaveStatus } from "@/lib/auto-save/types";

export interface UseAutoSaveOptions<T> extends Omit<AutoSaveConfig<T>, "onStatusChange" | "onSaved"> {
  /**
   * Server-side last-saved timestamp (ms). When a localStorage draft is newer
   * than this, the recovery banner becomes available via `pendingDraft`.
   */
  serverLastSavedAt?: number | null;
}

export interface UseAutoSaveReturn<T> {
  status: AutoSaveStatus;
  lastSavedAt: number | null;
  /** Call whenever form data changes. */
  markDirty: (data: T) => void;
  /** Manual Save handler. Cancels timers and saves immediately. */
  manualSave: () => Promise<void>;
  /** Force a save now (e.g. before navigation). */
  flush: () => Promise<void>;
  /** Mark as saved without running save (e.g. when an external save completed). */
  markSaved: () => void;
  /** A draft newer than the server snapshot, if any. Null once dismissed/restored. */
  pendingDraft: AutoSaveDraft<T> | null;
  dismissDraft: () => void;
  restoreDraft: () => AutoSaveDraft<T> | null;
}

/**
 * React hook wrapping AutoSaveManager. Re-instantiates when namespace/scopeKey changes.
 */
export function useAutoSave<T>(opts: UseAutoSaveOptions<T>): UseAutoSaveReturn<T> {
  const { namespace, scopeKey, serverLastSavedAt } = opts;
  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const [pendingDraft, setPendingDraft] = useState<AutoSaveDraft<T> | null>(null);
  const managerRef = useRef<AutoSaveManager<T> | null>(null);

  // Keep latest save fn in a ref so we don't recreate the manager every render.
  const saveRef = useRef(opts.save);
  saveRef.current = opts.save;

  useEffect(() => {
    if (!scopeKey) return;
    const manager = new AutoSaveManager<T>({
      namespace,
      scopeKey,
      intervalMs: opts.intervalMs,
      idleMs: opts.idleMs,
      persistDrafts: opts.persistDrafts,
      save: (data) => saveRef.current(data),
      onStatusChange: setStatus,
      onSaved: setLastSavedAt,
    });
    managerRef.current = manager;

    // Check for a recoverable draft
    const draft = manager.readDraft();
    if (draft && (!serverLastSavedAt || draft.savedAt > serverLastSavedAt)) {
      setPendingDraft(draft);
    } else if (draft) {
      // Stale draft — clear it silently.
      manager.clearDraft();
    }

    return () => {
      manager.destroy();
      managerRef.current = null;
      setStatus("idle");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [namespace, scopeKey]);

  const markDirty = useCallback((data: T) => {
    managerRef.current?.markDirty(data);
  }, []);

  const manualSave = useCallback(async () => {
    await managerRef.current?.manualSave();
  }, []);

  const flush = useCallback(async () => {
    await managerRef.current?.flush();
  }, []);

  const markSaved = useCallback(() => {
    managerRef.current?.markSaved();
  }, []);

  const dismissDraft = useCallback(() => {
    managerRef.current?.clearDraft();
    setPendingDraft(null);
  }, []);

  const restoreDraft = useCallback(() => {
    const draft = pendingDraft;
    setPendingDraft(null);
    return draft;
  }, [pendingDraft]);

  return useMemo(
    () => ({
      status,
      lastSavedAt,
      markDirty,
      manualSave,
      flush,
      markSaved,
      pendingDraft,
      dismissDraft,
      restoreDraft,
    }),
    [status, lastSavedAt, markDirty, manualSave, flush, markSaved, pendingDraft, dismissDraft, restoreDraft],
  );
}
