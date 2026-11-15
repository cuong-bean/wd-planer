"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, CalendarClock, Check, ChevronDown, Copy, Minus, Trash2 } from "lucide-react";
import {
  GROUP_LINK,
  OWNER_LABEL,
  STAGES,
  STATUS_LABEL,
  sectionOf,
  type Owner,
  type Role,
  type StageId,
  type Status,
} from "@/lib/plan";
import { allTasks, formatDate, useStore, type TaskView } from "@/lib/store";

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

export default function TaskItem({
  task,
  role,
  compact = false,
  defaultOpen = false,
  onReveal,
}: {
  task: TaskView;
  role: Role;
  compact?: boolean;
  /** Mở sẵn phần chi tiết (VD vừa tạo / vừa nhân bản) */
  defaultOpen?: boolean;
  /** Yêu cầu danh sách mở sẵn công việc này (bản sao vừa tạo, hoặc việc vừa đổi nhóm) */
  onReveal?: (id: string) => void;
}) {
  const { state, updateTask, duplicateTask, editCustomTask, removeTask } = useStore();
  const [open, setOpen] = useState(defaultOpen);
  const section = GROUP_LINK[task.group];

  // Gợi ý nhóm: các nhóm đang có trong cùng giai đoạn
  const groupOptions = useMemo(
    () => (task.custom ? [...new Set(allTasks(state).filter((t) => t.stage === task.stage).map((t) => t.group))] : []),
    [state, task.custom, task.stage],
  );

  const [groupDraft, setGroupDraft] = useState(task.group);
  const commitGroup = () => {
    const g = groupDraft.trim();
    if (!g) return setGroupDraft(task.group);
    if (g !== task.group) {
      editCustomTask(task.id, { group: g });
      onReveal?.(task.id);
    }
  };

  const duplicate = () => {
    const id = duplicateTask(task.id);
    if (id) onReveal?.(id);
  };

  return (
    <div className={`task is-${task.status}`}>
      <div className="task-row">
        <StatusCheck status={task.status} label={task.title} onChange={(status) => updateTask(task.id, { status })} />
        <button className="task-main" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <div className="task-title">{task.title || <span className="muted">(Chưa đặt tên)</span>}</div>
          <div className="task-meta">
            <span className={`chip ${task.owner}`}>{OWNER_LABEL[task.owner]}</span>
            {task.custom && <span className="chip custom">Tự thêm</span>}
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
        <button
          className="btn icon ghost task-action"
          onClick={duplicate}
          aria-label={`Nhân bản: ${task.title}`}
          title="Nhân bản công việc"
        >
          <Copy size={15} />
        </button>
        <button className={`chevron ${open ? "open" : ""}`} onClick={() => setOpen((o) => !o)} aria-label="Chi tiết">
          <ChevronDown size={18} />
        </button>
      </div>

      {open && (
        <div className="task-detail">
          {task.note && <div className="hint">{task.note}</div>}
          {task.custom && (
            <div className="fields">
              <label className="field wide">
                <span>Tên công việc</span>
                <input
                  className="input"
                  value={task.title}
                  autoFocus={defaultOpen}
                  placeholder="VD: Đặt xe đưa đón khách"
                  onChange={(e) => editCustomTask(task.id, { title: e.target.value })}
                />
              </label>
              <label className="field">
                <span>Nhóm</span>
                {/* Lưu khi rời ô / Enter: đổi nhóm sẽ chuyển công việc sang khung nhóm khác */}
                <input
                  className="input"
                  list={`groups-${task.id}`}
                  value={groupDraft}
                  onChange={(e) => setGroupDraft(e.target.value)}
                  onBlur={commitGroup}
                  onKeyDown={(e) => e.key === "Enter" && commitGroup()}
                />
                <datalist id={`groups-${task.id}`}>
                  {groupOptions.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </label>
              <label className="field">
                <span>Giai đoạn</span>
                <select
                  className="select"
                  value={task.stage}
                  onChange={(e) => editCustomTask(task.id, { stage: e.target.value as StageId })}
                >
                  {STAGES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )}
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
            <div className="row">
              {section && !compact && (
                <Link className="related" href={`/${role}/${section}/`}>
                  Mở {sectionOf(section).short} <ArrowUpRight size={15} />
                </Link>
              )}
              <button className="btn sm" onClick={duplicate}>
                <Copy size={14} /> Nhân bản
              </button>
              <button
                className="btn sm ghost danger"
                onClick={() =>
                  confirm(
                    task.custom
                      ? `Xoá công việc "${task.title || "(Chưa đặt tên)"}"?`
                      : `Xoá công việc "${task.title}" khỏi kế hoạch?\nCó thể khôi phục ở cuối danh sách giai đoạn này.`,
                  ) && removeTask(task.id)
                }
              >
                <Trash2 size={14} /> Xoá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
