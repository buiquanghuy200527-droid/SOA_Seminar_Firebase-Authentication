/**
 * PHA 2 — Phân quyền: danh sách ghi chú trên Firestore.
 *
 * Giao diện ẩn/hiện theo vai trò, nhưng mọi thao tác vẫn bị Security Rules
 * kiểm tra ở server. Nút "Thử ghi dù không có quyền" cố tình bỏ qua giao diện
 * để chứng minh điều đó.
 */
import {
  auth, db, collection, addDoc, deleteDoc, doc,
  query, orderBy, limit, onSnapshot, serverTimestamp,
} from "./firebase.js";
import { NOTES_LIMIT } from "./config.js";
import { $, show } from "./dom.js";
import { errText } from "./errors.js";
import { state } from "./state.js";
import { isAdminUser } from "./roles.js";

export function listenNotes() {
  const q = query(collection(db, "notes"), orderBy("createdAt", "desc"), limit(NOTES_LIMIT));
  state.unsubscribeNotes = onSnapshot(
    q,
    (snap) => {
      const list = $("notes");
      list.innerHTML = "";
      if (snap.empty) {
        list.innerHTML = '<li class="muted">Chưa có ghi chú nào.</li>';
        return;
      }
      snap.forEach((d) => list.appendChild(noteItem(d.id, d.data())));
    },
    (e) => {
      // Người không có quyền đọc rơi vào đây — lỗi do SERVER trả về, không phải client tự chặn.
      $("notes").innerHTML = "";
      show($("notes-msg"), "Không đọc được: " + errText(e), "error");
    }
  );
}

export function stopListeningNotes() {
  if (state.unsubscribeNotes) {
    state.unsubscribeNotes();
    state.unsubscribeNotes = null;
  }
}

function noteItem(id, n) {
  const li = document.createElement("li");
  const when = n.createdAt?.toDate().toLocaleString("vi-VN") || "đang lưu…";
  li.innerHTML =
    '<div class="note-meta"><b></b> <span class="muted"></span></div>' +
    '<div class="note-text"></div>';
  li.querySelector("b").textContent = n.authorName || n.authorEmail;
  li.querySelector(".muted").textContent = `${n.authorEmail} · ${when}`;
  // textContent chứ không innerHTML — nội dung người dùng không chèn được HTML.
  li.querySelector(".note-text").textContent = n.text;

  const own = n.authorUid === auth.currentUser?.uid;
  if (isAdminUser() || (state.currentRole === "student" && own)) {
    const del = document.createElement("button");
    del.className = "link danger-text";
    del.textContent = own ? "Xoá" : "Xoá (quản trị)";
    del.onclick = () =>
      deleteDoc(doc(db, "notes", id))
        .catch((e) => show($("notes-msg"), errText(e), "error"));
    li.querySelector(".note-meta").appendChild(del);
  }
  return li;
}

async function writeNote(text) {
  const u = auth.currentUser;
  await addDoc(collection(db, "notes"), {
    text,
    authorUid: u.uid,
    authorEmail: u.email,
    authorName: u.displayName || u.email,
    createdAt: serverTimestamp(),
  });
}

export function initNotesUI() {
  $("form-note").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const text = $("note-text").value.trim();
    if (!text) return;
    try {
      await writeNote(text);
      $("note-text").value = "";
      show($("notes-msg"), "Đã đăng.", "ok");
    } catch (e) { show($("notes-msg"), errText(e), "error"); }
  });

  // Giảng viên cố tình ghi — giao diện KHÔNG chặn, để chứng minh server chặn.
  $("btn-try-write").addEventListener("click", async () => {
    try {
      await writeNote("Thử ghi từ tài khoản không có quyền ghi");
      show($("notes-msg"),
        "Ghi được?! Kiểm tra lại Security Rules đã Publish chưa (README.md, Bước 6).",
        "error");
    } catch (e) { show($("notes-msg"), errText(e), "error"); }
  });
}
