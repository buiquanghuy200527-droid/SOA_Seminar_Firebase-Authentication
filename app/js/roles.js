/**
 * Xét vai trò — BẢN SAO ĐỂ HIỂN THỊ của logic trong firestore.rules.
 *
 * Client tính sai cũng không sao: mọi thao tác đọc/ghi vẫn bị server chặn lại
 * theo đúng Rules. File này chỉ quyết định giao diện hiện gì.
 *
 * Thứ tự ưu tiên, giống hệt firestore.rules:
 *   1. allowlist (admin cấp)   ← nguồn đúng, dùng được với mọi provider
 *   2. tên miền email trường
 *   3. chế độ demo tự chọn
 * Team GitHub KHÔNG nằm trong danh sách này — xem providers.js.
 */
import { auth, db, doc, getDoc, setDoc, serverTimestamp } from "./firebase.js";
import { DEMO_LECTURER_EMAILS, STUDENT_DOMAIN, LECTURER_DOMAIN } from "./config.js";
import { state, rerender } from "./state.js";

export const ROLE_INFO = {
  student: { label: "Sinh viên", perm: "Đọc + Ghi" },
  lecturer: { label: "Giảng viên", perm: "Chỉ đọc" },
  guest: { label: "Khách", perm: "Không có quyền" },
};

const lower = (email) => (email || "").toLowerCase();

/**
 * Đăng nhập bằng Google = Google đã xác nhận bạn sở hữu email này.
 * Cần vế thứ hai vì tài khoản Google Workspace có thể không set cờ email_verified.
 * GitHub KHÔNG được tin như vậy: GitHub cho đổi email chính bất cứ lúc nào.
 */
export const isTrusted = (user, provider) =>
  user.emailVerified || provider === "google.com";

export const isDemoLecturer = (email) =>
  DEMO_LECTURER_EMAILS.includes(lower(email));

/** Quản trị buổi demo: xoá được mọi ghi chú. Quyền thật do isAdmin() trong Rules cấp. */
export const isAdminUser = () => isDemoLecturer(auth.currentUser?.email);

/** Có vai trò cố định (allowlist hoặc tên miền) thì không hiện màn tự chọn. */
export function hasFixedRole(email, listedRole) {
  if (listedRole) return true;
  const e = lower(email);
  return e.endsWith(STUDENT_DOMAIN) || e.endsWith(LECTURER_DOMAIN) || isDemoLecturer(e);
}

export function resolveRole({ email, trusted, demoRole, listedRole }) {
  if (!email || !trusted) return "guest";
  if (listedRole === "student" || listedRole === "lecturer") return listedRole;
  const e = lower(email);
  if (e.endsWith(LECTURER_DOMAIN) || isDemoLecturer(e)) return "lecturer";
  if (e.endsWith(STUDENT_DOMAIN)) return "student";
  if (demoRole === "student" || demoRole === "lecturer") return demoRole;
  return "guest";
}

/** Câu mô tả vai trò ĐẾN TỪ ĐÂU — điểm mấu chốt của cả bài. */
export function roleSourceLabel({ email, trusted, demoRole, listedRole }) {
  const e = lower(email);
  if (!trusted) return "chưa có — email chưa xác minh";
  if (listedRole) return "allowlist (admin cấp trước)";
  if (isDemoLecturer(e)) return "danh sách giảng viên mô phỏng (chỉ để demo)";
  if (e.endsWith(LECTURER_DOMAIN) || e.endsWith(STUDENT_DOMAIN)) return "tên miền email của trường";
  if (demoRole) return "tự chọn — CHẾ ĐỘ DEMO, không phải cơ chế thật";
  return "chưa có";
}

const validRole = (r) => (r === "student" || r === "lecturer" ? r : null);

/** Tầng 1: vai trò do admin cấp. Rules chỉ cho đọc dòng của chính mình. */
export async function fetchListedRole(email) {
  if (!email) return null;
  const snap = await getDoc(doc(db, "allowlist", lower(email)));
  return snap.exists() ? validRole(snap.data().role) : null;
}

/** Tầng 3: vai trò người dùng tự chọn ở chế độ demo. */
export async function fetchDemoRole(uid) {
  const snap = await getDoc(doc(db, "roles", uid));
  return snap.exists() ? validRole(snap.data().role) : null;
}

/**
 * Ghi vai trò demo. Rules kiểm tra: chỉ tài khoản ngoài trường được ghi,
 * chỉ nhận "student"/"lecturer", chỉ ghi hồ sơ của chính mình, và
 * updatedAt phải bằng giờ server.
 */
export async function saveDemoRole(role) {
  const u = auth.currentUser;
  await setDoc(doc(db, "roles", u.uid), {
    role,
    email: u.email,
    updatedAt: serverTimestamp(),
  });
  rerender(u);
}

export const currentRoleInfo = () => ROLE_INFO[state.currentRole];
