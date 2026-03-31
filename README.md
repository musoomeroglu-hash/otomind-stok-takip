# 🚗 Otomind — Stok ve Üretim Yönetimi

Oto minder, kılıf ve aksesuar üretim/satış takibi için geliştirilmiş modern web uygulaması.

## ⚡ Hızlı Başlangıç (Yerel Çalıştırma)

```bash
git clone https://github.com/musoomeroglu-hash/otomind.git
cd otomind
npm install
npm run dev
```

> **Not:** Supabase yapılandırılmadan uygulama çalışır ancak veriler kaydedilmez. Kalıcı veri için aşağıdaki Supabase kurulumunu yapın.

---

## 🗄️ Supabase Kurulum Rehberi

### 1. Supabase Hesabı Oluşturma

1. [https://supabase.com](https://supabase.com) adresine gidin
2. **"Start your project"** butonuna tıklayın
3. GitHub hesabınızla giriş yapın
4. **New Project** oluşturun:
   - **Name:** `otomind` (veya istediğiniz ad)
   - **Database Password:** güçlü bir şifre belirleyin (not alın)
   - **Region:** `Frankfurt (eu-central-1)` — Türkiye'ye en yakın sunucu
5. Projenin oluşmasını bekleyin (~1 dakika)

### 2. Veritabanı Tablolarını Oluşturma

1. Supabase Dashboard'da sol menüden **SQL Editor** sekmesine gidin
2. **New query** butonuna tıklayın
3. Projedeki `supabase-schema.sql` dosyasının **tüm içeriğini** kopyalayıp SQL Editor'a yapıştırın
4. **Run** butonuna tıklayın
5. Tüm tabloların başarıyla oluşturulduğunu doğrulayın (sol menüden **Table Editor** > tablolar görünmeli)

### 3. API Anahtarlarını Alma

1. Sol menüden **Project Settings** (⚙️ dişli ikonu) > **API** sekmesine gidin
2. Şu bilgileri not alın:
   - **Project URL** — `https://xxxxxxxxxxxx.supabase.co` formatında
   - **anon public key** — `eyJ...` ile başlayan uzun anahtar

### 4. Projeye Bağlama

Proje kök dizininde `.env` dosyası oluşturun:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> ⚠️ `.env` dosyası `.gitignore`'da tanımlıdır, GitHub'a gitmez. Güvenlidir.

### 5. Uygulamayı Başlatma

```bash
npm run dev
```

Tarayıcıda `http://localhost:5173` adresini açın. Giriş bilgileri:
- **Kullanıcı:** `otomind`
- **Şifre:** `4003`

---

## 📂 Proje Yapısı

```
otomind/
├── src/
│   ├── components/      # Sidebar, Toast vb. paylaşılan bileşenler
│   ├── contexts/        # DataContext — tüm CRUD ve Supabase entegrasyonu
│   ├── lib/             # Supabase client yapılandırması
│   ├── pages/           # Tüm sayfa bileşenleri
│   ├── types/           # TypeScript tip tanımları
│   ├── utils/           # Yardımcı fonksiyonlar (helpers, demoData)
│   ├── App.tsx           # Ana uygulama ve yönlendirme
│   └── main.tsx          # Giriş noktası
├── supabase-schema.sql  # Veritabanı şeması (SQL)
├── .env.example         # Ortam değişkenleri şablonu
├── index.html           # Ana HTML + Tailwind + Tema sistemi
└── package.json
```

## 🎨 Özellikler

- 🔴 Kırmızı ana tema (Dark/Light mod desteği)
- 📱 Mobil uyumlu arayüz
- 📦 Ürün ve Hammadde stok takibi
- 🧵 Özel sipariş yönetimi (Araca özel kılıf/minder)
- 💰 Kasa (Gelir-Gider) otomatik takibi
- 👥 Cari hesap ve tedarikçi yönetimi
- 📊 Analitik ve raporlama
- 📅 Teslimat takvimi
- 🔔 Hatırlatıcılar (WhatsApp entegrasyonu)
- 💵 Canlı USD/TRY kuru (Sidebar)
- 🔐 Kullanıcı girişi sistemi

## 🛠️ Teknolojiler

- **Frontend:** React 19 + TypeScript + Vite
- **Stil:** Tailwind CSS (CDN) + CSS Variables
- **Veritabanı:** Supabase (PostgreSQL)
- **Grafikler:** Recharts
- **Excel:** SheetJS (xlsx)
