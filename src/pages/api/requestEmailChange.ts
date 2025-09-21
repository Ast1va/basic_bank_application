import type { NextApiRequest, NextApiResponse } from "next";
import { admin } from "../../../lib/firebaseAdmin";
import { v4 as uuidv4 } from "uuid";
import nodemailer from "nodemailer";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { uid, oldEmail, newEmail, displayName } = req.body;
  if (!uid || !oldEmail || !newEmail) {
    return res.status(400).json({ success: false, message: "Eksik parametre" });
  }

  try {
    const token = uuidv4();
    await admin.firestore().collection("emailChangeRequests").doc(token).set({
      uid,
      oldEmail,
      newEmail,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      verified: false,
    });

    // Doğrulama linkini oluştur
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const verifyLink = `${baseUrl}/verifyEmailChange?id=${token}`;

    // Nodemailer transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // İsme özel mail içeriği
    const isim = displayName ? displayName : "Sayın Kullanıcımız";
    const html = `
      <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;background:#f9f9f9;border-radius:8px;padding:24px 18px">
        <h2 style="color:#3b82f6;">Merhaba ${isim},</h2>
        <p>Bankacılık hesabınızda e-posta adresinizi <b>${newEmail}</b> olarak güncellemek için bir talepte bulundunuz.</p>
        <p>
          Değişikliği onaylamak ve hesabınızı güvenceye almak için lütfen aşağıdaki butona tıklayın:
        </p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${verifyLink}" style="background:#3b82f6;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:bold;">E-posta Adresimi Güncelle</a>
        </div>
        <p style="font-size:15px;color:#555;">
          Eğer bu işlemi siz yapmadıysanız, bu mesajı dikkate almayabilirsiniz.<br>
          Güvenliğiniz için herhangi bir sorunda lütfen bizimle iletişime geçin.
        </p>
        <hr style="border:none;border-top:1px solid #ddd;margin:32px 0;">
        <div style="font-size:13px;color:#999;">Bu mesaj Basic Bank Uygulaması tarafından otomatik olarak gönderilmiştir.</div>
      </div>
    `;
    const text = `
Merhaba ${isim},
Bankacılık hesabınızda e-posta adresinizi ${newEmail} olarak güncellemek için bir talepte bulundunuz.
Değişikliği onaylamak için aşağıdaki bağlantıya tıklayın:
${verifyLink}

Eğer bu işlemi siz yapmadıysanız, bu mesajı dikkate almayabilirsiniz.
Basic Bank Uygulaması
    `;

    await transporter.sendMail({
      from: `"Basic Bank" <${process.env.EMAIL_USER}>`,
      to: newEmail,
      subject: "E-posta Değişikliği Onayı",
      text,
      html,
    });

    return res.status(200).json({ success: true, verifyLink });
  } catch (err) {
    console.error("E-posta değişim isteği/mail hatası:", err);
    return res.status(500).json({ success: false, message: "Sunucu hatası." });
  }
}
