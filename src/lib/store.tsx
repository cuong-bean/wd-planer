"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { plan, type Owner, type StageId, type Status, type Task } from "./plan";
import seedGuests from "@/data/guests.json";

const STORAGE_KEY = "wedding-planner-v1";

/** Tăng số này khi thêm đợt khách mới vào `src/data/guests.json` để nạp lại các khách còn thiếu */
const GUEST_SEED_VERSION = 1;

export interface TaskState {
  status?: Status;
  owner?: Owner;
  due?: string; // yyyy-mm-dd
  note?: string;
}

/** Công việc do người dùng tạo mới hoặc nhân bản */
export interface CustomTask extends Task {
  /** Hiển thị ngay sau công việc này (dùng cho bản sao) */
  after?: string;
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
  customTasks: CustomTask[];
  /** Id các công việc có sẵn đã bị xoá (ẩn đi, khôi phục được) */
  removedTasks: string[];
  items: Record<string, ItemState>;
  guests: Guest[];
  /** Phiên bản danh sách khách mặc định đã được nạp (khách bị xoá sẽ không bị nạp lại) */
  guestSeed?: number;
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
  customTasks: [],
  removedTasks: [],
  items: {},
  guests: [],
});

function normalize(input: unknown): PlannerState | null {
  if (!input || typeof input !== "object") return null;
  const s = input as Partial<PlannerState>;
  const base = emptyState();
  let guests: Guest[] = Array.isArray(s.guests) ? s.guests : [];
  if ((s.guestSeed ?? 0) < GUEST_SEED_VERSION) {
    const have = new Set(guests.map((g) => g.id));
    guests = [...guests, ...(seedGuests as Guest[]).filter((g) => !have.has(g.id))];
  }
  return {
    version: 1,
    settings: {
      ...base.settings,
      ...(s.settings ?? {}),
      dates: { ...base.settings.dates, ...(s.settings?.dates ?? {}) },
    },
    tasks: s.tasks && typeof s.tasks === "object" ? s.tasks : {},
    customTasks: Array.isArray(s.customTasks)
      ? s.customTasks.filter((t) => t && typeof t.id === "string" && typeof t.title === "string")
      : [],
    removedTasks: Array.isArray(s.removedTasks) ? s.removedTasks.filter((id) => typeof id === "string") : [],
    items: s.items && typeof s.items === "object" ? s.items : {},
    guests,
    guestSeed: GUEST_SEED_VERSION,
    updatedAt: s.updatedAt,
  };
}

interface StoreApi {
  state: PlannerState;
  ready: boolean;
  updateTask: (id: string, patch: TaskState) => void;
  /** Tạo công việc mới, trả về id */
  addTask: (t: Omit<CustomTask, "id">, init?: TaskState) => string;
  /** Nhân bản một công việc (có sẵn hoặc tự tạo), trả về id bản sao */
  duplicateTask: (id: string) => string | null;
  editCustomTask: (id: string, patch: Partial<Omit<CustomTask, "id">>) => void;
  /** Xoá công việc: việc tự thêm bị xoá hẳn, việc có sẵn được ẩn đi (khôi phục được) */
  removeTask: (id: string) => void;
  restoreTasks: (ids: string[]) => void;
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
  const [state, setState] = useState<PlannerState>(() => normalize({})!);
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

  const addTask = useCallback((t: Omit<CustomTask, "id">, init?: TaskState) => {
    const id = newTaskId();
    setState((s) =>
      touch({
        ...s,
        customTasks: [...s.customTasks, { ...t, id }],
        tasks: init ? { ...s.tasks, [id]: init } : s.tasks,
      }),
    );
    return id;
  }, []);

  const duplicateTask = useCallback(
    (id: string) => {
      const src = findTask(state, id);
      if (!src) return null;
      const st = state.tasks[id] ?? {};
      const { id: _old, after: _after, ...def } = src as CustomTask;
      // Bản sao giữ người phụ trách, hạn và ghi chú; trạng thái quay về "Chưa bắt đầu"
      return addTask(
        { ...def, title: `${src.title} (bản sao)`, after: id },
        { owner: st.owner, due: st.due, note: st.note },
      );
    },
    [state, addTask],
  );

