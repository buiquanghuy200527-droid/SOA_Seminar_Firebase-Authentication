/**
 * Nhà cung cấp danh tính bên ngoài, và phần "tổ chức khai vai trò".
 *
 * Ba cách đăng nhập (Email/Password, Google, GitHub) đều cho ra cùng một thứ:
 * một ID Token đã ký, chứa email và uid. Phần còn lại của app không cần biết
 * người dùng vào bằng cửa nào.
 *
 * RANH GIỚI TIN CẬY: team GitHub đọc được ở đây KHÔNG phải nguồn cấp quyền.
 * Khác với Entra ID (nhúng roles vào token), GitHub bắt phải gọi REST API —
 * và lời gọi đó chạy TRONG TRÌNH DUYỆT bằng access token nằm sẵn ở client.
 * Mở DevTools là sửa được, giả được. Nên firestore.rules không có một dòng
 * nào đọc tới team.
 */
import { GoogleAuthProvider, GithubAuthProvider } from "./firebase.js";
import { GITHUB_ORG, GITHUB_TEAM_MAP } from "./config.js";
import { state } from "./state.js";

/** id nút trên trang → hàm dựng provider tương ứng. */
export const OAUTH_PROVIDERS = {
  "btn-google": () => {
    const p = new GoogleAuthProvider();
    p.setCustomParameters({ prompt: "select_account" }); // tiện khi đổi tài khoản lúc demo
    return p;
  },
  "btn-github": () => {
    const p = new GithubAuthProvider();
    p.addScope("read:org");   // để đọc team của người dùng trong tổ chức
    p.addScope("user:email"); // để thấy email nào đã được GitHub xác minh
    return p;
  },
};

/**
 * Hỏi GitHub API xem người đăng nhập thuộc team nào trong GITHUB_ORG.
 * Trả về [] nếu chưa khai báo tổ chức, thiếu scope, tổ chức bật
 * third-party restrictions, hoặc mất mạng — mọi trường hợp đều không phải lỗi
 * chặn luồng đăng nhập.
 */
if (!GITHUB_ORG) {
  console.warn(
    "[config] GITHUB_ORG đang rỗng — phần 'tổ chức khai vai trò' (Pha C của demo) bị tắt. " +
    "Điền tên tổ chức vào app/js/config.js, xem README.md, Bước 3b."
  );
}

export async function fetchGithubTeams(accessToken) {
  if (!accessToken || !GITHUB_ORG) return [];
  try {
    const res = await fetch("https://api.github.com/user/teams?per_page=100", {
      headers: {
        Authorization: "Bearer " + accessToken,
        Accept: "application/vnd.github+json",
      },
    });
    if (!res.ok) return [];
    const all = await res.json();
    if (!Array.isArray(all)) return [];
    return all
      .filter((t) => t.organization?.login?.toLowerCase() === GITHUB_ORG.toLowerCase())
      .map((t) => ({ slug: t.slug, name: t.name, org: t.organization.login }));
  } catch {
    return [];
  }
}

/** Vai trò mà TỔ CHỨC khai — chỉ để hiển thị, server không đọc tới. */
export function roleClaimedByOrg() {
  for (const t of state.providerTeams) {
    const mapped = GITHUB_TEAM_MAP[String(t.slug).toLowerCase()];
    if (mapped) return mapped;
  }
  return null;
}
