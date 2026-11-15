"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUpRight, Plus, RotateCcw, Search, X } from "lucide-react";
import { GROUP_LINK, OWNER_LABEL, ROLES, STAGES, plan, sectionOf, type Owner, type Role, type StageId } from "@/lib/plan";
import { allTaskViews, daysBetween, formatDate, isMine, progress, todayISO, useStore } from "@/lib/store";
import ProgressRing from "./ProgressRing";
import TaskItem from "./TaskItem";

type Scope = "mine" | "all";
type Filter = "open" | "done" | "all";

export default function PlanView({ role }: { role: Role }) {
  const { state, ready, addTask, restoreTasks } = useStore();
  const me = ROLES[role].owner;
  const [stage, setStage] = useState<StageId>("prewedding");
  const [scope, setScope] = useState<Scope>("mine");
  const [filter, setFilter] = useState<Filter>("open");
  const [q, setQ] = useState("");
  // Công việc được mở sẵn chi tiết (vừa tạo / vừa nhân bản)
  const [openId, setOpenId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<{ title: string; group: string; owner: Owner; due: string }>({
    title: "",
    group: "",
    owner: me,
    due: "",
  });
  const titleRef = useRef<HTMLInputElement>(null);

  // Ghi nhớ giai đoạn đang xem cho từng vai trò (chỉ là tiện ích, lỗi thì bỏ qua)
  const key = `wp-stage-${role}`;
  useEffect(() => {
    try {
      const v = window.sessionStorage.getItem(key) as StageId | null;
      if (v && STAGES.some((s) => s.id === v)) setStage(v);
    } catch {}
  }, [key]);
  const pickStage = (s: StageId) => {
    setStage(s);
    try {
      window.sessionStorage.setItem(key, s);
    } catch {}
  };

  const all = useMemo(() => allTaskViews(state), [state]);
  const scoped = useMemo(() => (scope === "mine" ? all.filter((t) => isMine(t, me)) : all), [all, scope, me]);
  const mine = useMemo(() => all.filter((t) => isMine(t, me)), [all, me]);
  const overall = progress(mine);
  const overdue = mine.filter((t) => t.reminder === "overdue").length;
  const soon = mine.filter((t) => t.reminder === "soon").length;
  const openCount = mine.filter((t) => t.status === "todo" || t.status === "doing").length;

  const name = role === "co-dau" ? state.settings.brideName : state.settings.groomName;
  const wedding = state.settings.dates.lecuoi;
  const daysLeft = wedding ? daysBetween(todayISO(), wedding) : null;
  const current = STAGES.find((s) => s.id === stage)!;

  const visible = scoped.filter((t) => {
    if (t.stage !== stage) return false;
    if (filter === "open" && (t.status === "done" || t.status === "na")) return false;
    if (filter === "done" && t.status !== "done" && t.status !== "na") return false;
    if (q && !t.title.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  const groups = useMemo(() => {
    const m = new Map<string, typeof visible>();
    for (const t of visible) m.set(t.group, [...(m.get(t.group) ?? []), t]);
    return [...m.entries()];
  }, [visible]);

  // Nhóm gợi ý khi thêm việc: mọi nhóm đang có ở giai đoạn này
  const stageGroups = useMemo(
    () => [...new Set(all.filter((t) => t.stage === stage).map((t) => t.group))],
    [all, stage],
  );

  // Việc có sẵn đã xoá ở giai đoạn này (khôi phục được)
  const removedHere = useMemo(
    () => plan.tasks.filter((t) => t.stage === stage && state.removedTasks.includes(t.id)),
    [state.removedTasks, stage],
  );

  // Hiện công việc vừa tạo / nhân bản dù bộ lọc hiện tại đang ẩn nó
  const unhide = () => {
    if (filter === "done") setFilter("open");
    setQ("");
  };
  const reveal = (id: string) => {
    setOpenId(id);
    unhide();
  };

  const openForm = (group?: string) => {
    setDraft((d) => ({ ...d, group: group ?? (d.group || stageGroups[0] || "Việc khác") }));
    setAdding(true);
    setTimeout(() => titleRef.current?.focus(), 0);
  };

  const submitTask = (e: React.FormEvent) => {
    e.preventDefault();
    const title = draft.title.trim();
    if (!title) return titleRef.current?.focus();
    addTask(
      { stage, group: draft.group.trim() || "Việc khác", title, milestone: "", note: "", owner: draft.owner },
      draft.due ? { due: draft.due } : undefined,
    );
    if (scope === "mine" && draft.owner !== "both" && draft.owner !== me) setScope("all");
    unhide();
    setDraft((d) => ({ ...d, title: "", due: "" }));
    titleRef.current?.focus();
  };

  if (!ready) return <div className="skeleton" />;

  return (
    <>
      <section className="card hero">
        <div>
          <div className="eyebrow">Kế hoạch của {ROLES[role].label.toLowerCase()}</div>
          <h1>Chào {name || ROLES[role].label.toLowerCase()}!</h1>
          <p>
            {daysLeft !== null && daysLeft >= 0 ? (
              <>
                Còn <b>{daysLeft} ngày</b> đến lễ cưới ({formatDate(wedding)}).
              </>
            ) : daysLeft !== null ? (
              <>Lễ cưới đã diễn ra ngày {formatDate(wedding)}. Đừng quên các việc sau cưới.</>
            ) : (
              <>Hãy nhập ngày cưới ở nút Thiết lập (góc trên bên phải) để bắt đầu đếm ngược.</>
            )}
          </p>
          <div className="stats">
            <div className="stat">
              <b>{openCount}</b>
              <small>việc còn lại</small>
            </div>
            <div className={`stat ${overdue ? "danger" : ""}`}>
              <b>{overdue}</b>
              <small>quá hạn</small>
            </div>
            <div className={`stat ${soon ? "warn" : ""}`}>
              <b>{soon}</b>
              <small>đến hạn trong 7 ngày</small>
            </div>
          </div>
        </div>
        <ProgressRing pct={overall.pct} label={`${overall.done}/${overall.total} việc`} />
      </section>

      <div className="stages" role="tablist" aria-label="Giai đoạn">
        {STAGES.map((s, i) => {
          const p = progress(scoped.filter((t) => t.stage === s.id));
          const d = state.settings.dates[s.id];
          return (
            <button
              key={s.id}
              role="tab"
              aria-selected={stage === s.id}
              className={`stage ${stage === s.id ? "on" : ""}`}
              onClick={() => pickStage(s.id)}
            >
              <span className="num">0{i + 1}</span>
              <span className="nm">{s.name}</span>
              <span className="alias">{d ? formatDate(d) : s.alias ?? " "}</span>
              <div className="bar">
                <i style={{ width: `${p.pct}%` }} />
              </div>
              <span className="meta">
                <span>
                  {p.done}/{p.total} việc
                </span>
                <span>{p.pct}%</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="stage-intro">
        <div>
          <h2>
            {current.name}
            {current.alias ? <span className="muted" style={{ fontSize: 20 }}> · {current.alias}</span> : null}
          </h2>
          <p>{current.desc}</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="seg" role="group" aria-label="Phạm vi">
          <button className={scope === "mine" ? "on" : ""} onClick={() => setScope("mine")}>
            Việc của tôi
          </button>
          <button className={scope === "all" ? "on" : ""} onClick={() => setScope("all")}>
            Tất cả
          </button>
        </div>
        <div className="seg" role="group" aria-label="Lọc">
          <button className={filter === "open" ? "on" : ""} onClick={() => setFilter("open")}>
            Chưa xong
          </button>
          <button className={filter === "done" ? "on" : ""} onClick={() => setFilter("done")}>
            Đã xong
          </button>
          <button className={filter === "all" ? "on" : ""} onClick={() => setFilter("all")}>
            Tất cả
          </button>
        </div>
        <label className="search">
          <Search size={16} />
          <input className="input" placeholder="Tìm công việc…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        {!adding && (
          <button className="btn primary" onClick={() => openForm()}>
            <Plus size={16} /> Thêm công việc
          </button>
        )}
      </div>

      {adding && (
        <form className="card card-pad" onSubmit={submitTask} style={{ marginBottom: 16 }}>
          <div className="task-form">
            <label className="field grow">
              <span>Công việc mới · {current.name}</span>
              <input
                ref={titleRef}
                className="input"
                value={draft.title}
                placeholder="VD: Đặt xe đưa đón khách"
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                onKeyDown={(e) => e.key === "Escape" && setAdding(false)}
              />
            </label>
            <label className="field">
              <span>Nhóm</span>
              <input
                className="input"
                list="plan-groups"
                value={draft.group}
                placeholder="Chọn hoặc gõ nhóm mới"
                onChange={(e) => setDraft({ ...draft, group: e.target.value })}
              />
              <datalist id="plan-groups">
                {stageGroups.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </label>
            <label className="field">
              <span>Người phụ trách</span>
              <select
                className="select"
                value={draft.owner}
                onChange={(e) => setDraft({ ...draft, owner: e.target.value as Owner })}
              >
                {(["bride", "groom", "both"] as Owner[]).map((o) => (
                  <option key={o} value={o}>
                    {OWNER_LABEL[o]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Hạn chốt</span>
              <input
                type="date"
                className="input"
                value={draft.due}
                onChange={(e) => setDraft({ ...draft, due: e.target.value })}
              />
            </label>
            <div className="row" style={{ flexWrap: "nowrap" }}>
              <button className="btn primary" type="submit" style={{ height: 40 }}>
                <Plus size={16} /> Thêm
              </button>
              <button
                className="btn icon ghost"
                type="button"
                aria-label="Đóng form thêm công việc"
                onClick={() => setAdding(false)}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </form>
      )}

      {groups.length === 0 && (
        <div className="card empty">
          {filter === "open" ? "Tuyệt vời! Không còn việc nào chưa xong ở giai đoạn này." : "Không có công việc phù hợp."}
        </div>
      )}

      {groups.map(([group, tasks]) => {
        const sec = GROUP_LINK[group];
        const gAll = scoped.filter((t) => t.stage === stage && t.group === group);
        const p = progress(gAll);
        return (
          <section className="card group" key={group}>
            <div className="group-head">
              <h3>{group}</h3>
              <span className="count">
                {p.done}/{p.total} xong
              </span>
              {sec && (
                <Link className="link" href={`/${role}/${sec}/`}>
                  {sectionOf(sec).short} <ArrowUpRight size={14} />
                </Link>
              )}
              <button
                className="btn icon ghost sm group-add"
                onClick={() => openForm(group)}
                aria-label={`Thêm công việc vào nhóm ${group}`}
                title="Thêm công việc vào nhóm này"
              >
                <Plus size={16} />
              </button>
            </div>
            {tasks.map((t) => (
              <TaskItem key={t.id} task={t} role={role} defaultOpen={openId === t.id} onReveal={reveal} />
            ))}
          </section>
        );
      })}

      {removedHere.length > 0 && (
        <details className="card group removed">
          <summary className="group-head">
            <h3>Đã xoá</h3>
            <span className="count">{removedHere.length} việc có sẵn ở giai đoạn này</span>
            <button
              type="button"
              className="btn sm"
              style={{ marginLeft: "auto" }}
              onClick={(e) => {
                e.preventDefault();
                restoreTasks(removedHere.map((t) => t.id));
              }}
            >
              <RotateCcw size={14} /> Khôi phục tất cả
            </button>
          </summary>
          {removedHere.map((t) => (
            <div className="guest-row" key={t.id}>
              <div style={{ minWidth: 0 }}>
                <div className="task-title">{state.tasks[t.id]?.title || t.title}</div>
                <div className="task-meta">
                  <span className="chip">{t.group}</span>
                </div>
              </div>
              <button className="btn sm" onClick={() => restoreTasks([t.id])}>
                <RotateCcw size={14} /> Khôi phục
              </button>
            </div>
          ))}
        </details>
      )}
    </>
  );
}
