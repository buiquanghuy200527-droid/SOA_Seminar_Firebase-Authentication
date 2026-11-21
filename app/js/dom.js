/** Tiện ích DOM dùng chung. Không phụ thuộc Firebase. */

/** Lấy phần tử theo id. */
export const $ = (id) => document.getElementById(id);

/** Ghi một dòng thông báo vào phần tử .msg. type: "" | "ok" | "error" */
export function show(el, text, type = "") {
  el.textContent = text;
  el.className = "msg " + type;
}

/** Hiện/ẩn phần tử theo điều kiện. */
export const toggle = (id, hidden) => $(id).classList.toggle("hidden", hidden);

/**
 * Hiện banner đỏ ở đầu trang rồi dừng hẳn việc khởi động app.
 * Dùng cho lỗi cấu hình — app chạy tiếp cũng chỉ ra lỗi khó hiểu hơn.
 */
export function fatal(html) {
  const el = $("setup-warning");
  el.innerHTML = html;
  el.classList.remove("hidden");
  throw new Error("setup");
}
