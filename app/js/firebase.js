/**
 * Khởi tạo Firebase và gom mọi import từ SDK về một chỗ.
 * Các module khác import từ file này, không import thẳng từ CDN —
 * nhờ vậy đổi phiên bản SDK chỉ phải sửa ba dòng URL ngay bên dưới.
 *
 * (Đường dẫn import tĩnh bắt buộc là chuỗi literal, không ghép biến được,
 *  nên phiên bản SDK nằm ở đây chứ không nằm trong config.js.)
 */
import { firebaseConfig } from "./config.js";
import { fatal } from "./dom.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
  getAuth, onAuthStateChanged, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendEmailVerification, sendPasswordResetEmail, updateProfile,
  GoogleAuthProvider, GithubAuthProvider, signInWithPopup, getAdditionalUserInfo,
  linkWithCredential,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
  getFirestore, collection, addDoc, deleteDoc, doc, getDoc, setDoc,
  query, orderBy, limit, onSnapshot, serverTimestamp,
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

// Bắt mọi trường hợp chưa điền: placeholder, rỗng, hoặc thiếu projectId.
if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("DAN_")
    || !firebaseConfig.projectId || firebaseConfig.projectId.startsWith("DAN_")) {
  fatal(
    "Chưa dán cấu hình Firebase. Mở <code>app/js/config.js</code> và làm theo " +
    "README.md, Bước 5."
  );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

auth.languageCode = "vi"; // email xác minh / quên mật khẩu bằng tiếng Việt

export {
  onAuthStateChanged, signOut,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  sendEmailVerification, sendPasswordResetEmail, updateProfile,
  GoogleAuthProvider, GithubAuthProvider, signInWithPopup, getAdditionalUserInfo,
  linkWithCredential,
  collection, addDoc, deleteDoc, doc, getDoc, setDoc,
  query, orderBy, limit, onSnapshot, serverTimestamp,
};
