-- =====================================================
-- OTOMIND SUPABASE VERİTABANI ŞEMASI
-- Bu dosyayı Supabase Dashboard > SQL Editor'da çalıştırın
-- =====================================================

-- 1. ÜRÜNLER
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  car_brand TEXT,
  car_model TEXT,
  car_year TEXT,
  sku_code TEXT,
  fabric_type TEXT,
  color TEXT,
  pattern TEXT,
  purchase_price NUMERIC DEFAULT 0,
  sale_price NUMERIC DEFAULT 0,
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  channel TEXT,
  is_custom BOOLEAN DEFAULT false,
  barcode TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ÖZEL SİPARİŞLER
CREATE TABLE IF NOT EXISTS custom_orders (
  id TEXT PRIMARY KEY,
  customer_id TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  car_brand TEXT,
  car_model TEXT,
  car_year TEXT,
  product_type TEXT,
  fabric_type TEXT,
  pattern TEXT,
  color TEXT,
  notes TEXT,
  status TEXT DEFAULT 'beklemede',
  order_date TEXT,
  delivery_date TEXT,
  price NUMERIC DEFAULT 0,
  channel TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. HAMMADDELER
CREATE TABLE IF NOT EXISTS materials (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,
  unit TEXT,
  stock_qty NUMERIC DEFAULT 0,
  min_qty NUMERIC DEFAULT 0,
  unit_cost NUMERIC DEFAULT 0,
  supplier_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CARİ HESAPLAR
CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'musteri',
  phone TEXT,
  email TEXT,
  address TEXT,
  notes TEXT,
  balance NUMERIC DEFAULT 0,
  total_debit NUMERIC DEFAULT 0,
  total_credit NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CARİ İŞLEMLER
CREATE TABLE IF NOT EXISTS cari_transactions (
  id TEXT PRIMARY KEY,
  account_id TEXT,
  type TEXT,
  amount NUMERIC DEFAULT 0,
  description TEXT,
  related_id TEXT,
  related_type TEXT,
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TEDARİKÇİLER
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  address TEXT,
  category TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SATIŞLAR
CREATE TABLE IF NOT EXISTS sales (
  id TEXT PRIMARY KEY,
  sale_type TEXT,
  product_id TEXT,
  product_name TEXT,
  customer_id TEXT,
  customer_name TEXT,
  quantity INTEGER DEFAULT 1,
  unit_price NUMERIC DEFAULT 0,
  total_price NUMERIC DEFAULT 0,
  channel TEXT,
  payment_method TEXT,
  notes TEXT,
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ALIMLAR
CREATE TABLE IF NOT EXISTS purchases (
  id TEXT PRIMARY KEY,
  supplier_id TEXT,
  supplier_name TEXT,
  items JSONB DEFAULT '[]',
  total_amount NUMERIC DEFAULT 0,
  payment_method TEXT,
  notes TEXT,
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. KASA (GELİR-GİDER)
CREATE TABLE IF NOT EXISTS cash_entries (
  id TEXT PRIMARY KEY,
  type TEXT,
  category TEXT,
  description TEXT,
  amount NUMERIC DEFAULT 0,
  related_id TEXT,
  related_type TEXT,
  payment_method TEXT,
  date TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. HATIRLATICILAR
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT,
  time TEXT,
  priority TEXT DEFAULT 'orta',
  send_whatsapp BOOLEAN DEFAULT false,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TAKVİM ETKİNLİKLERİ
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  date TEXT,
  time TEXT,
  type TEXT DEFAULT 'diger',
  related_order_id TEXT,
  completed BOOLEAN DEFAULT false
);

-- 12. MALZEME TİPLERİ
CREATE TABLE IF NOT EXISTS material_types (
  id TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  label TEXT NOT NULL
);

-- 13. UYGULAMA AYARLARI
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value JSONB DEFAULT '{}'
);

-- =====================================================
-- Row Level Security (RLS)
-- Anonim erişime izin ver (basit kullanım için)
-- Daha güvenli bir yapı için Supabase Auth entegre edin
-- =====================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cari_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- Tüm tablolara anon erişim izni
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'products','custom_orders','materials','accounts','cari_transactions',
    'suppliers','sales','purchases','cash_entries','reminders',
    'calendar_events','material_types','app_config'
  ])
  LOOP
    EXECUTE format('CREATE POLICY "Allow full access" ON %I FOR ALL USING (true) WITH CHECK (true)', tbl);
  END LOOP;
END $$;
