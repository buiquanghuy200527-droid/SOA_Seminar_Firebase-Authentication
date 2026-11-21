# Firebase Authentication — Xác thực và phân quyền (Nhóm 12)

Ứng dụng web "Bảng ghi chú môn học" minh hoạ hai việc tách biệt:

- **Xác thực** (*bạn là ai?*) — ba cách đăng nhập: Email/Password, Google, GitHub, do Firebase
  Authentication đảm nhận. Kèm luồng gộp tài khoản GitHub vào tài khoản sẵn có cùng email.
- **Phân quyền** (*bạn được làm gì?*) — Firestore Security Rules chạy trên server quyết định ai
  được đọc, ai được ghi.

Không có bước build: mã nguồn là ES module chạy thẳng trên trình duyệt.

| Nộp kèm | Nội dung |
|---|---|
| `app/` | Mã nguồn ứng dụng — thư mục duy nhất cần deploy |
| `firestore.rules` | Toàn bộ logic phân quyền phía server |
| `Firebase_Authentication_Seminar.pptx` | Bộ slide (16 slide) |
| `README.md` | Tài liệu này |

---

## 1. Câu hỏi của thầy và câu trả lời

> *Làm sao biết ai là sinh viên, ai là giảng viên khi họ đăng nhập không bằng tài khoản trường?*

### Câu trả lời ngắn

**Không biết được bằng cách đăng nhập, và cũng không nên cố đoán.**

Cách đăng nhập chỉ trả lời "bạn là ai" — nó cho ra một email và một `uid` đã xác minh. Nó **không**
mang theo thông tin "người này là sinh viên hay giảng viên", vì Google hay GitHub không biết gì
về cơ cấu của trường. Vai trò phải đến từ **một nguồn do tổ chức kiểm soát**.

Bản demo đầu tiên của nhóm suy vai trò từ tên miền email. Cách đó chỉ đúng **nhờ một điều kiện
ẩn**: trường kiểm soát việc cấp mail `@student.tdtu.edu.vn`, nên tên miền vô tình cũng là nguồn
vai trò đáng tin. Người dùng đăng nhập bằng Gmail hay GitHub cá nhân thì điều kiện đó mất, và
cách suy luận này sụp đổ.

### Hai khái niệm bị trộn vào nhau

| | Trả lời câu | Nguồn | Thay đổi khi nào |
|---|---|---|---|
| **Danh tính** (Authentication) | Bạn là ai? | Provider: Email/Password, Google, GitHub | Người dùng tự đổi cách đăng nhập |
| **Vai trò** (Authorization) | Bạn được làm gì? | **Tổ chức cấp** | Khi tổ chức quyết định |

Một giảng viên đăng nhập bằng GitHub vẫn là giảng viên. Một người lạ đăng nhập bằng mail
Google Workspace của trường khác vẫn không là gì cả. Lỗi thiết kế của bản đầu là **suy vai trò
từ danh tính**.

### Bản sửa: allowlist do admin cấp

Collection `allowlist` trong Firestore, mỗi tài liệu:

```
/allowlist/{email viết thường}
    role: "student" | "lecturer"
```

Trong `firestore.rules`:

```
match /allowlist/{userEmail} {
  allow read:  if signedIn() && email() == userEmail;
  allow write: if false;
}
```

`allow write: if false` là dòng quan trọng nhất của thiết kế: **không client nào ghi được**, kể cả
chủ tài khoản. Chỉ Firebase Console hoặc Admin SDK — tức là chỉ admin — cấp được vai trò.

### Vai trò đến từ đâu — bốn tầng, tầng trên thắng

| # | Nguồn | Ai kiểm soát | Server có tin không |
|---|---|---|---|
| 1 | `allowlist` trong Firestore | **Admin** | ✅ Có — nguồn đúng |
| 2 | Tên miền email của trường | Trường (vì trường cấp mail) | ✅ Có |
| 3 | Chế độ demo tự chọn | Người dùng | ⚠️ Có, nhưng chỉ là tiện ích demo |
| 4 | Team GitHub của tổ chức *(tuỳ chọn, đang tắt)* | Tổ chức trên GitHub | ❌ **Không** — chỉ hiển thị |

```
function isLecturer() {
  return signedIn() && verified() && (
    listed()
      ? listedRole() == 'lecturer'
      : (lecturerDomain() || isDemoLecturer() || (isDemoUser() && hasDemoRole('lecturer')))
  );
}
```

`app/js/roles.js` là bản sao **để hiển thị** của đúng thứ tự này; client tính sai cũng không sao,
vì mọi thao tác vẫn bị Rules kiểm tra lại. Giao diện có dòng **"Vai trò đến từ"** cho thấy vai trò
đang do tầng nào cấp.

