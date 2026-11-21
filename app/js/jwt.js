/**
 * ID Token (JWT): xem ba phần, gửi lên server kiểm tra, và sửa token rồi gửi lại.
 *
 * Phần "sửa token" là cảnh chốt của Pha 1: payload đọc và sửa được, nhưng chữ ký
 * do Firebase tạo thì không giả được, nên server từ chối ngay.
 */
import { auth } from "./firebase.js";
import { firebaseConfig } from "./config.js";
import { $ } from "./dom.js";
import { state } from "./state.js";
import { ROLE_INFO } from "./roles.js";

/** base64url → object */
export function decodePart(part) {
  const b64 = part.replace(/-/g, "+").replace(/_/g, "/")
    .padEnd(Math.ceil(part.length / 4) * 4, "=");
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

/** object → base64url */
export function encodePart(obj) {
  const bytes = new TextEncoder().encode(JSON.stringify(obj));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const fmtTime = (s) => new Date(s * 1000).toLocaleString("vi-VN");

function renderToken(token) {
  const [h, p, s] = token.split(".");
  const raw = $("jwt-raw");
  raw.innerHTML = "";
  [[h, "h"], [".", ""], [p, "p"], [".", ""], [s, "s"]].forEach(([txt, cls]) => {
    const span = document.createElement("span");
    span.textContent = txt;
    if (cls) span.className = "jwt-" + cls;
    raw.appendChild(span);
  });
  const payload = decodePart(p);
  $("jwt-header").textContent = JSON.stringify(decodePart(h), null, 2);
  $("jwt-payload").textContent = JSON.stringify({
    ...payload,
    "// iat (cấp lúc)": fmtTime(payload.iat),
    "// exp (hết hạn)": fmtTime(payload.exp),
  }, null, 2);
  $("jwt-out").classList.remove("hidden");
}

/**
 * Gửi token cho server xác thực của Google (Identity Toolkit). Server kiểm tra
 * chữ ký, hạn dùng và project — đúng việc mà verifyIdToken() làm ở backend riêng.
 */
async function sendToServer(token) {
  $("server-out").classList.remove("hidden");
  $("server-res").textContent = "Đang gửi…";

  const emu = auth.emulatorConfig;
  const base = emu
    ? `http://${emu.host}:${emu.port}/identitytoolkit.googleapis.com`
    : "https://identitytoolkit.googleapis.com";

  try {
    const res = await fetch(`${base}/v1/accounts:lookup?key=${firebaseConfig.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: token }),
    });
    const body = await res.json();

    let out;
    if (res.ok && body.users?.length) {
      const u = body.users[0];
      const claims = decodePart(token.split(".")[1]);
      out = {
        valid: true,
        message: "Token hợp lệ — server tin đây đúng là người dùng này.",
        uid: u.localId,
        email: u.email,
        email_verified: !!u.emailVerified,
        sign_in_provider: claims.firebase?.sign_in_provider,
        role: ROLE_INFO[state.currentRole].label,
        expires_at: fmtTime(claims.exp),
      };
    } else {
      out = {
        valid: false,
        message: "Token không hợp lệ — server từ chối.",
        error: body.error?.message || "unknown",
      };
    }
    $("server-res").textContent = `HTTP ${res.status}\n` + JSON.stringify(out, null, 2);
    $("server-res").className = out.valid ? "ok-box" : "err-box";
  } catch {
    $("server-res").textContent = "Không gọi được server. Kiểm tra kết nối mạng.";
    $("server-res").className = "err-box";
  }
}

export function initJwtUI() {
  $("btn-token").addEventListener("click", async () =>
    renderToken(await auth.currentUser.getIdToken()));

  $("btn-verify").addEventListener("click", async () =>
    sendToServer(await auth.currentUser.getIdToken()));

  // Đổi email trong payload nhưng GIỮ NGUYÊN chữ ký cũ → chữ ký không còn khớp.
  $("btn-tamper").addEventListener("click", async () => {
    const [h, p, s] = (await auth.currentUser.getIdToken()).split(".");
    const payload = decodePart(p);
    payload.email = "hacker@student.tdtu.edu.vn";
    sendToServer(`${h}.${encodePart(payload)}.${s}`);
  });
}
