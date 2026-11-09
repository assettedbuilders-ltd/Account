/**
 * Date Formatting Utilities
 * Standardizes all dates across Assetted Builders Ltd. to DD/MM/YYYY format
 */

export function formatDateDDMMYYYY(dateInput: string | Date | undefined | null): string {
  if (!dateInput) return '';
  
  if (dateInput instanceof Date) {
    if (isNaN(dateInput.getTime())) return '';
    const day = String(dateInput.getDate()).padStart(2, '0');
    const month = String(dateInput.getMonth() + 1).padStart(2, '0');
    const year = dateInput.getFullYear();
    return `${day}/${month}/${year}`;
  }

  const str = String(dateInput).trim();
  if (!str) return '';

  // Date range e.g. "01.01.2022 to 30.12.2023" or "2022-01-01 to 2023-12-30"
  if (str.includes(' to ')) {
    return str
      .split(' to ')
      .map(part => formatDateDDMMYYYY(part.trim()))
      .join(' to ');
  }

  // Already DD/MM/YYYY: "31/07/2025"
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // ISO YYYY-MM-DD: "2025-07-31" or "2025/07/31"
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}/.test(str)) {
    const parts = str.split(/[-/]/);
    const y = parts[0];
    const m = parts[1].padStart(2, '0');
    const d = parts[2].slice(0, 2).padStart(2, '0');
    return `${d}/${m}/${y}`;
  }

  // Dot separated DD.MM.YYYY: "31.07.2025" or hyphen DD-MM-YYYY
  if (/^\d{1,2}[.-]\d{1,2}[.-]\d{4}$/.test(str)) {
    const parts = str.split(/[.-]/);
    const d = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const y = parts[2];
    return `${d}/${m}/${y}`;
  }

  // Fallback using Date parser
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
  }

  return str;
}

/**
 * Converts a date string (either DD/MM/YYYY or ISO) into YYYY-MM-DD for HTML5 <input type="date">
 */
export function toISODateInput(dateInput: string | undefined | null): string {
  if (!dateInput) return '';
  const str = String(dateInput).trim();
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return str;
}

/**
 * Returns today's date formatted as DD/MM/YYYY
 */
export function getTodayDDMMYYYY(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  return `${day}/${month}/${year}`;
}
