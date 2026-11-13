"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Flower2, Gem, Repeat2, Settings2 } from "lucide-react";
import { ROLES, SECTIONS, type Role } from "@/lib/plan";
import { useStore } from "@/lib/store";
import SettingsDialog from "./SettingsDialog";

export default function Shell({ role, children }: { role: Role; children: React.ReactNode }) {
  const pathname = usePathname();
  const { state } = useStore();
  const [open, setOpen] = useState(false);
  const r = ROLES[role];
  const name = role === "co-dau" ? state.settings.brideName : state.settings.groomName;
  const Icon = role === "co-dau" ? Flower2 : Gem;
  const norm = (p: string) => (p.endsWith("/") ? p : p + "/");
  const current = norm(pathname ?? "");

  const links = [{ href: `/${role}/`, label: "Kế hoạch" }, ...SECTIONS.map((s) => ({ href: `/${role}/${s.id}/`, label: s.short }))];

  return (
    <div data-role={role}>
      <header className="topbar">
        <div className="container">
          <div className="topbar-row">
            <Link href="/" className="brand" title="Về trang chọn vai trò">
              <span className="brand-mark">
                <Icon size={18} strokeWidth={1.7} />
              </span>
              <span className="brand-text">
                {r.label}
                {name ? ` · ${name}` : ""}
              </span>
            </Link>
            <div className="topbar-actions">
              <Link href={`/${r.other}/`} className="btn sm ghost" title={`Chuyển sang ${ROLES[r.other].label}`}>
                <Repeat2 size={16} />
                <span style={{ display: "inline" }}>{ROLES[r.other].label}</span>
              </Link>
              <button className="btn icon ghost" onClick={() => setOpen(true)} aria-label="Thiết lập">
                <Settings2 size={18} />
              </button>
            </div>
          </div>
          <nav className="nav" aria-label="Điều hướng">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className={current === l.href ? "active" : ""}>
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="page">
        <div className="container">{children}</div>
      </main>
      {open && <SettingsDialog onClose={() => setOpen(false)} />}
    </div>
  );
}