### Không phải provider nào cũng được tin như nhau

```
function verified() {
  return request.auth.token.email_verified == true
    || request.auth.token.firebase.sign_in_provider == 'google.com';
}
```

- **Google** được tin thêm: Google có thẩm quyền với địa chỉ `@gmail.com`, và tài khoản Google
  Workspace nhiều khi không set cờ `email_verified` dù Google đã xác nhận email.
- **GitHub cố ý không** được tin thêm: GitHub cho đổi email chính bất cứ lúc nào và có thể trả về
  email chưa xác minh. Nếu tin GitHub, ai tạo tài khoản GitHub khai `giangvien@tdtu.edu.vn` sẽ
  được cấp vai Giảng viên mà không cần sở hữu hộp thư đó.

### GitHub và việc gộp tài khoản

Firebase để chế độ *một email = một tài khoản*. Đăng nhập Google vào thẳng tài khoản sẵn có cùng
Gmail. GitHub thì không: nếu email đã có tài khoản, Firebase từ chối với
`auth/account-exists-with-different-credential` — vì tự gộp thì ai tạo tài khoản GitHub mang
email của người khác cũng chiếm được tài khoản đó.

App bắt lỗi này, giữ credential GitHub lại, yêu cầu **đăng nhập bằng cách cũ để chứng minh sở
hữu**, rồi mới gộp bằng `linkWithCredential()` (`app/js/auth-ui.js`). Sau khi gộp, GitHub vào
thẳng cùng `uid`, và vì vai trò tra theo allowlist, vai trò cũng giữ nguyên: **đổi cách đăng
nhập, danh tính và vai trò không đổi.**

### Tổ chức có thể khai vai trò, nhưng server không tin

Một GitHub Organization có thể xếp người vào team `students` / `lecturers`. Code có sẵn phần đọc
team (`providers.js`, `idp-card.js`), bật bằng `GITHUB_ORG` trong `config.js` — bản nộp để trống.

Dù bật, `firestore.rules` **không có một dòng nào đọc tới team**, và đó là chủ ý: với GitHub,
vai trò không nằm trong token mà phải để **trình duyệt** gọi `api.github.com` bằng access token
nằm sẵn ở client. Mở DevTools là sửa được, giả được. Dữ liệu đi qua tay client thì không dùng để
cấp quyền. Muốn tin team thật, phải có backend đọc GitHub API rồi ghi vào allowlist.

### Vì sao không chọn cách khác

- **Custom claims** (`setCustomUserClaims()` của Admin SDK) là cách chuẩn hơn trong sản phẩm thật:
  vai trò nằm trong token, Rules không phải đọc thêm tài liệu. Nhóm không dùng vì cần backend chạy
  Admin SDK, ngoài phạm vi demo thuần trình duyệt. Custom claims cũng chỉ cập nhật khi token làm
  mới (tối đa một giờ), còn allowlist có hiệu lực ngay.
- **Tin `hd` (hosted domain) của Google** vẫn là suy vai trò từ danh tính, chỉ chặt hơn một chút,
  và chỉ dùng được với Google.

### Giới hạn còn lại

- Allowlist tra theo email, tức là tin rằng email đã xác minh đủ để xác định một con người. Hệ
  thống thật nên **gắn dòng allowlist với `uid`** sau lần nhận đầu tiên, để email có đổi chủ
  cũng không kéo theo vai trò.
- Rules dùng **email để xác định vai trò** nhưng dùng **`uid` để xác định quyền sở hữu** ghi chú.
  `uid` mới là danh tính thật; email chỉ là thuộc tính của nó.

---

## 2. Quyền của từng vai trò

| Vai trò | Được làm gì |
|---|---|
| **Sinh viên** | Đọc + đăng ghi chú; chỉ sửa/xoá ghi chú của chính mình |
| **Giảng viên** | Chỉ đọc |
| **Quản trị demo** (email trong `demoLecturerEmails()`) | Chỉ đọc + xoá được mọi ghi chú |
| **Khách** | Không có quyền gì — email chưa xác minh |

Rules còn kiểm tra **dữ liệu ghi vào**, không chỉ người ghi: `hasOnly()` giới hạn đúng các trường
được phép, `authorUid` phải trùng `uid` trong token (không đăng bài mạo danh), `createdAt` phải
bằng `request.time` (giờ server), nội dung tối đa 500 ký tự. Mặc định mọi đường dẫn khác bị từ chối.

---

## 3. Cấu trúc mã nguồn

