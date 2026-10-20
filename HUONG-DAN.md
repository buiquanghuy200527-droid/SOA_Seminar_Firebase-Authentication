# Hướng dẫn chạy Demo — Firebase Authentication (Nhóm 12)

Đây là demo nhóm mình làm cho buổi seminar Firebase Authentication. Toàn bộ nằm trong một file `index.html`, mở bằng trình duyệt là chạy được, không cần cài gì cả.

- **Nếu bạn chỉ là người thử:** mình gửi cho bạn một link dạng `https://....netlify.app` — mở link đó, đăng nhập thử là được, không cần đọc tiếp file này.
- **Nếu bạn là người dựng demo (trong nhóm mình, làm 1 lần trước buổi học, khoảng 15 phút):** làm theo **Phần A** bên dưới.
- **Nếu bạn là người thuyết trình:** đọc **Phần B** để biết thứ tự mình sẽ bấm khi demo trên lớp.

Nếu nhóm mình đã dựng xong từ trước (đã có link Netlify chạy ngon rồi) thì khỏi làm lại Phần A — mở link, đăng nhập thử bằng mail trường cho chắc ăn, rồi qua thẳng Phần B.

---

## 3 vai trò trong demo

| Đăng nhập bằng | Vai trò | Được làm gì | Vì sao |
|---|---|---|---|
| `...@student.tdtu.edu.vn` | **Sinh viên** | Đọc + Ghi (chỉ sửa/xoá ghi chú của mình) | Email trường, tên miền sinh viên |
| `...@tdtu.edu.vn` (không phải student) | **Giảng viên** | Chỉ đọc | Email trường, tên miền giảng viên |
| Gmail giảng viên mô phỏng (mình khai báo sẵn) | **Giảng viên** | Chỉ đọc | Email nằm trong danh sách cố định |
| Gmail cá nhân bất kỳ khác | **Chế độ demo** | Tự chọn Sinh viên hoặc Giảng viên, đổi lại bất cứ lúc nào | Để ai cũng test được cả hai vai trò |

Điểm quan trọng nhất mình muốn nhấn mạnh khi demo: **dù vai trò do ai chọn, quyền thật sự luôn do server (Firestore Security Rules) quyết định**, không phải do trình duyệt. Giảng viên có cố ghi cũng bị server chặn — kể cả khi tự chọn vai trò Giảng viên ở chế độ demo.

---

## Phần A — Dựng demo (làm 1 lần)

Mình đánh dấu ☐ từng bước để biết đang làm tới đâu.

### ☐ Bước 1 — Tạo project Firebase
1. Vào https://console.firebase.google.com → **Create a project**.
2. Đặt tên (ví dụ `seminar-nhom12`) → tắt Google Analytics → **Create**.

### ☐ Bước 2 — Bật 2 cách đăng nhập
1. Menu trái: **Build → Authentication → Get started**.
2. Tab **Sign-in method**:
   - **Email/Password** → bật công tắc đầu tiên → **Save**.
   - **Add new provider → Google** → bật lên → chọn *Support email* → **Save**.

### ☐ Bước 3 — Tạo Firestore Database
1. Menu trái: **Build → Firestore Database → Create database**.
2. Location: `asia-southeast1 (Singapore)` → Next.
3. Chọn **Start in production mode** → **Create**.

### ☐ Bước 4 — Dán cấu hình Firebase vào index.html
1. Bánh răng cạnh *Project Overview* → **Project settings**.
2. Mục *Your apps* → bấm **`</>`** (biểu tượng Web) → đặt tên → **Register app**.
3. Copy toàn bộ phần bên trong dấu `{ }` của đoạn `firebaseConfig`.
4. Mở `index.html` bằng Notepad (chuột phải file → **Open with → Notepad**). Tìm khung có chữ **CẤU HÌNH** ở gần đầu file, thay các giá trị mẫu bằng giá trị mình vừa copy. Lưu file (Ctrl+S).

### ☐ Bước 5 — Dán Security Rules (bước quyết định quyền thật)
1. Firestore Database → tab **Rules** → xoá hết nội dung cũ → dán toàn bộ nội dung file `firestore.rules` → **Publish**.
2. *(Tuỳ chọn)* Muốn đổi Gmail đóng vai giảng viên mô phỏng (mặc định `buiquanghuy200527@gmail.com`): mình sửa y hệt ở 2 nơi, viết thường toàn bộ —
   - `demoLecturerEmails()` trong `firestore.rules`
   - `DEMO_LECTURER_EMAILS` trong `index.html`

   Sửa xong phải **Publish lại Rules** và **kéo thả lại thư mục lên Netlify** (Bước 6), không là bản cũ vẫn còn chạy trên mạng. Mình dùng Gmail của một bạn trong nhóm là đủ, không cần email thật của giảng viên.

Lưu ý: nếu bỏ qua bước này hoặc quên Publish, mọi người sẽ bị chặn đọc/ghi dù đăng nhập đúng — xem bảng lỗi ở cuối file.

### ☐ Bước 6 — Đưa lên mạng (kéo thả, không cài gì)
1. Vào https://app.netlify.com/drop và đăng nhập trước (Google hoặc GitHub đều được — nếu không đăng nhập, link sẽ tự hết hạn sau khoảng 1 giờ).
2. Kéo cả thư mục chứa `index.html` thả vào khung trên trang.
3. Vài giây sau Netlify trả về một link dạng `https://ten-ngau-nhien.netlify.app`. Đây là link mình gửi cho cả lớp.
   - Muốn đổi tên link cho dễ nhớ: **Site configuration → Change site name**.

