import { GetServerSideProps } from "next";
import Head from "next/head";
import { admin } from "../../lib/firebaseAdmin";

interface Props {
  success: boolean;
  message: string;
}

export default function VerifyEmailChangePage({ success, message }: Props) {
  return (
    <>
      <Head>
        <title>E-posta Doğrulama</title>
      </Head>
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="bg-white p-6 rounded shadow-md max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">
            {success ? "✅ E-posta Güncellendi" : "❌ İşlem Başarısız"}
          </h1>
          <p className="text-gray-700">{message}</p>
        </div>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const token = context.query.id as string;

  if (!token) {
    return {
      props: {
        success: false,
        message: "Geçersiz bağlantı.",
      },
    };
  }

  try {
    // Belgeyi Firestore'dan oku
    const requestRef = admin.firestore().collection("emailChangeRequests").doc(token);
    const snap = await requestRef.get();

    if (!snap.exists) {
      return {
        props: {
          success: false,
          message: "İstek bulunamadı veya süresi dolmuş.",
        },
      };
    }

    const data = snap.data() as { uid: string; newEmail: string; verified: boolean };

    if (data.verified) {
      return {
        props: {
          success: false,
          message: "Bu bağlantı zaten kullanılmış.",
        },
      };
    }

    try {
      // E-posta değişikliği dene
      await admin.auth().updateUser(data.uid, { email: data.newEmail });
      await requestRef.update({ verified: true, verifiedAt: new Date() });

      return {
        props: {
          success: true,
          message: "E-posta adresiniz başarıyla güncellendi. Artık bu adresle giriş yapabilirsiniz.",
        },
      };
    } catch (err) {
      // Burada explicit any yerine güvenli tip cast kullanıyoruz
      const error = err as { errorInfo?: { code?: string }, message?: string };

      let message = "Sunucu hatası. Lütfen daha sonra tekrar deneyin.";
      if (
        error?.errorInfo?.code === "auth/email-already-exists" ||
        error?.message?.includes?.("email address is already in use")
      ) {
        message = "Bu e-posta adresi başka bir kullanıcı tarafından zaten kullanılıyor!";
      }
      if (
        error?.errorInfo?.code === "auth/user-not-found" ||
        error?.message?.includes?.("no user record")
      ) {
        message = "Kullanıcı kaydı bulunamadı.";
      }
      return {
        props: {
          success: false,
          message,
        },
      };
    }
  } catch (err) {
    console.error("Sunucu hatası:", err);
    return {
      props: {
        success: false,
        message: "Sunucu hatası. Lütfen daha sonra tekrar deneyin.",
      },
    };
  }
};
