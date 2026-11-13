"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { STATUS_LABEL, type RefItem, type Status } from "@/lib/plan";
import { useStore, type ItemState } from "@/lib/store";
import { StatusCheck } from "../TaskItem";

export interface FieldDef {
  key: string;
  label: string;
  type?: "text" | "money" | "number" | "date" | "time" | "tel" | "url" | "textarea";
  placeholder?: string;
  wide?: boolean;
}

interface Props {
  items: RefItem[];
  fields: FieldDef[];
  groupBy?: (i: RefItem) => string;
  summary?: (i: RefItem, s: ItemState) => string;
  leading?: (i: RefItem, s: ItemState) => ReactNode;
  extra?: (i: RefItem, s: ItemState) => ReactNode;
  sub?: (i: RefItem) => string;
}

export function FieldInput({ f, value, onChange }: { f: FieldDef; value: string; onChange: (v: string) => void }) {
  if (f.type === "textarea")
    return <textarea className="textarea" value={value} placeholder={f.placeholder} onChange={(e) => onChange(e.target.value)} />;
  if (f.type === "money")
    return (
      <input
        className="input"
        inputMode="numeric"
        placeholder={f.placeholder ?? "0"}
        value={value ? Number(value).toLocaleString("vi-VN") : ""}
        onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))}
      />
    );
  const type = f.type === "number" ? "number" : f.type ?? "text";
  return (
    <input
      className="input"
      type={type}
      min={f.type === "number" ? 0 : undefined}
      placeholder={f.placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

function ItemRow({ item, fields, summary, leading, extra, sub }: { item: RefItem } & Omit<Props, "items" | "groupBy">) {
  const { state, updateItem } = useStore();
  const [open, setOpen] = useState(false);
  const st: ItemState = state.items[item.id] ?? {};
  const status: Status = st.status ?? "todo";
  const line = summary?.(item, st) || sub?.(item) || "";

  return (
    <div className={`task is-${status}`}>
      <div className="task-row">
        {leading ? leading(item, st) : null}
        <StatusCheck status={status} label={item.title} onChange={(s) => updateItem(item.id, { status: s })} />
        <button className="task-main" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          <div className="task-title">{item.title}</div>
          {line && <div className="item-sub">{line}</div>}
        </button>
        <button className={`chevron ${open ? "open" : ""}`} onClick={() => setOpen((o) => !o)} aria-label="Chi tiết">
          <ChevronDown size={18} />
        </button>
      </div>
      {open && (
        <div className="task-detail">
          <div className="fields">
            {fields.map((f) => (
              <label className={`field ${f.wide || f.type === "textarea" ? "wide" : ""}`} key={f.key}>
                <span>{f.label}</span>
                <FieldInput f={f} value={st[f.key] ?? ""} onChange={(v) => updateItem(item.id, { [f.key]: v })} />
              </label>
            ))}
            <label className="field">
              <span>Trạng thái</span>
              <select className="select" value={status} onChange={(e) => updateItem(item.id, { status: e.target.value as Status })}>
                {(Object.keys(STATUS_LABEL) as Status[]).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {extra?.(item, st)}
        </div>
      )}
    </div>
  );
}

export default function ItemList({ items, groupBy, ...rest }: Props) {
  const groups = new Map<string, RefItem[]>();
  for (const i of items) {
    const g = groupBy ? groupBy(i) : "";
    groups.set(g, [...(groups.get(g) ?? []), i]);
  }
  return (
    <>
      {[...groups.entries()].map(([g, list]) => (
        <section className="card group" key={g || "all"}>
          {g && (
            <div className="group-head">
              <h3>{g}</h3>
              <span className="count">{list.length} mục</span>
            </div>
          )}
          {list.map((i) => (
            <ItemRow key={i.id} item={i} {...rest} />
          ))}
        </section>
      ))}
    </>
  );
}

export const joinParts = (...parts: (string | undefined | false)[]) => parts.filter(Boolean).join(" · ");