  const editCustomTask = useCallback((id: string, patch: Partial<Omit<CustomTask, "id">>) => {
    setState((s) => touch({ ...s, customTasks: s.customTasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) }));
  }, []);

  const removeTask = useCallback((id: string) => {
    setState((s) => {
      if (plan.tasks.some((t) => t.id === id)) {
        // Việc có sẵn: chỉ ẩn, giữ nguyên trạng thái/ghi chú để khôi phục
        return s.removedTasks.includes(id) ? s : touch({ ...s, removedTasks: [...s.removedTasks, id] });
      }
      const { [id]: _gone, ...tasks } = s.tasks;
      const removed = s.customTasks.find((t) => t.id === id);
      const customTasks = s.customTasks
        .filter((t) => t.id !== id)
        // Bản sao của việc bị xoá chuyển lên vị trí của việc đó
        .map((t) => (t.after === id ? { ...t, after: removed?.after } : t));
      return touch({ ...s, tasks, customTasks });
    });
  }, []);

  const restoreTasks = useCallback((ids: string[]) => {
    setState((s) => touch({ ...s, removedTasks: s.removedTasks.filter((id) => !ids.includes(id)) }));
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

  const reset = useCallback(() => setState(normalize({})!), []);

  const api = useMemo(
    () => ({
      state,
      ready,
      updateTask,
      addTask,
      duplicateTask,
      editCustomTask,
      removeTask,
      restoreTasks,
      updateItem,
      updateSettings,
      addGuest,
      updateGuest,
      removeGuest,
      importState,
      reset,
    }),
    [
      state,
      ready,
      updateTask,
      addTask,
      duplicateTask,
      editCustomTask,
      removeTask,
      restoreTasks,
      updateItem,
      updateSettings,
      addGuest,
      updateGuest,
      removeGuest,
      importState,
      reset,
    ],
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
  /** true nếu là công việc người dùng tự tạo / nhân bản (được sửa tên, xoá) */
  custom: boolean;
}

function newTaskId() {
  return `CV${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`.toUpperCase();
}

function findTask(s: PlannerState, id: string): Task | undefined {
  return plan.tasks.find((t) => t.id === id) ?? s.customTasks.find((t) => t.id === id);
}

/** Ghép công việc có sẵn với công việc tự tạo; bản sao nằm ngay sau công việc gốc */
export function allTasks(s: PlannerState): Task[] {
  const ids = new Set([...plan.tasks, ...s.customTasks].map((t) => t.id));
  const children = new Map<string, CustomTask[]>();
  const tail: CustomTask[] = [];
  for (const c of s.customTasks) {
    if (c.after && c.after !== c.id && ids.has(c.after)) children.set(c.after, [...(children.get(c.after) ?? []), c]);
    else tail.push(c);
  }
  const removed = new Set(s.removedTasks);
  const out: Task[] = [];
  const seen = new Set<string>();
  const visit = (t: Task) => {
    if (seen.has(t.id)) return;
    seen.add(t.id);
    // Việc có sẵn đã xoá thì ẩn, nhưng các bản sao của nó vẫn giữ đúng vị trí
    if (!removed.has(t.id)) out.push(t);
    for (const c of children.get(t.id) ?? []) visit(c);
  };
  plan.tasks.forEach(visit);
  tail.forEach(visit);
  // Phòng dữ liệu nhập vào bị vòng lặp `after`
  for (const c of s.customTasks) visit(c);
  return out;
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
  const custom = !plan.tasks.some((p) => p.id === t.id);
  return { ...t, owner: st.owner ?? t.owner, status, due, userNote: st.note ?? "", reminder, custom };
}

export function allTaskViews(s: PlannerState) {
  const today = todayISO();
  return allTasks(s).map((t) => viewTask(t, s, today));
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