```
app/
  index.html                  markup, không có CSS/JS nội tuyến
  css/styles.css              toàn bộ style
  js/
    config.js                 ★ file duy nhất cần sửa khi dựng lại
    firebase.js               khởi tạo SDK, gom mọi import từ CDN về một chỗ
    dom.js                    tiện ích DOM ($, show, fatal)
    state.js                  trạng thái dùng chung + móc rerender (tránh phụ thuộc vòng)
    errors.js                 mã lỗi Firebase → câu tiếng Việt
    roles.js                  xét vai trò (bản sao để hiển thị của firestore.rules)
    providers.js              provider OAuth + đọc team GitHub (tuỳ chọn)
    auth-ui.js                đăng ký, đăng nhập, xác minh email, gộp tài khoản GitHub
    notes.js                  danh sách ghi chú trên Firestore
    jwt.js                    xem / gửi / sửa ID Token
    idp-card.js               thẻ "nhà cung cấp danh tính khai gì về bạn"
    app.js                    điểm vào: nối các module, hàm render()
firestore.rules               dán vào Firebase Console, không deploy cùng app
```

`app.js` là điểm vào duy nhất và sở hữu `render()`; nó đăng ký hàm này vào `state.js`, các module
khác gọi `rerender()` thay vì import ngược lại `app.js`, nên không có phụ thuộc vòng.

---

## 4. Dựng lại từ đầu

`app/js/config.js` đã điền sẵn cho project Firebase **`seminartwelve-1bb47`**. Dùng project khác
thì làm đủ các bước dưới đây. Thông báo lỗi trong app trỏ về đúng số bước ở mục này.

**Bước 1 — Tạo project.** https://console.firebase.google.com → **Create a project** → tắt
Google Analytics → **Create**.

**Bước 2 — Bật Email/Password và Google.** Ô **Search for products** → `Authentication` →
**Get started** → tab **Sign-in method**: bật **Email/Password** và **Google**. Sang tab
**Settings → User account linking** → chọn **Link accounts that use the same email** (nếu chọn ô
còn lại, mỗi provider tạo một tài khoản riêng và luồng gộp GitHub không xảy ra).

**Bước 3 — Bật GitHub.** Sign-in method → **Add new provider → GitHub** → chép **Callback URL**.
Trên GitHub: https://github.com/settings/developers → **New OAuth App** → dán Callback URL vào
*Authorization callback URL* → **Register** → chép Client ID, tạo Client secret → dán vào Firebase
→ **Save**. Chỉ tạo **một** OAuth App — Firebase chỉ lưu một cặp Client ID + secret.

**Bước 3b — GitHub Organization (tuỳ chọn).** Tạo tổ chức miễn phí, hai team slug `students` và
`lecturers`, mời thành viên (phải chấp nhận lời mời). Tổ chức → **Settings → Third-party Access**
→ cấp quyền cho OAuth App. Điền `GITHUB_ORG` và `GITHUB_TEAM_MAP` trong `config.js`. Access token
GitHub không sống qua F5, nên thẻ team biến mất khi tải lại trang.

**Bước 4 — Firestore.** **Search for products** → `Firestore` → **Create database** →
`asia-southeast1` → **Start in production mode**.

**Bước 5 — Cấu hình.** **Project settings** → *Your apps* → **`</>`** → **Register app** → chép
`firebaseConfig` vào `app/js/config.js`. Để trống hoặc còn chữ `DAN_` thì trang dừng với banner đỏ.

**Bước 6 — Security Rules.** Firestore → tab **Rules** → dán toàn bộ `firestore.rules` →
**Publish**. Đổi email quản trị demo thì sửa giống hệt ở `demoLecturerEmails()` (rules) và
`DEMO_LECTURER_EMAILS` (`config.js`).

**Bước 7 — Allowlist.** Firestore → **Start collection** `allowlist` → mỗi người một tài liệu:
ID là email **viết thường**, trường `role` = `student` hoặc `lecturer`.

**Bước 8 — Deploy.** https://app.netlify.com/drop (đăng nhập trước) → kéo **thư mục `app/`** vào →
bấm **Make public**. Mở bằng link thật, không dùng khung preview nhúng (`embed-…netlify.app`).

**Bước 9 — Authorized domains.** Authentication → **Settings → Authorized domains** → thêm tên
miền Netlify, **không có `https://`**.

### Chạy tại máy

ES module không chạy khi mở file bằng double-click (`file://` bị chặn). Phục vụ qua HTTP:

```bash
cd app
python3 -m http.server 8000      # mở http://localhost:8000
```

`localhost` có sẵn trong Authorized domains.

---

## 5. Kiểm tra từng chức năng

Mỗi dòng ghi thao tác và kết quả phải thấy. Dùng một Gmail **khác** email trong
`DEMO_LECTURER_EMAILS` — email quản trị demo có vai trò cố định nên không bao giờ thấy màn chọn
vai trò.

