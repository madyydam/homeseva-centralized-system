// Helper to convert number to Indian English currency words
export function numberToIndianWords(num: number): string {
  if (!num || isNaN(num)) return 'Zero Rupees Only';

  const a = [
    '',
    'One',
    'Two',
    'Three',
    'Four',
    'Five',
    'Six',
    'Seven',
    'Eight',
    'Nine',
    'Ten',
    'Eleven',
    'Twelve',
    'Thirteen',
    'Fourteen',
    'Fifteen',
    'Sixteen',
    'Seventeen',
    'Eighteen',
    'Nineteen',
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = ('000000000' + Math.floor(num)).slice(-9);
  const crore = parseInt(n.substring(0, 2), 10);
  const lakh = parseInt(n.substring(2, 4), 10);
  const thousand = parseInt(n.substring(4, 6), 10);
  const hundred = parseInt(n.substring(6, 7), 10);
  const rest = parseInt(n.substring(7, 9), 10);

  let str = '';

  const convertTwoDigits = (val: number) => {
    if (val === 0) return '';
    if (val < 20) return a[val];
    return b[Math.floor(val / 10)] + (val % 10 !== 0 ? ' ' + a[val % 10] : '');
  };

  if (crore > 0) str += convertTwoDigits(crore) + ' Crore ';
  if (lakh > 0) str += convertTwoDigits(lakh) + ' Lakh ';
  if (thousand > 0) str += convertTwoDigits(thousand) + ' Thousand ';
  if (hundred > 0) str += a[hundred] + ' Hundred ';
  if (rest > 0) {
    if (str !== '') str += 'and ';
    str += convertTwoDigits(rest);
  }

  const paise = Math.round((num - Math.floor(num)) * 100);
  let paiseStr = '';
  if (paise > 0) {
    paiseStr = ` and ${convertTwoDigits(paise)} Paise`;
  }

  return (str.trim() || 'Zero') + ' Rupees' + paiseStr + ' Only';
}
