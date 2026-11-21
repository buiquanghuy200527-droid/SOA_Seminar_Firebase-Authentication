/** PHA 1 — Xác thực: tab, form đăng ký/đăng nhập, nút provider, xác minh email, gộp tài khoản. */
import {
  auth, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendEmailVerification, sendPasswordResetEmail, updateProfile,
  signInWithPopup, getAdditionalUserInfo,
  GoogleAuthProvider, GithubAuthProvider, linkWithCredential,
} from "./firebase.js";
import { $, show } from "./dom.js";
import { errText } from "./errors.js";
import { state, rerender } from "./state.js";
import { OAUTH_PROVIDERS, fetchGithubTeams } from "./providers.js";
import { saveDemoRole } from "./roles.js";

export function selectTab(name) {
  document.querySelectorAll(".tab")
    .forEach((x) => x.classList.toggle("active", x.dataset.tab === name));
  $("form-login").classList.toggle("hidden", name !== "login");
  $("form-register").classList.toggle("hidden", name !== "register");
  show($("auth-msg"), "");
}

/* ---------------------------------------------------------------------------
 * GỘP TÀI KHOẢN
 *
 * Firebase coi một email là MỘT tài khoản. Google là nhà cung cấp "có thẩm quyền"
 * với địa chỉ @gmail.com, nên đăng nhập Google luôn vào thẳng tài khoản sẵn có.
 * GitHub thì không: nếu email đã có tài khoản (Google hoặc mật khẩu), Firebase
 * từ chối với auth/account-exists-with-different-credential — vì nếu tự gộp,
 * ai tạo tài khoản GitHub mang email của bạn cũng chiếm được tài khoản.
 *
 * Cách gộp đúng: giữ credential GitHub lại, bắt người dùng đăng nhập bằng cách
 * CŨ để chứng minh sở hữu, rồi mới linkWithCredential(). Sau đó GitHub đăng nhập
 * thẳng vào cùng uid.
 * ------------------------------------------------------------------------- */

function showLinkPanel(email) {
  $("link-msg").textContent =
    `${email} đã có tài khoản bằng cách khác. Firebase không tự gộp — ` +
    `hãy đăng nhập bằng cách cũ (Google, hoặc Email/Password ở trên) để chứng minh ` +
    `bạn sở hữu tài khoản đó, rồi GitHub sẽ được gộp vào.`;
  $("link-panel").classList.remove("hidden");
  show($("auth-msg"), "");
}

function clearPendingLink() {
  state.pendingLink = null;
  $("link-panel").classList.add("hidden");
}

/**
 * Gọi sau MỌI lần đăng nhập thành công. Nếu đang chờ gộp và đúng email,
 * gắn credential GitHub vào tài khoản vừa đăng nhập.
 */
async function completePendingLink(user) {
  const pending = state.pendingLink;
  if (!pending || !user) return;
  if ((user.email || "").toLowerCase() !== (pending.email || "").toLowerCase()) {
    show($("auth-msg"),
      `Bạn vừa đăng nhập bằng ${user.email}, không phải ${pending.email} — chưa gộp.`, "error");
    return;
  }
  try {
    await linkWithCredential(user, pending.credential);
    // Token GitHub vẫn dùng được ngay lúc này: đọc luôn team (nếu có khai báo tổ chức).
    state.providerTeams = await fetchGithubTeams(pending.credential.accessToken);
    clearPendingLink();
    await user.reload(); // để providerData có cả GitHub
  } catch (e) {
    clearPendingLink();
    show($("auth-msg"), errText(e), "error");
  }
}

