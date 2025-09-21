import {
  User,
  updateProfile,
  updatePassword,
  sendEmailVerification,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateEmail,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";

/**
 * 🔄 Kullanıcının profil bilgilerini günceller (Firebase Auth üzerindeki displayName dışı veriler Firestore'da tutulur)
 */
export const updateUserProfile = async (
  user: User,
  profileData: {
    birthDate?: string;
    occupation?: string;
    avgIncome?: number;
  }
) => {
  await updateProfile(user, {
    displayName: user.displayName || "",
  });

  // Firestore güncellemesi ayrı bir servis (accountService) ile yapılır
  return profileData;
};

/**
 * 🔒 Şifre güncelleme (önce eski şifre ile doğrulama yapılır)
 */
export const changeUserPassword = async (
  user: User,
  currentPassword: string,
  newPassword: string
) => {
  const credential = EmailAuthProvider.credential(user.email || "", currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
};

/**
 * ✉️ Yeni e-posta adresine doğrulama gönderir ve e-posta değiştirir
 * - Mevcut e-posta doğrulanmamışsa işlem engellenir
 * - Şifre ile yeniden doğrulama yapılır
 * - Firebase Auth üzerindeki e-posta gerçekten değiştirilir
 * - Yeni e-postaya doğrulama bağlantısı gönderilir
 */
export const changeUserEmail = async (
  user: User,
  currentPassword: string,
  newEmail: string
) => {
  try {
    await user.reload(); // 🔄 Kullanıcı bilgilerini güncelle

    if (!user.emailVerified) {
      throw new Error("Mevcut e-posta adresiniz henüz doğrulanmamış. Lütfen önce onu onaylayın.");
    }

    const credential = EmailAuthProvider.credential(user.email || "", currentPassword);
    await reauthenticateWithCredential(user, credential);

    await updateEmail(user, newEmail); // 🔁 E-posta değiştir
    await sendEmailVerification(user); // 📩 Yeni e-postaya doğrulama gönder

    console.log("Yeni e-posta adresine doğrulama bağlantısı gönderildi.");
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof FirebaseError) {
      console.error("E-posta güncelleme hatası:", error.code, error.message);

      if (error.code === "auth/email-already-in-use") {
        throw new Error("Bu e-posta adresi başka bir kullanıcı tarafından kullanılıyor.");
      }
      if (error.code === "auth/invalid-email") {
        throw new Error("Geçersiz e-posta adresi.");
      }
      if (error.code === "auth/wrong-password") {
        throw new Error("Şu anki şifre hatalı.");
      }
    } else {
      console.error("E-posta güncelleme sırasında bilinmeyen hata:", error);
    }

    throw error;
  }
};
