import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/firebase/config";
import toast from "react-hot-toast";

const PasswordResetForm = ({ onClose }: { onClose: () => void }) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading("📧 Mail gönderiliyor...");

    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Şifre sıfırlama maili gönderildi! Lütfen e-posta adresini kontrol et.", { id: toastId });
      onClose(); 
    } catch {
      toast.error("E-posta bulunamadı veya geçersiz. Lütfen tekrar deneyin.", { id: toastId });
      
    }
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleReset}
      className="bg-white p-6 rounded-lg shadow-lg w-[90vw] max-w-xs flex flex-col gap-3 relative"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-2 right-3 text-gray-400 hover:text-gray-700 text-lg"
        title="Kapat"
      >
        ×
      </button>
      <h3 className="font-semibold text-center mb-2">Şifremi Unuttum</h3>
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        placeholder="E-posta adresiniz"
        className="border px-3 py-2 rounded"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {loading ? "Gönderiliyor..." : "Şifre Sıfırlama Maili Gönder"}
      </button>
    </form>
  );
};

export default PasswordResetForm;
