# 🏦 Basic Bank Application

Firebase + Next.js tabanlı, sade ama güçlü bir bankacılık uygulaması.  
Kullanıcılar bakiye görüntüleyebilir, para transferi yapabilir, bildirim alabilir.  
Admin ise tüm hesapları yönetebilir ve bildirim gönderebilir.

---

## 🚀 Özellikler

### 👤 Kullanıcı Özellikleri
- Hesap bakiyesi görüntüleme
- Para transferi yapma
- Transfer geçmişini inceleme
- Bildirim alma ve okundu olarak işaretleme

### 🛠️ Admin Paneli
- Tüm kullanıcı hesaplarını görüntüleme
- Bakiye güncelleme
- Hesap aktif/pasif durumu değiştirme
- Tüm transferleri görüntüleme
- Bildirim gönderme

---

## 🧪 Kurulum ve Geliştirme

### 1. Projeyi Klonla

```bash
git clone https://github.com/Ast1va/basic_bank_application.git
cd basic_bank_application
```

### 2. Bağımlılıkları Yükle

```bash
npm install
```

### 3. Uygulamayı Başlat

```bash
npm run dev
```

---

## 🔐 Firestore Güvenlik Kuralları

Uygulama Firebase Firestore ile çalışır ve güvenlik kuralları kullanıcı ve admin yetkilerini ayırır.  
- Kullanıcı yalnızca kendi verilerini görebilir/güncelleyebilir  
- Admin bildirim gönderebilir, bakiye değiştirebilir  
- Bildirimler sadece ilgili kullanıcı tarafından görülebilir

---

## 📌 Gelecek Planları

- 🤖 Yapay zekâ entegrasyonu (AI asistan)
- 📱 Mobil uyumluluk
- 🎨 Gelişmiş kullanıcı arayüzü
- 📊 Raporlama ve analiz ekranları

---

## 👨‍💻 Geliştirenler

| İsim     | Rol                    |
|----------|------------------------|
| Yağız    | Junior Developer |
| Burak    | Junior Developer |

---

## 📄 Lisans

Bu proje MIT lisansı ile lisanslanmıştır. Ayrıntılar için [LICENSE](./LICENSE) dosyasına bakınız.
