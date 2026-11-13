"use client";

import { ExternalLink, Phone } from "lucide-react";
import { plan } from "@/lib/plan";
import { formatDate, money, num, useStore } from "@/lib/store";
import ItemList, { joinParts, type FieldDef } from "./ItemList";

/* ---------------- Nghi lễ & sính lễ ---------------- */
export function RitualsView() {
  const fields: FieldDef[] = [
    { key: "qty", label: "Số lượng chốt" },
    { key: "unit", label: "Đơn vị", placeholder: "tráp, mâm, bộ…" },
    { key: "holder", label: "Người chuẩn bị / giữ" },
    { key: "ready", label: "Hạn sẵn sàng", type: "date" },
    { key: "receiver", label: "Người nhận / bàn giao" },
    { key: "note", label: "Ghi chú phong tục", type: "textarea" },
  ];
  return (
    <ItemList
      items={plan.rituals}
      groupBy={(i) => (i.ceremony?.startsWith("Lễ") ? i.ceremony : `Lễ ${(i.ceremony ?? "").toLowerCase()}`)}
      fields={fields}
      summary={(_, s) =>
        joinParts(s.qty && `${s.qty} ${s.unit ?? ""}`.trim(), s.holder && `Giữ: ${s.holder}`, s.ready && `Sẵn sàng ${formatDate(s.ready)}`)
      }
    />
  );
}

/* ---------------- Ngân sách ---------------- */
export function BudgetView() {
  const { state } = useStore();
  const max = num(state.settings.budgetMax);
  let est = 0,
    fin = 0,
    paid = 0;
  for (const b of plan.budget) {
    const s = state.items[b.id] ?? {};
    est += num(s.est);
    fin += num(s.final);
    paid += num(s.deposit) + num(s.extra);
  }
  const fields: FieldDef[] = [
    { key: "vendor", label: "Nhà cung cấp" },
    { key: "payer", label: "Bên chi trả", placeholder: "Hai nhà / Nhà trai / Nhà gái" },
    { key: "est", label: "Dự toán (VND)", type: "money" },
    { key: "final", label: "Giá chốt (VND)", type: "money" },
    { key: "deposit", label: "Tiền cọc (VND)", type: "money" },
    { key: "extra", label: "Trả thêm lũy kế (VND)", type: "money" },
    { key: "due", label: "Hạn trả tiếp", type: "date" },
    { key: "note", label: "Ghi chú", type: "textarea" },
  ];
  return (
    <>
      <div className="summary-grid">
        <div className="stat">
          <small>Ngân sách tối đa</small>
          <b>{max ? money(max) : "Chưa nhập"}</b>
        </div>
        <div className="stat">
          <small>Dự toán</small>
          <b>{money(est)}</b>
        </div>
        <div className="stat">
          <small>Giá chốt</small>
          <b>{money(fin)}</b>
        </div>
        <div className="stat">
          <small>Đã thanh toán</small>
          <b>{money(paid)}</b>
        </div>
        <div className={`stat ${fin - paid > 0 ? "warn" : ""}`}>
          <small>Còn phải trả</small>
          <b>{money(fin - paid)}</b>
        </div>
        {max > 0 && (
          <div className={`stat ${max - fin < 0 ? "danger" : ""}`}>
            <small>Còn lại so với giá chốt</small>
            <b>{money(max - fin)}</b>
          </div>
        )}
      </div>
      <ItemList
        items={plan.budget}
        groupBy={(i) => i.group ?? ""}
        fields={fields}
        summary={(_, s) => {
          const f = num(s.final);
          const p = num(s.deposit) + num(s.extra);
          if (!f && !num(s.est)) return s.vendor ?? "";
          return joinParts(
            s.vendor,
            f ? `Chốt ${money(f)}` : `Dự toán ${money(num(s.est))}`,
            p ? `Đã trả ${money(p)}` : undefined,
            f ? `Còn ${money(f - p)}` : undefined,
            s.due && `Hạn ${formatDate(s.due)}`,
          );
        }}
      />
    </>
  );
}

/* ---------------- Nhà cung cấp ---------------- */
export function VendorsView() {
  const fields: FieldDef[] = [
    { key: "name", label: "Tên nhà cung cấp" },
    { key: "contact", label: "Người liên hệ" },
    { key: "phone", label: "Điện thoại", type: "tel" },
    { key: "place", label: "Buổi / địa điểm" },
    { key: "date", label: "Ngày giao / thực hiện", type: "date" },
    { key: "time", label: "Giờ có mặt", type: "time" },
    { key: "link", label: "Mã hợp đồng / đường dẫn", type: "url", placeholder: "https://…", wide: true },
    { key: "content", label: "Nội dung đã chốt", type: "textarea" },
    { key: "cancel", label: "Điều kiện đổi / hủy", type: "textarea" },
  ];
  return (
    <ItemList
      items={plan.vendors}
      fields={fields}
      summary={(_, s) => joinParts(s.name, s.phone, s.date && `${formatDate(s.date)}${s.time ? " " + s.time : ""}`)}
      extra={(_, s) =>
        s.phone || s.link ? (
          <div className="row">
            {s.phone && (
              <a className="btn sm" href={`tel:${s.phone.replace(/\s/g, "")}`}>
                <Phone size={14} /> Gọi {s.phone}
              </a>
            )}
            {s.link && /^https?:\/\//.test(s.link) && (
              <a className="btn sm" href={s.link} target="_blank" rel="noreferrer">
                <ExternalLink size={14} /> Mở hợp đồng
              </a>
            )}
          </div>
        ) : null
      }
    />
  );
}

