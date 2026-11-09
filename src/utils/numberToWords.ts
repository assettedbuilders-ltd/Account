/**
 * Convert numeric amounts into Bangladeshi Taka words (Crores, Lakhs, Thousands, Hundreds)
 */
export function convertAmountToWords(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Zero Taka Only';
  }

  const rounded = Math.round(amount * 100) / 100;
  if (rounded === 0) return 'Zero Taka Only';

  const isNegative = rounded < 0;
  const absAmount = Math.abs(rounded);

  const integerPart = Math.floor(absAmount);
  const decimalPart = Math.round((absAmount - integerPart) * 100);

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];

  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertTwoDigits(n: number): string {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    const unit = n % 10;
    const ten = Math.floor(n / 10);
    return tens[ten] + (unit > 0 ? ' ' + ones[unit] : '');
  }

  function convertThreeDigits(n: number): string {
    const hundred = Math.floor(n / 100);
    const remainder = n % 100;
    let res = '';
    if (hundred > 0) {
      res += ones[hundred] + ' Hundred';
      if (remainder > 0) res += ' ';
    }
    if (remainder > 0) {
      res += convertTwoDigits(remainder);
    }
    return res;
  }

  function convertSouthAsian(num: number): string {
    if (num === 0) return '';

    let result = '';
    const crore = Math.floor(num / 10000000);
    let rem = num % 10000000;

    const lakh = Math.floor(rem / 100000);
    rem = rem % 100000;

    const thousand = Math.floor(rem / 1000);
    rem = rem % 1000;

    const remainder = rem;

    if (crore > 0) {
      result += convertSouthAsian(crore) + ' Crore ';
    }
    if (lakh > 0) {
      result += convertSouthAsian(lakh) + ' Lakh ';
    }
    if (thousand > 0) {
      result += convertSouthAsian(thousand) + ' Thousand ';
    }
    if (remainder > 0) {
      result += convertThreeDigits(remainder) + ' ';
    }

    return result.trim();
  }

  const words = convertSouthAsian(integerPart);
  let finalStr = words ? words + ' Taka' : 'Zero Taka';

  if (decimalPart > 0) {
    const decimalWords = convertTwoDigits(decimalPart);
    finalStr += ' and ' + decimalWords + ' Paisa';
  }

  finalStr += ' Only';

  return (isNegative ? 'Minus ' : '') + finalStr;
}

export function formatBDT(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0';
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0
  }).format(amount);
}
