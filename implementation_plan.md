# Tamamen Mobil Uyumlu Tasarım (Responsive) Uygulama Planı

Mevcut sistemin (TailwindCSS tabanlı) zaten temel bir mobil duyarlılığı var (tablolar sağa kaydırılabiliyor, gridler alt alta geçiyor vs). Sistemin "tamamen" mobil uyumlu hissettirmesi ve masaüstü arayüzünü bozmadan tıpkı bir mobil uygulama (native app) gibi davranması için bir dizi arayüz güncellemelerine ihtiyacı var.

Bu geliştirmeleri yaparken **masaüstündeki 260px'lik sol menü (Sidebar) yapısı ve geniş ekran tablo görünümleri hiçbir şekilde değişmeyecektir.**

## User Review Required
Aşağıdaki değişiklik planı hakkında onayınızı veya eklemek istediğiniz maddeleri bekliyorum.

## Proposed Changes

---

### Navbar / App Shell (Mobil Üst Başlık)
Şu anda mobilde sol üstte havada duran (floating) bir menü açma butonu var.
- **Yapılacaklar:** Havada duran buton yerine, mobilde en üstte sabit (sticky/fixed) bir "Mobil Header" eklenecek. Bu barda logonuz ve menü açma tuşunuz estetik bir şekilde bulunacak. 
- **Fayda:** Ekranı okurken sayfa başlığının butonun altına kayması engellenecek ve tam bir "Mobil Uygulama" hissi verecek.

#### [MODIFY] `src/components/Sidebar.tsx`
- Havada duran `button` kaldırılarak, mobil görünüm (`lg:hidden`) için üst bir navbar div'i eklenecek.

#### [MODIFY] `src/App.tsx`
- Mevcut yapıdaki `pt-20` (üst boşluk) değeri, yeni mobil tasarıma uyumlu hale getirilecek.

---

### Tablo Kullanımları (Tam Ekrana Yayılma)
Şu an Sales, Products, Purchases gibi sayfalardaki tablolar kenarlardan boşluk bırakılarak kart içine yerleştirilmiş durumda. Mobilde bu durum, tabloların çok dar bir alana sıkışmasına yol açıyor.
- **Yapılacaklar:** Tabloların bulunduğu ana çerçeveler (glass-panel) sadece mobilde ekranın tam kenarlarına sıfırlanacak şekilde ayarlanacak (`sm:mx-0`).
- **Fayda:** Yatayda sağa sola kayarken parmağın ekranın en solundan/sağından kaydırmaya başlamasına olanak tanıyacak. Masaüstünde ise tıpkı eskisi gibi oval köşeli şık çerçeveler halinde kalacak.

#### [MODIFY] `src/pages/SalesPage.tsx`
#### [MODIFY] `src/pages/ProductsPage.tsx`
#### [MODIFY] `src/pages/CustomOrdersPage.tsx`
#### [MODIFY] `src/pages/PurchasesPage.tsx`
#### [MODIFY] `src/pages/AccountsPage.tsx`
#### [MODIFY] `src/pages/MaterialsPage.tsx`

---

### Pencereler ve Form Elementleri (Dokunmatik Hedefleri)
- Mobilde (`sm:` öncesi genişliklerde) menüler, input alanları ve "Kaydet" butonu gibi kritik yerlerin genişliği biraz daha büyütülerek (minimum dokunma yüksekliği 40-44px) parmakla hatasız basılabilir hale getirilecek. (Eğer halihazırda yeterli değilse `index.html` altından global güncellenecek).
- Modal (Açılır pencere) animasyonları zaten mobil-uyumlu alt kısma çekilmiş durumda, sadece köşe yumuşatması (border-radius) tam uysun diye küçük düzeltmeler yapılacak.

#### [MODIFY] `index.html` (Global stil ufak dokunuşları)

---

## Open Questions

- Mobilde alt menü (Bottom Navigation) gibi çok büyük bir değişiklik **istemediğinizi**, bunun yerine mevcut "yandan açılır (Drawer) menünün" daha kusursuzlaşmasını istediğinizi varsayıyorum? (Mevcut yapı drawer şeklindedir). Bu konuda bir değişiklik talebiniz var mı?
- Başka bir eklemek veya çıkarmak istediğiniz detay bulunuyor mu? Yoksa bu planı derhal uygulamaya dökebilirim.

## Verification Plan

### Manual Verification
- Vercel üzerinde uygulamanın güncel haline girilerek masaüstü penceresi daraltılıp, mobil header'ın varlığı test edilecek.
- Tablolarda soldan ve sağdan sıfırlanmış kaydırma davranışı denenecek.
- Tıklanabilir alanların ergonomisi kontrol edilecek.
- Masaüstü formunun **asla bozulmadığı** teyit edilecek.
