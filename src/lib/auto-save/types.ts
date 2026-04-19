export type AutoSaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export interface AutoSaveDraft<T = unknown> {
  data: T;
  savedAt: number; // epoch ms
  scopeKey: string;
}

export interface AutoSaveConfig<T = unknown> {
  /** Logical namespace, e.g. 'marks', 'attendance', 'fees', 'students' */
  namespace: string;
  /**
   * Sub-key that uniquely identifies the form scope
   * (e.g. assessment+subject+class for marks, or date+class for attendance).
   * Drafts are stored per scopeKey so they never cross-contaminate.
   */
  scopeKey: string;
  /** Function that performs the actual save. Should throw on failure. */
  save: (data: T) => Promise<void>;
  /** Auto-save interval while dirty (default 30s) */
  intervalMs?: number;
  /** Idle debounce after last change (default 10s) */
  idleMs?: number;
  /** Whether persistence to localStorage is enabled (default true) */
  persistDrafts?: boolean;
  /** Optional listener for status changes */
  onStatusChange?: (status: AutoSaveStatus) => void;
  /** Optional listener for lastSavedAt updates */
  onSaved?: (savedAt: number) => void;
}
