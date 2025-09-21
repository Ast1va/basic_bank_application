import { User } from "firebase/auth";

// Bu fonksiyon API route'a POST isteği atar, direkt Firestore'a erişmez!
export const createEmailChangeRequest = async (user: User, newEmail: string) => {
  const res = await fetch("/api/requestEmailChange", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      uid: user.uid,
      oldEmail: user.email,
      newEmail,
      displayName: user.displayName || null, // displayName ekleniyor
    }),
  });

  const data = await res.json();

  if (!data.success) throw new Error(data.message);
  return data.verifyLink; // API'nin döndürdüğü doğrulama bağlantısı
};
