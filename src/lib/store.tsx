"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { plan, type Owner, type StageId, type Status, type Task } from "./plan";

const STORAGE_KEY = "wedding-planner-v1";

export interface TaskState {
  status?: Status;
  owner?: Owner;
  due?: string; // yyyy-mm-dd
  note?: string;
}

/** Trạng thái chung cho mọi mục ở các trang thông tin (nghi lễ, ngân sách, NCC, ...) */
export type ItemState = { status?: Status } & Record<string, string | undefined>;

export type GuestSide = "bride" | "groom";
export type Rsvp = "pending" | "yes" | "no";

export interface Guest {
  id: string;
  name: string;
  side: GuestSide;
  session: string;
  group: string;
  invited: number;
  confirmed?: number;
  phone?: string;
  rsvp: Rsvp;
  note?: string;
}

export interface Settings {
  brideName: string;
  groomName: string;
  budgetMax: string;
  dates: Record<StageId, string>;
}

export interface PlannerState {
  version: 1;
  settings: Settings;
  tasks: Record<string, TaskState>;
  items: Record<string, ItemState>;
  guests: Guest[];
  updatedAt?: string;
}

export const emptyState = (): PlannerState => ({
  version: 1,
  settings: {
    brideName: "",
    groomName: "",
    budgetMax: "",
    dates: { prewedding: "", damngo: "", anhoi: "", lecuoi: "" },
  },
  tasks: {},
  items: {},
  guests: [],
});

function normalize(input: unknown): PlannerState | null {
  if (!input || typeof input !== "object") return null;
  const s = input as Partial<PlannerState>;
  const base = emptyState();
  return {
    version: 1,
    settings: {
      ...base.settings,
      ...(s.settings ?? {}),
      dates: { ...base.settings.dates, ...(s.settings?.dates ?? {}) },
    },
    tasks: s.tasks && typeof s.tasks === "object" ? s.tasks : {},
    items: s.items && typeof s.items === "object" ? s.items : {},
    guests: Array.isArray(s.guests) ? s.guests : [],
    updatedAt: s.updatedAt,
  };
}

interface StoreApi {
  state: PlannerState;
  ready: boolean;
  updateTask: (id: string, patch: TaskState) => void;
  updateItem: (id: string, patch: Partial<ItemState>) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  addGuest: (g: Omit<Guest, "id">) => void;
  updateGuest: (id: string, patch: Partial<Guest>) => void;
  removeGuest: (id: string) => void;
  importState: (data: unknown) => boolean;
  reset: () => void;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PlannerState>(emptyState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? normalize(JSON.parse(raw)) : null;
      if (parsed) setState(parsed);
    } catch {
      /* bộ nhớ trình duyệt không khả dụng – dùng dữ liệu mặc định */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* bỏ qua */
    }
  }, [state, ready]);

  const touch = (s: PlannerState): PlannerState => ({ ...s, updatedAt: new Date().toISOString() });

  const updateTask = useCallback((id: string, patch: TaskState) => {
    setState((s) => touch({ ...s, tasks: { ...s.tasks, [id]: { ...s.tasks[id], ...patch } } }));
  }, []);

  const updateItem = useCallback((id: string, patch: Partial<ItemState>) => {
    setState((s) => touch({ ...s, items: { ...s.items, [id]: { ...s.items[id], ...patch } as ItemState } }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((s) => touch({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const addGuest = useCallback((g: Omit<Guest, "id">) => {
    const id = `KM${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
    setState((s) => touch({ ...s, guests: [...s.guests, { ...g, id }] }));
  }, []);

  const updateGuest = useCallback((id: string, patch: Partial<Guest>) => {
    setState((s) => touch({ ...s, guests: s.guests.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
  }, []);

  const removeGuest = useCallback((id: string) => {
    setState((s) => touch({ ...s, guests: s.guests.filter((g) => g.id !== id) }));
  }, []);

  const importState = useCallback((data: unknown) => {
    const n = normalize(data);
    if (!n) return false;
    setState(n);
    return true;
  }, []);

  const reset = useCallback(() => setState(emptyState()), []);

  const api = useMemo(
    () => ({ state, ready, updateTask, updateItem, updateSettings, addGuest, updateGuest, removeGuest, importState, reset }),
    [state, ready, updateTask, updateItem, updateSettings, addGuest, updateGuest, removeGuest, importState, reset],
  );

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

/* ---------- Tiện ích ---------- */

export interface TaskView extends Task {
  status: Status;
  due: string;
  userNote: string;
  reminder: "overdue" | "soon" | "nodue" | "";
}

export function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

export function daysBetween(fromISO: string, toISO: string) {
  return Math.round((Date.parse(toISO) - Date.parse(fromISO)) / 86400000);
}

export function viewTask(t: Task, s: PlannerState, today = todayISO()): TaskView {
  const st = s.tasks[t.id] ?? {};
  const status = st.status ?? "todo";
  const due = st.due ?? "";
  let reminder: TaskView["reminder"] = "";
  if (status !== "done" && status !== "na") {
    if (!due) reminder = "nodue";
    else if (due < today) reminder = "overdue";
    else if (daysBetween(today, due) <= 7) reminder = "soon";
  }
  return { ...t, owner: st.owner ?? t.owner, status, due, userNote: st.note ?? "", reminder };
}

export function allTaskViews(s: PlannerState) {
  const today = todayISO();
  return plan.tasks.map((t) => viewTask(t, s, today));
}

export function progress(tasks: TaskView[]) {
  const active = tasks.filter((t) => t.status !== "na");
  const done = active.filter((t) => t.status === "done").length;
  return { done, total: active.length, pct: active.length ? Math.round((done / active.length) * 100) : 0 };
}

export function isMine(t: { owner: Owner }, me: Owner) {
  return t.owner === "both" || t.owner === me;
}

export function formatDate(iso: string) {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function money(v: number) {
  return new Intl.NumberFormat("vi-VN").format(Math.round(v)) + " đ";
}

export function num(v: string | undefined) {
  if (!v) return 0;
  const n = Number(String(v).replace(/[^\d-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
