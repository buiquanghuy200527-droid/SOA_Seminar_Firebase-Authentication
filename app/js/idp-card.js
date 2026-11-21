/**
 * Thẻ "Nhà cung cấp danh tính khai gì về bạn?"
 *
 * Bày ra đúng ranh giới tin cậy: một dòng vai trò TỔ CHỨC KHAI, một dòng vai trò
 * SERVER THẬT SỰ CẤP. Hai dòng lệch nhau là cảnh đáng chiếu nhất của buổi demo —
 * provider khai một đằng, server cấp một nẻo, và server thắng.
 */
import { GITHUB_ORG } from "./config.js";
import { $ } from "./dom.js";
import { state } from "./state.js";
import { ROLE_INFO } from "./roles.js";
import { roleClaimedByOrg } from "./providers.js";

export function renderIdpCard(provider) {
  const card = $("idp-card");
  if (!state.providerClaims) {
    card.classList.add("hidden");
    return;
  }
  card.classList.remove("hidden");

  const claims = state.providerClaims;
  const teams = state.providerTeams;

  $("idp-provider").textContent = provider || "(không rõ)";

  // hd = hosted domain của Google Workspace; với GitHub là tổ chức đã khai báo.
  $("idp-tenant").textContent = teams.length
    ? teams[0].org
    : claims.hd || (GITHUB_ORG && provider === "github.com"
        ? `${GITHUB_ORG} (không thấy team nào)`
        : "(không có — tài khoản cá nhân)");

  const claimed = roleClaimedByOrg();
  const teamList = teams.map((t) => t.slug).join(", ");

  $("idp-claimed-role").textContent = claimed
    ? `${ROLE_INFO[claimed].label}  ←  teams: ${teamList}`
    : teamList
      ? `không khớp bản đồ (teams: ${teamList})`
      : "tổ chức không khai vai trò nào";

  $("idp-actual-role").textContent = ROLE_INFO[state.currentRole].label;

  const mismatch = $("idp-mismatch");
  if (claimed && claimed !== state.currentRole) {
    mismatch.classList.remove("hidden");
    mismatch.innerHTML =
      `Tổ chức khai <b>${ROLE_INFO[claimed].label}</b> nhưng server cấp ` +
      `<b>${ROLE_INFO[state.currentRole].label}</b>. Server không đọc tới team — ` +
      `vai trò vẫn lấy từ allowlist / tên miền. Đúng như thiết kế.`;
  } else {
    mismatch.classList.add("hidden");
  }

  $("idp-raw").textContent = JSON.stringify(
    { profile: claims, teams }, null, 2);
}
