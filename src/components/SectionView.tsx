"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { GROUP_LINK, ROLES, sectionOf, type Role, type SectionId } from "@/lib/plan";
import { allTaskViews, isMine, progress, useStore } from "@/lib/store";
import TaskItem from "./TaskItem";
import GuestsView from "./sections/GuestsView";
import { BudgetView, FeastView, HouseView, PostView, RitualsView, ScheduleView, VendorsView } from "./sections/Views";

export default function SectionView({ role, section }: { role: Role; section: SectionId }) {
  const { state, ready } = useStore();
  const info = sectionOf(section);
  const me = ROLES[role].owner;

  const related = allTaskViews(state)
    .filter((t) => GROUP_LINK[t.group] === section && isMine(t, me))
    .sort((a, b) => Number(a.status === "done" || a.status === "na") - Number(b.status === "done" || b.status === "na"));
  const p = progress(related);

  if (!ready) return <div className="skeleton" />;

  const body = {
    "khach-moi": <GuestsView role={role} />,
    "ngan-sach": <BudgetView />,
    "nghi-le": <RitualsView />,
    "nha-cung-cap": <VendorsView />,
    "nha-cua": <HouseView />,
    "co-cuoi": <FeastView />,
    "lich-ngay-cuoi": <ScheduleView />,
    "sau-cuoi": <PostView />,
  }[section];

  return (
    <>
      <div className="sec-head">
        <div>
          <Link href={`/${role}/`} className="back">
            <ChevronLeft size={15} /> Kế hoạch
          </Link>
          <h1>{info.title}</h1>
          <p>{info.desc}</p>
        </div>
      </div>
      <div className="layout-2">
        <div>{body}</div>
        <aside className="card side">
          <h3>
            Công việc liên quan{" "}
            <span className="muted" style={{ fontSize: 14, fontFamily: "var(--font-body)" }}>
              {p.done}/{p.total}
            </span>
          </h3>
          {related.length === 0 && <div className="empty">Không có công việc liên quan.</div>}
          {related.map((t) => (
            <TaskItem key={t.id} task={t} role={role} compact />
          ))}
        </aside>
      </div>
    </>
  );
}