/* ---------------- Nhà cửa & rạp ---------------- */
export function HouseView() {
  const fields: FieldDef[] = [
    { key: "place", label: "Nhà / địa điểm", placeholder: "Nhà gái / Nhà trai" },
    { key: "qty", label: "Số lượng" },
    { key: "unit", label: "Đơn vị" },
    { key: "owner", label: "Nhà cung cấp / phụ trách" },
    { key: "setup", label: "Ngày lắp / sẵn sàng", type: "date" },
    { key: "remove", label: "Ngày tháo / trả", type: "date" },
    { key: "spec", label: "Yêu cầu / kích thước", type: "textarea" },
    { key: "backup", label: "Phương án dự phòng", type: "textarea" },
  ];
  return (
    <ItemList
      items={plan.house}
      groupBy={(i) => i.group ?? ""}
      fields={fields}
      summary={(_, s) => joinParts(s.place, s.qty && `${s.qty} ${s.unit ?? ""}`.trim(), s.owner, s.setup && `Lắp ${formatDate(s.setup)}`)}
    />
  );
}

/* ---------------- Cỗ cưới ---------------- */
export function FeastView() {
  const { state } = useStore();
  const confirmedFor = (session: string) =>
    state.guests
      .filter((g) => g.session === session && g.rsvp !== "no")
      .reduce((n, g) => n + (g.rsvp === "yes" ? g.confirmed ?? g.invited : g.invited), 0);

  const fields: FieldDef[] = [
    { key: "place", label: "Địa điểm" },
    { key: "date", label: "Ngày tổ chức", type: "date" },
    { key: "time", label: "Giờ đón khách", type: "time" },
    { key: "guests", label: "Khách chốt", type: "number" },
    { key: "per", label: "Người / mâm", type: "number", placeholder: "6" },
    { key: "spare", label: "Mâm dự phòng", type: "number", placeholder: "0" },
    { key: "booked", label: "Mâm đã đặt", type: "number" },
    { key: "person", label: "Người phụ trách" },
    { key: "menu", label: "Thực đơn đã chốt", type: "textarea" },
    { key: "drinks", label: "Đồ uống / số lượng", type: "textarea" },
  ];
  const needed = (s: Record<string, string | undefined>) => {
    const g = num(s.guests);
    const per = num(s.per) || 6;
    return g ? Math.ceil(g / per) + num(s.spare) : 0;
  };
  return (
    <ItemList
      items={plan.feast}
      fields={fields}
      summary={(_, s) =>
        joinParts(
          s.date && formatDate(s.date),
          s.guests && `${s.guests} khách`,
          needed(s) ? `Cần ${needed(s)} mâm` : undefined,
          s.booked && `Đã đặt ${s.booked}`,
        )
      }
      extra={(i, s) => {
        const fromList = confirmedFor(i.title);
        const need = needed(s);
        const booked = num(s.booked);
        return (
          <div className="note-box">
            Mâm cần (tính) = làm tròn lên (khách chốt ÷ người/mâm) + dự phòng = <b>{need || "–"}</b>
            {booked > 0 && need > 0 && booked !== need && (
              <>
                {" "}
                · <b style={{ color: booked < need ? "var(--danger)" : "var(--warn)" }}>
                  {booked < need ? `thiếu ${need - booked}` : `dư ${booked - need}`} mâm
                </b>
              </>
            )}
            <br />
            Khách dự kiến từ danh sách Khách mời cho buổi “{i.title}”: <b>{fromList}</b> người
          </div>
        );
      }}
    />
  );
}

/* ---------------- Lịch ngày cưới ---------------- */
export function ScheduleView() {
  const { state } = useStore();
  const items = [...plan.schedule].sort((a, b) => {
    const ta = state.items[a.id]?.start ?? "";
    const tb = state.items[b.id]?.start ?? "";
    if (ta && tb && ta !== tb) return ta < tb ? -1 : 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });
  const fields: FieldDef[] = [
    { key: "date", label: "Ngày", type: "date" },
    { key: "start", label: "Bắt đầu", type: "time" },
    { key: "end", label: "Kết thúc", type: "time" },
    { key: "main", label: "Người chính" },
    { key: "helper", label: "Người hỗ trợ" },
    { key: "phone", label: "Điện thoại", type: "tel" },
    { key: "bring", label: "Cần bàn giao / mang theo", type: "textarea" },
    { key: "backup", label: "Phương án khi trễ", type: "textarea" },
  ];
  return (
    <ItemList
      items={items}
      fields={fields}
      leading={(i, s) => (
        <div className="time-col">
          <b>{s.start || "--:--"}</b>
          <small>{s.end ? `→ ${s.end}` : `#${i.order}`}</small>
        </div>
      )}
      sub={(i) => i.place ?? ""}
      summary={(i, s) => joinParts(i.place, s.main && `Chính: ${s.main}`, s.phone)}
    />
  );
}

/* ---------------- Sau cưới ---------------- */
export function PostView() {
  const fields: FieldDef[] = [
    { key: "person", label: "Người phụ trách" },
    { key: "due", label: "Hạn hoàn thành", type: "date" },
    { key: "handover", label: "Bên / nơi bàn giao" },
    { key: "doneDate", label: "Ngày hoàn thành", type: "date" },
    { key: "result", label: "Kết quả / ghi chú", type: "textarea" },
  ];
  return (
    <ItemList
      items={plan.postWedding}
      fields={fields}
      summary={(_, s) => joinParts(s.person, s.due && `Hạn ${formatDate(s.due)}`, s.handover)}
    />
  );
}
