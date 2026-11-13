# Wedding Planner

Trang web nhỏ giúp **cô dâu** và **chú rể** theo dõi kế hoạch cưới, dữ liệu lấy từ file Excel `excel/Wedding_Planner_Tai_Nha.xlsx`.

- Trang đầu: chọn **Cô dâu** hoặc **Chú rể** để vào xem plan của riêng mình.
- Kế hoạch chia 4 giai đoạn: **Pre-wedding → Bỏ trầu (dạm ngõ) → Ăn hỏi → Lễ cưới**, mỗi giai đoạn chia theo nhóm việc.
- Mỗi nhóm việc có liên kết sang trang thông tin: Khách mời, Ngân sách, Nghi lễ, Nhà cung cấp, Nhà cửa & rạp, Cỗ cưới, Lịch ngày cưới, Sau cưới.
- Mỗi công việc: đánh dấu xong, đổi người phụ trách (Cô dâu / Chú rể / Cả hai), đặt hạn chốt, ghi chú. Có nhắc *quá hạn* và *đến hạn trong 7 ngày*.

## Chạy trên máy

```bash
npm install
npm run dev          # mở http://localhost:3000
```

## Cập nhật dữ liệu từ Excel

Khi sửa danh sách công việc / lễ vật / hạng mục trong Excel:

```bash
npm run import-excel # ghi lại src/data/plan.json (chỉ cần Python 3, không cần cài thêm)
```

Đổi file Excel khác: `python scripts/import_excel.py <đường-dẫn.xlsx> src/data/plan.json`.

## Deploy lên Cloudflare Pages

Dự án xuất ra **web tĩnh** (`output: "export"`, thư mục `out/`), không cần server.

**Cách 1: kết nối Git (khuyên dùng)**

1. Đẩy code lên GitHub/GitLab.
2. Cloudflare Dashboard → *Workers & Pages* → *Create* → *Pages* → *Connect to Git*.
3. Cấu hình build:
   - Framework preset: **Next.js (Static HTML Export)**
   - Build command: `npm run build`
   - Build output directory: `out`
   - Biến môi trường: `NODE_VERSION = 22`

**Cách 2: deploy từ máy**

```bash
npx wrangler login
npm run deploy
```

## Lưu dữ liệu

Tiến độ được lưu trong trình duyệt (localStorage) của từng máy. Để cô dâu và chú rể dùng chung:
**Thiết lập → Xuất file**, gửi file `.json` cho người kia, người kia chọn **Nhập file**.

> Muốn đồng bộ tự động giữa hai điện thoại: có thể nâng cấp lên Cloudflare Pages Functions + D1/KV ở bước sau.

## Cấu trúc

```
excel/                 file Excel gốc
scripts/import_excel.py   chuyển Excel → src/data/plan.json
src/data/plan.json     dữ liệu công việc, nghi lễ, ngân sách, ...
src/lib/plan.ts        giai đoạn, vai trò, liên kết nhóm việc → trang thông tin
src/lib/store.tsx      lưu trạng thái (localStorage), xuất/nhập
src/components/        giao diện (Home, PlanView, TaskItem, các trang thông tin)
src/app/               routes: /, /co-dau, /chu-re, /[vai-trò]/[trang]
```
