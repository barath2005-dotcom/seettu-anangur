/**
 * Currency & Time utilities for Seettu Manager
 * All money is stored in integer paise (1 Rupee = 100 Paise)
 * Timezone: Asia/Kolkata
 */

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

/**
 * Format paise into Indian Rupee display (e.g. ₹1,50,000.00)
 */
export function formatINR(paise: number, showDecimals = false): string {
  const rupees = paise / 100;
  const isNegative = rupees < 0;
  const absRupees = Math.abs(rupees);

  const formatted = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(absRupees);

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Format date in Asia/Kolkata timezone
 */
export function formatKolkataDate(dateInput: string | Date | null | undefined, includeTime = false): string {
  if (!dateInput) return '-';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '-';

  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  };

  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hour12 = true;
  }

  return new Intl.DateTimeFormat('en-IN', options).format(date);
}

/**
 * Format date in YYYY-MM-DD format in Asia/Kolkata
 */
export function toKolkataISODate(dateInput: string | Date = new Date()): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // en-CA gives YYYY-MM-DD
}

export function generateReceiptNumber(): string {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `REC-${datePart}-${randomPart}`;
}

export function generateTransactionId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.floor(100 + Math.random() * 900);
  return `TXN-${timestamp}-${random}`;
}
