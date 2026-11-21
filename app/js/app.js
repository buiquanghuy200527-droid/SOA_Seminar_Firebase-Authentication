/**
 * Điểm vào của ứng dụng: nối các module lại và vẽ giao diện theo trạng thái.
 *
 * Luồng:  onAuthStateChanged → render(user) → xét vai trò → bật/tắt từng khối.
 */
import { auth, onAuthStateChanged } from "./firebase.js";
import { $, show } from "./dom.js";
import { state, setRenderer } from "./state.js";
import {
  ROLE_INFO, isTrusted, isDemoLecturer, hasFixedRole,
  resolveRole, roleSourceLabel, fetchListedRole, fetchDemoRole,
} from "./roles.js";
import { initAuthUI, selectTab } from "./auth-ui.js";
import { initNotesUI, listenNotes, stopListeningNotes } from "./notes.js";
import { initJwtUI } from "./jwt.js";
import { renderIdpCard } from "./idp-card.js";

/** Tên provider hiển thị cho người dùng. */
const PROVIDER_LABEL = {
  "google.com": "Google",
  "github.com": "GitHub",
  password: "Email/Password",
};

const PERM_NOTE = {
  student: "Bạn là sinh viên: được đọc và đăng ghi chú, chỉ xoá ghi chú của chính mình.",
  lecturer: "Bạn là giảng viên: chỉ được đọc, không được ghi.",
  guest: "Email chưa được xác minh nên chưa có quyền. Hãy xác minh email (xem banner phía trên).",
};

/** Ảnh đại diện dự phòng cho tài khoản không có photoURL. */
function fallbackAvatar(user) {
  const initial = (user.displayName || user.email || "?")
    .trim()[0].toUpperCase().replace(/[<&>]/g, "");
  return "data:image/svg+xml," + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">' +
    '<rect width="64" height="64" fill="#1a56db"/>' +
    `<text x="32" y="42" font-size="28" font-family="sans-serif" fill="#fff" ` +
    `text-anchor="middle">${initial}</text></svg>`);
}

/**
 * Mỗi lần gọi render tăng renderSeq. Lần gọi cũ thấy số đã đổi thì dừng,
 * tránh trường hợp đổi tài khoản nhanh làm kết quả cũ ghi đè kết quả mới.
 */
let renderSeq = 0;

async function render(user) {
  const seq = ++renderSeq;
  const loggedIn = !!user;

  $("auth-view").classList.toggle("hidden", loggedIn);
  $("app-view").classList.toggle("hidden", !loggedIn);
  $("role-pick-view").classList.add("hidden");
  $("demo-banner").classList.add("hidden");
  $("btn-logout").classList.toggle("hidden", !loggedIn);
  $("jwt-out").classList.add("hidden");
  $("server-out").classList.add("hidden");
  $("idp-card").classList.add("hidden");
  stopListeningNotes();

  if (!user) {
    state.providerClaims = null;
    state.providerTeams = [];
    selectTab("login");
    return;
  }

  // Cách đăng nhập của LẦN NÀY lấy từ token — một tài khoản có thể gắn nhiều provider.
  const provider = (await user.getIdTokenResult()).signInProvider;
  if (seq !== renderSeq) return;

  const trusted = isTrusted(user, provider);

  // Tầng 1: vai trò admin cấp trong allowlist — dùng được với MỌI provider.
  const listedRole = trusted ? await fetchListedRole(user.email).catch(() => null) : null;
  if (seq !== renderSeq) return;

  // Không có trong allowlist, không thuộc tên miền trường → chế độ demo tự chọn.
  const isDemo = trusted && !hasFixedRole(user.email, listedRole);
  let demoRole = null;
  if (isDemo) {
    demoRole = await fetchDemoRole(user.uid).catch(() => null);
    if (seq !== renderSeq) return;
    if (!demoRole) {
      $("app-view").classList.add("hidden");
      $("role-pick-view").classList.remove("hidden");
      show($("role-msg"), "");
      return;
    }
  }

  const ctx = { email: user.email, trusted, demoRole, listedRole };
  state.currentRole = resolveRole(ctx);
  const info = ROLE_INFO[state.currentRole];

  if (isDemo) {
    $("demo-banner").classList.remove("hidden");
    $("demo-role-label").textContent = info.label;
    $("btn-switch-role").textContent =
      state.currentRole === "student" ? "Chuyển sang Giảng viên" : "Chuyển sang Sinh viên";
    show($("demo-msg"), "", "error");
  }

  // ---- Thông tin người dùng ----
  $("p-photo").src = user.photoURL || fallbackAvatar(user);
  $("p-name").textContent = user.displayName || "(chưa đặt tên)";
  $("p-email").textContent = user.email;
  $("p-role").textContent = info.label;
  $("p-role").className = "role " + state.currentRole;
  $("p-uid").textContent = user.uid;
  $("p-provider").textContent = PROVIDER_LABEL[provider] || provider || "(không rõ)";
  // Mọi cách đăng nhập đang gắn vào CÙNG uid này — thấy rõ sau khi gộp GitHub.
  $("p-linked").textContent = (user.providerData || [])
    .map((p) => PROVIDER_LABEL[p.providerId] || p.providerId).join(", ") || "—";
  $("p-verified").textContent = user.emailVerified
    ? "Có"
    : provider === "google.com" ? "Có (Google xác nhận)" : "Chưa";
  $("p-rolesource").textContent = roleSourceLabel(ctx);
  $("p-perm").textContent = info.perm;
  $("verify-banner").classList.toggle("hidden", trusted);

  renderIdpCard(provider);

  // ---- PHA 2: giao diện theo vai trò ----
  $("form-note").classList.toggle("hidden", state.currentRole !== "student");
  // Chỉ giảng viên mới thấy nút thử ghi, để minh hoạ Security Rules từ chối.
  $("try-write").classList.toggle("hidden", state.currentRole !== "lecturer");
  $("perm-note").textContent = PERM_NOTE[state.currentRole] +
    (isDemo ? " (Chế độ demo — vai trò tự chọn, quyền vẫn do server kiểm tra.)" : "");
  show($("notes-msg"), "");

  if (state.currentRole === "guest") {
    // Không gửi truy vấn đọc với tài khoản khách; dọn nội dung cũ nếu vừa đổi tài khoản.
    $("notes").innerHTML = "";
    show($("notes-msg"), "Không có quyền đọc ghi chú nội bộ.");
  } else {
    listenNotes();
  }
}

setRenderer(render);
initAuthUI();
initNotesUI();
initJwtUI();
onAuthStateChanged(auth, (user) => render(user));
