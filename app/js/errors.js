/** Chuyển mã lỗi của Firebase thành câu tiếng Việt người dùng hiểu được. */

const ERRORS = {
  // Firebase bật email enumeration protection: "chưa có tài khoản" và "sai mật khẩu"
  // đều trả về mã này, nên auth/user-not-found bên dưới gần như không bao giờ chạy.
  "auth/invalid-credential":
    "Sai email hoặc mật khẩu — hoặc email này chưa đăng ký ở project hiện tại (bấm tab Đăng ký).",
  "auth/wrong-password": "Sai mật khẩu.",
  "auth/user-not-found": "Chưa có tài khoản với email này — hãy Đăng ký trước.",
  "auth/invalid-email": "Email không hợp lệ.",
  "auth/missing-password": "Hãy nhập mật khẩu.",
  "auth/email-already-in-use": "Email này đã được đăng ký — chuyển sang tab Đăng nhập.",
  "auth/weak-password": "Mật khẩu phải có ít nhất 6 ký tự.",
  "auth/too-many-requests": "Thử quá nhiều lần, vui lòng đợi một lúc.",
  "auth/popup-closed-by-user": "Bạn đã đóng cửa sổ đăng nhập.",
  "auth/cancelled-popup-request": "Bạn đã đóng cửa sổ đăng nhập.",
  "auth/popup-blocked": "Trình duyệt chặn cửa sổ đăng nhập — hãy cho phép popup rồi bấm lại.",
  "auth/account-exists-with-different-credential":
    "Email này đã có tài khoản bằng cách khác. Firebase coi một email là MỘT tài khoản — " +
    "đăng nhập bằng cách cũ trước.",
  "auth/provider-already-linked": "Tài khoản này đã gộp GitHub rồi.",
  "auth/credential-already-in-use":
    "Tài khoản GitHub này đã gắn với một tài khoản Firebase khác, không gộp được.",
  "auth/unauthorized-continue-uri":
    "Tên miền này chưa được thêm vào Authorized domains (README.md, Bước 9).",
  "auth/operation-not-allowed":
    "Phương thức đăng nhập này chưa được bật trong Firebase Console (README.md, Bước 2 và 3).",
  "auth/network-request-failed": "Mất kết nối mạng, thử lại.",

  "permission-denied":
    "Server từ chối (permission-denied): Security Rules không cho phép thao tác này.",
  "unavailable":
    "Không kết nối được Firestore — kiểm tra mạng, hoặc đã tạo Firestore Database chưa (Bước 4).",
  "failed-precondition":
    "Firestore chưa sẵn sàng — đã tạo Firestore Database chưa (Bước 4)?",
};

export function errText(e) {
  if (e?.code === "auth/unauthorized-domain") {
    // Tên miền chỉ biết lúc chạy, nên dựng câu ở đây thay vì để sẵn trong bảng.
    return `Tên miền ${location.hostname} chưa được thêm vào Authorized domains ` +
           `(README.md, Bước 9).`;
  }
  return ERRORS[e?.code] || `${e?.code || "lỗi"}: ${e?.message || e}`;
}
