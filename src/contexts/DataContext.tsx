import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { Product, CustomOrder, Material, CariAccount, CariTransaction, Supplier, Sale, Purchase, CashEntry, Reminder, CalendarEvent, CustomMaterialType, WhatsappConfig } from '../types';
import { MATERIAL_TYPES } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface DataContextType {
  products: Product[];
  customOrders: CustomOrder[];
  materials: Material[];
  accounts: CariAccount[];
  cariTransactions: CariTransaction[];
  suppliers: Supplier[];
  sales: Sale[];
  purchases: Purchase[];
  cashEntries: CashEntry[];
  reminders: Reminder[];
  calendarEvents: CalendarEvent[];
  materialTypes: CustomMaterialType[];
  salesChannels: string[];
  addSalesChannel: (channel: string) => Promise<void>;
  deleteSalesChannel: (channel: string) => Promise<void>;
  whatsappConfig: WhatsappConfig;
  firmaBilgileri: any;
  updateFirmaBilgileri: (info: any) => Promise<void>;
  usdRate: number | null;
  loading: boolean;
  addProduct: (p: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;
  addCustomOrder: (o: Omit<CustomOrder, 'id' | 'createdAt'>) => void;
  updateCustomOrder: (id: string, o: Partial<CustomOrder>) => void;
  deleteCustomOrder: (id: string) => void;
  addMaterial: (m: Omit<Material, 'id' | 'createdAt'>) => void;
  updateMaterial: (id: string, m: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;
  addAccount: (a: Omit<CariAccount, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateAccount: (id: string, a: Partial<CariAccount>) => void;
  deleteAccount: (id: string) => void;
  addCariTransaction: (t: Omit<CariTransaction, 'id' | 'createdAt'>) => void;
  deleteCariTransaction: (id: string) => void;
  addSupplier: (s: Omit<Supplier, 'id' | 'createdAt'>) => void;
  updateSupplier: (id: string, s: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  addSale: (s: Omit<Sale, 'id' | 'createdAt'>) => void;
  deleteSale: (id: string) => void;
  addPurchase: (p: Omit<Purchase, 'id' | 'createdAt'>) => void;
  deletePurchase: (id: string) => void;
  addCashEntry: (e: Omit<CashEntry, 'id' | 'createdAt'>) => void;
  deleteCashEntry: (id: string) => void;
  addReminder: (r: Omit<Reminder, 'id' | 'createdAt'>) => void;
  updateReminder: (id: string, r: Partial<Reminder>) => void;
  deleteReminder: (id: string) => void;
  addCalendarEvent: (e: Omit<CalendarEvent, 'id'>) => void;
  updateCalendarEvent: (id: string, e: Partial<CalendarEvent>) => void;
  deleteCalendarEvent: (id: string) => void;
  addMaterialType: (t: Omit<CustomMaterialType, 'id'>) => void;
  updateMaterialType: (id: string, t: Partial<CustomMaterialType>) => void;
  deleteMaterialType: (id: string) => void;
  updateWhatsappConfig: (w: WhatsappConfig) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

// ===================== SUPABASE HELPERS =====================
// Supabase sütun adları snake_case, TypeScript camelCase.
// Veritabanı tasarımında camelCase kullanacağız (jsonb olarak),
// ama tablolar düz sütunlarla çalışacak.

const DB_TABLES = {
  products: 'products',
  custom_orders: 'custom_orders',
  materials: 'materials',
  accounts: 'accounts',
  cari_transactions: 'cari_transactions',
  suppliers: 'suppliers',
  sales: 'sales',
  purchases: 'purchases',
  cash_entries: 'cash_entries',
  reminders: 'reminders',
  calendar_events: 'calendar_events',
  material_types: 'material_types',
  app_config: 'app_config',
} as const;

// Generic Supabase CRUD helpers
async function sbFetchAll<T>(table: string): Promise<T[]> {
  let query = supabase.from(table).select('*');
  if (table !== 'material_types' && table !== 'app_config' && table !== 'calendar_events') {
    query = query.order('created_at', { ascending: false });
  }
  const { data, error } = await query;
  if (error) { console.error(`Supabase fetch ${table}:`, error); return []; }
  return (data || []).map(mapFromDb) as T[];
}

async function sbInsert<T extends Record<string, any>>(table: string, record: T): Promise<T | null> {
  const dbRecord = mapToDb(record);
  const { data, error } = await supabase.from(table).insert(dbRecord).select().single();
  if (error) { console.error(`Supabase insert ${table}:`, error); return null; }
  return data ? mapFromDb(data) as T : null;
}

async function sbUpdate<T extends Record<string, any>>(table: string, id: string, updates: Partial<T>): Promise<void> {
  const dbUpdates = mapToDb(updates);
  const { error } = await supabase.from(table).update(dbUpdates).eq('id', id);
  if (error) console.error(`Supabase update ${table}:`, error);
}

async function sbDelete(table: string, id: string): Promise<void> {
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) console.error(`Supabase delete ${table}:`, error);
}

// camelCase <-> snake_case dönüşüm
function camelToSnake(str: string): string {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

function snakeToCamel(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function mapToDb(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key in obj) {
    result[camelToSnake(key)] = obj[key];
  }
  return result;
}

function mapFromDb(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key in obj) {
    result[snakeToCamel(key)] = obj[key];
  }
  return result;
}

// ===================== PROVIDER =====================
export function DataProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [customOrders, setCustomOrders] = useState<CustomOrder[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [accounts, setAccounts] = useState<CariAccount[]>([]);
  const [cariTransactions, setCariTransactions] = useState<CariTransaction[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [cashEntries, setCashEntries] = useState<CashEntry[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [materialTypes, setMaterialTypes] = useState<CustomMaterialType[]>([]);
  const [salesChannels, setSalesChannels] = useState<string[]>(['website', 'hepsiburada', 'n11', 'bayi', 'cimri']); // varsayılan
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsappConfig>({ phone: '', apikey: '' });
  const [firmaBilgileri, setFirmaBilgileri] = useState<any>({});
  const [usdRate, setUsdRate] = useState<number | null>(null);

  // ---- INITIAL LOAD ----
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase yapılandırılmamış. Lütfen .env dosyasını kontrol edin.');
      setMaterialTypes(MATERIAL_TYPES.map(m => ({ id: uid(), value: m.value, label: m.label })));
      setLoading(false);
      return;
    }

    async function loadAll() {
      try {
        const [p, co, m, a, ct, s, sa, pu, ce, r, calEv, mt] = await Promise.all([
          sbFetchAll<Product>(DB_TABLES.products),
          sbFetchAll<CustomOrder>(DB_TABLES.custom_orders),
          sbFetchAll<Material>(DB_TABLES.materials),
          sbFetchAll<CariAccount>(DB_TABLES.accounts),
          sbFetchAll<CariTransaction>(DB_TABLES.cari_transactions),
          sbFetchAll<Supplier>(DB_TABLES.suppliers),
          sbFetchAll<Sale>(DB_TABLES.sales),
          sbFetchAll<Purchase>(DB_TABLES.purchases),
          sbFetchAll<CashEntry>(DB_TABLES.cash_entries),
          sbFetchAll<Reminder>(DB_TABLES.reminders),
          sbFetchAll<CalendarEvent>(DB_TABLES.calendar_events),
          sbFetchAll<CustomMaterialType>(DB_TABLES.material_types),
        ]);

        setProducts(p);
        setCustomOrders(co);
        setMaterials(m);
        setAccounts(a);
        setCariTransactions(ct);
        setSuppliers(s);
        setSales(sa);
        setPurchases(pu);
        setCashEntries(ce);
        setReminders(r);
        setCalendarEvents(calEv);
        setMaterialTypes(mt.length > 0 ? mt : MATERIAL_TYPES.map(mt2 => ({ id: uid(), value: mt2.value, label: mt2.label })));

        // Varsayılan kanallar app_config'ten okuma (sales_channels jsonb string array)
        try {
          const { data: channelData } = await supabase.from(DB_TABLES.app_config).select('*').eq('key', 'sales_channels').single();
          if (channelData?.value) {
            setSalesChannels(channelData.value);
          }
        } catch(e) { /* ignore single error */ }

        // WhatsApp config
        try {
          const { data: configData } = await supabase.from(DB_TABLES.app_config).select('*').eq('key', 'whatsapp').single();
          if (configData?.value) setWhatsappConfig(configData.value);
        } catch(e) { /* ignore single error */ }

        // Firma Bilgileri
        try {
          const { data: firmaData } = await supabase.from(DB_TABLES.app_config).select('*').eq('key', 'firma_bilgileri').single();
          if (firmaData?.value) setFirmaBilgileri(firmaData.value);
        } catch(e) { /* ignore single error */ }

        // USD Rate Fetch
        try {
          const cached = localStorage.getItem('otomind_usd_rate');
          const cacheTime = localStorage.getItem('otomind_usd_time');
          const nowMs = Date.now();
          if (cached && cacheTime && (nowMs - Number(cacheTime)) < 3600000) {
            setUsdRate(Number(cached));
          } else {
            const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
            const data = await res.json();
            if (data?.rates?.TRY) {
              setUsdRate(data.rates.TRY);
              localStorage.setItem('otomind_usd_rate', data.rates.TRY.toString());
              localStorage.setItem('otomind_usd_time', nowMs.toString());
            }
          }
        } catch(e) { console.error('USD fetch error', e); }

      } catch (err) {
        console.error('Veri yüklenirken hata:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAll();
  }, []);

  // ===================== CRUD OPERATIONS =====================

  // --- PRODUCTS ---
  const addProduct = useCallback(async (p: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newItem: Product = { ...p, id: uid(), createdAt: now, updatedAt: now };
    setProducts(prev => [...prev, newItem]);
    if (isSupabaseConfigured()) await sbInsert(DB_TABLES.products, newItem);
  }, []);

  const updateProduct = useCallback(async (id: string, p: Partial<Product>) => {
    const updates = { ...p, updatedAt: new Date().toISOString() };
    setProducts(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    if (isSupabaseConfigured()) await sbUpdate(DB_TABLES.products, id, updates);
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    setProducts(prev => prev.filter(item => item.id !== id));
    if (isSupabaseConfigured()) await sbDelete(DB_TABLES.products, id);
  }, []);

  // --- CUSTOM ORDERS ---
  const addCustomOrder = useCallback(async (o: Omit<CustomOrder, 'id' | 'createdAt'>) => {
    const newId = uid();
    const now = new Date().toISOString();
    const newItem: CustomOrder = { ...o, id: newId, createdAt: now };
    setCustomOrders(prev => [...prev, newItem]);
    if (isSupabaseConfigured()) await sbInsert(DB_TABLES.custom_orders, newItem);

    if (o.isPaid && o.price > 0) {
      const cashItem: CashEntry = {
        id: uid(), type: 'giris', category: 'satis', amount: o.price,
        description: `Özel Sipariş Tahsilatı: ${o.customerName}`,
        paymentMethod: (o.paymentMethod as any) || 'nakit', date: now.split('T')[0], createdAt: now,
        relatedId: newId, relatedType: 'custom_order'
      };
      setCashEntries(prev => [...prev, cashItem]);
      if (isSupabaseConfigured()) await sbInsert(DB_TABLES.cash_entries, cashItem);
    }

    // Kumaş stoktan düşme işlemi (Negatife inebilir)
    if (o.deductMaterial) {
      if (o.materialId && (o.materialAmount || 0) > 0) {
        const deductAmt = Number(o.materialAmount) || 0;
        setMaterials(prevMat => {
          const mat = prevMat.find(m => m.id === o.materialId);
          if (mat) {
            const newQty = mat.stockQty - deductAmt;
            if (isSupabaseConfigured()) {
              sbUpdate(DB_TABLES.materials, mat.id, { stockQty: newQty });
            }
            return prevMat.map(m => m.id === mat.id ? { ...m, stockQty: newQty } : m);
          }
          return prevMat;
        });
      }
      // Ek hammaddelerden düşme
      if (o.extraMaterials && o.extraMaterials.length > 0) {
        o.extraMaterials.forEach(em => {
          if (em.materialId && em.amount > 0) {
            setMaterials(prevMat => {
              const mat = prevMat.find(m => m.id === em.materialId);
              if (mat) {
                const newQty = mat.stockQty - Number(em.amount);
                if (isSupabaseConfigured()) {
                  sbUpdate(DB_TABLES.materials, mat.id, { stockQty: newQty });
                }
                return prevMat.map(m => m.id === mat.id ? { ...m, stockQty: newQty } : m);
              }
              return prevMat;
            });
          }
        });
      }
    }
  }, []);

  const updateCustomOrder = useCallback(async (id: string, o: Partial<CustomOrder>) => {
    const existing = customOrders.find(item => item.id === id);
    if (existing) {
      const now = new Date().toISOString();

      if (!existing.isPaid && o.isPaid) {
        const amount = Number(o.price ?? existing.price) || 0;
        if (amount > 0) {
          const cashItem: CashEntry = {
            id: uid(), type: 'giris', category: 'satis', amount,
            description: `Özel Sipariş Tahsilatı: ${existing.customerName}`,
            paymentMethod: (o.paymentMethod as any) || existing.paymentMethod || 'nakit', date: now.split('T')[0], createdAt: now,
            relatedId: id, relatedType: 'custom_order'
          };
          setCashEntries(cash => [...cash, cashItem]);
          if (isSupabaseConfigured()) await sbInsert(DB_TABLES.cash_entries, cashItem);
        }
      } else if (existing.isPaid && o.isPaid === false) {
        setCashEntries(cash => cash.filter(c => !(c.relatedId === id && c.relatedType === 'custom_order')));
        if (isSupabaseConfigured()) {
          await supabase.from(DB_TABLES.cash_entries).delete().eq('related_id', id).eq('related_type', 'custom_order');
        }
      } else if (existing.isPaid && o.isPaid !== false) {
        if (o.price !== undefined && Number(o.price) !== Number(existing.price)) {
          setCashEntries(cash => cash.map(c =>
            (c.relatedId === id && c.relatedType === 'custom_order') ? { ...c, amount: Number(o.price) } : c
          ));
          if (isSupabaseConfigured()) {
            await supabase.from(DB_TABLES.cash_entries).update({ amount: Number(o.price) }).eq('related_id', id).eq('related_type', 'custom_order');
          }
        }
      }
    }
    setCustomOrders(prev => prev.map(item => item.id === id ? { ...item, ...o } : item));
    if (isSupabaseConfigured()) await sbUpdate(DB_TABLES.custom_orders, id, o);
  }, [customOrders]);

  const deleteCustomOrder = useCallback(async (id: string) => {
    setCustomOrders(prev => prev.filter(item => item.id !== id));
    setCashEntries(prev => prev.filter(c => !(c.relatedId === id && c.relatedType === 'custom_order')));
    if (isSupabaseConfigured()) {
      await sbDelete(DB_TABLES.custom_orders, id);
      await supabase.from(DB_TABLES.cash_entries).delete().eq('related_id', id).eq('related_type', 'custom_order');
    }
  }, []);

  // --- MATERIALS ---
  const addMaterial = useCallback(async (m: Omit<Material, 'id' | 'createdAt'>) => {
    const newItem: Material = { ...m, id: uid(), createdAt: new Date().toISOString() };
    setMaterials(prev => [...prev, newItem]);
    if (isSupabaseConfigured()) await sbInsert(DB_TABLES.materials, newItem);
  }, []);

  const updateMaterial = useCallback(async (id: string, m: Partial<Material>) => {
    setMaterials(prev => prev.map(item => item.id === id ? { ...item, ...m } : item));
    if (isSupabaseConfigured()) await sbUpdate(DB_TABLES.materials, id, m);
  }, []);

  const deleteMaterial = useCallback(async (id: string) => {
    setMaterials(prev => prev.filter(item => item.id !== id));
    if (isSupabaseConfigured()) await sbDelete(DB_TABLES.materials, id);
  }, []);

  // --- ACCOUNTS ---
  const addAccount = useCallback(async (a: Omit<CariAccount, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newItem: CariAccount = { ...a, id: uid(), createdAt: now, updatedAt: now };
    setAccounts(prev => [...prev, newItem]);
    if (isSupabaseConfigured()) await sbInsert(DB_TABLES.accounts, newItem);
  }, []);

  const updateAccount = useCallback(async (id: string, a: Partial<CariAccount>) => {
    const updates = { ...a, updatedAt: new Date().toISOString() };
    setAccounts(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
    if (isSupabaseConfigured()) await sbUpdate(DB_TABLES.accounts, id, updates);
  }, []);

  const deleteAccount = useCallback(async (id: string) => {
    setAccounts(prev => prev.filter(item => item.id !== id));
    if (isSupabaseConfigured()) await sbDelete(DB_TABLES.accounts, id);
  }, []);

  const addCariTransaction = useCallback(async (t: Omit<CariTransaction, 'id' | 'createdAt'>) => {
    const newItem: CariTransaction = { ...t, id: uid(), createdAt: new Date().toISOString() };
    setCariTransactions(prev => [...prev, newItem]);
    if (isSupabaseConfigured()) await sbInsert(DB_TABLES.cari_transactions, newItem);
  }, []);

  const deleteCariTransaction = useCallback(async (id: string) => {
    setCariTransactions(prev => prev.filter(item => item.id !== id));
    if (isSupabaseConfigured()) await sbDelete(DB_TABLES.cari_transactions, id);
  }, []);

  // --- SUPPLIERS ---
  const addSupplier = useCallback(async (s: Omit<Supplier, 'id' | 'createdAt'>) => {
    const newItem: Supplier = { ...s, id: uid(), createdAt: new Date().toISOString() };
    setSuppliers(prev => [...prev, newItem]);
    if (isSupabaseConfigured()) await sbInsert(DB_TABLES.suppliers, newItem);
  }, []);

  const updateSupplier = useCallback(async (id: string, s: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(item => item.id === id ? { ...item, ...s } : item));
    if (isSupabaseConfigured()) await sbUpdate(DB_TABLES.suppliers, id, s);
  }, []);

  const deleteSupplier = useCallback(async (id: string) => {
    setSuppliers(prev => prev.filter(item => item.id !== id));
    if (isSupabaseConfigured()) await sbDelete(DB_TABLES.suppliers, id);
  }, []);

  // --- SALES ---
  const addSale = useCallback(async (s: Omit<Sale, 'id' | 'createdAt'>) => {
    const sId = uid();
    const now = new Date().toISOString();
    const newSale: Sale = { ...s, id: sId, createdAt: now };
    setSales(prev => [...prev, newSale]);

    const cashItem: CashEntry = {
      id: uid(), type: 'giris', category: 'satis', amount: s.totalPrice,
      description: `Satış Geliri: ${s.productName}`,
      paymentMethod: s.paymentMethod, date: s.date, createdAt: now,
      relatedId: sId, relatedType: 'sale'
    };
    setCashEntries(prev => [...prev, cashItem]);

    if (isSupabaseConfigured()) {
      await sbInsert(DB_TABLES.sales, newSale);
      await sbInsert(DB_TABLES.cash_entries, cashItem);
    }

    // Hammaddeleri ürün özelliklerine göre stoktan düşme (Sıfırdan Üretim) (Negatife inebilir)
    if (s.deductMaterial) {
      setProducts(prevProducts => {
        const product = prevProducts.find(p => p.name === s.productName);
        if (product) {
          // 1. Kumaşı düş
          if (product.materialId && (product.materialAmount || 0) > 0) {
            const deductAmt = Number(product.materialAmount) * s.quantity;
            const matId = product.materialId;
            setMaterials(prevMat => {
              const mat = prevMat.find(m => m.id === matId);
              if (mat) {
                const newQty = mat.stockQty - deductAmt;
                if (isSupabaseConfigured()) {
                  sbUpdate(DB_TABLES.materials, matId, { stockQty: newQty });
                }
                return prevMat.map(m => m.id === matId ? { ...m, stockQty: newQty } : m);
              }
              return prevMat;
            });
          }
          // 2. Ek hammaddeleri (extraMaterials) düş
          if (product.extraMaterials && product.extraMaterials.length > 0) {
            product.extraMaterials.forEach(em => {
              if (em.materialId && em.amount > 0) {
                const deductAmt = Number(em.amount) * s.quantity;
                setMaterials(prevMat => {
                  const mat = prevMat.find(m => m.id === em.materialId || m.type === em.materialId);
                  if (mat) {
                    const newQty = mat.stockQty - deductAmt;
                    if (isSupabaseConfigured()) {
                      sbUpdate(DB_TABLES.materials, mat.id, { stockQty: newQty });
                    }
                    return prevMat.map(m => m.id === mat.id ? { ...m, stockQty: newQty } : m);
                  }
                  return prevMat;
                });
              }
            });
          }
        }
        return prevProducts; // Product'ın kendisinde hammadde için değişiklik yapmıyoruz
      });
    }

    // Ürünün kendi stoğunu her halükarda satış miktarında düşür (Eksiye düşebilir)
    setProducts(prevProducts => {
      const product = prevProducts.find(p => p.name === s.productName);
      if (product) {
        const newStock = product.stock - s.quantity;
        if (isSupabaseConfigured()) {
          sbUpdate(DB_TABLES.products, product.id, { stock: newStock });
        }
        return prevProducts.map(p => p.id === product.id ? { ...p, stock: newStock } : p);
      }
      return prevProducts;
    });

  }, []);

  const deleteSale = useCallback(async (id: string) => {
    setSales(prev => prev.filter(item => item.id !== id));
    setCashEntries(prev => prev.filter(c => !(c.relatedId === id && c.relatedType === 'sale')));
    if (isSupabaseConfigured()) {
      await sbDelete(DB_TABLES.sales, id);
      await supabase.from(DB_TABLES.cash_entries).delete().eq('related_id', id).eq('related_type', 'sale');
    }
  }, []);

  // --- PURCHASES ---
  const addPurchase = useCallback(async (p: Omit<Purchase, 'id' | 'createdAt'>) => {
    const pId = uid();
    const now = new Date().toISOString();
    const newPurchase: Purchase = { ...p, id: pId, createdAt: now };
    setPurchases(prev => [...prev, newPurchase]);

    // Cari hesap entegrasyonu
    setAccounts(prevAccounts => {
      let account = prevAccounts.find(a => a.name.toLowerCase() === p.supplierName.toLowerCase() && (a.type === 'tedarikci' || a.type === 'diger'));
      let accountId = '';
      
      const isPaidMode = p.isPaid === true; // Ödeme anında yapıldı mı?
      const balanceChange = isPaidMode ? 0 : p.totalAmount; // Ödendiyse cari bakiye DEĞİŞMEZ

      // Cari'ye şeffaflık için işlemi giriyoruz
      const alacakTx: CariTransaction = { id: uid(), accountId: '', type: 'alacak', amount: p.totalAmount, description: `Alım Faturası: ${p.supplierName} - ${p.date}`, relatedId: pId, relatedType: 'purchase', date: p.date, createdAt: now };
      const odemeTx: CariTransaction | null = isPaidMode ? { id: uid(), accountId: '', type: 'odeme', amount: p.totalAmount, description: `Alım Ödemesi (Anında - ${p.paymentMethod}): ${p.supplierName}`, relatedId: pId, relatedType: 'purchase', date: p.date, createdAt: now } : null;

      if (!account) {
        accountId = uid();
        alacakTx.accountId = accountId;
        if (odemeTx) odemeTx.accountId = accountId;

        const newAccount: CariAccount = { 
          id: accountId, name: p.supplierName, type: 'tedarikci', 
          balance: balanceChange, totalDebit: 0, totalCredit: p.totalAmount, // Alacak hanesi (toplam iş hacmi) artar
          createdAt: now, updatedAt: now 
        };
        
        setCariTransactions(prevTx => odemeTx ? [...prevTx, alacakTx, odemeTx] : [...prevTx, alacakTx]);
        
        if (isSupabaseConfigured()) {
          sbInsert(DB_TABLES.accounts, newAccount);
          sbInsert(DB_TABLES.cari_transactions, alacakTx);
          if (odemeTx) sbInsert(DB_TABLES.cari_transactions, odemeTx);
        }
        return [...prevAccounts, newAccount];
      } else {
        accountId = account.id;
        alacakTx.accountId = accountId;
        if (odemeTx) odemeTx.accountId = accountId;

        setCariTransactions(prevTx => odemeTx ? [...prevTx, alacakTx, odemeTx] : [...prevTx, alacakTx]);
        
        if (isSupabaseConfigured()) {
          sbInsert(DB_TABLES.cari_transactions, alacakTx);
          if (odemeTx) sbInsert(DB_TABLES.cari_transactions, odemeTx);
          sbUpdate(DB_TABLES.accounts, accountId, { 
            totalCredit: account.totalCredit + p.totalAmount, 
            balance: account.balance + balanceChange, 
            updatedAt: now 
          });
        }
        return prevAccounts.map(a => a.id === accountId ? { 
          ...a, 
          totalCredit: a.totalCredit + p.totalAmount, 
          balance: a.balance + balanceChange, 
          updatedAt: now 
        } : a);
      }
    });

    // Kasaya eksi (GİDER) olarak ekle
    if (p.isPaid === true) {
      const cashItem: CashEntry = {
        id: uid(), type: 'cikis', category: 'alim', amount: p.totalAmount,
        description: `Alım Ödemesi: ${p.supplierName} - ${p.date}`,
        paymentMethod: p.paymentMethod as any, date: p.date, createdAt: now,
        relatedId: pId, relatedType: 'purchase'
      };
      setCashEntries(prev => [...prev, cashItem]);
      if (isSupabaseConfigured()) await sbInsert(DB_TABLES.cash_entries, cashItem);
    }

    if (isSupabaseConfigured()) await sbInsert(DB_TABLES.purchases, newPurchase);
  }, []);

  const deletePurchase = useCallback(async (id: string) => {
    setPurchases(prev => prev.filter(item => item.id !== id));
    setCashEntries(prev => prev.filter(c => !(c.relatedId === id && c.relatedType === 'purchase')));
    if (isSupabaseConfigured()) {
      await sbDelete(DB_TABLES.purchases, id);
      await supabase.from(DB_TABLES.cash_entries).delete().eq('related_id', id).eq('related_type', 'purchase');
    }
  }, []);

  // --- CASH ENTRIES ---
  const addCashEntry = useCallback(async (e: Omit<CashEntry, 'id' | 'createdAt'>) => {
    const newItem: CashEntry = { ...e, id: uid(), createdAt: new Date().toISOString() };
    setCashEntries(prev => [...prev, newItem]);
    if (isSupabaseConfigured()) await sbInsert(DB_TABLES.cash_entries, newItem);
  }, []);

  const deleteCashEntry = useCallback(async (id: string) => {
    setCashEntries(prev => prev.filter(item => item.id !== id));
    if (isSupabaseConfigured()) await sbDelete(DB_TABLES.cash_entries, id);
  }, []);

  // --- REMINDERS ---
  const addReminder = useCallback(async (r: Omit<Reminder, 'id' | 'createdAt'>) => {
    const newItem: Reminder = { ...r, id: uid(), createdAt: new Date().toISOString() };
    setReminders(prev => [...prev, newItem]);
    if (isSupabaseConfigured()) await sbInsert(DB_TABLES.reminders, newItem);
  }, []);

  const updateReminder = useCallback(async (id: string, r: Partial<Reminder>) => {
    setReminders(prev => prev.map(item => item.id === id ? { ...item, ...r } : item));
    if (isSupabaseConfigured()) await sbUpdate(DB_TABLES.reminders, id, r);
  }, []);

  const deleteReminder = useCallback(async (id: string) => {
    setReminders(prev => prev.filter(item => item.id !== id));
    if (isSupabaseConfigured()) await sbDelete(DB_TABLES.reminders, id);
  }, []);

  // --- CALENDAR EVENTS ---
  const addCalendarEvent = useCallback(async (e: Omit<CalendarEvent, 'id'>) => {
    const newItem: CalendarEvent = { ...e, id: uid() };
    setCalendarEvents(prev => [...prev, newItem]);
    if (isSupabaseConfigured()) await sbInsert(DB_TABLES.calendar_events, newItem);
  }, []);

  const updateCalendarEvent = useCallback(async (id: string, e: Partial<CalendarEvent>) => {
    setCalendarEvents(prev => prev.map(item => item.id === id ? { ...item, ...e } : item));
    if (isSupabaseConfigured()) await sbUpdate(DB_TABLES.calendar_events, id, e);
  }, []);

  const deleteCalendarEvent = useCallback(async (id: string) => {
    setCalendarEvents(prev => prev.filter(item => item.id !== id));
    if (isSupabaseConfigured()) await sbDelete(DB_TABLES.calendar_events, id);
  }, []);

  // --- MATERIAL TYPES ---
  const addMaterialType = useCallback(async (t: Omit<CustomMaterialType, 'id'>) => {
    const newItem: CustomMaterialType = { ...t, id: uid() };
    setMaterialTypes(prev => [...prev, newItem]);
    if (isSupabaseConfigured()) await sbInsert(DB_TABLES.material_types, newItem);
  }, []);

  const updateMaterialType = useCallback(async (id: string, t: Partial<CustomMaterialType>) => {
    setMaterialTypes(prev => prev.map(item => item.id === id ? { ...item, ...t } : item));
    if (isSupabaseConfigured()) await sbUpdate(DB_TABLES.material_types, id, t);
  }, []);

  const deleteMaterialType = useCallback(async (id: string) => {
    setMaterialTypes(prev => prev.filter(item => item.id !== id));
    if (isSupabaseConfigured()) await sbDelete(DB_TABLES.material_types, id);
  }, []);

  // --- SALES CHANNELS ---
  const addSalesChannel = useCallback(async (channel: string) => {
    setSalesChannels(prev => {
      if (prev.includes(channel)) return prev;
      const next = [...prev, channel];
      if (isSupabaseConfigured()) {
        supabase.from(DB_TABLES.app_config).upsert({ key: 'sales_channels', value: next }).then();
      }
      return next;
    });
  }, []);

  const deleteSalesChannel = useCallback(async (channel: string) => {
    setSalesChannels(prev => {
      const next = prev.filter(c => c !== channel);
      if (isSupabaseConfigured()) {
         supabase.from(DB_TABLES.app_config).upsert({ key: 'sales_channels', value: next }).then();
      }
      return next;
    });
  }, []);

  // --- WHATSAPP CONFIG ---
  const updateWhatsappConfig = useCallback(async (w: WhatsappConfig) => {
    setWhatsappConfig(w);
    if (isSupabaseConfigured()) {
      await supabase.from(DB_TABLES.app_config).upsert({ key: 'whatsapp', value: w }, { onConflict: 'key' });
    }
  }, []);

  // --- FIRMA BILGILERI CONFIG ---
  const updateFirmaBilgileri = useCallback(async (info: any) => {
    setFirmaBilgileri(info);
    if (isSupabaseConfigured()) {
      await supabase.from(DB_TABLES.app_config).upsert({ key: 'firma_bilgileri', value: info }, { onConflict: 'key' });
    }
  }, []);

  return (
    <DataContext.Provider value={{
      products, customOrders, materials, accounts, cariTransactions, suppliers, sales, purchases, cashEntries, reminders, calendarEvents, materialTypes, whatsappConfig, firmaBilgileri, updateFirmaBilgileri, usdRate, loading,
      addProduct, updateProduct, deleteProduct,
      addCustomOrder, updateCustomOrder, deleteCustomOrder,
      addMaterial, updateMaterial, deleteMaterial,
      addAccount, updateAccount, deleteAccount,
      addCariTransaction, deleteCariTransaction,
      addSupplier, updateSupplier, deleteSupplier,
      addSale, deleteSale,
      addPurchase, deletePurchase,
      addCashEntry, deleteCashEntry,
      addReminder, updateReminder, deleteReminder,
      addCalendarEvent, updateCalendarEvent, deleteCalendarEvent,
      addMaterialType, updateMaterialType, deleteMaterialType, updateWhatsappConfig,
      salesChannels, addSalesChannel, deleteSalesChannel
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
