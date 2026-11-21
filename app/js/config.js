/**
 * CẤU HÌNH — file duy nhất cần sửa khi dựng lại demo.
 * Xem README.md, mục 4 (Bước 5; phần GitHub Organization ở Bước 3b).
 */

/**
 * Dán từ Firebase Console → Project settings → Your apps → biểu tượng `</>`.
 * Để trống hoặc còn "DAN_" thì trang hiện banner đỏ và dừng (xem firebase.js).
 */
export const firebaseConfig = {
  apiKey: "AIzaSyANhCM23hOZHcoCTKX9kr7fQJZKzc-IFi0",
  authDomain: "seminartwelve-1bb47.firebaseapp.com",
  projectId: "seminartwelve-1bb47",
  storageBucket: "seminartwelve-1bb47.firebasestorage.app",
  messagingSenderId: "622693190109",
  appId: "1:622693190109:web:5f96c0a72e25b7db778e34",
};

/**
 * Email cá nhân được khai báo trước để MÔ PHỎNG giảng viên, và để dọn ghi chú
 * không phù hợp lúc demo. Đây chỉ là cấu hình HIỂN THỊ — quyền thật nằm ở
 * hàm demoLecturerEmails() trong firestore.rules. Đổi ở đây thì sửa y hệt bên đó.
 */
export const DEMO_LECTURER_EMAILS = ["buiquanghuy200527@gmail.com"];

/** Tên miền email của trường. Tầng 2 trong thứ tự xét vai trò. */
export const STUDENT_DOMAIN = "@student.tdtu.edu.vn";
export const LECTURER_DOMAIN = "@tdtu.edu.vn";

/**
 * Tổ chức GitHub dùng để demo "tổ chức khai vai trò".
 * Để "" thì bỏ qua phần đọc team. Tạo miễn phí: https://github.com/organizations/plan
 */
export const GITHUB_ORG = ""; // để rỗng = không đọc team (Pha C chỉ trình bày khái niệm)

/**
 * Bản đồ team slug → vai trò. Slug là phần trong URL của team, không phải tên
 * hiển thị: team tên "Sinh viên" có thể ra slug "sinh-vien".
 */
export const GITHUB_TEAM_MAP = {
  students: "student",
  lecturers: "lecturer",
};

/** Số ghi chú mới nhất hiển thị trên trang. */
export const NOTES_LIMIT = 50;
