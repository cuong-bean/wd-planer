"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowUpRight, CalendarClock, Check, ChevronDown, Minus } from "lucide-react";
import { GROUP_LINK, OWNER_LABEL, STATUS_LABEL, sectionOf, type Owner, type Role, type Status } from "@/lib/plan";
import { formatDate, useStore, type TaskView } from "@/lib/store";

export function StatusCheck({ status, onChange, label }: { status: Status; onChange: (s: Status) => void; label: string }) {
  const next: Status = status === "done" ? "todo" : "done";
  return (
    <button
      className={`check ${status}`}
      onClick={() => onChange(next)}
      aria-label={status === "done" ? `Bỏ đánh dấu hoàn thành: ${label}` : `Đánh dấu hoàn thành: ${label}`}
      title={STATUS_LABEL[status]}
    >
      {status === "done" && <Check size={14} strokeWidth={3} />}
      {status === "na" && <Minus size={14} />}
    </button>
  );
}

export default function TaskItem({ task, role, compact = false }: { task: TaskView; role: Role; compact?: boolean }) {
  const { updateTask } = useStore();
  const [open, setOpen] = useState(false);
  const section = GROUP_LINK[task.group];

  return (
    <div className={`task is-${task.status}`}>
      <div className="task-row">
        <StatusCheck status={task.status} label={task.title} onChange={(status) => updateTask(task.id, { status })} />
        <button className="task-main" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <div className="task-title">{task.title}</div>
          <div className="task-meta">
            <span className={`chip ${task.owner}`}>{OWNER_LABEL[task.owner]}</span>
            {!compact && task.milestone && <span className="chip">{task.milestone}</span>}
            {task.status === "doing" && <span className="chip doing">Đang làm</span>}
            {task.status === "na" && <span className="chip">Không áp dụng</span>}
            {task.due && (
              <span className={`chip ${task.reminder === "overdue" ? "overdue" : task.reminder === "soon" ? "soon" : ""}`}>
                <CalendarClock size={12} />
                {task.reminder === "overdue" ? "Quá hạn · " : ""}
                {formatDate(task.due)}
              </span>
            )}
          </div>
        </button>
        <button className={`chevron ${open ? "open" : ""}`} onClick={() => setOpen((o) => !o)} aria-label="Chi tiết">
          <ChevronDown size={18} />
        </button>
      </div>

      {open && (
        <div className="task-detail">
          {task.note && <div className="hint">{task.note}</div>}
          <div className="fields">
            <label className="field">
              <span>Trạng thái</span>
              <select
                className="select"
                value={task.status}
                onChange={(e) => updateTask(task.id, { status: e.target.value as Status })}
              >
                {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Hạn chốt</span>
              <input
                type="date"
                className="input"
                value={task.due}
                onChange={(e) => updateTask(task.id, { due: e.target.value })}
              />
            </label>
            <div className="field">
              <span>Người phụ trách</span>
              <div className="seg" role="group">
                {(["bride", "groom", "both"] as Owner[]).map((o) => (
                  <button key={o} className={task.owner === o ? "on" : ""} onClick={() => updateTask(task.id, { owner: o })}>
                    {OWNER_LABEL[o]}
                  </button>
                ))}
              </div>
            </div>
            <label className="field wide">
              <span>Ghi chú của bạn</span>
              <textarea
                className="textarea"
                value={task.userNote}
                placeholder="Liên hệ, chi phí, việc cần nhớ…"
                onChange={(e) => updateTask(task.id, { note: e.target.value })}
              />
            </label>
          </div>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <span className="muted" style={{ fontSize: 12 }}>
              {task.id} · {task.group}
              {task.milestone ? ` · Mốc gợi ý: ${task.milestone}` : ""}
            </span>
            {section && !compact && (
              <Link className="related" href={`/${role}/${section}/`}>
                Mở {sectionOf(section).short} <ArrowUpRight size={15} />
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
