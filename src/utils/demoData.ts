import type { Product, CustomOrder, Material, CariAccount, CariTransaction, Supplier, Sale, Purchase, CashEntry, Reminder, CalendarEvent } from '../types';

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().split('T')[0];
}

export function generateDemoData() {
  const accounts: CariAccount[] = [
    { id: uid(), name: 'Ahmet Yılmaz', type: 'musteri', phone: '0532 111 2233', email: 'ahmet@email.com', address: 'Bursa/Nilüfer', notes: 'WhatsApp ile iletişim', balance: 0, totalDebit: 0, totalCredit: 0, createdAt: daysAgo(60), updatedAt: daysAgo(60) },
    { id: uid(), name: 'Fatma Demir', type: 'musteri', phone: '0533 222 3344', email: 'fatma@email.com', address: 'İstanbul/Kadıköy', notes: '', balance: 0, totalDebit: 0, totalCredit: 0, createdAt: daysAgo(30), updatedAt: daysAgo(30) },
    { id: uid(), name: 'Mehmet Kaya', type: 'musteri', phone: '0534 333 4455', address: 'Ankara/Çankaya', notes: 'Bayilik ilgilenir', balance: 0, totalDebit: 0, totalCredit: 0, createdAt: daysAgo(90), updatedAt: daysAgo(90) },
    { id: uid(), name: 'Ayşe Çelik', type: 'musteri', phone: '0535 444 5566', address: 'İzmir/Karşıyaka', notes: '', balance: 0, totalDebit: 0, totalCredit: 0, createdAt: daysAgo(45), updatedAt: daysAgo(45) },
    { id: uid(), name: 'Ali Öztürk', type: 'musteri', phone: '0536 555 6677', address: 'Bursa/Osmangazi', notes: 'Toptan alım yapıyor', balance: 0, totalDebit: 0, totalCredit: 0, createdAt: daysAgo(120), updatedAt: daysAgo(120) },
  ];
  
  const cariTransactions: CariTransaction[] = [];

  const suppliers: Supplier[] = [
    { id: uid(), name: 'Bursa Tekstil A.Ş.', phone: '0224 111 2233', email: 'info@bursatekstil.com', address: 'Bursa/Yıldırım', category: 'Kumaş Tedarikçisi', notes: 'Jakar ve süet kumaş', createdAt: daysAgo(180) },
    { id: uid(), name: 'Anadolu Sünger Ltd.', phone: '0224 222 3344', email: 'satis@anadolusunger.com', address: 'Bursa/İnegöl', category: 'Sünger Tedarikçisi', notes: 'Terletmez sünger', createdAt: daysAgo(150) },
    { id: uid(), name: 'İplik Dünyası', phone: '0212 333 4455', address: 'İstanbul/Güngören', category: 'Nakış Malzemesi', notes: 'Nakış ipliği ve etiket', createdAt: daysAgo(120) },
  ];

  const products: Product[] = [
    { id: uid(), name: 'Toyota Corolla Koltuk Kılıfı - Jakar Siyah', category: 'kilif', carBrand: 'Toyota', carModel: 'Corolla', carYear: '2018-2024', skuCode: 'KLF-TC-JKS01', fabricType: 'jakar', color: 'Siyah', pattern: 'Klasik Çizgi', purchasePrice: 450, salePrice: 850, stock: 12, minStock: 3, channel: 'website', isCustom: false, createdAt: daysAgo(30), updatedAt: daysAgo(5) },
    { id: uid(), name: 'VW Golf Koltuk Kılıfı - Süet Kahve', category: 'kilif', carBrand: 'Volkswagen', carModel: 'Golf', carYear: '2017-2023', skuCode: 'KLF-VG-SKH01', fabricType: 'suet', color: 'Kahverengi', pattern: 'Elmas Dikiş', purchasePrice: 500, salePrice: 950, stock: 8, minStock: 2, channel: 'hepsiburada', isCustom: false, createdAt: daysAgo(25), updatedAt: daysAgo(3) },
    { id: uid(), name: 'Universal Oto Minderi - Peluş Gri', category: 'minder', skuCode: 'MD-UNV-PG01', fabricType: 'pelus', color: 'Gri', pattern: 'Düz', purchasePrice: 120, salePrice: 250, stock: 25, minStock: 5, channel: 'website', isCustom: false, createdAt: daysAgo(20), updatedAt: daysAgo(1) },
    { id: uid(), name: 'Boyun Yastığı Seti - Siyah Süet', category: 'yastikseti', skuCode: 'YS-SYH-S01', fabricType: 'suet', color: 'Siyah', purchasePrice: 80, salePrice: 180, stock: 30, minStock: 10, isCustom: false, createdAt: daysAgo(15), updatedAt: daysAgo(2) },
    { id: uid(), name: 'Renault Megane Konfor Seti', category: 'konforseti', carBrand: 'Renault', carModel: 'Megane', carYear: '2019-2024', skuCode: 'KS-RM-01', fabricType: 'jakar', color: 'Bej', purchasePrice: 350, salePrice: 650, stock: 5, minStock: 2, isCustom: false, createdAt: daysAgo(10), updatedAt: daysAgo(1) },
    { id: uid(), name: 'Fiat Egea Koltuk Kılıfı - Dijital Baskı', category: 'kilif', carBrand: 'Fiat', carModel: 'Egea', carYear: '2020-2024', skuCode: 'KLF-FE-DB01', fabricType: 'dijital_baski', color: 'Kırmızı-Siyah', pattern: 'Spor', purchasePrice: 550, salePrice: 1050, stock: 3, minStock: 2, channel: 'n11', isCustom: false, createdAt: daysAgo(8), updatedAt: daysAgo(1) },
    { id: uid(), name: 'Emniyet Kemeri Kılıfı Seti', category: 'aksesuar', skuCode: 'AKS-EK-01', color: 'Siyah', purchasePrice: 25, salePrice: 60, stock: 50, minStock: 15, isCustom: false, createdAt: daysAgo(45), updatedAt: daysAgo(10) },
    { id: uid(), name: 'Ford Focus Koltuk Kılıfı - Jakar Bej', category: 'kilif', carBrand: 'Ford', carModel: 'Focus', carYear: '2015-2022', skuCode: 'KLF-FF-JKB01', fabricType: 'jakar', color: 'Bej', pattern: 'Klasik', purchasePrice: 420, salePrice: 800, stock: 6, minStock: 2, isCustom: false, createdAt: daysAgo(35), updatedAt: daysAgo(7) },
  ];

  const materials: Material[] = [
    { id: uid(), name: 'Siyah Jakar Kumaş', type: 'kumas', unit: 'metre', stockQty: 150, minQty: 30, unitCost: 45, supplierId: suppliers[0].id, notes: '150cm en', createdAt: daysAgo(60) },
    { id: uid(), name: 'Kahve Süet Kumaş', type: 'kumas', unit: 'metre', stockQty: 80, minQty: 20, unitCost: 65, supplierId: suppliers[0].id, createdAt: daysAgo(50) },
    { id: uid(), name: 'Gri Peluş Kumaş', type: 'kumas', unit: 'metre', stockQty: 200, minQty: 50, unitCost: 35, supplierId: suppliers[0].id, createdAt: daysAgo(40) },
    { id: uid(), name: 'Terletmez Sünger 2cm', type: 'sunger', unit: 'metre', stockQty: 120, minQty: 25, unitCost: 28, supplierId: suppliers[1].id, createdAt: daysAgo(55) },
    { id: uid(), name: 'Siyah Cırt Bant', type: 'cirt', unit: 'rulo', stockQty: 15, minQty: 5, unitCost: 35, notes: '25m rulo', createdAt: daysAgo(30) },
    { id: uid(), name: 'Nakış İpliği - Siyah', type: 'nakis_ipligi', unit: 'adet', stockQty: 40, minQty: 10, unitCost: 12, supplierId: suppliers[2].id, createdAt: daysAgo(25) },
    { id: uid(), name: 'Otomind Marka Etiketi', type: 'etiket', unit: 'adet', stockQty: 500, minQty: 100, unitCost: 1.5, supplierId: suppliers[2].id, createdAt: daysAgo(20) },
    { id: uid(), name: 'Dijital Baskı Kumaş - Kırmızı', type: 'kumas', unit: 'metre', stockQty: 45, minQty: 15, unitCost: 85, supplierId: suppliers[0].id, createdAt: daysAgo(15) },
  ];

  const customOrders: CustomOrder[] = [
    { id: uid(), customerId: accounts[0].id, customerName: 'Ahmet Yılmaz', customerPhone: '0532 111 2233', carBrand: 'Toyota', carModel: 'Corolla', carYear: '2022', productType: 'kilif', fabricType: 'Jakar', pattern: 'Elmas Dikiş', color: 'Siyah-Kırmızı', status: 'beklemede', orderDate: daysAgo(5), deliveryDate: daysFromNow(3), price: 950, channel: 'website', notes: 'Airbag dikişi özel', createdAt: daysAgo(5) },
    { id: uid(), customerId: accounts[1].id, customerName: 'Fatma Demir', customerPhone: '0533 222 3344', carBrand: 'Volkswagen', carModel: 'Golf', carYear: '2020', productType: 'set', fabricType: 'Süet', color: 'Kahverengi', status: 'beklemede', orderDate: daysAgo(2), price: 1200, channel: 'hepsiburada', createdAt: daysAgo(2) },
    { id: uid(), customerName: 'Hasan Arslan', customerPhone: '0537 666 7788', carBrand: 'BMW', carModel: '3 Serisi', carYear: '2021', productType: 'kilif', fabricType: 'Dijital Baskı', pattern: 'Spor Karbon', color: 'Siyah', status: 'kargoda', orderDate: daysAgo(10), deliveryDate: daysFromNow(1), price: 1500, channel: 'website', createdAt: daysAgo(10) },
    { id: uid(), customerName: 'Zeynep Koç', customerPhone: '0538 777 8899', carBrand: 'Mercedes', carModel: 'C Serisi', carYear: '2023', productType: 'kilif', fabricType: 'Süet', pattern: 'Premium', color: 'Bej', status: 'kargoda', orderDate: daysAgo(15), deliveryDate: daysFromNow(0), price: 1800, channel: 'website', createdAt: daysAgo(15) },
    { id: uid(), customerName: 'Osman Güneş', customerPhone: '0539 888 9900', carBrand: 'Hyundai', carModel: 'Tucson', carYear: '2022', productType: 'minder', fabricType: 'Peluş', color: 'Gri', status: 'teslim_edildi', orderDate: daysAgo(20), deliveryDate: daysAgo(3), price: 450, channel: 'n11', createdAt: daysAgo(20) },
  ];

  const sales: Sale[] = [
    { id: uid(), saleType: 'arac_ozel', productName: 'Toyota Corolla Koltuk Kılıfı', customerName: 'Ahmet Yılmaz', quantity: 1, unitPrice: 850, totalPrice: 850, channel: 'website', paymentMethod: 'kredi_karti', date: daysAgo(3).split('T')[0], createdAt: daysAgo(3) },
    { id: uid(), saleType: 'normal', productName: 'Universal Oto Minderi - Peluş Gri', customerName: 'N11 Müşterisi', quantity: 2, unitPrice: 250, totalPrice: 500, channel: 'n11', paymentMethod: 'kapida', date: daysAgo(5).split('T')[0], createdAt: daysAgo(5) },
    { id: uid(), saleType: 'normal', productName: 'Boyun Yastığı Seti', customerName: 'Fatma Demir', quantity: 1, unitPrice: 180, totalPrice: 180, channel: 'hepsiburada', paymentMethod: 'kredi_karti', date: daysAgo(7).split('T')[0], createdAt: daysAgo(7) },
    { id: uid(), saleType: 'normal', productName: 'Emniyet Kemeri Kılıfı Seti', customerName: 'Mehmet Kaya', quantity: 5, unitPrice: 60, totalPrice: 300, channel: 'bayi', paymentMethod: 'havale', date: daysAgo(10).split('T')[0], notes: 'Toptan bayi satışı', createdAt: daysAgo(10) },
    { id: uid(), saleType: 'arac_ozel', productName: 'VW Golf Koltuk Kılıfı', customerName: 'Hepsiburada Müşterisi', quantity: 1, unitPrice: 950, totalPrice: 950, channel: 'hepsiburada', paymentMethod: 'kredi_karti', date: daysAgo(12).split('T')[0], createdAt: daysAgo(12) },
    { id: uid(), saleType: 'arac_ozel', productName: 'Renault Megane Konfor Seti', customerName: 'Ayşe Çelik', quantity: 1, unitPrice: 650, totalPrice: 650, channel: 'website', paymentMethod: 'havale', date: daysAgo(1).split('T')[0], createdAt: daysAgo(1) },
  ];

  const purchases: Purchase[] = [
    { id: uid(), supplierName: 'Bursa Tekstil A.Ş.', items: [{ name: 'Siyah Jakar Kumaş', quantity: 100, unitPrice: 45, totalPrice: 4500 }, { name: 'Kahve Süet Kumaş', quantity: 50, unitPrice: 65, totalPrice: 3250 }], totalAmount: 7750, paymentMethod: 'Havale', date: daysAgo(30).split('T')[0], createdAt: daysAgo(30) },
    { id: uid(), supplierName: 'Anadolu Sünger Ltd.', items: [{ name: 'Terletmez Sünger 2cm', quantity: 80, unitPrice: 28, totalPrice: 2240 }], totalAmount: 2240, paymentMethod: 'Vadeli', date: daysAgo(25).split('T')[0], createdAt: daysAgo(25) },
  ];

  const cashEntries: CashEntry[] = [
    { id: uid(), type: 'cikis', category: 'kira', description: 'Atölye Kirası', amount: 15000, date: daysAgo(5), createdAt: daysAgo(5), paymentMethod: 'havale' },
    { id: uid(), type: 'cikis', category: 'fatura', description: 'Elektrik Faturası', amount: 3500, date: daysAgo(10), createdAt: daysAgo(10), paymentMethod: 'kredi_karti' },
    { id: uid(), type: 'cikis', category: 'maas', description: 'Personel Avans', amount: 5000, date: daysAgo(2), createdAt: daysAgo(2), paymentMethod: 'nakit' },
  ];

  const reminders: Reminder[] = [
    { id: uid(), title: 'Kumaş siparişi ver', description: 'Jakar kumaş stoku azalıyor, Bursa Tekstil ile görüş', date: daysFromNow(2), priority: 'yuksek', completed: false, createdAt: daysAgo(1) },
    { id: uid(), title: 'Hepsiburada kampanya güncelle', description: 'Bahar kampanyası için fiyat güncellemesi', date: daysFromNow(5), priority: 'orta', completed: false, createdAt: daysAgo(3) },
    { id: uid(), title: 'BMW siparişi kargoya ver', description: 'Hasan Arslan siparişi hazır', date: daysFromNow(1), priority: 'yuksek', completed: false, createdAt: daysAgo(2) },
  ];

  const calendarEvents: CalendarEvent[] = [
    { id: uid(), title: 'Toyota Corolla Kılıf Teslimi', date: daysFromNow(3), type: 'teslimat', completed: false },
    { id: uid(), title: 'BMW 3 Serisi Kılıf Kargo', date: daysFromNow(1), type: 'teslimat', completed: false },
    { id: uid(), title: 'Mercedes C Serisi Teslim', date: daysFromNow(0), type: 'teslimat', completed: false },
    { id: uid(), title: 'VW Golf Seti Üretim Başla', date: daysFromNow(2), type: 'uretim', completed: false },
    { id: uid(), title: 'Kumaş Siparişi Teslim Alınacak', date: daysFromNow(7), type: 'siparis', completed: false },
  ];

  return { products, customOrders, materials, accounts, cariTransactions, suppliers, sales, purchases, cashEntries, reminders, calendarEvents };
}