### Xác thực

| Thao tác | Phải thấy |
|---|---|
| Đăng ký Email/Password bằng mail trường | Vai trò **Khách**, banner vàng — chưa xác minh thì chưa có quyền |
| Bấm link trong email → **Tôi đã xác minh** | Vai trò đổi thành **Sinh viên** |
| Đăng nhập Google | Vào thẳng; *Email đã xác minh* = "Có (Google xác nhận)" |
| Đăng nhập GitHub có email chưa xác minh | Vẫn là **Khách** — `verified()` không tin GitHub |
| **Xem token** | ID Token ba phần: header, payload, chữ ký |
| **Gửi lên server kiểm tra** | `valid: true` |
| **Sửa token rồi gửi** (đổi email trong payload) | `INVALID_ID_TOKEN` — sửa payload thì chữ ký không còn khớp |

### Allowlist — vai trò do admin cấp

| Thao tác | Phải thấy |
|---|---|
| Gmail **không** có trong allowlist đăng nhập | Màn **Chọn vai trò** (chế độ demo); *Vai trò đến từ* = `tự chọn — CHẾ ĐỘ DEMO` |
| Admin thêm Gmail đó vào allowlist (`role: student`), người dùng **F5** | Màn chọn vai trò biến mất; *Vai trò đến từ* = `allowlist (admin cấp trước)` |
| Thêm mail `@student.tdtu.edu.vn` vào allowlist với `role: lecturer` | Mail đó thành **Giảng viên** — allowlist thắng tên miền |

### Gộp tài khoản — vai trò đi theo người, không theo provider

Cần một tài khoản GitHub có email chính **trùng** Gmail đang thử, đã xác minh trên GitHub.

| Thao tác | Phải thấy |
|---|---|
| Đăng nhập Google, ghi lại UID, đăng xuất | *Cách đăng nhập đã gộp* = `Google` |
| Đăng nhập GitHub | Khung vàng: email đã có tài khoản bằng cách khác, Firebase không tự gộp |
| Bấm **Đăng nhập Google để gộp** | Khung đóng; *Cách đăng nhập đã gộp* = `Google, GitHub` |
| Đăng xuất, đăng nhập GitHub lần nữa | Vào thẳng, **cùng UID**, cùng vai trò, cùng *Vai trò đến từ* |

Chạy lại từ đầu: Authentication → **Users** → xoá tài khoản đó.

### Phân quyền phía server

| Thao tác | Phải thấy |
|---|---|
| Sinh viên đăng và xoá ghi chú của mình | Được |
| Giảng viên bấm **Thử ghi dù không có quyền** (nút cố tình bỏ qua giao diện) | `permission-denied` — server chặn, không phải trình duyệt |
| Rules Playground: **create** `/allowlist/test@gmail.com`, đã đăng nhập, `email_verified = true`, dữ liệu `{ "role": "lecturer" }` | **Simulated write denied** tại `allow write: if false` |

---

## 6. Lỗi thường gặp

| Hiện tượng | Nguyên nhân & cách sửa |
|---|---|
| Banner đỏ "Chưa dán cấu hình Firebase" | `firebaseConfig` trống hoặc còn `DAN_` (Bước 5) |
| Banner đỏ "phải được mở qua một đường link web" | Đang mở file trực tiếp — phục vụ qua HTTP hoặc link Netlify (Bước 8) |
| "Tên miền … chưa được thêm vào Authorized domains" | Bước 9, hoặc dán nhầm có `https://` |
| Tên miền báo lỗi là `embed-...netlify.app` | Đang xem khung preview nhúng của Netlify — mở link thật ở tab mới |
| "Phương thức đăng nhập này chưa được bật" | Provider chưa bật (Bước 2/3) |
| `redirect_uri mismatch` khi đăng nhập GitHub | Callback URL bên GitHub phải giống Firebase từng ký tự |
| GitHub vào thẳng với **UID mới**, không hiện khung gộp | *User account linking* chưa đặt *Link accounts that use the same email* (Bước 2) |
| "Sai email hoặc mật khẩu" dù gõ đúng | Tài khoản tạo ở project khác; danh sách user không chuyển giữa project |
| Đăng nhập đúng nhưng `permission-denied` | Email chưa xác minh, hoặc Rules chưa Publish (Bước 6) |
| Email trong allowlist vẫn hiện màn chọn vai trò | Document ID phải là email viết thường, không thừa dấu cách; rồi F5 |
| Không hiện màn chọn vai trò với Gmail cá nhân | Gmail đó là email quản trị demo — dùng Gmail khác |
