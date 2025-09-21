import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/firebase/config";
import ProfileUpdateForm from "@/components/forms/ProfileUpdateForm";
import toast from "react-hot-toast";
import { getDoc, doc } from "firebase/firestore";
import { db } from "@/firebase/config";

// ✅ AccountData tipi tanımı
interface AccountData {
  birthDate?: string;
  occupation?: string;
  avgIncome?: number;
  email?: string;
  name?: string;
  balance?: number;
}

export default function ProfilePage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        toast.error("Giriş yapmalısınız");
        router.push("/login");
        return;
      }

      setUser(currentUser);

      try {
        const docRef = doc(db, "accounts", currentUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setAccountData(docSnap.data() as AccountData);
        } else {
          toast.error("Hesap verisi bulunamadı");
        }
      } catch {
        toast.error("Hesap verisi alınamadı");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return <p className="text-center mt-10">Yükleniyor...</p>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Profil Bilgilerini Güncelle</h1>
      {user && accountData && (
        <ProfileUpdateForm user={user} accountData={accountData} />
      )}
    </div>
  );
}
