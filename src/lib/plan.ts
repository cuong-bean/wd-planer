import raw from "@/data/plan.json";

export type Role = "co-dau" | "chu-re";
export type Owner = "both" | "bride" | "groom";
export type StageId = "prewedding" | "damngo" | "anhoi" | "lecuoi";
export type Status = "todo" | "doing" | "done" | "na";

export interface Task {
  id: string;
  stage: StageId;
  group: string;
  title: string;
  milestone: string;
  note: string;
  owner: Owner;
}

export interface RefItem {
  id: string;
  title: string;
  group?: string;
  ceremony?: string;
  place?: string;
  order?: number;
}

interface PlanData {
  source: string;
  tasks: Task[];
  rituals: RefItem[];
  budget: RefItem[];
  house: RefItem[];
  feast: RefItem[];
  vendors: RefItem[];
  schedule: RefItem[];
  postWedding: RefItem[];
}

export const plan = raw as PlanData;

/* ---------- Vai trò ---------- */
export const ROLES: Record<Role, { owner: Owner; label: string; other: Role }> = {
  "co-dau": { owner: "bride", label: "Cô dâu", other: "chu-re" },
  "chu-re": { owner: "groom", label: "Chú rể", other: "co-dau" },
};

export const OWNER_LABEL: Record<Owner, string> = {
  bride: "Cô dâu",
  groom: "Chú rể",
  both: "Cả hai",
};

export function isRole(v: string): v is Role {
  return v === "co-dau" || v === "chu-re";
}

/* ---------- Giai đoạn ---------- */
export interface Stage {
  id: StageId;
  name: string;
  alias?: string;
  desc: string;
}

export const STAGES: Stage[] = [
  { id: "prewedding", name: "Pre-wedding", desc: "Thống nhất hai nhà, khách mời, trang phục & chụp ảnh cưới" },
  { id: "damngo", name: "Bỏ trầu", alias: "Dạm ngõ", desc: "Buổi gặp mặt chính thức đầu tiên của hai gia đình" },
  { id: "anhoi", name: "Ăn hỏi", alias: "Đính hôn", desc: "Trao tráp, lễ vật và lễ gia tiên tại nhà gái" },
  { id: "lecuoi", name: "Lễ cưới", desc: "Nhà cung cấp, rạp, cỗ, điều phối ngày cưới & sau cưới" },
];

/* ---------- Trạng thái ---------- */
export const STATUS_LABEL: Record<Status, string> = {
  todo: "Chưa bắt đầu",
  doing: "Đang làm",
  done: "Hoàn thành",
  na: "Không áp dụng",
};

/* ---------- Trang thông tin liên kết ---------- */
export type SectionId =
  | "nghi-le"
  | "ngan-sach"
  | "khach-moi"
  | "nha-cung-cap"
  | "nha-cua"
  | "co-cuoi"
  | "lich-ngay-cuoi"
  | "sau-cuoi";

export const SECTIONS: { id: SectionId; title: string; short: string; desc: string }[] = [
  { id: "khach-moi", title: "Khách mời", short: "Khách mời", desc: "Danh sách khách theo từng buổi và phản hồi tham dự" },
  { id: "ngan-sach", title: "Ngân sách & thanh toán", short: "Ngân sách", desc: "Dự toán, giá chốt, đã trả và còn phải trả" },
  { id: "nghi-le", title: "Nghi lễ & sính lễ", short: "Nghi lễ", desc: "Lễ vật, nghi thức cần chuẩn bị cho từng buổi lễ" },
  { id: "nha-cung-cap", title: "Nhà cung cấp & hợp đồng", short: "Nhà cung cấp", desc: "Thông tin liên hệ, nội dung đã chốt, giờ có mặt" },
  { id: "nha-cua", title: "Nhà cửa & rạp cưới", short: "Nhà cửa & rạp", desc: "Hạng mục theo từng khu vực, lắp đặt và phương án dự phòng" },
  { id: "co-cuoi", title: "Cỗ cưới & đồ uống", short: "Cỗ cưới", desc: "Số khách, số mâm cần đặt và thực đơn từng buổi" },
  { id: "lich-ngay-cuoi", title: "Lịch điều phối ngày cưới", short: "Lịch ngày cưới", desc: "Trình tự theo giờ, người phụ trách và đồ cần mang" },
  { id: "sau-cuoi", title: "Quà mừng & việc sau cưới", short: "Sau cưới", desc: "Đối soát, cảm ơn, trả đồ thuê và sao lưu" },
];

export function isSection(v: string): v is SectionId {
  return SECTIONS.some((s) => s.id === v);
}

/** Nhóm việc trong Checklist được liên kết tới trang thông tin nào */
export const GROUP_LINK: Record<string, SectionId> = {
  "Thống nhất gia đình": "ngan-sach",
  "Khách mời": "khach-moi",
  "Nhà cung cấp": "nha-cung-cap",
  "Trang phục & làm đẹp": "nha-cung-cap",
  "Ảnh pre-wedding": "nha-cung-cap",
  "Chuẩn bị dạm ngõ": "nghi-le",
  "Chuẩn bị ăn hỏi": "nghi-le",
  "Nghi lễ": "nghi-le",
  "Nhà cửa": "nha-cua",
  "Rạp & kỹ thuật": "nha-cua",
  "Cỗ cưới": "co-cuoi",
  "Điều phối": "lich-ngay-cuoi",
  "Chốt lần cuối": "lich-ngay-cuoi",
  "Trước ngày cưới": "lich-ngay-cuoi",
  "Trong ngày cưới": "lich-ngay-cuoi",
  "Sau cưới": "sau-cuoi",
};

export function sectionOf(id: SectionId) {
  return SECTIONS.find((s) => s.id === id)!;
}
