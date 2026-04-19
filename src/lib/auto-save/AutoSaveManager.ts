import type { AutoSaveConfig, AutoSaveDraft, AutoSaveStatus } from "./types";

const STORAGE_PREFIX = "edzen:autosave";

function storageKey(namespace: string, scopeKey: string) {
  return `${STORAGE_PREFIX}:${namespace}:${scopeKey}`;
}

/**
 * Framework-agnostic auto-save manager.
 *
 * Lifecycle per instance:
 *   - markDirty(data)  → starts the 30s interval and 10s idle debounce
 *   - flush()          → forces a save now (used on tab hide / unload / nav)
 *   - manualSave()     → cancels timers, saves, sets state to 'saved'
 *   - destroy()        → clears timers + listeners
 *
 * Drafts are persisted to localStorage on every markDirty so we can offer
 * recovery later. They are cleared on successful save.
 */
export class AutoSaveManager<T = unknown> {
  private config: Required<Omit<AutoSaveConfig<T>, "onStatusChange" | "onSaved">> & {
    onStatusChange?: (status: AutoSaveStatus) => void;
    onSaved?: (savedAt: number) => void;
  };
  private status: AutoSaveStatus = "idle";
  private currentData: T | null = null;
  private intervalTimer: ReturnType<typeof setInterval> | null = null;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private lastSavedAt: number | null = null;
  private destroyed = false;
  private boundVisibility: () => void;
  private boundBeforeUnload: () => void;

  constructor(config: AutoSaveConfig<T>) {
    this.config = {
      intervalMs: 30_000,
      idleMs: 10_000,
      persistDrafts: true,
      ...config,
    };

    this.boundVisibility = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") {
        void this.flush();
      }
    };
    this.boundBeforeUnload = () => {
      // Best-effort synchronous draft persistence; the async save may not complete
      // but the localStorage draft ensures recovery on next load.
      this.persistDraft();
    };

    if (typeof window !== "undefined") {
      document.addEventListener("visibilitychange", this.boundVisibility);
      window.addEventListener("beforeunload", this.boundBeforeUnload);
    }
  }

  getStatus(): AutoSaveStatus {
    return this.status;
  }

  getLastSavedAt(): number | null {
    return this.lastSavedAt;
  }

  /** Call whenever form data changes. */
  markDirty(data: T) {
    if (this.destroyed) return;
    this.currentData = data;
    this.persistDraft();
    this.setStatus("dirty");

    // Idle debounce: save 10s after the last keystroke.
    if (this.idleTimer) clearTimeout(this.idleTimer);
    this.idleTimer = setTimeout(() => {
      void this.runSave();
    }, this.config.idleMs);

    // Periodic interval: ensure we save at least every 30s while dirty.
    if (!this.intervalTimer) {
      this.intervalTimer = setInterval(() => {
        if (this.status === "dirty") void this.runSave();
      }, this.config.intervalMs);
    }
  }

  /** Force an immediate save (used on tab switch / nav-away). */
  async flush(): Promise<void> {
    if (this.status === "dirty") {
      await this.runSave();
    }
  }

  /** Called by the manual Save button. Cancels timers, saves immediately. */
  async manualSave(): Promise<void> {
    this.clearTimers();
    if (this.currentData !== null) {
      await this.runSave({ silent: false });
    } else {
      // Nothing locally dirty — just confirm a saved state.
      this.markSaved();
    }
  }

  /** Mark as saved without running a save (e.g. external save just happened). */
  markSaved() {
    this.lastSavedAt = Date.now();
    this.config.onSaved?.(this.lastSavedAt);
    this.clearDraft();
    this.setStatus("saved");
  }

  /** Read any persisted draft for this scope. */
  readDraft(): AutoSaveDraft<T> | null {
    if (!this.config.persistDrafts || typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(storageKey(this.config.namespace, this.config.scopeKey));
      if (!raw) return null;
      return JSON.parse(raw) as AutoSaveDraft<T>;
    } catch {
      return null;
    }
  }

  clearDraft() {
    if (!this.config.persistDrafts || typeof window === "undefined") return;
    try {
      localStorage.removeItem(storageKey(this.config.namespace, this.config.scopeKey));
    } catch {
      /* ignore */
    }
  }

  destroy() {
    this.destroyed = true;
    this.clearTimers();
    if (typeof window !== "undefined") {
      document.removeEventListener("visibilitychange", this.boundVisibility);
      window.removeEventListener("beforeunload", this.boundBeforeUnload);
    }
  }

  // ───── internals ─────

  private async runSave(_opts?: { silent?: boolean }) {
    if (this.destroyed || this.currentData === null) return;
    const dataSnapshot = this.currentData;
    this.setStatus("saving");
    try {
      await this.config.save(dataSnapshot);
      this.lastSavedAt = Date.now();
      this.config.onSaved?.(this.lastSavedAt);
      this.clearDraft();
      // If no further edits happened during save, mark saved.
      if (this.currentData === dataSnapshot) {
        this.setStatus("saved");
        this.clearTimers();
      } else {
        // Edits arrived during save — stay dirty so timers keep running.
        this.setStatus("dirty");
      }
    } catch {
      // Silent failure — keep draft in localStorage and retry on next tick.
      this.setStatus("error");
      // Drop quietly back to "dirty" so the user sees an unsaved indicator
      // rather than an alarming error state.
      setTimeout(() => {
        if (this.status === "error") this.setStatus("dirty");
      }, 1500);
    }
  }

  private persistDraft() {
    if (!this.config.persistDrafts || typeof window === "undefined") return;
    if (this.currentData === null) return;
    try {
      const draft: AutoSaveDraft<T> = {
        data: this.currentData,
        savedAt: Date.now(),
        scopeKey: this.config.scopeKey,
      };
      localStorage.setItem(
        storageKey(this.config.namespace, this.config.scopeKey),
        JSON.stringify(draft),
      );
    } catch {
      /* quota / serialization errors — ignore */
    }
  }

  private setStatus(next: AutoSaveStatus) {
    if (this.status === next) return;
    this.status = next;
    this.config.onStatusChange?.(next);
  }

  private clearTimers() {
    if (this.intervalTimer) {
      clearInterval(this.intervalTimer);
      this.intervalTimer = null;
    }
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
  }
}
