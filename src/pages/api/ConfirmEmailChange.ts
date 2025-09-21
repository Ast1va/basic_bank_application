import type { NextApiRequest, NextApiResponse } from "next";
import { admin } from "../../../lib/firebaseAdmin";

type Data = {
  success: boolean;
  message?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { uid, newEmail, token } = req.body;

  if (!uid || !newEmail || !token) {
    return res.status(400).json({ success: false, message: "Eksik parametre" });
  }

  try {
    // Firestore'dan token ile belgeyi Admin SDK ile oku
    const requestRef = admin.firestore().collection("emailChangeRequests").doc(token);
    const requestSnap = await requestRef.get();

    if (!requestSnap.exists) {
      return res.status(400).json({ success: false, message: "Geçersiz veya süresi dolmuş bağlantı." });
    }

    const data = requestSnap.data() as { uid: string; newEmail: string; verified: boolean };

    if (data.verified) {
      return res.status(400).json({ success: false, message: "Bu bağlantı zaten kullanılmış." });
    }

    if (data.uid !== uid || data.newEmail !== newEmail) {
      return res.status(400).json({ success: false, message: "Veriler eşleşmiyor." });
    }

    // Kullanıcı e-postasını güncelle
    await admin.auth().updateUser(uid, { email: newEmail });

    // Firestore'da isteği onaylandı olarak işaretle
    await requestRef.update({ verified: true, verifiedAt: new Date() });

    return res.status(200).json({ success: true, message: "E-posta başarıyla güncellendi." });
  } catch (error) {
    console.error("E-posta güncelleme hatası:", error);
    return res.status(500).json({ success: false, message: "Sunucu hatası." });
  }
}
