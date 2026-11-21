/**
 * Trạng thái dùng chung giữa các module, và móc gọi lại render().
 *
 * Tách riêng để tránh phụ thuộc vòng: app.js đăng ký hàm render vào đây,
 * các module khác chỉ gọi rerender() mà không cần import app.js.
 */

export const state = {
  /** Vai trò app đang HIỂN THỊ. Quyền thật luôn do firestore.rules quyết định. */
  currentRole: "guest",

  /**
   * Claim thô provider trả về lúc đăng nhập. Chỉ sống trong bộ nhớ:
   * không ghi xuống Firestore, không gửi cho Rules. Đây là ranh giới tin cậy.
   */
  providerClaims: null,

  /**
   * Team GitHub của người dùng. F5 là mất, vì Firebase không giữ lại
   * access token của provider sau lúc đăng nhập.
   */
  providerTeams: [],

  /**
   * Đăng nhập GitHub bị từ chối vì email đã có tài khoản bằng cách khác.
   * Giữ lại credential GitHub ở đây, chờ người dùng chứng minh sở hữu
   * tài khoản cũ rồi gộp vào. { credential, email } hoặc null.
   */
  pendingLink: null,

  /** Hàm huỷ lắng nghe onSnapshot của danh sách ghi chú. */
  unsubscribeNotes: null,
};

let renderFn = () => {};

/** app.js gọi hàm này một lần lúc khởi động. */
export const setRenderer = (fn) => { renderFn = fn; };

/** Yêu cầu vẽ lại giao diện sau khi trạng thái đổi. */
export const rerender = (user) => renderFn(user);
