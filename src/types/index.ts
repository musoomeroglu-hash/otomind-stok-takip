// ==================== OTOMIND STOK YÖNETİMİ TİP TANIMLARI ====================

export interface WhatsappConfig {
  phone: string;
  apikey: string;
}


export interface Product {
  id: string;
  name: string;
  category: 'kilif' | 'minder' | 'yastikseti' | 'konforseti' | 'aksesuar';
  carBrand?: string;
  carModel?: string;
  carYear?: string;
  skuCode: string;
  fabricType?: 'jakar' | 'suet' | 'pelus' | 'dijital_baski' | 'diger';
  color?: string;
  pattern?: string;
  materialId?: string; // hammadde ID
  materialAmount?: number; // kaç metre gidiyor
  purchasePrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  channel?: string;
  isCustom: boolean;
  barcode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomOrder {
  id: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  carBrand: string;
  carModel: string;
  carYear?: string;
  productType: 'kilif' | 'minder' | 'aksesuar' | 'set';
  fabricType?: string;
  pattern?: string;
  color?: string;
  notes?: string;
  materialId?: string;
  materialAmount?: number;
  deductMaterial?: boolean; // Form'dan gelen geçici/kalıcı flag
  status: 'beklemede' | 'kargoda' | 'teslim_edildi';
  orderDate: string;
  deliveryDate?: string;
  price: number;
  isPaid?: boolean;
  paymentMethod?: string;
  channel: string;
  createdAt: string;
}

export interface Material {
  id: string;
  name: string;
  type: string;
  unit: 'metre' | 'adet' | 'kg' | 'rulo';
  stockQty: number;
  minQty: number;
  unitCost: number;
  supplierId?: string;
  notes?: string;
  createdAt: string;
}

export interface CustomMaterialType {
  id: string;
  value: string;
  label: string;
}

export interface CariAccount {
  id: string;
  name: string;           // Cari adı (kişi veya firma)
  type: 'musteri' | 'tedarikci' | 'diger'; // Cari tipi
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  balance: number;        // Bakiye (+ alacak, - borç)
  totalDebit: number;     // Toplam borç (bize olan)
  totalCredit: number;    // Toplam alacak (onlara olan)
  createdAt: string;
  updatedAt: string;
}

export interface CariTransaction {
  id: string;
  accountId: string;
  type: 'borc' | 'alacak' | 'tahsilat' | 'odeme'; 
  // borc = birinin bize borcu var (kasaya yansımaz)
  // alacak = biz birine borçluyuz (kasaya yansımaz)
  // tahsilat = bize ödeme yapıldı (kasaya GELİR yansır)
  // odeme = biz ödeme yaptık (kasaya GİDER yansır)
  amount: number;
  description: string;
  relatedId?: string;     // ilgili satış/alım ID'si (otomatik yansıtmalar için)
  relatedType?: 'sale' | 'purchase';
  date: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  category: string;
  notes?: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  saleType: 'arac_ozel' | 'normal';
  productId?: string;
  productName: string;
  customerId?: string;
  customerName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  channel: string;
  paymentMethod: 'nakit' | 'kredi_karti' | 'havale' | 'kapida';
  deductMaterial?: boolean; // stoktan düşülsün mü? Formdan geliyor
  notes?: string;
  date: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  supplierId?: string;
  supplierName: string;
  items: PurchaseItem[];
  totalAmount: number;
  isPaid?: boolean;
  paymentMethod: string;
  notes?: string;
  date: string;
  createdAt: string;
}

export interface PurchaseItem {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}




export interface CashEntry {
  id: string;
  type: 'giris' | 'cikis';         // Gelir mi, gider mi
  category: 'satis' | 'alim' | 'maas' | 'kira' | 'fatura' | 'kargo' | 'reklam' | 'bakim' | 'diger';
  description: string;
  amount: number;
  relatedId?: string;               // Otomatik yansıtmalar için (satış/alım ID)
  relatedType?: 'sale' | 'purchase' | 'custom_order';
  paymentMethod?: 'nakit' | 'kredi_karti' | 'havale' | 'kapida';
  date: string;
  createdAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  priority: 'dusuk' | 'orta' | 'yuksek';
  sendWhatsapp?: boolean;
  completed: boolean;
  createdAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  type: 'teslimat' | 'uretim' | 'siparis' | 'diger';
  relatedOrderId?: string;
  completed: boolean;
}

export type PageType =
  | 'kasa'
  | 'dashboard'
  | 'sales'
  | 'products'
  | 'custom-orders'
  | 'materials'
  | 'accounts'
  | 'suppliers'
  | 'purchases'
  | 'delivery-calendar'

  | 'reminders'
  | 'analytics'
  | 'settings';

export const CAR_BRANDS = [
  'Alfa Romeo', 'Audi', 'BMW', 'Chevrolet', 'Citroen', 'Dacia', 'Fiat',
  'Ford', 'Honda', 'Hyundai', 'Kia', 'Mercedes', 'Nissan', 'Opel',
  'Peugeot', 'Renault', 'Seat', 'Skoda', 'Suzuki', 'Toyota', 'Volkswagen', 'Volvo'
];

export const FABRIC_TYPES = [
  { value: 'jakar', label: 'Jakar Dokuma' },
  { value: 'suet', label: 'Süet' },
  { value: 'pelus', label: 'Peluş' },
  { value: 'dijital_baski', label: 'Dijital Baskı' },
  { value: 'diger', label: 'Diğer' },
];

export const PRODUCT_CATEGORIES = [
  { value: 'kilif', label: 'Araca Özel Koltuk Kılıfı' },
  { value: 'minder', label: 'Oto Minderi' },
  { value: 'yastikseti', label: 'Oto Yastık Seti' },
  { value: 'konforseti', label: 'Oto Konfor Seti' },
  { value: 'aksesuar', label: 'Oto Aksesuar' },
];

export const ORDER_STATUSES = [
  { value: 'beklemede', label: 'Beklemede', color: '#f59e0b' },
  { value: 'kargoda', label: 'Kargoda', color: '#8b5cf6' },
  { value: 'teslim_edildi', label: 'Teslim Edildi', color: '#22c55e' },
];

export const MATERIAL_TYPES = [
  { value: 'kumas', label: 'Kumaş' },
  { value: 'sunger', label: 'Sünger' },
  { value: 'cirt', label: 'Cırt Bant' },
  { value: 'nakis_ipligi', label: 'Nakış İpliği' },
  { value: 'etiket', label: 'Etiket' },
  { value: 'diger', label: 'Diğer' },
];

export const MATERIAL_UNITS = [
  { value: 'metre', label: 'Metre' },
  { value: 'adet', label: 'Adet' },
  { value: 'kg', label: 'Kilogram' },
  { value: 'rulo', label: 'Rulo' },
];
