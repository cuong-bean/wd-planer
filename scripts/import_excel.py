"""Chuyển file Excel Wedding Planner thành src/data/plan.json cho website.

Chạy:  python scripts/import_excel.py excel/Wedding_Planner_Tai_Nha.xlsx
(Chỉ dùng thư viện chuẩn của Python, không cần cài thêm gì.)
"""
import json
import re
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

NS = {
    "m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}

STAGE_MAP = {
    "Pre-wedding": "prewedding",
    "Dạm ngõ": "damngo",
    "Ăn hỏi": "anhoi",
    "Lễ cưới": "lecuoi",
}


def read_workbook(path):
    z = zipfile.ZipFile(path)
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        root = ET.fromstring(z.read("xl/sharedStrings.xml"))
        for si in root.findall("m:si", NS):
            shared.append("".join(t.text or "" for t in si.iter("{%s}t" % NS["m"])))
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    relmap = {r.get("Id"): r.get("Target") for r in rels}
    sheets = {}
    for s in wb.find("m:sheets", NS):
        target = relmap[s.get("{%s}id" % NS["r"])].lstrip("/")
        if not target.startswith("xl/"):
            target = "xl/" + target
        sh = ET.fromstring(z.read(target))
        rows = []
        for row in sh.iter("{%s}row" % NS["m"]):
            cells = {}
            for c in row.findall("m:c", NS):
                if c.find("m:f", NS) is not None:
                    continue  # bỏ qua ô công thức
                t, v = c.get("t"), c.find("m:v", NS)
                val = None
                if t == "s" and v is not None:
                    val = shared[int(v.text)]
                elif t == "inlineStr":
                    val = "".join(x.text or "" for x in c.iter("{%s}t" % NS["m"]))
                elif v is not None:
                    val = v.text
                if val not in (None, ""):
                    cells[re.sub(r"\d", "", c.get("r"))] = val.strip()
            if cells:
                rows.append((int(row.get("r")), cells))
        # Bỏ tiền tố số "02 " trong tên sheet để dễ tra cứu
        sheets[re.sub(r"^\d+\s+", "", s.get("name"))] = rows
    return sheets


def table(rows, id_prefix, start_row=7, stop_row=None):
    """Trả về các dòng dữ liệu có mã bắt đầu bằng id_prefix."""
    out = []
    for r, c in rows:
        if r < start_row or (stop_row and r > stop_row):
            continue
        if c.get("A", "").startswith(id_prefix):
            out.append(c)
    return out


def guess_owner(title):
    t = title.lower()
    bride = "nhà gái" in t or "cô dâu" in t
    groom = "nhà trai" in t or "chú rể" in t
    if bride and not groom:
        return "bride"
    if groom and not bride:
        return "groom"
    return "both"


def main(xlsx, out_path):
    s = read_workbook(xlsx)

    tasks = []
    for c in table(s["Checklist"], "CV"):
        if "C" not in c:
            continue
        tasks.append({
            "id": c["A"],
            "stage": STAGE_MAP.get(c.get("B", ""), "lecuoi"),
            "group": c.get("E", "Khác"),
            "title": c["C"],
            "milestone": c.get("G", ""),
            "note": c.get("L", ""),
            "owner": guess_owner(c["C"]),
        })

    data = {
        "source": Path(xlsx).name,
        "tasks": tasks,
        "rituals": [
            {"id": c["A"], "ceremony": c.get("B", ""), "title": c.get("D", "")}
            for c in table(s["Nghi lễ"], "NL") if c.get("D")
        ],
        "budget": [
            {"id": c["A"], "group": c.get("B", ""), "title": c.get("C", "")}
            for c in table(s["Ngân sách"], "CP") if c.get("C")
        ],
        "house": [
            {"id": c["A"], "group": c.get("C", ""), "title": c.get("D", "")}
            for c in table(s["Nhà cửa & rạp"], "NC") if c.get("D")
        ],
        "feast": [
            {"id": f"CO{i + 1}", "title": c["A"]}
            for i, (r, c) in enumerate(s["Cỗ cưới"]) if r >= 7 and c.get("A")
        ],
        "vendors": [
            {"id": c["A"], "title": c.get("B", "")}
            for c in table(s["Nhà cung cấp"], "NCC") if c.get("B")
        ],
        "schedule": [
            {"id": f"LT{c['A']}", "order": int(c["A"]), "place": c.get("D", ""), "title": c.get("G", "")}
            for r, c in s["Lịch ngày cưới"] if r >= 7 and c.get("A", "").isdigit() and c.get("G")
        ],
        "postWedding": [
            {"id": c["A"], "title": c.get("B", "")}
            for c in table(s["Quà & sau cưới"], "SC", start_row=113) if c.get("B")
        ],
    }

    Path(out_path).write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    counts = {k: len(v) for k, v in data.items() if isinstance(v, list)}
    print("Đã ghi", out_path, counts)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    src = sys.argv[1] if len(sys.argv) > 1 else "excel/Wedding_Planner_Tai_Nha.xlsx"
    dst = sys.argv[2] if len(sys.argv) > 2 else "src/data/plan.json"
    main(src, dst)
