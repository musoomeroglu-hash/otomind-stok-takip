import ExcelJS from 'exceljs';

// Renk paleti (ARGB)
const C = {
  titleBg:    'FF0F2647',
  headerBg:   'FF1B4F8A',
  headerText: 'FFFFFFFF',
  subtitleBg: 'FF2563A0',
  altRow:     'FFF0F6FF',
  white:      'FFFFFFFF',
  summaryKey: 'FFDBEAFE',
  totalBg:    'FFFFFBEB',
  totalBorder:'FFD97706',
  green:      'FF16A34A',
  red:        'FFDC2626',
  textDark:   'FF1E293B',
  border:     'FFD1D9E0',
  borderMed:  'FFB0BEC5',
  sectionBg:  'FF334155',
  sectionText:'FFFFFFFF',
};

function bdr(colorArgb = C.border, style: ExcelJS.BorderStyle = 'thin'): ExcelJS.Border {
  return { style, color: { argb: colorArgb } };
}

function allBorders(colorArgb = C.border, style: ExcelJS.BorderStyle = 'thin'): Partial<ExcelJS.Borders> {
  const b = bdr(colorArgb, style);
  return { top: b, bottom: b, left: b, right: b };
}

function solidFill(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: argb } };
}

/** Büyük başlık satırı (birleşik) */
export function addTitle(ws: ExcelJS.Worksheet, text: string, numCols: number) {
  const row = ws.addRow([text]);
  row.height = 44;
  const cell = row.getCell(1);
  cell.style = {
    font: { bold: true, size: 16, color: { argb: C.headerText }, name: 'Calibri' },
    fill: solidFill(C.titleBg),
    alignment: { horizontal: 'center', vertical: 'middle' },
  };
  if (numCols > 1) ws.mergeCells(row.number, 1, row.number, numCols);
}

/** Alt başlık (bilgi satırı) */
export function addSubtitle(ws: ExcelJS.Worksheet, text: string, numCols: number) {
  const row = ws.addRow([text]);
  row.height = 22;
  const cell = row.getCell(1);
  cell.style = {
    font: { size: 10, color: { argb: C.headerText }, name: 'Calibri', italic: true },
    fill: solidFill(C.subtitleBg),
    alignment: { horizontal: 'center', vertical: 'middle' },
  };
  if (numCols > 1) ws.mergeCells(row.number, 1, row.number, numCols);
}

/** Boşluk satırı */
export function addSpacer(ws: ExcelJS.Worksheet, numCols: number, height = 6) {
  const row = ws.addRow([]);
  row.height = height;
  for (let c = 1; c <= numCols; c++) {
    row.getCell(c).style = { fill: solidFill(C.white) };
  }
}

/** Kolon başlıkları */
export function addHeaders(ws: ExcelJS.Worksheet, headers: string[]): ExcelJS.Row {
  const row = ws.addRow(headers);
  row.height = 34;
  row.eachCell({ includeEmpty: true }, (cell, col) => {
    if (col <= headers.length) {
      cell.style = {
        font: { bold: true, color: { argb: C.headerText }, size: 10.5, name: 'Calibri' },
        fill: solidFill(C.headerBg),
        alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
        border: allBorders(C.borderMed),
      };
    }
  });
  return row;
}

export interface DataRowOptions {
  currencyColumns?: number[];  // 1-tabanlı kolon numaraları
  signedColumn?: number;       // pozitifse yeşil, negatifse kırmızı
  centerColumns?: number[];
}

