"use client";

import { useEffect, useRef } from "react";
import { Download, RotateCcw, Upload, X } from "lucide-react";
import { STAGES } from "@/lib/plan";
import { useStore } from "@/lib/store";

export default function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { state, updateSettings, importState, reset } = useStore();
  const s = state.settings;
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `wedding-plan-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const onImport = async (file?: File) => {
    if (!file) return;
    try {
      const ok = importState(JSON.parse(await file.text()));
      alert(ok ? "Đã nhập dữ liệu thành công." : "File không đúng định dạng.");
    } catch {
      alert("Không đọc được file. Hãy chọn file .json đã xuất từ trang này.");
    }
  };

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label="Thiết lập">
        <div className="dialog-head">
          <h2>Thiết lập</h2>
          <button className="btn icon ghost" onClick={onClose} aria-label="Đóng">
            <X size={18} />
          </button>
        </div>
        <div className="dialog-body">
          <section>
            <h4>Cặp đôi</h4>
            <div className="fields">
              <label className="field">
                <span>Tên cô dâu</span>
                <input className="input" value={s.brideName} onChange={(e) => updateSettings({ brideName: e.target.value })} />
              </label>
              <label className="field">
                <span>Tên chú rể</span>
                <input className="input" value={s.groomName} onChange={(e) => updateSettings({ groomName: e.target.value })} />
              </label>
              <label className="field wide">
                <span>Ngân sách tối đa (VND)</span>
                <input
                  className="input"
                  inputMode="numeric"
                  value={s.budgetMax}
                  placeholder="VD: 300000000"
                  onChange={(e) => updateSettings({ budgetMax: e.target.value.replace(/[^\d]/g, "") })}
                />
              </label>
            </div>
          </section>

          <section>
            <h4>Ngày của từng buổi</h4>
            <div className="fields">
              {STAGES.map((st) => (
                <label className="field" key={st.id}>
                  <span>
                    {st.id === "prewedding" ? "Ngày chụp pre-wedding" : `Ngày ${st.name.toLowerCase()}`}
                    {st.alias ? ` (${st.alias.toLowerCase()})` : ""}
                  </span>
                  <input
                    type="date"
                    className="input"
                    value={s.dates[st.id]}
                    onChange={(e) => updateSettings({ dates: { ...s.dates, [st.id]: e.target.value } })}
                  />
                </label>
              ))}
            </div>
          </section>

          <section>
            <h4>Dữ liệu</h4>
            <p className="note-box" style={{ margin: "0 0 12px" }}>
              Dữ liệu được lưu ngay trên trình duyệt của máy này. Để cô dâu và chú rể dùng chung, hãy <b>Xuất file</b> rồi gửi cho
              người kia <b>Nhập file</b>.
            </p>
            <div className="row">
              <button className="btn" onClick={exportData}>
                <Download size={16} /> Xuất file
              </button>
              <button className="btn" onClick={() => fileRef.current?.click()}>
                <Upload size={16} /> Nhập file
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json,.json"
                hidden
                onChange={(e) => {
                  onImport(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
              <button
                className="btn ghost danger"
                onClick={() => confirm("Xoá toàn bộ tiến độ đã nhập trên máy này?") && reset()}
              >
                <RotateCcw size={16} /> Làm lại từ đầu
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
