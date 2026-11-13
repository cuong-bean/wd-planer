"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { plan, ROLES, type Role } from "@/lib/plan";
import { useStore, type GuestSide, type Rsvp } from "@/lib/store";

const SESSIONS = plan.feast.map((f) => f.title);
const GROUPS = ["Họ hàng", "Bạn bè", "Đồng nghiệp", "Hàng xóm", "Khác"];
const SIDE_LABEL: Record<GuestSide, string> = { bride: "Nhà gái", groom: "Nhà trai" };
const RSVP_LABEL: Record<Rsvp, string> = { pending: "Chờ", yes: "Tham dự", no: "Không" };

export default function GuestsView({ role }: { role: Role }) {
  const { state, addGuest, updateGuest, removeGuest } = useStore();
  const mySide: GuestSide = ROLES[role].owner === "bride" ? "bride" : "groom";
  const [side, setSide] = useState<GuestSide | "all">(mySide);
  const [form, setForm] = useState({
    name: "",
    session: mySide === "bride" ? "Tiệc nhà gái" : "Tiệc nhà trai",
    group: GROUPS[0],
    invited: "2",
  });

  const list = state.guests.filter((g) => side === "all" || g.side === side);
  const invited = list.reduce((n, g) => n + g.invited, 0);
  const confirmed = list.filter((g) => g.rsvp === "yes").reduce((n, g) => n + (g.confirmed ?? g.invited), 0);
  const pending = list.filter((g) => g.rsvp === "pending").length;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addGuest({
      name: form.name.trim(),
      side: side === "all" ? mySide : side,
      session: form.session,
      group: form.group,
      invited: Math.max(1, Number(form.invited) || 1),
      rsvp: "pending",
    });
    setForm((f) => ({ ...f, name: "" }));
  };

  return (
    <>
      <div className="row" style={{ marginBottom: 14 }}>
        <div className="seg" role="group" aria-label="Bên mời">
          {(["bride", "groom", "all"] as const).map((s) => (
            <button key={s} className={side === s ? "on" : ""} onClick={() => setSide(s)}>
              {s === "all" ? "Cả hai bên" : SIDE_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="summary-grid">
        <div className="stat">
          <small>Hộ / lượt mời</small>
          <b>{list.length}</b>
        </div>
        <div className="stat">
          <small>Số người mời</small>
          <b>{invited}</b>
        </div>
        <div className="stat">
          <small>Xác nhận tham dự</small>
          <b>{confirmed}</b>
        </div>
        <div className={`stat ${pending ? "warn" : ""}`}>
          <small>Chưa phản hồi</small>
          <b>{pending}</b>
        </div>
      </div>

      <form className="card card-pad" onSubmit={submit} style={{ marginBottom: 16 }}>
        <div className="guest-form">
          <label className="field grow">
            <span>Tên khách / đại diện hộ</span>
            <input
              className="input"
              value={form.name}
              placeholder="VD: Gia đình chú Hùng"
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>
          <label className="field">
            <span>Nhóm</span>
            <select className="select" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })}>
              {GROUPS.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Buổi tham dự</span>
            <select className="select" value={form.session} onChange={(e) => setForm({ ...form, session: e.target.value })}>
              {SESSIONS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Số người</span>
            <input
              className="input"
              type="number"
              min={1}
              value={form.invited}
              onChange={(e) => setForm({ ...form, invited: e.target.value })}
            />
          </label>
          <button className="btn primary" type="submit" style={{ height: 40 }}>
            <Plus size={16} /> Thêm
          </button>
        </div>
        <p className="muted" style={{ fontSize: 12, margin: "10px 0 0" }}>
          Một hộ dự hai buổi thì thêm thành hai dòng. Khách được thêm vào {side === "all" ? SIDE_LABEL[mySide] : SIDE_LABEL[side]}.
        </p>
      </form>

      <section className="card group">
        {list.length === 0 && <div className="empty">Chưa có khách nào. Thêm khách ở ô phía trên.</div>}
        {list.map((g) => (
          <div className="guest-row" key={g.id}>
            <div style={{ minWidth: 0 }}>
              <div className="task-title">{g.name}</div>
              <div className="task-meta">
                <span className={`chip ${g.side}`}>{SIDE_LABEL[g.side]}</span>
                <span className="chip">{g.session}</span>
                <span className="chip">{g.group}</span>
                <span className="chip">{g.invited} người</span>
              </div>
            </div>
            <div className="seg" role="group" aria-label="Phản hồi">
              {(Object.keys(RSVP_LABEL) as Rsvp[]).map((r) => (
                <button key={r} className={g.rsvp === r ? "on" : ""} onClick={() => updateGuest(g.id, { rsvp: r })}>
                  {RSVP_LABEL[r]}
                </button>
              ))}
            </div>
            <button
              className="btn icon ghost danger"
              aria-label={`Xoá ${g.name}`}
              onClick={() => confirm(`Xoá "${g.name}" khỏi danh sách?`) && removeGuest(g.id)}
            >
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </section>
    </>
  );
}
