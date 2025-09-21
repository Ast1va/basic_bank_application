import { useState } from "react";
import { useRouter } from "next/router";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { User, signOut } from "firebase/auth";
import { auth } from "@/firebase/config";
import {
  updateUserProfile,
  changeUserPassword,
} from "@/firebase/profileUpdateService";
import { createEmailChangeRequest } from "@/firebase/emailChangeService";
import {
  isNotEmpty,
  isPositiveNumber,
  isValidPassword,
  isValidEmail,
} from "@/utils/validators";
import { updateFirestoreAccountInfo } from "@/firebase/accountService";
import toast from "react-hot-toast";

interface AccountData {
  birthDate?: string;
  occupation?: string;
  avgIncome?: number;
  email?: string;
}

interface Props {
  user: User;
  accountData: AccountData;
}

export default function ProfileUpdateForm({ user, accountData }: Props) {
  const router = useRouter();

  const [birthDate, setBirthDate] = useState<Date | null>(
    accountData?.birthDate ? new Date(accountData.birthDate) : null
  );
  const [occupation, setOccupation] = useState(accountData?.occupation || "");
  const [avgIncome, setAvgIncome] = useState(accountData?.avgIncome || 0);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [oldPasswordForChange, setOldPasswordForChange] = useState("");
  const [newEmail, setNewEmail] = useState("");

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showOldPasswordForChange, setShowOldPasswordForChange] = useState(false);
  
  // Loading states
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  const toggleNewPassword = () => setShowNewPassword(!showNewPassword);
  const toggleCurrentPassword = () => setShowCurrentPassword(!showCurrentPassword);
  const toggleOldPasswordForChange = () => setShowOldPasswordForChange(!showOldPasswordForChange);

  const handleProfileUpdate = async () => {
    if (!birthDate || !isNotEmpty(occupation) || !isPositiveNumber(avgIncome)) {
      toast.error("Lütfen tüm bilgileri geçerli şekilde girin.");
      return;
    }

    setIsUpdatingProfile(true);
    const toastId = toast.loading("Profil bilgileri güncelleniyor...");

    try {
      const formattedDate = birthDate.toISOString();
      await updateUserProfile(user, { birthDate: formattedDate, occupation, avgIncome });
      await updateFirestoreAccountInfo(user.uid, {
        birthDate: formattedDate,
        occupation,
        avgIncome,
      });
      toast.success("Profil bilgileri güncellendi.", { id: toastId });
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Profil güncelleme başarısız.", { id: toastId });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!oldPasswordForChange || !isValidPassword(newPassword)) {
      toast.error("Eski şifreyi girin ve yeni şifre en az 6 karakter olmalı.");
      return;
    }

    setIsChangingPassword(true);
    const toastId = toast.loading("Şifre güncelleniyor...");

    try {
      await changeUserPassword(user, oldPasswordForChange, newPassword);
      toast.success("Şifre güncellendi.", { id: toastId });
      setNewPassword("");
      setOldPasswordForChange("");
    } catch (error) {
      console.error("Password change error:", error);
      toast.error("Şifre değiştirilemedi.", { id: toastId });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleEmailChange = async () => {
    if (!isValidEmail(newEmail)) {
      toast.error("Geçerli bir e-posta adresi giriniz.");
      return;
    }
    if (!currentPassword || newEmail === user.email) {
      toast.error("Yeni e-posta adresi mevcut adresinizle aynı olamaz ve şifre girilmelidir.");
      return;
    }

    setIsChangingEmail(true);
    const toastId = toast.loading("E-posta değişim talebi gönderiliyor...");

    try {
      const verifyLink = await createEmailChangeRequest(user, newEmail);
      toast.success("Yeni e-posta adresinize onay bağlantısı gönderildi.", { id: toastId });
      console.log("📩 Doğrulama linki:", verifyLink);
      await signOut(auth);
      router.push("/login");
    } catch (err: unknown) {
      console.error("Email change error:", err);
      if (err instanceof Error) {
        toast.error(err.message, { id: toastId });
      } else {
        toast.error("E-posta değişim bağlantısı oluşturulamadı.", { id: toastId });
      }
    } finally {
      setIsChangingEmail(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      <button
        onClick={() => router.push("/")}
        className="text-sm text-gray-600 hover:underline"
      >
        ← Ana sayfaya dön
      </button>

      <h1 className="text-2xl font-bold">Profil Bilgilerini Güncelle</h1>

      {/* Profil bilgileri */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Profil Bilgileri</h2>

        <label>Doğum Tarihi:</label>
        <DatePicker
          selected={birthDate}
          onChange={(date: Date | null) => setBirthDate(date)}
          dateFormat="dd/MM/yyyy"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          className="border px-2 py-1 rounded w-full"
          maxDate={new Date()}
        />

        <label>Meslek:</label>
        <input
          type="text"
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          className="border px-2 py-1 rounded w-full"
        />

        <label>Aylık Ortalama Gelir (₺):</label>
        <input
          type="number"
          value={avgIncome}
          onChange={(e) => setAvgIncome(Number(e.target.value))}
          className="border px-2 py-1 rounded w-full"
        />

        <button
          onClick={handleProfileUpdate}
          disabled={isUpdatingProfile}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded"
        >
          {isUpdatingProfile ? "Güncelleniyor..." : "Profil Bilgilerini Güncelle"}
        </button>
      </div>

      {/* E-posta güncelleme */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">E-posta Güncelleme</h2>

        <div>
          <label>Şu Anki E-posta:</label>
          <div className="font-mono text-gray-800 mb-1">{user.email}</div>
        </div>

        <label>Yeni E-posta:</label>
        <input
          type="email"
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          className="border px-2 py-1 rounded w-full"
          placeholder="Yeni e-posta adresinizi girin"
        />

        <label>Şu Anki Şifre:</label>
        <div className="flex items-center gap-2">
          <input
            type={showCurrentPassword ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="border px-2 py-1 rounded w-full"
          />
          <button onClick={toggleCurrentPassword} className="text-xl">
            {showCurrentPassword ? "🙉" : "🙈"}
          </button>
        </div>

        <button
          onClick={handleEmailChange}
          disabled={isChangingEmail}
          className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white px-4 py-2 rounded"
        >
          {isChangingEmail ? "Gönderiliyor..." : "E-posta Güncelle ve Doğrulama Gönder"}
        </button>
      </div>

      {/* Şifre değiştirme */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Şifre Değiştirme</h2>

        <label>Eski Şifre:</label>
        <div className="flex items-center gap-2">
          <input
            type={showOldPasswordForChange ? "text" : "password"}
            value={oldPasswordForChange}
            onChange={(e) => setOldPasswordForChange(e.target.value)}
            className="border px-2 py-1 rounded w-full"
          />
          <button onClick={toggleOldPasswordForChange} className="text-xl">
            {showOldPasswordForChange ? "🙉" : "🙈"}
          </button>
        </div>

        <label>Yeni Şifre:</label>
        <div className="flex items-center gap-2">
          <input
            type={showNewPassword ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="border px-2 py-1 rounded w-full"
            placeholder="En az 6 karakter"
          />
          <button onClick={toggleNewPassword} className="text-xl">
            {showNewPassword ? "🙉" : "🙈"}
          </button>
        </div>

        <button
          onClick={handlePasswordChange}
          disabled={isChangingPassword}
          className="bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-300 text-white px-4 py-2 rounded"
        >
          {isChangingPassword ? "Güncelleniyor..." : "Şifreyi Güncelle"}
        </button>
      </div>
    </div>
  );
}