Sau này sửa lại file: vào site đó trên Netlify → tab **Deploys** → kéo thả thư mục mới vào ô *"Drag and drop your site output folder here"* (sẽ ghi đè bản cũ, link giữ nguyên).

### ☐ Bước 7 — Cho phép tên miền Netlify đăng nhập
Firebase → **Authentication → Settings → Authorized domains → Add domain** → dán đúng tên miền Netlify, ví dụ `ten-ngau-nhien.netlify.app` — không có `https://` ở đầu (đây là tên miền, không phải đường link).

### ☐ Kiểm tra lần cuối
Mở link Netlify, đăng nhập thử bằng mail trường (`@student.tdtu.edu.vn`). Thấy nhãn **Sinh viên** và đăng được ghi chú là mình yên tâm, mọi thứ đã sẵn sàng.

---

## Phần B — Thứ tự mình demo trên lớp

### Pha 1 — Xác thực (Authentication)
1. Tab **Đăng ký**: tạo tài khoản bằng mail `@student.tdtu.edu.vn`. Vai trò đang là **Khách** (banner vàng) vì email chưa xác minh.
2. Mở hộp thư, bấm link xác minh, quay lại bấm **Tôi đã xác minh**. Vai trò đổi thành **Sinh viên**.
3. (Tuỳ chọn) Mở Firebase Console → Authentication → Users: cho lớp thấy tài khoản vừa tạo.
4. Đăng xuất → **Đăng nhập bằng Google**: giao diện hiện tên và ảnh lấy từ Google.
5. Khung **ID Token (JWT)** trên trang:
   - **Xem token**: thấy 3 phần màu (header · payload · chữ ký).
   - **Gửi lên server kiểm tra**: token được gửi cho server xác thực của Google, trả về `valid: true`.
   - **Sửa token rồi gửi**: đổi email trong token thành `hacker@...` → chữ ký không còn khớp → server **từ chối** (`INVALID_ID_TOKEN`).

### Pha 2 — Phân quyền (Authorization)
6. Đăng nhập tài khoản sinh viên vừa tạo → đăng 1–2 ghi chú → xoá được ghi chú của chính mình.
7. Mở cửa sổ ẩn danh, **Đăng nhập bằng Google** bằng Gmail giảng viên mô phỏng (email đã khai báo ở `DEMO_LECTURER_EMAILS`): vào thẳng với nhãn **Giảng viên**, thấy ghi chú ngay nhưng không có ô đăng bài.
8. Giảng viên bấm **Thử ghi dù không có quyền** → server trả về **permission-denied**.
9. Đăng nhập bằng một Gmail cá nhân khác (không phải Gmail giảng viên mô phỏng): hiện màn **Chế độ demo · Chọn vai trò**. Chọn **Giảng viên** → bấm "Thử ghi" vẫn bị **permission-denied**. Bấm **Chuyển sang Sinh viên** trên banner vàng → đăng được ghi chú bình thường.
10. Mở tab **Rules** trên Firebase Console, chỉ vào các hàm `isStudent()`, `isLecturer()` và `match /roles`: nhấn mạnh rằng vai trò có thể tự chọn, nhưng quyền luôn do server quyết định.

### Cho cả lớp cùng thử
Mình gửi link cho cả lớp. Mail trường tự nhận vai trò theo tên miền. Gmail cá nhân sẽ vào chế độ demo, tự chọn và đổi qua lại Sinh viên ↔ Giảng viên bất cứ lúc nào để thử cả hai quyền.

---

## Lỗi thường gặp

| Hiện tượng | Nguyên nhân & cách sửa |
|---|---|
| Banner đỏ "Chưa dán cấu hình Firebase" | Chưa làm xong Bước 4, hoặc quên lưu file rồi kéo thả lại lên Netlify |
| Banner đỏ "phải được mở qua một đường link web" | Đang mở file `index.html` trực tiếp trên máy. Phải mở bằng link Netlify (Bước 6) |
| "Tên miền … chưa được thêm vào Authorized domains" | Chưa làm Bước 7, hoặc dán nhầm có `https://` |
| "Phương thức đăng nhập này chưa được bật" | Chưa làm Bước 2 |
| "Không kết nối được Firestore" | Chưa tạo Firestore Database (Bước 3) |
| Sinh viên / Giảng viên thuộc domain trường bị permission-denied | Email chưa xác minh, hoặc Rules chưa Publish/chưa Publish lại (Bước 5) |
| Gmail giảng viên mô phỏng vẫn hiện màn "Chọn vai trò" thay vì vào thẳng Giảng viên | Email trong `DEMO_LECTURER_EMAILS` (index.html) và `demoLecturerEmails()` (firestore.rules) không giống hệt nhau, chưa viết chữ thường, hoặc Rules mới chưa Publish |
| Gmail cá nhân bấm chọn / đổi vai trò bị permission-denied | Rules chưa Publish bản mới nhất — bản cũ không cho ghi collection `roles` |
| "Email này đã được đăng ký bằng mật khẩu" khi bấm nút Google | Email đó từng đăng ký bằng Email/Password rồi. Đăng nhập lại bằng Email/Password, hoặc dùng mail khác để thử Google |
| Popup Google không mở | Trình duyệt đang chặn popup — bấm cho phép rồi thử lại |
