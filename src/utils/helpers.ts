export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  if (!dateStr) return '';
  try {
    return new Intl.DateTimeFormat('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    beklemede: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    kargoda: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    teslim_edildi: 'bg-green-500/20 text-green-400 border-green-500/30',
  };
  return colors[status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    beklemede: 'Beklemede',
    kargoda: 'Kargoda',
    teslim_edildi: 'Teslim Edildi',
  };
  return labels[status] || status;
}

export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    kilif: 'Koltuk Kılıfı',
    minder: 'Oto Minderi',
    yastikseti: 'Yastık Seti',
    konforseti: 'Konfor Seti',
    aksesuar: 'Aksesuar',
  };
  return labels[category] || category;
}

export function getMaterialTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    kumas: 'Kumaş',
    sunger: 'Sünger',
    cirt: 'Cırt Bant',
    nakis_ipligi: 'Nakış İpliği',
    etiket: 'Etiket',
    diger: 'Diğer',
  };
  return labels[type] || type;
}

export function getChannelLabel(channel: string): string {
  const labels: Record<string, string> = {
    website: 'Web Sitesi',
    hepsiburada: 'Hepsiburada',
    n11: 'N11',
    bayi: 'Bayi',
    cimri: 'Cimri',
  };
  return labels[channel] || channel;
}

export function sendWhatsappMessage(phone: string, text: string, apikey: string): void {
  if (!phone || !apikey) return;
  const encodedText = encodeURIComponent(text);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${encodedText}&apikey=${apikey}`;
  fetch(url, { mode: 'no-cors' }).catch(console.error);
}