/** Veri satırı (dönüşümlü renk) */
export function addDataRow(
  ws: ExcelJS.Worksheet,
  values: (string | number | null | undefined)[],
  rowIdx: number,
  opts: DataRowOptions = {}
): ExcelJS.Row {
  const row = ws.addRow(values as ExcelJS.CellValue[]);
  const bgArgb = rowIdx % 2 === 0 ? C.altRow : C.white;
  row.height = 21;

  row.eachCell({ includeEmpty: true }, (cell, col) => {
    if (col > values.length) return;
    const v = cell.value;
    const isNum = typeof v === 'number';

    let textColor = C.textDark;
    if (opts.signedColumn === col && isNum) {
      textColor = (v as number) >= 0 ? C.green : C.red;
    }

    let align: ExcelJS.Alignment['horizontal'] = col === 1 ? 'left' : isNum ? 'right' : 'left';
    if (opts.centerColumns?.includes(col)) align = 'center';

    cell.style = {
      font: { size: 10, color: { argb: textColor }, name: 'Calibri' },
      fill: solidFill(bgArgb),
      alignment: { horizontal: align, vertical: 'middle' },
      border: allBorders(C.border),
      numFmt: opts.currencyColumns?.includes(col) ? '#,##0.00 "₺"' : undefined,
    };
  });

  return row;
}

/** Toplam/özet satırı (sarı arka plan, koyu) */
export function addTotalRow(
  ws: ExcelJS.Worksheet,
  values: (string | number | null | undefined)[],
  opts: { currencyColumns?: number[]; signedColumn?: number } = {}
): ExcelJS.Row {
  const row = ws.addRow(values as ExcelJS.CellValue[]);
  row.height = 28;

  row.eachCell({ includeEmpty: true }, (cell, col) => {
    if (col > values.length) return;
    const v = cell.value;
    const isNum = typeof v === 'number';

    let textColor = C.textDark;
    if (opts.signedColumn === col && isNum) {
      textColor = (v as number) >= 0 ? C.green : C.red;
    }

    cell.style = {
      font: { bold: true, size: 11, color: { argb: textColor }, name: 'Calibri' },
      fill: solidFill(C.totalBg),
      alignment: { horizontal: col === 1 ? 'left' : isNum ? 'right' : 'center', vertical: 'middle' },
      border: allBorders(C.totalBorder, 'medium'),
      numFmt: opts.currencyColumns?.includes(col) ? '#,##0.00 "₺"' : undefined,
    };
  });

  return row;
}

/** Özet sayfası için etiket-değer çifti */
export function addSummaryPair(
  ws: ExcelJS.Worksheet,
  label: string,
  value: string | number,
  opts: {
    isCurrency?: boolean;
    positive?: boolean;
    negative?: boolean;
    bold?: boolean;
  } = {}
) {
  const row = ws.addRow([label, value]);
  row.height = 26;

  row.getCell(1).style = {
    font: { bold: true, size: 10.5, name: 'Calibri', color: { argb: C.textDark } },
    fill: solidFill(C.summaryKey),
    alignment: { horizontal: 'left', vertical: 'middle' },
    border: allBorders(C.borderMed),
  };

  const textColor = opts.positive ? C.green : opts.negative ? C.red : C.textDark;
  row.getCell(2).style = {
    font: { bold: opts.bold, size: 10.5, name: 'Calibri', color: { argb: textColor } },
    fill: solidFill(C.white),
    alignment: { horizontal: typeof value === 'number' ? 'right' : 'left', vertical: 'middle' },
    border: allBorders(C.borderMed),
    numFmt: opts.isCurrency ? '#,##0.00 "₺"' : undefined,
  };
}

/** Referans sayfası için bölüm başlığı */
export function addSectionHeader(ws: ExcelJS.Worksheet, text: string, numCols: number) {
  const row = ws.addRow([text]);
  row.height = 28;
  const cell = row.getCell(1);
  cell.style = {
    font: { bold: true, size: 11, color: { argb: C.sectionText }, name: 'Calibri' },
    fill: solidFill(C.sectionBg),
    alignment: { horizontal: 'left', vertical: 'middle' },
    border: allBorders(C.borderMed),
  };
  if (numCols > 1) ws.mergeCells(row.number, 1, row.number, numCols);
}

/** Browser'da Excel dosyasını indir */
export async function saveExcel(wb: ExcelJS.Workbook, filename: string) {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
