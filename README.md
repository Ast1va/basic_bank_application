# 🏦 Basic Bank Application

Bu proje, kullanıcıların banka hesaplarını yönetebileceği bir uygulamadır.  
Ayrıca bir **admin paneli** üzerinden tüm kullanıcı hesaplarına erişilip bakiye güncellenebilir veya silinebilir.

---

## 🚀 Özellikler

- ✅ Firebase Authentication ile kullanıcı kayıt & giriş
- ✅ Admin paneli (Yalnızca admin@gmail.com kullanıcı erişebilir)
- ✅ Firestore veritabanı ile hesap saklama
- ✅ Zustand ile global state yönetimi
- ✅ Hesap bakiyesi görüntüleme, güncelleme ve silme
- ✅ Admin panelinde tüm kullanıcıların hesaplarına erişim

---

## 🛠️ Kullanılan Teknolojiler

- [Next.js](https://nextjs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Firebase](https://firebase.google.com/) (Auth + Firestore)
- [Zustand](https://github.com/pmndrs/zustand)
- TailwindCSS (isteğe bağlı)

---

## 📦 Kurulum

### 1. Reposu klonla

```bash
git clone https://github.com/kullanici-adi/basic_bank_application.git
cd basic_bank_application
```

### 2. Gerekli paketleri yükle

```bash
npm install
```

### 3. Firebase yapılandırmasını yap

`src/firebase/config.ts` dosyasındaki bilgileri kendi Firebase projenize göre doldurun:

```ts
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  ...
};
```

### 4. Firestore’da `/users` ve `/accounts` koleksiyonlarını oluşturun

Örnek admin kullanıcı dokümanı:

```
/users/{uid}
{
  email: "admin@gmail.com",
  isAdmin: true
}
```

---

## 🧪 Geliştirme

```bash
npm run dev
```

### 🔑 Giriş Bilgisi (test için)

- Email: `admin@gmail.com`
- Şifre: `123456` (Firebase Auth üzerinde tanımlı olmalı)

---

## 📁 Proje Yapısı

```
src/
├── components/        → Arayüz bileşenleri (LoginForm, RegisterForm, AccountItem)
├── firebase/          → Firebase config ve servisler
├── pages/             → Next.js sayfaları (login, register, admin)
├── store/             → Zustand store
├── types/             → Tip tanımlamaları (User, Account)
```

---

## 📜 Lisans

Bu proje MIT lisansı ile lisanslanmıştır.  
Özgürce kullanabilir, geliştirebilir ve dağıtabilirsiniz.

---

## 👨‍💻 Geliştiriciler

**Yağız ve Burak** — 
Proje ile ilgili her türlü öneri ve geri bildirim için PR ve Issue gönderebilirsiniz!
