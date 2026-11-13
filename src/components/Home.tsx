"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Flower2, Gem, Heart, Settings2 } from "lucide-react";
import { ROLES, type Role } from "@/lib/plan";
import { allTaskViews, daysBetween, formatDate, isMine, progress, todayISO, useStore } from "@/lib/store";
import SettingsDialog from "./SettingsDialog";

export default function Home() {
  const { state, ready } = useStore();
  const [open, setOpen] = useState(false);
  const { brideName, groomName, dates } = state.settings;
  const tasks = allTaskViews(state);
  const left = dates.lecuoi ? daysBetween(todayISO(), dates.lecuoi) : null;

  const card = (role: Role, Icon: typeof Flower2, name: string) => {
    const mine = tasks.filter((t) => isMine(t, ROLES[role].owner));
    const p = progress(mine);
    return (
      <Link href={`/${role}/`} className="role-card" data-role={role}>
        <span className="role-icon">
          <Icon size={24} strokeWidth={1.6} />
        </span>
        <div>
          <h2>{ROLES[role].label}</h2>
          <div className="name">{name || " "}</div>
        </div>
        <div>
          <div className="row" style={{ justifyContent: "space-between", fontSize: 13, color: "var(--muted)", marginBottom: 6 }}>
            <span>Việc của {ROLES[role].label.toLowerCase()}</span>
            <span>
              {ready ? p.done : "–"}/{ready ? p.total : "–"} xong
            </span>
          </div>
          <div className="bar">
            <i style={{ width: `${ready ? p.pct : 0}%` }} />
          </div>
        </div>
        <span className="go">
          Xem kế hoạch của tôi <ArrowRight size={16} />
        </span>
      </Link>
    );
  };

  return (
    <main className="home">
      <div className="container">
        <header className="home-head">
          <div className="eyebrow">Wedding Planner</div>
          <h1 className="home-names">
            {brideName || "Cô dâu"}
            <span className="amp">&amp;</span>
            {groomName || "Chú rể"}
          </h1>
          <div className="divider">
            <Heart size={14} fill="currentColor" />
          </div>
          <p className="home-date">
            {dates.lecuoi ? (
              <>
                Lễ cưới <strong>{formatDate(dates.lecuoi)}</strong>
                {left !== null && left >= 0 && (
                  <>
                    {" "}· còn <strong>{left}</strong> ngày
                  </>
                )}
              </>
            ) : (
              <>Chưa chốt ngày cưới, nhập ở phần Thiết lập</>
            )}
          </p>
        </header>

        <p className="home-q">Bạn là ai?</p>
        <div className="role-grid">
          {card("co-dau", Flower2, brideName)}
          {card("chu-re", Gem, groomName)}
        </div>

        <div className="home-foot">
          <button className="btn ghost" onClick={() => setOpen(true)}>
            <Settings2 size={16} /> Thiết lập tên, ngày cưới & dữ liệu
          </button>
        </div>
      </div>
      {open && <SettingsDialog onClose={() => setOpen(false)} />}
    </main>
  );
}