export function initAuthUI() {
  document.querySelectorAll(".tab").forEach((t) =>
    t.addEventListener("click", () => selectTab(t.dataset.tab)));

  // Đăng ký bằng Email/Password → gửi email xác minh
  $("form-register").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    try {
      const cred = await createUserWithEmailAndPassword(
        auth, $("reg-email").value.trim(), $("reg-password").value);
      await updateProfile(cred.user, { displayName: $("reg-name").value.trim() });
      await sendEmailVerification(cred.user);
      rerender(cred.user); // để hiện ngay tên vừa đặt
    } catch (e) { show($("auth-msg"), errText(e), "error"); }
  });

  // Đăng nhập bằng Email/Password
  $("form-login").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    try {
      const cred = await signInWithEmailAndPassword(
        auth, $("login-email").value.trim(), $("login-password").value);
      await completePendingLink(cred.user);
      rerender(auth.currentUser);
    } catch (e) { show($("auth-msg"), errText(e), "error"); }
  });

  // Quên mật khẩu
  $("btn-forgot").addEventListener("click", async () => {
    const email = $("login-email").value.trim();
    if (!email) return show($("auth-msg"), "Nhập email ở ô phía trên trước.", "error");
    try {
      await sendPasswordResetEmail(auth, email);
      show($("auth-msg"), "Đã gửi email đặt lại mật khẩu (nếu email này tồn tại).", "ok");
    } catch (e) { show($("auth-msg"), errText(e), "error"); }
  });

  // Đăng nhập bằng provider bên ngoài
  for (const [btnId, makeProvider] of Object.entries(OAUTH_PROVIDERS)) {
    $(btnId).addEventListener("click", async () => {
      try {
        const result = await signInWithPopup(auth, makeProvider());
        // Claim thô CHỈ có ở kết quả đăng nhập, không lấy lại được sau đó.
        state.providerClaims = getAdditionalUserInfo(result)?.profile || null;
        state.providerTeams = btnId === "btn-github"
          ? await fetchGithubTeams(GithubAuthProvider.credentialFromResult(result)?.accessToken)
          : [];
        await completePendingLink(result.user);
        rerender(auth.currentUser);
      } catch (e) {
        // Email đã có tài khoản bằng cách khác → không báo lỗi suông, mở luồng gộp.
        if (btnId === "btn-github" && e?.code === "auth/account-exists-with-different-credential") {
          const credential = GithubAuthProvider.credentialFromError(e);
          const email = e.customData?.email;
          if (credential && email) {
            state.pendingLink = { credential, email };
            showLinkPanel(email);
            return;
          }
        }
        show($("auth-msg"), errText(e), "error");
      }
    });
  }

  // Bước chứng minh sở hữu: đăng nhập Google với đúng email đang chờ gộp.
  $("btn-link-google").addEventListener("click", async () => {
    const pending = state.pendingLink;
    if (!pending) return;
    try {
      const p = new GoogleAuthProvider();
      p.setCustomParameters({ login_hint: pending.email, prompt: "select_account" });
      const result = await signInWithPopup(auth, p);
      state.providerClaims = getAdditionalUserInfo(result)?.profile || null;
      await completePendingLink(result.user);
      rerender(auth.currentUser);
    } catch (e) { show($("auth-msg"), errText(e), "error"); }
  });

  $("btn-link-cancel").addEventListener("click", clearPendingLink);

  $("btn-logout").addEventListener("click", () => signOut(auth));

  // Xác minh email xong: tải lại user VÀ làm mới token — token cũ vẫn ghi
  // email_verified=false nên Security Rules sẽ còn chặn.
  $("btn-verified").addEventListener("click", async () => {
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    rerender(auth.currentUser);
  });

  $("btn-resend").addEventListener("click", async () => {
    try {
      await sendEmailVerification(auth.currentUser);
      alert("Đã gửi lại email xác minh.");
    } catch (e) { alert(errText(e)); }
  });

  // Chế độ demo: chọn / đổi vai trò
  const pick = (role, msgId) =>
    saveDemoRole(role).catch((e) => show($(msgId), errText(e), "error"));

  $("btn-pick-student").addEventListener("click", () => pick("student", "role-msg"));
  $("btn-pick-lecturer").addEventListener("click", () => pick("lecturer", "role-msg"));
  $("btn-switch-role").addEventListener("click", () =>
    pick(state.currentRole === "student" ? "lecturer" : "student", "demo-msg"));
}
